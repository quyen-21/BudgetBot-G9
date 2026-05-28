# 03 - ComputeDurationNearTimeout

Tao alarm `budget-bot-hackathon-ComputeDurationNearTimeout`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
export FUNCTION_NAME="budget-bot-chat"
```

## Step 1 - Check metric

Dung native Lambda `Duration`. `budget-bot-chat` timeout la 10s, threshold dat 8s.

```bash
aws cloudwatch list-metrics \
  --region "$AWS_REGION" \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value="$FUNCTION_NAME" \
  --output table
```

## Step 2 - Create alarm

```bash
aws cloudwatch put-metric-alarm \
  --region "$AWS_REGION" \
  --alarm-name "${ALARM_PREFIX}-ComputeDurationNearTimeout" \
  --alarm-description "Task02 budget-bot-chat p95 duration above 80 percent of 10s timeout" \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value="$FUNCTION_NAME" \
  --extended-statistic p95 \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 8000 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Khong gan action truc tiep. Alarm nay chi dung trong composite `BackendComputeCritical`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-ComputeDurationNearTimeout" \
  --output table
```

Current state: `OK`.
