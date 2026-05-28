"""Endpoint business logic for BudgetBot."""
import csv
import io
import math
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional


MAX_CSV_ROWS = 5000
MAX_DESCRIPTION_LENGTH = 240
MAX_ABS_AMOUNT = 1_000_000_000_000
MIN_TXN_DATE = datetime(1970, 1, 1)
MAX_TXN_DATE = datetime(2100, 12, 31)
REQUIRED_COLUMNS = {"date", "description", "amount"}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
AMOUNT_RE = re.compile(r"^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$")
CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class CsvValidationError(ValueError):
    def __init__(self, code: str, message: str, row_number: int | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.row_number = row_number


def safe_upload_filename(filename: str) -> str:
    safe_name = Path(filename or "statement.csv").name.strip()
    if not safe_name or safe_name in {".", ".."}:
        return "statement.csv"
    return safe_name


def _parse_amount(raw_amount: str) -> float:
    amount_text = raw_amount.strip()
    if not AMOUNT_RE.fullmatch(amount_text):
        raise ValueError("amount format is invalid")
    return float(amount_text.replace(",", ""))


def _parse_csv(data: bytes) -> list:
    """Expect CSV columns: date, description, amount."""
    try:
        text = data.decode("utf-8-sig", errors="strict")
    except UnicodeDecodeError as exc:
        raise CsvValidationError(
            "INVALID_ENCODING",
            "CSV must be UTF-8 encoded",
        ) from exc
    try:
        reader = csv.reader(io.StringIO(text), strict=True)
        rows = list(reader)
    except csv.Error as exc:
        raise CsvValidationError("MALFORMED_CSV", "CSV syntax is malformed") from exc
    if not rows:
        raise CsvValidationError("EMPTY_CSV", "CSV file has no rows")
    header = [c.lower().strip() for c in rows[0]]
    if not any(header):
        raise CsvValidationError("EMPTY_HEADER", "CSV header row is empty")
    if len(header) != len(set(header)):
        raise CsvValidationError("DUPLICATE_COLUMNS", "CSV header has duplicate columns")
    if not REQUIRED_COLUMNS.issubset(set(header)):
        raise CsvValidationError(
            "INVALID_COLUMNS",
            "CSV must include date, description, and amount columns",
        )

    idx = {col: i for i, col in enumerate(header)}
    data_rows = rows[1:]
    if len(data_rows) > MAX_CSV_ROWS:
        raise CsvValidationError(
            "TOO_MANY_ROWS",
            f"CSV must have at most {MAX_CSV_ROWS} transaction rows",
        )
    parsed = []
    for row_number, r in enumerate(data_rows, start=2):
        if not any(cell.strip() for cell in r):
            continue
        try:
            if len(r) != len(header):
                raise ValueError("row cell count does not match header")
            if any(idx[column] >= len(r) for column in REQUIRED_COLUMNS):
                raise ValueError("required cell missing")
            date = r[idx["date"]].strip()
            description = r[idx["description"]].strip()
            amount = _parse_amount(r[idx["amount"]])
            if not DATE_RE.fullmatch(date):
                raise ValueError("date format is invalid")
            parsed_date = datetime.strptime(date, "%Y-%m-%d")
            if parsed_date < MIN_TXN_DATE or parsed_date > MAX_TXN_DATE:
                raise ValueError("date is out of supported range")
            if not description or len(description) > MAX_DESCRIPTION_LENGTH:
                raise ValueError("description length is invalid")
            if CONTROL_CHAR_RE.search(description):
                raise ValueError("description contains control characters")
            if not math.isfinite(amount):
                raise ValueError("amount must be finite")
            if amount == 0:
                raise ValueError("amount cannot be zero")
            if abs(amount) > MAX_ABS_AMOUNT:
                raise ValueError("amount is outside supported range")
            parsed.append({
                "date": date,
                "description": description,
                "amount": amount,
            })
        except (ValueError, IndexError):
            raise CsvValidationError(
                "INVALID_ROW",
                "CSV row must have YYYY-MM-DD date, non-empty description, and numeric amount",
                row_number=row_number,
            )
    if not parsed:
        raise CsvValidationError("NO_VALID_ROWS", "CSV has no valid transaction rows")
    return parsed


def _normalize_merchant(desc: str) -> str:
    import re
    return re.sub(r'\b(ft|pos|napas)\b', '', desc, flags=re.IGNORECASE).strip()


def handle_upload(
    user_id: str,
    filename: str,
    data: bytes,
    ai_client,
    storage,
    userstore,
) -> dict:
    import_id = "import-" + uuid.uuid4().hex[:8]
    key = f"{user_id}/{safe_upload_filename(filename)}"
    rows = _parse_csv(data)
    location = storage.put(key, data)
    
    rules_applied = 0
    ai_calls = 0
    reviews_needed = 0

    rules = userstore.list_rules(user_id)
    
    txns = []
    for i, row in enumerate(rows):
        desc = row["description"]
        desc_lower = desc.lower()
        amount = row["amount"]
        
        # Check Rules first
        matched_rule = next((r for r in rules if r["contains"].lower() in desc_lower), None)
        
        category = "Other"
        confidence = 0.0
        status = "NEEDS_REVIEW"
        merchant = _normalize_merchant(desc)
        recurring = False

        if matched_rule:
            category = matched_rule["category"]
            confidence = 1.0
            status = "AUTO_APPROVED"
            rules_applied += 1
        else:
            ai_calls += 1
            cat_result = ai_client.categorize(description=desc, amount=amount, date=row["date"])
            category = cat_result["category"]
            confidence = float(cat_result["confidence"])
            if confidence >= 0.8:
                status = "AUTO_APPROVED"
            else:
                status = "NEEDS_REVIEW"
                reviews_needed += 1
        
        txn = {
            "id": f"{import_id}-txn-{i+1}",
            "importId": import_id,
            "date": row["date"],
            "description": desc,
            "merchant": merchant,
            "amount": amount,
            "category": category,
            "confidence": confidence,
            "status": status,
            "classifiedBy": "RULE" if matched_rule else "AI",
            "recurring": recurring
        }
        userstore.add_transaction(user_id, txn)
        txns.append(txn)

    return {
        "id": import_id,
        "filename": filename,
        "importedAt": _now(),
        "rows": len(rows),
        "rows_parsed": len(rows),
        "rows_inserted": len(rows),
        "sample_categorized": txns,
        "ruleMatches": rules_applied,
        "aiCalls": ai_calls,
        "reviewsNeeded": reviews_needed,
        "status": "Completed"
    }

def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def handle_summary(user_id: str, month: Optional[str], userstore) -> dict:
    txns = userstore.list_transactions(user_id, month=month)
    income = sum(t["amount"] for t in txns if t["amount"] > 0)
    spend = abs(sum(t["amount"] for t in txns if t["amount"] < 0))
    
    from collections import defaultdict
    cats = defaultdict(lambda: {"amount": 0.0, "count": 0})
    for t in txns:
        if t["amount"] < 0:
            cats[t["category"]]["amount"] += abs(t["amount"])
        cats[t["category"]]["count"] += 1
        
    by_cat = []
    for cat, data in cats.items():
        if data["amount"] > 0:
            by_cat.append({"category": cat, "amount": data["amount"], "count": data["count"]})
    by_cat.sort(key=lambda x: x["amount"], reverse=True)

    resolved_month = month or _now()[:7]
    top_3 = by_cat[:3]
    by_category_dict = {cat: {"amount": data["amount"], "count": data["count"]} for cat, data in cats.items()}

    return {
        "income": income,
        "spend": spend,
        "net": income - spend,
        "reviewCount": sum(1 for t in txns if t["status"] == "NEEDS_REVIEW"),
        "byCategory": by_cat,
        "by_category": by_category_dict,
        "top_3_drivers": top_3,
        "month": resolved_month
    }

def handle_list_transactions(user_id: str, month: Optional[str], userstore) -> list:
    return userstore.list_transactions(user_id, month=month)
