"""FastAPI app for BudgetBot. Runtime-agnostic."""
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, File, Header, HTTPException, UploadFile, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.config import config
from src.adapters import factory
from src import handlers


app = FastAPI(title="BudgetBot API")

MAX_UPLOAD_BYTES = 2 * 1024 * 1024
ALLOWED_UPLOAD_TYPES = {
    "text/csv",
    "text/plain",
    "application/csv",
    "application/octet-stream",
    "application/vnd.ms-excel",
}
Category = Literal[
    "Food",
    "Transport",
    "Shopping",
    "Utilities",
    "Entertainment",
    "Health",
    "Subscriptions",
    "Income",
    "Transfer",
    "Other",
]
TransactionStatus = Literal["AUTO_APPROVED", "NEEDS_REVIEW", "MANUAL_APPROVED"]

_allowed = ["*"] if config.cors_origins == "*" else [o.strip() for o in config.cors_origins.split(",") if o.strip()]

if "*" in _allowed:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_allowed,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

ai_client = factory.make_ai()
storage = factory.make_storage()
userstore = factory.make_userstore()


def _resolve_user_id(x_user_id: Optional[str], request: Optional[Request] = None) -> str:
    if request and hasattr(request, "scope"):
        aws_event = request.scope.get("aws.event")
        if aws_event and isinstance(aws_event, dict):
            request_context = aws_event.get("requestContext", {})
            authorizer = request_context.get("authorizer", {})
            jwt_data = authorizer.get("jwt", {})
            claims = jwt_data.get("claims", {}) or authorizer.get("claims", {})
            
            user_id = claims.get("sub") or claims.get("username") or claims.get("cognito:username")
            if user_id:
                return user_id

    if x_user_id:
        return x_user_id
    return config.default_user_id


def _bad_request(code: str, message: str, **extra: object) -> HTTPException:
    return HTTPException(
        status_code=400,
        detail={"code": code, "message": message, **extra},
    )


def _validate_upload_metadata(file: UploadFile, data: bytes) -> None:
    filename = file.filename or ""
    content_type = file.content_type or ""
    safe_name = handlers.safe_upload_filename(filename)
    if safe_name != filename:
        raise _bad_request("INVALID_FILENAME", "CSV filename is invalid")
    if not filename.lower().endswith(".csv"):
        raise _bad_request("INVALID_FILE_TYPE", "Only .csv files are accepted")
    if content_type and content_type not in ALLOWED_UPLOAD_TYPES:
        raise _bad_request("INVALID_FILE_TYPE", "Only CSV MIME types are accepted")
    if len(data) > MAX_UPLOAD_BYTES:
        raise _bad_request(
            "FILE_TOO_LARGE",
            "CSV file is too large",
            max_bytes=MAX_UPLOAD_BYTES,
        )


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "backends": {
            "ai": config.ai_backend,
            "storage": config.storage_backend,
            "userstore": config.userstore_backend,
        }
    }


@app.post("/upload")
async def upload(
    request: Request,
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header(default=None),
) -> dict:
    user_id = _resolve_user_id(x_user_id, request)
    data = await file.read()
    if not data:
        raise _bad_request("EMPTY_FILE", "Uploaded file is empty")
    _validate_upload_metadata(file, data)
    try:
        return handlers.handle_upload(
            user_id=user_id,
            filename=file.filename or "statement.csv",
            data=data,
            ai_client=ai_client,
            storage=storage,
            userstore=userstore,
        )
    except handlers.CsvValidationError as exc:
        payload = {"row_number": exc.row_number} if exc.row_number is not None else {}
        raise _bad_request(exc.code, exc.message, **payload) from exc


@app.get("/summary")
def summary(
    request: Request,
    month: Optional[str] = None,
    x_user_id: Optional[str] = Header(default=None),
) -> dict:
    return handlers.handle_summary(_resolve_user_id(x_user_id, request), month, userstore)


@app.get("/transactions")
def transactions(
    request: Request,
    month: Optional[str] = None,
    x_user_id: Optional[str] = Header(default=None),
) -> dict:
    txns = handlers.handle_list_transactions(_resolve_user_id(x_user_id, request), month, userstore)
    return {"transactions": txns}


class TransactionUpdate(BaseModel):
    category: Optional[Category] = None
    status: Optional[TransactionStatus] = None

@app.put("/transactions/{txn_id}")
def update_transaction(
    txn_id: str,
    update_data: TransactionUpdate,
    request: Request,
    x_user_id: Optional[str] = Header(default=None),
) -> dict:
    user_id = _resolve_user_id(x_user_id, request)
    updates = {}
    if update_data.category is not None:
        updates["category"] = update_data.category
    if update_data.status is not None:
        updates["status"] = update_data.status
    if not updates:
        raise _bad_request("EMPTY_UPDATE", "At least one update field is required")
    userstore.update_transaction(user_id, txn_id, updates)
    return {"status": "success"}


class RuleCreate(BaseModel):
    contains: str = Field(min_length=2, max_length=120)
    category: Category

@app.post("/rules")
def create_rule(
    rule_data: RuleCreate,
    request: Request,
    x_user_id: Optional[str] = Header(default=None),
) -> dict:
    import uuid
    user_id = _resolve_user_id(x_user_id, request)
    rule = {
        "id": "rule-" + uuid.uuid4().hex[:8],
        "contains": rule_data.contains,
        "category": rule_data.category
    }
    userstore.add_rule(user_id, rule)
    return rule


@app.delete("/transactions")
def reset_transactions(
    request: Request,
    x_user_id: Optional[str] = Header(default=None),
) -> dict:
    """Delete all transactions for a user — used by E2E tests to reset state."""
    user_id = _resolve_user_id(x_user_id, request)
    userstore.clear_transactions(user_id)
    return {"status": "ok", "user_id": user_id}
