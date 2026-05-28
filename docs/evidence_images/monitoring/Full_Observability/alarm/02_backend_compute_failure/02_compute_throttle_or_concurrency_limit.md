# 02 - ComputeThrottleOrConcurrencyLimit

Tao alarm `budget-bot-hackathon-ComputeThrottleOrConcurrencyLimit`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
```

## Step 1 - Check metric

Dung native Lambda metric, khong tao custom metric.

```bash
aws cloudwatch list-metrics \
  --region "$AWS_REGION" \
  --namespace AWS/Lambda \
  --metric-name Throttles \
  --output table
```

## Step 2 - Create alarm

Alarm dung metric math: `Throttles(chat) + Throttles(upload)`.

```powershell
$metrics = @(
  @{Id='t1'; MetricStat=@{Metric=@{Namespace='AWS/Lambda'; MetricName='Throttles'; Dimensions=@(@{Name='FunctionName'; Value='budget-bot-chat'})}; Period=300; Stat='Sum'}; ReturnData=$false},
  @{Id='t2'; MetricStat=@{Metric=@{Namespace='AWS/Lambda'; MetricName='Throttles'; Dimensions=@(@{Name='FunctionName'; Value='budget-bot-upload'})}; Period=300; Stat='Sum'}; ReturnData=$false},
  @{Id='total_throttles'; Expression='t1+t2'; Label='TotalLambdaThrottles'; ReturnData=$true}
)
$path=Join-Path $env:TEMP 'task02-throttles-metrics.json'
$metrics | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $path -Encoding ascii
aws cloudwatch put-metric-alarm --region us-west-2 --alarm-name budget-bot-hackathon-ComputeThrottleOrConcurrencyLimit --alarm-description 'Task02 backend Lambda throttles across chat/upload' --metrics "file://$path" --evaluation-periods 1 --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold --treat-missing-data notBreaching --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Khong gan action truc tiep. Alarm nay dung trong composite `BackendComputeCritical`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-ComputeThrottleOrConcurrencyLimit" \
  --output table
```

Current state: `OK`.
