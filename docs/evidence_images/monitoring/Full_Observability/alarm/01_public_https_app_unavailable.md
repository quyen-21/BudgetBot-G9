# Request 01 - Public HTTPS App Unavailable

## 1. Problem
- Detect khi public HTTPS endpoint cua app khong truy cap duoc tu ben ngoai.
- User impact: app khong mo duoc, request timeout, health check fail, hoac canary nhan loi khong mong muon.
- System impact: anh huong truc tiep Core 1 User Interface; Lambda `budget-bot-chat` duoc dung lam tin hieu ho tro root-cause.

## 2. Objective
- Monitor public endpoint bang CloudWatch Synthetics canary `budget-bot-hackathon-public-endpoint`.
- Dung `UserFacingCritical` lam alert chinh cho user-facing outage.
- Dung Lambda alarms `Backend5xxOrErrorRateHigh` va `BackendHighLatency` de xac dinh public outage co kha nang do backend.
- Khong dung ALB/API Gateway metric vi resource thuc te cua task nay dang monitor CloudWatch Synthetics va Lambda.

## 3. Independent Alarms

### PublicEndpointUnavailable
Purpose:
- Detect public URL fail tu ben ngoai app bang CloudWatch Synthetics.

Metric:
- Namespace: `CloudWatchSynthetics`
- Metric: `SuccessPercent`
- Dimension: `budget-bot-hackathon-public-endpoint`

Condition:
- `Average SuccessPercent < 100`
- Period: `300 seconds`
- Evaluation periods: `1`
- Treat missing data: `breaching`

Severity:
- Critical

Action:
- Khong page truc tiep; dung trong composite alarm.

Interpretation:
- Public endpoint unreachable hoac health check failed.

(docs/evidence_images/monitoring/Full_Observability\alarm\01_public_https_app_unavailable\Picture\PublicEndpointUnavailable.png)

### PublicEndpointCanaryFailed
Purpose:
- Detect so lan canary run bi fail.

Metric:
- Namespace: `CloudWatchSynthetics`
- Metric: `Failed`
- Dimension: `budget-bot-hackathon-public-endpoint`

Condition:
- `Sum Failed >= 1`
- Period: `300 seconds`
- Evaluation periods: `1`
- Treat missing data: `notBreaching`

Severity:
- Critical

Action:
- Khong page truc tiep; dung de bo tro `PublicEndpointUnavailable`.

Interpretation:
- Canary da chay va xac nhan endpoint fail.

(docs/evidence_images/monitoring/Full_Observability\alarm\01_public_https_app_unavailable\Picture\PublicEndpointCanaryFailed.png)

### Backend5xxOrErrorRateHigh
Purpose:
- Detect Lambda backend dang tra loi lam public app degraded.

Metric:
- Namespace: `AWS/Lambda`
- Metric: `Errors`
- FunctionName: `budget-bot-chat`

Condition:
- `Sum Errors >= 1`
- Period: `300 seconds`
- Evaluation periods: `2`
- Treat missing data: `notBreaching`

Severity:
- High

Action:
- Khong page truc tiep neu chua co user-facing signal.

Interpretation:
- Backend co kha nang la nguyen nhan public app fail/degraded.

(docs/evidence_images/monitoring/Full_Observability\alarm\01_public_https_app_unavailable\Picture\Backend5xxOrErrorRateHigh.png)

### BackendHighLatency
Purpose:
- Detect backend cham truoc khi thanh outage.

Metric:
- Namespace: `AWS/Lambda`
- Metric: `Duration`
- FunctionName: `budget-bot-chat`

Condition:
- `p95 Duration >= 3000`
- Period: `300 seconds`
- Evaluation periods: `2`
- Treat missing data: `notBreaching`

Severity:
- High

Action:
- Khong page truc tiep neu chua co user-facing impact.

Interpretation:
- Backend dang degraded, co nguy co timeout hoac lam canary fail.

(docs/evidence_images/monitoring/Full_Observability\alarm\01_public_https_app_unavailable\Picture\BackendHighLatency.png)

## 4. Composite Alarms

### UserFacingCritical
Purpose:
- Alert chinh khi public app khong dung duoc hoac dang degraded ro rang.

Rule:
- `ALARM(budget-bot-hackathon-PublicEndpointUnavailable) OR ALARM(budget-bot-hackathon-PublicEndpointCanaryFailed)`

Severity:
- Critical

Action:
- SNS action.

Interpretation:
- User co kha nang dang bi anh huong. Uu tien kiem tra canary run, DNS/TLS/public endpoint, sau do backend logs.

(docs/evidence_images/monitoring/Full_Observability\alarm\01_public_https_app_unavailable\Picture\UserFacingCritical.png)

### UserFacingBackendSuspected
Purpose:
- Tach truong hop public outage co dau hieu do backend.

Rule:
- `(ALARM(budget-bot-hackathon-PublicEndpointUnavailable) OR ALARM(budget-bot-hackathon-PublicEndpointCanaryFailed)) AND (ALARM(budget-bot-hackathon-Backend5xxOrErrorRateHigh) OR ALARM(budget-bot-hackathon-BackendHighLatency))`

Severity:
- Critical

Action:
- SNS action.

Interpretation:
- Public endpoint fail va backend cung loi/cham. Bat dau dieu tra Lambda `budget-bot-chat`, deployment gan nhat, va dependency downstream.

(docs/evidence_images/monitoring/Full_Observability\alarm\01_public_https_app_unavailable\Picture\UserFacingBackendSuspected.png)

## 5. Deliverables
- Alarm: `PublicEndpointUnavailable`
- Alarm: `PublicEndpointCanaryFailed`
- Alarm: `Backend5xxOrErrorRateHigh`
- Alarm: `BackendHighLatency`
- Composite alarm: `UserFacingCritical`
- Composite alarm: `UserFacingBackendSuspected`
