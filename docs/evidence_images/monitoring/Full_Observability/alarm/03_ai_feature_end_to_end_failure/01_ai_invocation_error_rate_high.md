# 01 - AiInvocationErrorRateHigh

Tao alarm `budget-bot-hackathon-AiInvocationErrorRateHigh`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
```

## Step 1 - Check metric

Dung native Bedrock metrics, khong tao custom metric.

```bash
aws cloudwatch list-metrics \
  --region "$AWS_REGION" \
  --namespace AWS/Bedrock \
  --output table
```

## Step 2 - Create alarm

Alarm dung metric math:

```text
InvocationClientErrors / Invocations * 100
```

```powershell
$metrics = @(
  @{Id='errors'; MetricStat=@{Metric=@{Namespace='AWS/Bedrock'; MetricName='InvocationClientErrors'}; Period=300; Stat='Sum'}; ReturnData=$false},
  @{Id='calls'; MetricStat=@{Metric=@{Namespace='AWS/Bedrock'; MetricName='Invocations'}; Period=300; Stat='Sum'}; ReturnData=$false},
  @{Id='error_rate'; Expression='IF(calls>0, errors/calls*100, 0)'; Label='BedrockInvocationErrorRate'; ReturnData=$true}
)
$path=Join-Path $env:TEMP 'task03-ai-error-rate-metrics.json'
$metrics | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $path -Encoding ascii
aws cloudwatch put-metric-alarm --region us-west-2 --alarm-name budget-bot-hackathon-AiInvocationErrorRateHigh --alarm-description 'Task03 Bedrock invocation client error rate above 5 percent' --metrics "file://$path" --evaluation-periods 2 --threshold 5 --comparison-operator GreaterThanThreshold --treat-missing-data notBreaching --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Khong gan action truc tiep. Alarm nay chi dung trong composite `AiFeatureCritical`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-AiInvocationErrorRateHigh" \
  --output table
```

Current state: `OK`.
