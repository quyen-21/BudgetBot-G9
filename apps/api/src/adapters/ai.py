"""AI adapters. BudgetBot uses direct InvokeModel for categorization and Bedrock Converse API Tool Use for chat.

Interface:
    categorize(description, amount, date) -> {"category": str, "confidence": float}
    chat(user_id, question) -> str
"""
import json
import re
import os
from typing import Any


CATEGORIES = [
    "Food", "Transport", "Shopping", "Utilities", "Entertainment",
    "Health", "Subscriptions", "Income", "Transfer", "Other",
]


CATEGORIZE_PROMPT = """Categorize the following bank transaction into exactly one category.
Categories: {categories}

Transaction: "{description}"
Amount: {amount}
Date: {date}

Respond with JSON only. No explanation.
{{"category": "<category>", "confidence": <float between 0.0 and 1.0>}}"""


def _parse_json_response(text: str) -> dict:
    """Extract first JSON object from LLM response. Falls back to Other if invalid."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?|```$", "", text, flags=re.MULTILINE).strip()
    match = re.search(r"\{[^}]+\}", text, re.DOTALL)
    if match:
        try:
            obj = json.loads(match.group())
            if obj.get("category") in CATEGORIES:
                conf = obj.get("confidence", 0.5)
                if isinstance(conf, str):
                    try: conf = float(conf)
                    except: conf = 0.5
                return {
                    "category": obj["category"],
                    "confidence": conf,
                }
        except json.JSONDecodeError:
            pass
    return {"category": "Other", "confidence": 0.2}


class BedrockAI:
    def __init__(self, region: str, model_id: str):
        import boto3
        self.runtime = boto3.client("bedrock-runtime", region_name=region)
        self.model_id = model_id

    def categorize(self, description: str, amount: float, date: str) -> dict:
        prompt = CATEGORIZE_PROMPT.format(
            categories=", ".join(CATEGORIES),
            description=description,
            amount=amount,
            date=date,
        )
        try:
            resp = self.runtime.converse(
                modelId=self.model_id,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"maxTokens": 100, "temperature": 0.0},
            )
            text = resp["output"]["message"]["content"][0]["text"]
            return _parse_json_response(text)
        except Exception as e:
            print(f"Bedrock Categorize Error: {e}")
            return {"category": "Other", "confidence": 0.0}

    def chat(self, user_id: str, question: str) -> str:
        """AI Money Coach powered by Bedrock Converse API Tool Use (Client-managed RAG & Actions)."""
        
        # 1. Định nghĩa danh sách các Tools chuẩn JSON Schema gửi cho Bedrock
        tools = [
            {
                "toolSpec": {
                    "name": "get_spending_summary",
                    "description": "Lấy báo cáo chi tiêu, thu nhập, dư ròng và phân tích chi tiêu theo từng danh mục của người dùng.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "month": {
                                    "type": "string",
                                    "description": "Tháng cần lấy báo cáo (định dạng YYYY-MM, ví dụ '2026-05'). Có thể để trống để lấy tháng hiện tại."
                                }
                            }
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "list_transactions",
                    "description": "Lấy danh sách các giao dịch tài chính chi tiết của người dùng từ cơ sở dữ liệu để phân tích dòng tiền.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "month": {
                                    "type": "string",
                                    "description": "Tháng cần lọc danh sách giao dịch (định dạng YYYY-MM, ví dụ '2026-05'). Có thể để trống để lấy tất cả."
                                }
                            }
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "create_transaction",
                    "description": "Ghi nhận/Thêm thủ công một giao dịch chi tiêu hoặc thu nhập mới vào cơ sở dữ liệu khi người dùng yêu cầu.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "required": ["description", "amount", "category", "date"],
                            "properties": {
                                "description": {
                                    "type": "string",
                                    "description": "Mô tả chi tiết của giao dịch (ví dụ: 'Ăn trưa Highlands', 'Mua sách Shopee')."
                                },
                                "amount": {
                                    "type": "number",
                                    "description": "Số tiền giao dịch. SỬ DỤNG SỐ ÂM CHO KHOẢN CHI TIÊU (ví dụ: -50000) và SỐ DƯƠNG CHO KHOẢN THU NHẬP (ví dụ: 10000000)."
                                },
                                "category": {
                                    "type": "string",
                                    "enum": CATEGORIES,
                                    "description": "Danh mục phân loại giao dịch."
                                },
                                "date": {
                                    "type": "string",
                                    "description": "Ngày diễn ra giao dịch (định dạng YYYY-MM-DD, ví dụ '2026-05-28')."
                                }
                            }
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "parse_text_csv",
                    "description": "Phân tích cú pháp văn bản thô định dạng CSV do người dùng copy-paste trực tiếp để nạp hàng loạt giao dịch vào DB.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "required": ["csv_text"],
                            "properties": {
                                "csv_text": {
                                    "type": "string",
                                    "description": "Đoạn văn bản định dạng CSV chuẩn có chứa các cột (date, description, amount) được phân tách bằng dấu phẩy."
                                }
                            }
                        }
                    }
                }
            }
        ]

        system_prompt = """You are a helpful and intelligent AI Money Coach for G9 Personal Finance.
You have secure access to the user's database through the provided tools.
Always use the tools dynamically to query their real financial summary, list transactions, create new transactions, or parse CSV text when they ask.
If the user's question requires actual spending details or calculations, call 'get_spending_summary' or 'list_transactions' first to ensure 100% accuracy.
Ground your answers strictly on the tool results returned. Do not hallucinate or guess numbers.
Respond in a friendly, actionable, and structured manner.
Always format currency in VND (e.g. 100.000 ₫).
You must speak the same language as the user's question (usually Vietnamese)."""

        # Bắt đầu luồng gọi Agentic Tool Calling
        messages = [{"role": "user", "content": [{"text": question}]}]
        max_steps = 5  # Giới hạn số bước để tránh vòng lặp vô hạn
        
        # Import động các hàm cần thiết từ handlers và factory
        from src import handlers
        from src.adapters import factory
        
        userstore = factory.make_userstore()
        storage = factory.make_storage()

        for step in range(max_steps):
            try:
                # Gọi Bedrock converse gửi kèm system prompt và cấu hình tools
                resp = self.runtime.converse(
                    modelId=self.model_id,
                    system=[{"text": system_prompt}],
                    messages=messages,
                    toolConfig={"tools": tools}
                )
            except Exception as e:
                print(f"Bedrock converse error at step {step}: {e}")
                return f"Xin lỗi, tôi gặp sự cố khi trò chuyện với AI: {str(e)}"

            output_message = resp["output"]["message"]
            messages.append(output_message)

            # Check xem AI có muốn gọi Tool nào không
            tool_requests = []
            for content in output_message.get("content", []):
                if "toolUse" in content:
                    tool_requests.append(content["toolUse"])

            if not tool_requests:
                # AI không gọi thêm tool nào nữa -> Trả về câu trả lời cuối cùng
                text_content = ""
                for content in output_message.get("content", []):
                    if "text" in content:
                        text_content += content["text"]
                return text_content if text_content else "Tôi đã xử lý yêu cầu của bạn thành công."

            # Thực thi các Tool được yêu cầu
            tool_results = []
            for tool_req in tool_requests:
                tool_use_id = tool_req["toolUseId"]
                tool_name = tool_req["name"]
                tool_input = tool_req["input"]

                print(f"[Bedrock Tool Use] AI wants to run {tool_name} with args: {tool_input}")
                
                result_data = {}
                try:
                    if tool_name == "get_spending_summary":
                        month = tool_input.get("month")
                        res = handlers.handle_summary(user_id, month, userstore)
                        result_data = res
                    elif tool_name == "list_transactions":
                        month = tool_input.get("month")
                        res = handlers.handle_list_transactions(user_id, month, userstore)
                        result_data = {"transactions": res}
                    elif tool_name == "create_transaction":
                        desc = tool_input["description"]
                        amount = float(tool_input["amount"])
                        cat = tool_input["category"]
                        date = tool_input["date"]
                        
                        import uuid
                        txn = {
                            "id": "manual-txn-" + uuid.uuid4().hex[:8],
                            "importId": "manual-import",
                            "date": date,
                            "description": desc,
                            "merchant": desc,
                            "amount": amount,
                            "category": cat,
                            "confidence": 1.0,
                            "status": "AUTO_APPROVED",
                            "classifiedBy": "RULE",
                            "recurring": False
                        }
                        userstore.add_transaction(user_id, txn)
                        result_data = {"status": "success", "transaction": txn}
                    elif tool_name == "parse_text_csv":
                        csv_text = tool_input["csv_text"]
                        import_res = handlers.handle_upload(
                            user_id=user_id,
                            filename="pasted_statement.csv",
                            data=csv_text.encode("utf-8"),
                            ai_client=self,
                            storage=storage,
                            userstore=userstore
                        )
                        result_data = import_res
                    else:
                        result_data = {"error": f"Tool {tool_name} is not implemented"}
                except Exception as err:
                    print(f"Error executing tool {tool_name}: {err}")
                    result_data = {"error": str(err)}

                tool_results.append({
                    "toolResult": {
                        "toolUseId": tool_use_id,
                        "content": [{"json": result_data}]
                    }
                })

            # Đưa kết quả thực thi của Tool ngược lại cho AI dưới dạng tin nhắn "user"
            messages.append({
                "role": "user",
                "content": tool_results
            })

        return "AI Coach bị quá tải ngữ cảnh do thực hiện quá nhiều bước suy luận liên tiếp."


class LocalAI:
    """Rule-based categorizer for development."""
    KEYWORDS = {
        "Income": ["salary", "deposit credit", "payroll", "incoming transfer"],
        "Transfer": ["transfer to", "transfer from", "moved to savings"],
        "Subscriptions": ["subscription", "netflix", "spotify", "openai", "chatgpt", "anthropic",
                          "claude", "github", "icloud", "google one"],
        "Food": ["restaurant", "cafe", "coffee", "starbucks", "highlands", "phở", "pho", "food",
                 "grab food", "shopee food", "lunch", "dinner", "bakery"],
        "Transport": ["grab", "uber", " be ", "xanh sm", "taxi", "metro", "bus", "petrol", "shell",
                      "vinfast", "fuel"],
        "Shopping": ["shopee", "lazada", "tiki", "amazon", "store", "mall", "vincom", "shop"],
        "Utilities": ["electric", "evn", "water", "internet", "viettel", "vnpt", "fpt", "utility"],
        "Entertainment": ["cinema", "cgv", "lotte cinema", "concert", "game"],
        "Health": ["pharmacy", "hospital", "clinic", "guardian", "long chau", "medlatec"],
    }

    def categorize(self, description: str, amount: float, date: str) -> dict:
        desc_lower = description.lower()
        for category, keywords in self.KEYWORDS.items():
            for kw in keywords:
                if kw in desc_lower:
                    return {"category": category, "confidence": 0.9}
        try:
            if float(amount) > 0:
                return {"category": "Income", "confidence": 0.4}
        except (TypeError, ValueError):
            pass
        return {"category": "Other", "confidence": 0.1}

    def chat(self, user_id: str, question: str) -> str:
        return "Xin lỗi, AI Coach đang chạy ở chế độ Offline (LocalAI). Vui lòng cấu hình Bedrock để trò chuyện thực tế."


class OllamaAI:
    def __init__(self, url: str, model_id: str):
        import httpx
        self.url = url.rstrip("/")
        self.model_id = model_id
        self.client = httpx.Client(timeout=60.0)

    def categorize(self, description: str, amount: float, date: str) -> dict:
        prompt = CATEGORIZE_PROMPT.format(
            categories=", ".join(CATEGORIES),
            description=description,
            amount=amount,
            date=date,
        )
        payload = {
            "model": self.model_id,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        try:
            resp = self.client.post(f"{self.url}/api/generate", json=payload)
            resp.raise_for_status()
            text = resp.json().get("response", "")
            return _parse_json_response(text)
        except Exception as e:
            print(f"Ollama Error: {e}")
            return {"category": "Other", "confidence": 0.0}

    def chat(self, user_id: str, question: str) -> str:
        prompt = f"""You are a helpful and intelligent AI Money Coach. Answer the user's question.
User ID: {user_id}
Question: {question}
Answer:"""
        payload = {
            "model": self.model_id,
            "prompt": prompt,
            "stream": False
        }
        try:
            resp = self.client.post(f"{self.url}/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "Không nhận được phản hồi từ Ollama.")
        except Exception as e:
            return f"Ollama Chat Error: {str(e)}"
