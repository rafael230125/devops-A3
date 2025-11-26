# 🔐 Políticas IAM para o Projeto DevOps-A3

## 📋 Resumo

Este documento detalha todas as políticas IAM necessárias para deployar a aplicação Strapi na AWS com Terraform, ECS, ALB e S3.

---

## 1️⃣ Como Criar o Usuário IAM

### Via Console AWS:
1. Acesse [IAM Console](https://console.aws.amazon.com/iam/)
2. Clique em **Users** → **Create user**
3. Defina o nome: `devops-a3-user`
4. Marque **"Provide user access to the AWS Management Console"** (se quiser acesso visual)
5. Clique em **Create user**

### Via AWS CLI:
```bash
aws iam create-user --user-name devops-a3-user
```

---

## 2️⃣ Política Consolidada (Recomendado)

**Nome da Policy:** `DevOpsA3FullPolicy`

Cole este JSON no Console AWS ou salve como `policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECSFullAccess",
      "Effect": "Allow",
      "Action": [
        "ecs:CreateCluster",
        "ecs:DescribeClusters",
        "ecs:ListClusters",
        "ecs:UpdateCluster",
        "ecs:DeleteCluster",
        "ecs:CreateService",
        "ecs:DescribeServices",
        "ecs:ListServices",
        "ecs:UpdateService",
        "ecs:DeleteService",
        "ecs:RegisterTaskDefinition",
        "ecs:DescribeTaskDefinition",
        "ecs:ListTaskDefinitions",
        "ecs:DeregisterTaskDefinition",
        "ecs:ListTasks",
        "ecs:DescribeTasks",
        "ecs:RunTask",
        "ecs:StopTask"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ALBFullAccess",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:CreateLoadBalancer",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DeleteLoadBalancer",
        "elasticloadbalancing:CreateTargetGroup",
        "elasticloadbalancing:DescribeTargetGroups",
        "elasticloadbalancing:DeleteTargetGroup",
        "elasticloadbalancing:ModifyTargetGroup",
        "elasticloadbalancing:CreateListener",
        "elasticloadbalancing:DescribeListeners",
        "elasticloadbalancing:DeleteListener",
        "elasticloadbalancing:ModifyListener",
        "elasticloadbalancing:RegisterTargets",
        "elasticloadbalancing:DeregisterTargets",
        "elasticloadbalancing:DescribeTargetHealth"
      ],
      "Resource": "*"
    },
    {
      "Sid": "VPCFullAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVpc",
        "ec2:DescribeVpcs",
        "ec2:DeleteVpc",
        "ec2:CreateSubnet",
        "ec2:DescribeSubnets",
        "ec2:DeleteSubnet",
        "ec2:CreateInternetGateway",
        "ec2:AttachInternetGateway",
        "ec2:DetachInternetGateway",
        "ec2:DescribeInternetGateways",
        "ec2:DeleteInternetGateway",
        "ec2:CreateRouteTable",
        "ec2:DescribeRouteTables",
        "ec2:DeleteRouteTable",
        "ec2:CreateRoute",
        "ec2:DeleteRoute",
        "ec2:AssociateRouteTable",
        "ec2:DisassociateRouteTable",
        "ec2:DescribeAvailabilityZones",
        "ec2:CreateSecurityGroup",
        "ec2:DescribeSecurityGroups",
        "ec2:DeleteSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupEgress"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMRoleAccess",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:GetRole",
        "iam:ListRoles",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:GetRolePolicy",
        "iam:ListRolePolicies",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:PassRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECRAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DescribeRepositories",
        "ecr:DeleteRepository",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetAuthorizationToken",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:ListImages"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3TerraformState",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:GetBucket*",
        "s3:ListBucket",
        "s3:DeleteBucket",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucketVersions",
        "s3:GetObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::devops-a3-tfstate*",
        "arn:aws:s3:::devops-a3-tfstate*/*",
        "arn:aws:s3:::devops-a3-docker*",
        "arn:aws:s3:::devops-a3-docker*/*"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 3️⃣ Criar Access Keys para CI/CD (GitHub)

### Via Console AWS:

1. Vá em **IAM** → **Users** → Selecione `devops-a3-user`
2. Clique em **Security credentials**
3. Role para **Access keys**
4. Clique em **Create access key**
5. Escolha **Other** e clique em **Next**
6. Anote:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

⚠️ **IMPORTANTE:** Salve essas chaves em lugar seguro! Você não conseguirá vê-las novamente.

### Via AWS CLI:

```bash
aws iam create-access-key --user-name devops-a3-user
```

---

## 4️⃣ Anexar Policy ao Usuário

### Via Console AWS:

1. Vá em **IAM** → **Users** → `devops-a3-user`
2. Clique em **Add permissions** → **Attach policies directly**
3. Procure por `DevOpsA3FullPolicy`
4. Marque e clique em **Add permissions**

### Via AWS CLI:

```bash
aws iam put-user-policy --user-name devops-a3-user --policy-name DevOpsA3FullPolicy --policy-document file://policy.json
```

---

## 5️⃣ Criar Bucket S3 para Terraform State

### Via Console AWS:

1. Acesse [S3 Console](https://s3.console.aws.amazon.com/)
2. Clique em **Create bucket**
3. Nome: `devops-a3-tfstate-seu-usuario`
4. Região: `us-east-1` (ou sua região)
5. Desmarque **"Block all public access"** (deixar privado)
6. Clique em **Create bucket**

### Via AWS CLI:

```bash
aws s3 mb s3://devops-a3-tfstate-seu-usuario --region us-east-1
```

---

## 6️⃣ Checklist de Segurança

- ✅ Usuário IAM criado
- ✅ Policy anexada
- ✅ Access Keys geradas
- ✅ Chaves salvas com segurança
- ✅ Bucket S3 criado para state do Terraform
- ✅ Bucket S3 configurado como privado
- ✅ MFA ativado no usuário (recomendado)

---

## 7️⃣ Próximos Passos

Após completar isso, veja o documento `VARIAVEIS_GITHUB.md` para:
1. Adicionar secrets no GitHub
2. Configurar variáveis de ambiente
3. Preparar o workflow de CI/CD
