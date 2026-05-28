# 02 - AiLatencyHigh

Tao alarm `budget-bot-hackathon-AiLatencyHigh`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
```

## Step 1 - Check metric

Dung native Bedrock metric `InvocationLatency`.

```bash
aws cloudwatch list-metrics \
  --region "$AWS_REGION" \
  --namespace AWS/Bedrock \
  --metric-name InvocationLatency \
  --output table
```

## Step 2 - Create alarm

```bash
aws cloudwatch put-metric-alarm \
  --region "$AWS_REGION" \
  --alarm-name "${ALARM_PREFIX}-AiLatencyHigh" \
  --alarm-description "Task03 Bedrock p95 invocation latency above 8000ms" \
  --namespace AWS/Bedrock \
  --metric-name InvocationLatency \
  --extended-statistic p95 \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 8000 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Khong gan action truc tiep. Alarm nay dung trong composite `AiFeatureDegraded`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-AiLatencyHigh" \
  --output table
```

Current state: `OK`.
