# 03 - AiThrottleHigh

Tao alarm `budget-bot-hackathon-AiThrottleHigh`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
```

## Step 1 - Check metric

Dung native Bedrock metric `EstimatedTPMQuotaUsage` lam quota/throttle early warning.

```bash
aws cloudwatch list-metrics \
  --region "$AWS_REGION" \
  --namespace AWS/Bedrock \
  --metric-name EstimatedTPMQuotaUsage \
  --output table
```

## Step 2 - Create alarm

```bash
aws cloudwatch put-metric-alarm \
  --region "$AWS_REGION" \
  --alarm-name "${ALARM_PREFIX}-AiThrottleHigh" \
  --alarm-description "Task03 Bedrock estimated TPM quota usage above 80 percent" \
  --namespace AWS/Bedrock \
  --metric-name EstimatedTPMQuotaUsage \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Khong gan action truc tiep. Alarm nay dung trong composite `AiFeatureCritical` va `AiFeatureDegraded`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-AiThrottleHigh" \
  --output table
```

Current state: `OK`.
