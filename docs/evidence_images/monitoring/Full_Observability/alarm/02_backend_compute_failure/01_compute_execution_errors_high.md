# 01 - ComputeExecutionErrorsHigh

Tao alarm `budget-bot-hackathon-ComputeExecutionErrorsHigh`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export AWS_ACCOUNT_ID="783459135560"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
export FUNCTION_CHAT="budget-bot-chat"
export FUNCTION_UPLOAD="budget-bot-upload"
```

## Step 1 - Check metric

Dung native Lambda metric, khong tao custom metric.

```bash
aws cloudwatch list-metrics \
  --region "$AWS_REGION" \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --output table
```

## Step 2 - Create alarm

Alarm dung metric math: `Errors(chat) + Errors(upload)`.

```powershell
$metrics = @(
  @{Id='e1'; MetricStat=@{Metric=@{Namespace='AWS/Lambda'; MetricName='Errors'; Dimensions=@(@{Name='FunctionName'; Value='budget-bot-chat'})}; Period=300; Stat='Sum'}; ReturnData=$false},
  @{Id='e2'; MetricStat=@{Metric=@{Namespace='AWS/Lambda'; MetricName='Errors'; Dimensions=@(@{Name='FunctionName'; Value='budget-bot-upload'})}; Period=300; Stat='Sum'}; ReturnData=$false},
  @{Id='total_errors'; Expression='e1+e2'; Label='TotalLambdaErrors'; ReturnData=$true}
)
$path=Join-Path $env:TEMP 'task02-errors-metrics.json'
$metrics | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $path -Encoding ascii
aws cloudwatch put-metric-alarm --region us-west-2 --alarm-name budget-bot-hackathon-ComputeExecutionErrorsHigh --alarm-description 'Task02 backend Lambda execution errors across chat/upload' --metrics "file://$path" --evaluation-periods 2 --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold --treat-missing-data notBreaching --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Khong gan action truc tiep. Alarm nay chi dung trong composite `BackendComputeCritical`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-ComputeExecutionErrorsHigh" \
  --output table
```

Current state: `OK`.
