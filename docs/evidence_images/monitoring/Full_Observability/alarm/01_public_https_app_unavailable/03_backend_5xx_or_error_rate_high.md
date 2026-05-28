# 03 - Backend5xxOrErrorRateHigh

Tao alarm `budget-bot-hackathon-Backend5xxOrErrorRateHigh`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export AWS_ACCOUNT_ID="783459135560"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
export FUNCTION_NAME="budget-bot-chat"

export TAG_PROJECT="W7Capstone"
export TAG_TEAM="G9"
export TAG_OWNER="Duc"
export TAG_ENVIRONMENT="hackathon"
```

## Step 1 - Check metric

Dung native Lambda metric, khong can custom metric.
Current alarm state: OK

```bash
aws cloudwatch list-metrics \
  --region "$AWS_REGION" \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value="$FUNCTION_NAME" \
  --output table
```

## Step 2 - Create alarm

```bash
aws cloudwatch put-metric-alarm \
  --region "$AWS_REGION" \
  --alarm-name "${ALARM_PREFIX}-Backend5xxOrErrorRateHigh" \
  --alarm-description "Lambda backend errors detected" \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value="$FUNCTION_NAME" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --treat-missing-data notBreaching \
  --tags \
    Key=Project,Value="$TAG_PROJECT" \
    Key=Team,Value="$TAG_TEAM" \
    Key=Owner,Value="$TAG_OWNER" \
    Key=Environment,Value="$TAG_ENVIRONMENT"
```

## Step 3 - Action

Khong gan action truc tiep cho alarm don le nay. Alarm nay chi dung cho composite `UserFacingBackendSuspected`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-Backend5xxOrErrorRateHigh" \
  --output table
```

```bash
aws cloudwatch list-tags-for-resource \
  --region "$AWS_REGION" \
  --resource-arn "arn:aws:cloudwatch:${AWS_REGION}:${AWS_ACCOUNT_ID}:alarm:${ALARM_PREFIX}-Backend5xxOrErrorRateHigh" \
  --output table
```
