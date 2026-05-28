# 04 - BackendComputeCritical Composite

Tao composite alarm `budget-bot-hackathon-BackendComputeCritical`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
export NOTIFICATION_TOPIC_ARN="arn:aws:sns:us-west-2:783459135560:budget-bot-hackathon-public-app-alerts-v2"
```

## Step 1 - Check child alarms

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names \
    "${ALARM_PREFIX}-ComputeExecutionErrorsHigh" \
    "${ALARM_PREFIX}-ComputeThrottleOrConcurrencyLimit" \
    "${ALARM_PREFIX}-ComputeDurationNearTimeout" \
    "${ALARM_PREFIX}-UserFacingCritical" \
  --output table
```

## Step 2 - Create composite alarm

```powershell
$rule = '(ALARM("budget-bot-hackathon-ComputeExecutionErrorsHigh") OR ALARM("budget-bot-hackathon-ComputeThrottleOrConcurrencyLimit") OR ALARM("budget-bot-hackathon-ComputeDurationNearTimeout")) AND ALARM("budget-bot-hackathon-UserFacingCritical")'
aws cloudwatch put-composite-alarm --region us-west-2 --alarm-name budget-bot-hackathon-BackendComputeCritical --alarm-description 'Task02 backend compute failure with user-facing impact' --alarm-rule $rule --alarm-actions arn:aws:sns:us-west-2:783459135560:budget-bot-hackathon-public-app-alerts-v2 --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Co SNS action vi day la alert chinh cua Task 02.

```text
arn:aws:sns:us-west-2:783459135560:budget-bot-hackathon-public-app-alerts-v2
```

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-types CompositeAlarm \
  --alarm-names "${ALARM_PREFIX}-BackendComputeCritical" \
  --output table
```

Current state: `OK`.
