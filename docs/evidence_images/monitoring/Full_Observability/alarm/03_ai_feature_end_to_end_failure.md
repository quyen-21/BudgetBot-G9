# Request 03 - AI Feature End-to-End Failure

## 1. Problem
- Detect khi AI feature dung Bedrock bi loi, cham, quota pressure, hoac phai fallback.
- User impact: user khong nhan duoc AI result dung chat luong, nhan fallback, hoac flow bi cham/loi.
- System impact: anh huong Core 3 AI/ML Feature va co the keo theo backend compute/user-facing incident.

## 2. Objective
- Monitor Bedrock bang native `AWS/Bedrock` metrics: invocation error rate, latency, va estimated TPM quota usage.
- Monitor fallback tu Lambda log group `/aws/lambda/budget-bot-chat` bang CloudWatch Logs metric filter.
- Phan biet AI degraded warning voi AI incident that anh huong user/backend flow.
- Chi page qua `AiFeatureCritical` khi AI signal di kem `UserFacingCritical` hoac `BackendComputeCritical`.
- Khong log prompt/response/token/PII trong metric evidence.

## 3. Independent Alarms

### AiInvocationErrorRateHigh
Purpose:
- Detect Bedrock invocation client error rate cao.

Metric:
- Namespace: `AWS/Bedrock`
- Metrics:
  - `InvocationClientErrors`
  - `Invocations`
- Math expression: `IF(calls>0, errors/calls*100, 0)`
- Label: `BedrockInvocationErrorRate`

Condition:
- Error rate `> 5%`
- Period: `300 seconds`
- Evaluation periods: `2`
- Treat missing data: `notBreaching`

Severity:
- High

Action:
- No direct action. Dung lam child alarm cho composite `AiFeatureCritical`.

Interpretation:
- Bedrock invocation dang fail theo ti le cao.

(docs/evidence_images/monitoring/Full_Observability\alarm\03_ai_feature_end_to_end_failure\Picture\AiInvocationErrorRateHigh.png)

### AiLatencyHigh
Purpose:
- Detect Bedrock response cham.

Metric:
- Namespace: `AWS/Bedrock`
- Metric: `InvocationLatency`
- Statistic: `p95`

Condition:
- `p95 > 8000 ms`
- Period: `300 seconds`
- Evaluation periods: `2`
- Treat missing data: `notBreaching`

Severity:
- High

Action:
- No direct action. Dung lam child alarm cho composite `AiFeatureDegraded`.

Interpretation:
- AI dependency cham, co the lam backend timeout hoac workflow cham.

(docs/evidence_images/monitoring/Full_Observability\alarm\03_ai_feature_end_to_end_failure\Picture\AiLatencyHigh.png)

### AiThrottleHigh
Purpose:
- Detect Bedrock quota/throughput pressure.

Metric:
- Namespace: `AWS/Bedrock`
- Metric: `EstimatedTPMQuotaUsage`
- Statistic: `Average`

Condition:
- `Average > 80`
- Period: `300 seconds`
- Evaluation periods: `2`
- Treat missing data: `notBreaching`

Severity:
- High

Action:
- No direct action. Dung lam child alarm cho `AiFeatureCritical` va `AiFeatureDegraded`.

Interpretation:
- Bedrock token-per-minute quota usage cao, co nguy co throttle hoac degraded latency.

(docs/evidence_images/monitoring/Full_Observability\alarm\03_ai_feature_end_to_end_failure\Picture\AiThrottleHigh.png)

### AiFallbackRateHigh
Purpose:
- Detect AI fallback xuat hien trong backend logs.

Metric source:
- CloudWatch Logs metric filter
- Log group: `/aws/lambda/budget-bot-chat`
- Filter name: `budget-bot-hackathon-ai-fallback-filter`
- Filter pattern: `?fallback ?Fallback ?AI_FALLBACK ?model_fallback`

Metric:
- Namespace: `FullObservability/Logs`
- Metric: `AiFallbackCount`
- Statistic: `Sum`

Condition:
- `Sum >= 1`
- Period: `300 seconds`
- Evaluation periods: `2`
- Treat missing data: `notBreaching`

Severity:
- Medium

Action:
- No direct action. Dung lam child alarm cho composite `AiFeatureDegraded`.

Interpretation:
- AI feature co the degraded am tham du backend van tra HTTP 200.

(docs/evidence_images/monitoring/Full_Observability\alarm\03_ai_feature_end_to_end_failure\Picture\AiFallbackRateHigh.png)

## 4. Composite Alarms

### AiFeatureCritical
Purpose:
- Alert chinh khi AI failure anh huong user/backend flow.

Rule:
- `(ALARM(budget-bot-hackathon-AiInvocationErrorRateHigh) OR ALARM(budget-bot-hackathon-AiThrottleHigh)) AND (ALARM(budget-bot-hackathon-UserFacingCritical) OR ALARM(budget-bot-hackathon-BackendComputeCritical))`

Severity:
- Critical

Action:
- SNS action: `budget-bot-hackathon-public-app-alerts-v2`

Interpretation:
- AI dependency co loi/quota pressure va da co user-facing hoac backend compute impact.

(docs/evidence_images/monitoring/Full_Observability\alarm\03_ai_feature_end_to_end_failure\Picture\AiFeatureCritical.png)

### AiFeatureDegraded
Purpose:
- Warning khi AI dependency degraded nhung chua chung minh user/backend incident.

Rule:
- `ALARM(budget-bot-hackathon-AiLatencyHigh) OR ALARM(budget-bot-hackathon-AiFallbackRateHigh) OR ALARM(budget-bot-hackathon-AiThrottleHigh)`

Severity:
- Medium

Action:
- No direct action.

Interpretation:
- Can kiem tra Bedrock latency, quota usage, fallback logic, va thay doi gan day trong prompt/model/backend.

(docs/evidence_images/monitoring/Full_Observability\alarm\03_ai_feature_end_to_end_failure\Picture\AiFeatureDegraded.png)

## 5. Deliverables
- Alarm: `AiInvocationErrorRateHigh`
- Alarm: `AiLatencyHigh`
- Alarm: `AiThrottleHigh`
- Alarm: `AiFallbackRateHigh`
- Composite alarm: `AiFeatureCritical`
- Composite alarm: `AiFeatureDegraded`
- Logs metric filter: `budget-bot-hackathon-ai-fallback-filter`
