# 04 - AiFallbackRateHigh

Tao alarm `budget-bot-hackathon-AiFallbackRateHigh`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
export BACKEND_LOG_GROUP_NAME="/aws/lambda/budget-bot-chat"
```

## Step 1 - Create/check metric source

Dung CloudWatch Logs Metric Filter vi khong co custom app fallback metric.

```bash
aws logs put-metric-filter \
  --region "$AWS_REGION" \
  --log-group-name "$BACKEND_LOG_GROUP_NAME" \
  --filter-name "${ALARM_PREFIX}-ai-fallback-filter" \
  --filter-pattern "?fallback ?Fallback ?AI_FALLBACK ?model_fallback" \
  --metric-transformations metricName=AiFallbackCount,metricNamespace=FullObservability/Logs,metricValue=1,defaultValue=0
```

```bash
aws logs describe-metric-filters \
  --region "$AWS_REGION" \
  --log-group-name "$BACKEND_LOG_GROUP_NAME" \
  --filter-name-prefix "${ALARM_PREFIX}-ai-fallback-filter" \
  --output table
```

## Step 2 - Create alarm

```bash
aws cloudwatch put-metric-alarm \
  --region "$AWS_REGION" \
  --alarm-name "${ALARM_PREFIX}-AiFallbackRateHigh" \
  --alarm-description "Task03 AI fallback detected from Lambda logs" \
  --namespace FullObservability/Logs \
  --metric-name AiFallbackCount \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --treat-missing-data notBreaching \
  --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Khong gan action truc tiep. Alarm nay dung trong composite `AiFeatureDegraded`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-AiFallbackRateHigh" \
  --output table
```

Current state: `OK`.
