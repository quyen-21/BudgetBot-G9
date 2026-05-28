# Request 02 - Backend Compute Failure

## 1. Problem
- Detect khi backend Lambda compute bi loi, throttle, hoac gan timeout.
- User impact: request cham, 5xx, upload/chat workflow khong hoan tat.
- System impact: anh huong Core 2 Application Compute cho hai function `budget-bot-chat` va `budget-bot-upload`.

## 2. Objective
- Dung native `AWS/Lambda` metrics theo resource thuc te: `Errors`, `Throttles`, va `Duration`.
- Monitor `budget-bot-chat` va `budget-bot-upload` cho execution errors/throttles.
- Monitor `budget-bot-chat` duration theo timeout 10s.
- Alert chinh chi page qua `BackendComputeCritical` khi compute signal di kem `UserFacingCritical`.
- Chi tao/cap nhat CloudWatch alarms, khong thay doi Lambda code/config hoac resource cua team core.

## 3. Independent Alarms

### ComputeExecutionErrorsHigh
Purpose:
- Detect Lambda execution errors across backend services.

Metric:
- Namespace: `AWS/Lambda`
- Metric: `Errors`
- Functions:
  - `budget-bot-chat`
  - `budget-bot-upload`
- Math expression: `e1 + e2`

Condition:
- `TotalLambdaErrors >= 1`
- Period: `300 seconds`
- Evaluation periods: `2`
- Datapoints to alarm: `2/2`
- Treat missing data: `notBreaching`

Severity:
- High

Action:
- No direct action. Dung lam supporting alarm cho composite monitoring va root-cause analysis.

Interpretation:
- Backend Lambda execution errors detected across chat/upload services.

![ComputeExecutionErrorsHigh.png](02_backend_compute_failure/Picture/ComputeExecutionErrorsHigh.png)

### ComputeThrottleOrConcurrencyLimit
Purpose:
- Detect Lambda throttles across backend services.

Metric:
- Namespace: `AWS/Lambda`
- Metric: `Throttles`
- Functions:
  - `budget-bot-chat`
  - `budget-bot-upload`
- Math expression: `t1 + t2`

Condition:
- `TotalLambdaThrottles >= 1`
- Period: `300 seconds`
- Evaluation periods: `1`
- Datapoints to alarm: `1/1`
- Treat missing data: `notBreaching`

Severity:
- High

Action:
- No direct action. Dung lam supporting alarm cho composite monitoring va root-cause analysis.

Interpretation:
- Backend Lambda bi throttle hoac thieu execution capacity.

![ComputeThrottleOrConcurrencyLimit.png](02_backend_compute_failure/Picture/ComputeThrottleOrConcurrencyLimit.png)

### ComputeDurationNearTimeout
Purpose:
- Detect Lambda execution gan timeout threshold.

Metric:
- Namespace: `AWS/Lambda`
- Metric: `Duration`
- FunctionName: `budget-bot-chat`
- Statistic: `p95`

Condition:
- `Duration > 8000 ms`
- Period: `300 seconds`
- Evaluation periods: `2`
- Datapoints to alarm: `2/2`
- Treat missing data: `notBreaching`

Severity:
- High

Action:
- No direct action. Dung lam supporting alarm cho composite monitoring va root-cause analysis.

Interpretation:
- Lambda execution dang cham va gan timeout limit 10 giay.

![ComputeDurationNearTimeout.png](02_backend_compute_failure/Picture/ComputeDurationNearTimeout.png)

## 4. Composite Alarms

### BackendComputeCritical
Purpose:
- Alert chinh khi compute failure anh huong request that.

Rule:
- `(ALARM(budget-bot-hackathon-ComputeExecutionErrorsHigh) OR ALARM(budget-bot-hackathon-ComputeThrottleOrConcurrencyLimit) OR ALARM(budget-bot-hackathon-ComputeDurationNearTimeout)) AND ALARM(budget-bot-hackathon-UserFacingCritical)`

Severity:
- Critical

Action:
- SNS action: `budget-bot-hackathon-public-app-alerts-v2`

Interpretation:
- Backend compute signal dang loi/cham/throttle va da co user-facing impact tu alarm `UserFacingCritical`.

![BackendComputeCritical.png](02_backend_compute_failure/Picture/BackendComputeCritical.png)

## 5. Deliverables
- Alarm: `ComputeExecutionErrorsHigh`
- Alarm: `ComputeThrottleOrConcurrencyLimit`
- Alarm: `ComputeDurationNearTimeout`
- Composite alarm: `BackendComputeCritical`

