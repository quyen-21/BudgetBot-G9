"""FastAPI app for BudgetBot. Runtime-agnostic."""
import json
import time
import uuid
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, File, Header, HTTPException, UploadFile, Request, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware

from src.config import config
from src.adapters import factory
from src import handlers
from src.auth import get_current_user

app = FastAPI(title="BudgetBot API")

# --- Structured Logging Middleware (For CloudWatch Logs Insights - Req 01 & 02) ---
class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Sinh hoặc nhận request_id để tracing
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        error_type = None
        error_message = None
        status_code = 500
        
        try:
            response = await call_next(request)
            status_code = response.status_code
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as exc:
            error_type = type(exc).__name__
            error_message = str(exc)
            raise exc
        finally:
            latency_ms = (time.time() - start_time) * 1000
            
            # Format log JSON
            log_record = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "level": "ERROR" if status_code >= 500 else "INFO",
                "service": "budgetbot-backend",
                "environment": "production",
                "request_id": request_id,
                "route": request.url.path,
                "status_code": status_code,
                "latency_ms": round(latency_ms, 2),
                "error_type": error_type,
                "error_message": error_message
            }
            
            # In thẳng ra stdout/stderr dưới dạng JSON line để CloudWatch bắt lấy
            print(json.dumps(log_record), flush=True)

app.add_middleware(StructuredLoggingMiddleware)

# --- AWS Lambda Wrapper via Mangum ---
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = None

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
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
) -> dict:
    data = await file.read()
    if not data:
        raise _bad_request("EMPTY_FILE", "Uploaded file is empty")
    _validate_upload_metadata(file, data)
    
    # 1. Tính mã SHA-256 hash từ nội dung file để kiểm tra trùng lặp
    import hashlib
    file_hash = hashlib.sha256(data).hexdigest()
    
    # 2. Ngăn chặn upload nếu file đã được upload trước đó
    if hasattr(userstore, "is_file_uploaded") and userstore.is_file_uploaded(user_id, file_hash):
        raise _bad_request("DUPLICATE_FILE", "Tệp tin này đã được tải lên trước đó.")
        
    try:
        res = handlers.handle_upload(
            user_id=user_id,
            filename=file.filename or "statement.csv",
            data=data,
            ai_client=ai_client,
            storage=storage,
            userstore=userstore,
        )
        
        # 3. Đăng ký lưu vết file đã xử lý thành công vào database
        if hasattr(userstore, "register_uploaded_file"):
            userstore.register_uploaded_file(user_id, file_hash, file.filename or "statement.csv")
            
        return res
    except handlers.CsvValidationError as exc:
        payload = {"row_number": exc.row_number} if exc.row_number is not None else {}
        raise _bad_request(exc.code, exc.message, **payload) from exc


class ChatMessage(BaseModel):
    message: str
    image: Optional[str] = None
    session_id: Optional[str] = None


@app.post("/chat")
def chat(
    payload: ChatMessage,
    user_id: str = Depends(get_current_user),
) -> dict:
    if not payload.message.strip() and not payload.image:
        raise _bad_request("EMPTY_MESSAGE", "Message or image must be provided")
    return handlers.handle_chat(
        user_id=user_id,
        question=payload.message,
        userstore=userstore,
        ai_client=ai_client,
        image=payload.image,
        session_id=payload.session_id,
    )


@app.get("/summary")
def summary(
    month: Optional[str] = None,
    user_id: str = Depends(get_current_user),
) -> dict:
    return handlers.handle_summary(user_id, month, userstore)


@app.get("/transactions")
def transactions(
    month: Optional[str] = None,
    user_id: str = Depends(get_current_user),
) -> dict:
    txns = handlers.handle_list_transactions(user_id, month, userstore)
    return {"transactions": txns}


class TransactionUpdate(BaseModel):
    category: Optional[Category] = None
    status: Optional[TransactionStatus] = None

@app.put("/transactions/{txn_id}")
def update_transaction(
    txn_id: str,
    update_data: TransactionUpdate,
    user_id: str = Depends(get_current_user),
) -> dict:
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
    user_id: str = Depends(get_current_user),
) -> dict:
    import uuid
    rule = {
        "id": "rule-" + uuid.uuid4().hex[:8],
        "contains": rule_data.contains,
        "category": rule_data.category
    }
    userstore.add_rule(user_id, rule)
    return rule


@app.delete("/transactions")
def reset_transactions(
    user_id: str = Depends(get_current_user),
) -> dict:
    """Delete all transactions for a user — used by E2E tests to reset state."""
    userstore.clear_transactions(user_id)
    return {"status": "ok", "user_id": user_id}
