#!/usr/bin/env bash
# ==============================================================================
# FocalPoint: AWS Serverless Cloud Stack Deployment Script
# Provisions API Gateway, Lambda Orchestrator, Rekognition, Bedrock, Polly, DynamoDB, and S3
# ==============================================================================

set -e

STACK_NAME="focalpoint-stack"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "================================================================="
echo "  FOCALPOINT AWS CLOUD DEPLOYMENT"
echo "  Region: ${AWS_REGION}"
echo "  Stack:  ${STACK_NAME}"
echo "================================================================="

if ! command -v sam &> /dev/null; then
    echo "AWS SAM CLI not found in PATH."
    echo "Install via: brew install aws-sam-cli"
    echo "Or run using Python sam package: pip install aws-sam-cli"
    exit 1
fi

echo "[1/3] Building AWS SAM application..."
sam build --template-file template.yaml

echo "[2/3] Deploying CloudFormation Stack to AWS..."
sam deploy \
    --stack-name "${STACK_NAME}" \
    --resolve-s3 \
    --capabilities CAPABILITY_IAM \
    --region "${AWS_REGION}" \
    --no-confirm-changeset

echo "[3/3] Fetching API Gateway REST Endpoint..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='FocalPointApiUrl'].OutputValue" \
    --output text)

echo "================================================================="
echo "  DEPLOYMENT SUCCESSFUL!"
echo "  Live API Gateway Endpoint: ${API_URL}"
echo "================================================================="
echo "Updating frontend/.env.local with live endpoint..."
echo "NEXT_PUBLIC_API_URL=${API_URL}" > ../frontend/.env.local
echo "NEXT_PUBLIC_AWS_API_URL=${API_URL}" >> ../frontend/.env.local
echo "AWS_API_GATEWAY_URL=${API_URL}" >> ../frontend/.env.local
echo "Done."
