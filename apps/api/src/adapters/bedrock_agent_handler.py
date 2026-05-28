"""Handler for Bedrock Agent Action Group events."""
import json
from src.adapters import factory
from src import handlers

# Khởi tạo các adapter dùng chung (Postgres, S3, v.v.)
userstore = factory.make_userstore()

def handle_bedrock_agent_event(event, context):
    print("Received Bedrock Agent event:", json.dumps(event))
    
    action_group = event.get("actionGroup")
    api_path = event.get("apiPath")
    http_method = event.get("httpMethod")
    
    # Lấy user_id an toàn từ session attributes
    session_attrs = event.get("sessionAttributes", {})
    user_id = session_attrs.get("user_id")
    
    if not user_id:
        # Fallback về default user trong môi trường test nếu thiếu
        user_id = "test-user-001"
        
    # Trích xuất parameters
    parameters = {}
    for p in event.get("parameters", []):
        parameters[p["name"]] = p["value"]
        
    status_code = 200
    response_body = {}
    
    try:
        if api_path == "/summary":
            month = parameters.get("month")
            res = handlers.handle_summary(user_id, month, userstore)
            response_body = res
        elif api_path == "/transactions":
            month = parameters.get("month")
            res = handlers.handle_list_transactions(user_id, month, userstore)
            response_body = {"transactions": res}
        elif api_path == "/rules" and http_method == "POST":
            # Trích xuất body từ requestBody
            req_body = event.get("requestBody", {}).get("content", {}).get("application/json", {}).get("properties", [])
            body_params = {p["name"]: p["value"] for p in req_body}
            contains = body_params.get("contains") or parameters.get("contains")
            category = body_params.get("category") or parameters.get("category")
            
            if not contains or not category:
                raise ValueError("Missing contains or category for rule creation")
                
            import uuid
            rule = {
                "id": "rule-" + uuid.uuid4().hex[:8],
                "contains": contains,
                "category": category
            }
            userstore.add_rule(user_id, rule)
            response_body = rule
        else:
            status_code = 404
            response_body = {"error": f"Unknown API Path: {api_path}"}
    except Exception as e:
        print(f"Error handling Bedrock Agent action: {e}")
        status_code = 500
        response_body = {"error": str(e)}
        
    # Định dạng phản hồi chuẩn bắt buộc của Bedrock Agent Action Group Lambda Response
    response = {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": action_group,
            "apiPath": api_path,
            "httpMethod": http_method,
            "statusCode": status_code,
            "responseBody": {
                "application/json": {
                    "body": json.dumps(response_body)
                }
            }
        }
    }
    
    print("Sending response to Bedrock Agent:", json.dumps(response))
    return response
