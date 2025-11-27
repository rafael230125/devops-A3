# Script para importar recursos existentes na AWS ou criar novos
# Para Windows PowerShell

$CLUSTER_NAME = "devops-a3-cluster"
$AWS_REGION = "us-east-1"

Write-Host "🔍 Verificando recursos existentes na AWS..." -ForegroundColor Cyan

# 1. Verificar e importar IAM Role
Write-Host "Checando IAM Role: ecsTaskExecutionRole-${CLUSTER_NAME}" -ForegroundColor Yellow
try {
    $roleExists = aws iam get-role --role-name "ecsTaskExecutionRole-${CLUSTER_NAME}" 2>$null
    if ($roleExists) {
        Write-Host "✅ IAM Role encontrada! Importando..." -ForegroundColor Green
        terraform import aws_iam_role.task_exec "ecsTaskExecutionRole-${CLUSTER_NAME}"
    }
} catch {
    Write-Host "❌ IAM Role não encontrada. Será criada pelo Terraform." -ForegroundColor Red
}

# 2. Verificar e importar Target Group
Write-Host "Checando Target Group: strapi-a3-tg" -ForegroundColor Yellow
try {
    $tgArn = aws elbv2 describe-target-groups `
        --names "strapi-a3-tg" `
        --region $AWS_REGION `
        --query 'TargetGroups[0].TargetGroupArn' `
        --output text 2>$null

    if ($tgArn -and $tgArn -ne "None") {
        Write-Host "✅ Target Group encontrada! ARN: $tgArn" -ForegroundColor Green
        Write-Host "Importando..." -ForegroundColor Yellow
        terraform import aws_lb_target_group.app $tgArn
    } else {
        Write-Host "❌ Target Group não encontrada. Será criada pelo Terraform." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Target Group não encontrada. Será criada pelo Terraform." -ForegroundColor Red
}

# 3. Verificar VPC
Write-Host "Checando VPC: devops-a3-vpc" -ForegroundColor Yellow
try {
    $vpcId = aws ec2 describe-vpcs `
        --filters "Name=tag:Name,Values=devops-a3-vpc" `
        --region $AWS_REGION `
        --query 'Vpcs[0].VpcId' `
        --output text 2>$null

    if ($vpcId -and $vpcId -ne "None") {
        Write-Host "✅ VPC encontrada! ID: $vpcId" -ForegroundColor Green
        Write-Host "Importando..." -ForegroundColor Yellow
        terraform import aws_vpc.main $vpcId
    } else {
        Write-Host "❌ VPC não encontrada. Será criada pelo Terraform." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ VPC não encontrada. Será criada pelo Terraform." -ForegroundColor Red
}

Write-Host "✅ Verificação completa!" -ForegroundColor Green
