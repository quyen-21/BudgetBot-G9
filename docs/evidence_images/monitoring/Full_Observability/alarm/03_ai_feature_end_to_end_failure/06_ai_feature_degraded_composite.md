# 06 - AiFeatureDegraded Composite

Tao composite alarm `budget-bot-hackathon-AiFeatureDegraded`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
```

## Step 1 - Check child alarms

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names \
    "${ALARM_PREFIX}-AiLatencyHigh" \
    "${ALARM_PREFIX}-AiFallbackRateHigh" \
    "${ALARM_PREFIX}-AiThrottleHigh" \
  --output table
```

## Step 2 - Create composite alarm

```powershell
$rule = 'ALARM("budget-bot-hackathon-AiLatencyHigh") OR ALARM("budget-bot-hackathon-AiFallbackRateHigh") OR ALARM("budget-bot-hackathon-AiThrottleHigh")'
aws cloudwatch put-composite-alarm --region us-west-2 --alarm-name budget-bot-hackathon-AiFeatureDegraded --alarm-description 'Task03 AI dependency degraded warning' --alarm-rule $rule --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Khong gan action de tranh warning noise.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-types CompositeAlarm \
  --alarm-names "${ALARM_PREFIX}-AiFeatureDegraded" \
  --output table
```

Current state: `OK`.
