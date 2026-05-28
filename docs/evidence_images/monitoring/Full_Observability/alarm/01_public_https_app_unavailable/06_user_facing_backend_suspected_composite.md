# 06 - UserFacingBackendSuspected Composite

Tao composite alarm `budget-bot-hackathon-UserFacingBackendSuspected`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export AWS_ACCOUNT_ID="783459135560"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
export SNS_TOPIC_NAME="${ALARM_PREFIX}-public-app-alerts-v2"

export TAG_PROJECT="W7Capstone"
export TAG_TEAM="G9"
export TAG_OWNER="Duc"
export TAG_ENVIRONMENT="hackathon"
```

## Step 1 - Check child alarms

Composite alarm khong dung metric truc tiep. No dung state cua alarm con.
Current composite state: OK

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names \
    "${ALARM_PREFIX}-PublicEndpointUnavailable" \
    "${ALARM_PREFIX}-PublicEndpointCanaryFailed" \
    "${ALARM_PREFIX}-Backend5xxOrErrorRateHigh" \
    "${ALARM_PREFIX}-BackendHighLatency" \
  --query 'MetricAlarms[].{Name:AlarmName,State:StateValue}' \
  --output table
```

Neu thieu alarm con, tao file `01`, `02`, `03`, `04` truoc.

## Step 2 - Create composite alarm

```bash
aws cloudwatch put-composite-alarm \
  --region "$AWS_REGION" \
  --alarm-name "${ALARM_PREFIX}-UserFacingBackendSuspected" \
  --alarm-description "Public outage has backend error or latency signal" \
  --alarm-rule "(ALARM(\"${ALARM_PREFIX}-PublicEndpointUnavailable\") OR ALARM(\"${ALARM_PREFIX}-PublicEndpointCanaryFailed\")) AND (ALARM(\"${ALARM_PREFIX}-Backend5xxOrErrorRateHigh\") OR ALARM(\"${ALARM_PREFIX}-BackendHighLatency\"))" \
  --tags \
    Key=Project,Value="$TAG_PROJECT" \
    Key=Team,Value="$TAG_TEAM" \
    Key=Owner,Value="$TAG_OWNER" \
    Key=Environment,Value="$TAG_ENVIRONMENT"
```

## Step 3 - Action

Khong gan action cho composite nay de tranh duplicate alert. Alert chinh nam o `UserFacingCritical`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-UserFacingBackendSuspected" \
  --query 'CompositeAlarms[].{Name:AlarmName,State:StateValue,Rule:AlarmRule,Actions:AlarmActions}' \
  --output table
```

```bash
aws cloudwatch list-tags-for-resource \
  --region "$AWS_REGION" \
  --resource-arn "arn:aws:cloudwatch:${AWS_REGION}:${AWS_ACCOUNT_ID}:alarm:${ALARM_PREFIX}-UserFacingBackendSuspected" \
  --output table
```
