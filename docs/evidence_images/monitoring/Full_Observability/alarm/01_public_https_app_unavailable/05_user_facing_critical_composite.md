# 05 - UserFacingCritical Composite

Tao composite alarm `budget-bot-hackathon-UserFacingCritical`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export AWS_ACCOUNT_ID="783459135560"
export ALERT_EMAIL="duykhanh6404@gmail.com"

export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
export SNS_TOPIC_NAME="${ALARM_PREFIX}-public-app-alerts-v2"

export TAG_PROJECT="W7Capstone"
export TAG_TEAM="G9"
export TAG_OWNER="Duc"
export TAG_ENVIRONMENT="hackathon"
```

## Step 1 - Check child alarms

Composite alarm khong dung metric truc tiep. No dung state cua alarm con.
Current composite state: ALARM

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names \
    "${ALARM_PREFIX}-PublicEndpointUnavailable" \
    "${ALARM_PREFIX}-PublicEndpointCanaryFailed" \
  --query 'MetricAlarms[].{Name:AlarmName,State:StateValue}' \
  --output table
```

Neu thieu alarm con, tao file `01` va `02` truoc.

## Step 2 - Create composite alarm

```bash
aws cloudwatch put-composite-alarm \
  --region "$AWS_REGION" \
  --alarm-name "${ALARM_PREFIX}-UserFacingCritical" \
  --alarm-description "Public app unavailable from canary signal" \
  --alarm-rule "ALARM(\"${ALARM_PREFIX}-PublicEndpointUnavailable\") OR ALARM(\"${ALARM_PREFIX}-PublicEndpointCanaryFailed\")" \
  --tags \
    Key=Project,Value="$TAG_PROJECT" \
    Key=Team,Value="$TAG_TEAM" \
    Key=Owner,Value="$TAG_OWNER" \
    Key=Environment,Value="$TAG_ENVIRONMENT"
```

## Step 3 - Action

Topic dang active trong AWS:

```text
arn:aws:sns:us-west-2:783459135560:budget-bot-hackathon-public-app-alerts-v2
```

Email active:

```text
duykhanh6404@gmail.com
```

```bash
export NOTIFICATION_TOPIC_ARN="$(aws sns create-topic \
  --region "$AWS_REGION" \
  --name "$SNS_TOPIC_NAME" \
  --tags \
    Key=Project,Value="$TAG_PROJECT" \
    Key=Team,Value="$TAG_TEAM" \
    Key=Owner,Value="$TAG_OWNER" \
    Key=Environment,Value="$TAG_ENVIRONMENT" \
  --query TopicArn \
  --output text)"
```

```bash
aws sns subscribe \
  --region "$AWS_REGION" \
  --topic-arn "$NOTIFICATION_TOPIC_ARN" \
  --protocol email \
  --notification-endpoint "$ALERT_EMAIL"
```

Confirm email subscription, roi gan action:
Hien tai email `duykhanh6404@gmail.com` da active; neu chay lai subscribe co the khong can confirm lai.

```bash
aws cloudwatch put-composite-alarm \
  --region "$AWS_REGION" \
  --alarm-name "${ALARM_PREFIX}-UserFacingCritical" \
  --alarm-description "Public app unavailable from canary signal" \
  --alarm-rule "ALARM(\"${ALARM_PREFIX}-PublicEndpointUnavailable\") OR ALARM(\"${ALARM_PREFIX}-PublicEndpointCanaryFailed\")" \
  --alarm-actions "$NOTIFICATION_TOPIC_ARN" \
  --tags \
    Key=Project,Value="$TAG_PROJECT" \
    Key=Team,Value="$TAG_TEAM" \
    Key=Owner,Value="$TAG_OWNER" \
    Key=Environment,Value="$TAG_ENVIRONMENT"
```

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-UserFacingCritical" \
  --query 'CompositeAlarms[].{Name:AlarmName,State:StateValue,Rule:AlarmRule,Actions:AlarmActions}' \
  --output table
```

```bash
aws cloudwatch list-tags-for-resource \
  --region "$AWS_REGION" \
  --resource-arn "arn:aws:cloudwatch:${AWS_REGION}:${AWS_ACCOUNT_ID}:alarm:${ALARM_PREFIX}-UserFacingCritical" \
  --output table
```
