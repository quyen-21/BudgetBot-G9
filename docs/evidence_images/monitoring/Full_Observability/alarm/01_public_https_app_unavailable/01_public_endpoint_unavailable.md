# 01 - PublicEndpointUnavailable

Tao alarm `budget-bot-hackathon-PublicEndpointUnavailable`.

## Step 0 - Input

```bash
export AWS_REGION="us-west-2"
export AWS_ACCOUNT_ID="783459135560"
export APP_NAME="budget-bot"
export ENVIRONMENT="hackathon"
export ALARM_PREFIX="${APP_NAME}-${ENVIRONMENT}"
export CANARY_NAME="${ALARM_PREFIX}-public-endpoint"
export SNS_TOPIC_NAME="${ALARM_PREFIX}-public-app-alerts-v2"

export TAG_PROJECT="W7Capstone"
export TAG_TEAM="G9"
export TAG_OWNER="Duc"
export TAG_ENVIRONMENT="hackathon"
```

## Step 1 - Check metric source

Metric nay do CloudWatch Synthetics canary sinh ra.
Metric source da tao trong AWS:

```text
Canary: budget-bot-hackathon-public-endpoint
URL: https://jkmzhu6ro5.execute-api.us-west-2.amazonaws.com/chat
Artifact bucket: budget-bot-hackathon-synthetics-783459135560-us-west-2
Role: budget-bot-hackathon-public-endpoint-role
Current canary state: RUNNING
Current alarm state: ALARM
```

```bash
aws synthetics get-canary \
  --region "$AWS_REGION" \
  --name "$CANARY_NAME" \
  --output table
```

```bash
aws cloudwatch list-metrics \
  --region "$AWS_REGION" \
  --namespace CloudWatchSynthetics \
  --metric-name SuccessPercent \
  --dimensions Name=CanaryName,Value="$CANARY_NAME" \
  --output table
```

Neu canary co nhung chua co metric, start canary:

```bash
aws synthetics start-canary \
  --region "$AWS_REGION" \
  --name "$CANARY_NAME"
```

Neu `get-canary` fail, tao canary truoc roi quay lai file nay.

## Step 2 - Create alarm

```bash
aws cloudwatch put-metric-alarm \
  --region "$AWS_REGION" \
  --alarm-name "${ALARM_PREFIX}-PublicEndpointUnavailable" \
  --alarm-description "Public endpoint canary SuccessPercent below 100" \
  --namespace CloudWatchSynthetics \
  --metric-name SuccessPercent \
  --dimensions Name=CanaryName,Value="$CANARY_NAME" \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator LessThanThreshold \
  --treat-missing-data breaching \
  --tags \
    Key=Project,Value="$TAG_PROJECT" \
    Key=Team,Value="$TAG_TEAM" \
    Key=Owner,Value="$TAG_OWNER" \
    Key=Environment,Value="$TAG_ENVIRONMENT"
```

## Step 3 - Action

Khong gan action truc tiep cho alarm don le nay. Action duoc gan o composite alarm `UserFacingCritical` trong file `05`.

## Step 4 - Verify

```bash
aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-names "${ALARM_PREFIX}-PublicEndpointUnavailable" \
  --output table
```

```bash
aws cloudwatch list-tags-for-resource \
  --region "$AWS_REGION" \
  --resource-arn "arn:aws:cloudwatch:${AWS_REGION}:${AWS_ACCOUNT_ID}:alarm:${ALARM_PREFIX}-PublicEndpointUnavailable" \
  --output table
```
