#!/bin/bash

# Script para importar recursos existentes na AWS ou criar novos

CLUSTER_NAME="devops-a3-cluster"
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🔍 Verificando recursos existentes na AWS..."

# 1. Verificar e importar IAM Role
echo "Checando IAM Role: ecsTaskExecutionRole-${CLUSTER_NAME}"
if aws iam get-role --role-name "ecsTaskExecutionRole-${CLUSTER_NAME}" 2>/dev/null; then
    echo "✅ IAM Role encontrada! Importando..."
    terraform import aws_iam_role.task_exec "ecsTaskExecutionRole-${CLUSTER_NAME}" || echo "⚠️ Falha ao importar IAM Role"
else
    echo "❌ IAM Role não encontrada. Será criada pelo Terraform."
fi

# 2. Verificar e importar Target Group
echo "Checando Target Group: strapi-a3-tg"
TG_ARN=$(aws elbv2 describe-target-groups \
    --names "strapi-a3-tg" \
    --region ${AWS_REGION} \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text 2>/dev/null)

if [ "$TG_ARN" != "None" ] && [ ! -z "$TG_ARN" ]; then
    echo "✅ Target Group encontrada! ARN: $TG_ARN"
    echo "Importando..."
    terraform import aws_lb_target_group.app "$TG_ARN" || echo "⚠️ Falha ao importar Target Group"
else
    echo "❌ Target Group não encontrada. Será criada pelo Terraform."
fi

# 3. Verificar VPC
echo "Checando VPC: devops-a3-vpc"
VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=devops-a3-vpc" \
    --region ${AWS_REGION} \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null)

if [ "$VPC_ID" != "None" ] && [ ! -z "$VPC_ID" ]; then
    echo "✅ VPC encontrada! ID: $VPC_ID"
    echo "Importando..."
    terraform import aws_vpc.main "$VPC_ID" || echo "⚠️ Falha ao importar VPC"
else
    echo "❌ VPC não encontrada. Será criada pelo Terraform."
fi

echo "✅ Verificação completa!"
