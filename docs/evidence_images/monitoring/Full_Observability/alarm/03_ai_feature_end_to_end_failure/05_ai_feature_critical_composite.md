# 05 - AiFeatureCritical Composite

Tao composite alarm `budget-bot-hackathon-AiFeatureCritical`.

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
    "${ALARM_PREFIX}-AiInvocationErrorRateHigh" \
    "${ALARM_PREFIX}-AiThrottleHigh" \
    "${ALARM_PREFIX}-UserFacingCritical" \
    "${ALARM_PREFIX}-BackendComputeCritical" \
  --output table
```

## Step 2 - Create composite alarm

```powershell
$rule = '(ALARM("budget-bot-hackathon-AiInvocationErrorRateHigh") OR ALARM("budget-bot-hackathon-AiThrottleHigh")) AND (ALARM("budget-bot-hackathon-UserFacingCritical") OR ALARM("budget-bot-hackathon-BackendComputeCritical"))'
aws cloudwatch put-composite-alarm --region us-west-2 --alarm-name budget-bot-hackathon-AiFeatureCritical --alarm-description 'Task03 AI failure with user/backend impact' --alarm-rule $rule --alarm-actions arn:aws:sns:us-west-2:783459135560:budget-bot-hackathon-public-app-alerts-v2 --tags Key=Project,Value=W7Capstone Key=Team,Value=G9 Key=Owner,Value=Duc Key=Environment,Value=hackathon
```

## Step 3 - Action

Co SNS action vi day la alert chinh cua Task 03.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-types CompositeAlarm \
  --alarm-names "${ALARM_PREFIX}-AiFeatureCritical" \
  --output table
```

Current state: `OK`.
