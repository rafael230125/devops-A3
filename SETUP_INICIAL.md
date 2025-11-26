# 🚀 Setup Inicial Completo - DevOps A3

Guia passo-a-passo para configurar tudo do zero.

---

## 📍 Fase 1: Preparação AWS (15 min)

### Passo 1: Criar Usuário IAM

```bash
# Terminal do AWS
aws iam create-user --user-name devops-a3-user
```

### Passo 2: Criar Access Keys

```bash
aws iam create-access-key --user-name devops-a3-user
```

📌 **Salve em local seguro:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Passo 3: Anexar Policy

1. Salve a policy JSON de `POLITICAS_AWS.md` em um arquivo: `policy.json`

```bash
aws iam put-user-policy --user-name devops-a3-user --policy-name DevOpsA3FullPolicy --policy-document file://policy.json
```

### Passo 4: Criar Bucket S3 para Terraform

```bash
aws s3 mb s3://devops-a3-tfstate-seu-usuario --region us-east-1
```

---

## 📍 Fase 2: Configurar GitHub (10 min)

### Passo 1: Adicionar Secrets AWS

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret** e adicione:

```
AWS_ACCESS_KEY_ID = <sua-chave-de-acesso>
AWS_SECRET_ACCESS_KEY = <sua-chave-secreta>
```

### Passo 2: Adicionar Variáveis Públicas

1. Vá em **Secrets and variables** → **Variables**
2. Adicione:

```
AWS_REGION = us-east-1
ECR_REGISTRY = seu-account-id.dkr.ecr.us-east-1.amazonaws.com
IMAGE_NAME = devops-a3
CLUSTER_NAME = devops-a3-cluster
SERVICE_NAME = strapi-a3-service
TF_STATE_BUCKET = devops-a3-tfstate-seu-usuario
```

### Passo 3: Adicionar Secrets do Docker (opcional)

Se usar Docker Hub:

```
DOCKER_USERNAME = <seu-usuario-dockerhub>
DOCKER_PASSWORD = <seu-token-dockerhub>
```

---

## 📍 Fase 3: Configurar Ambiente Local (10 min)

### Passo 1: Instalar AWS CLI

```bash
# Windows
choco install awscli
# ou baixe de https://aws.amazon.com/cli/

# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Passo 2: Configurar AWS Credentials

```bash
aws configure
```

Será pedido:
```
AWS Access Key ID [None]: <seu-AWS_ACCESS_KEY_ID>
AWS Secret Access Key [None]: <seu-AWS_SECRET_ACCESS_KEY>
Default region name [None]: us-east-1
Default output format [None]: json
```

### Passo 3: Instalar Terraform

```bash
# Windows (Chocolatey)
choco install terraform

# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Passo 4: Instalar Docker

- Windows: https://www.docker.com/products/docker-desktop
- macOS: https://www.docker.com/products/docker-desktop
- Linux: `sudo apt install docker.io`

### Passo 5: Instalar Node.js e pnpm

```bash
# Node já está instalado? Verifique
node --version

# Instalar pnpm
npm install -g pnpm@latest-10

# Verificar
pnpm --version
```

---

## 📍 Fase 4: Preparar Projeto Localmente (5 min)

### Passo 1: Clonar/Atualizar Repositório

```bash
git clone https://github.com/rafael230125/devops-A3.git
cd devops-A3
```

### Passo 2: Instalar Dependências

```bash
pnpm install
```

### Passo 3: Criar `.env` Local

```bash
# Copie o template
cp .env.example .env

# Edite conforme VARIAVEIS_GITHUB.md
```

### Passo 4: Testar Build Local

```bash
pnpm build
```

### Passo 5: Testar Docker Localmente

```bash
# Build
docker build -t devops-a3:latest .

# Run
docker run -p 1337:1337 devops-a3:latest
```

Acesse: http://localhost:1337

---

## 📍 Fase 5: Configurar Terraform (15 min)

### Passo 1: Inicializar Backend S3

Edite `infra/terraform/backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "devops-a3-tfstate-seu-usuario"
    key            = "devops-a3/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}
```

### Passo 2: Inicializar Terraform

```bash
cd infra/terraform
terraform init
```

### Passo 3: Validar Configuração

```bash
terraform validate
```

### Passo 4: Planejar Deploy

```bash
terraform plan -var="image=seu-account-id.dkr.ecr.us-east-1.amazonaws.com/devops-a3:latest"
```

### Passo 5: Revisar e Aplicar

```bash
terraform apply
```

---

## 📍 Fase 6: Criar Workflow CI/CD (20 min)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main, testes]

env:
  AWS_REGION: ${{ vars.AWS_REGION }}
  ECR_REGISTRY: ${{ vars.ECR_REGISTRY }}
  IMAGE_NAME: ${{ vars.IMAGE_NAME }}
  CLUSTER_NAME: ${{ vars.CLUSTER_NAME }}
  SERVICE_NAME: ${{ vars.SERVICE_NAME }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --force-new-deployment
```

---

## ✅ Checklist Final

### AWS Setup
- ✅ Usuário IAM criado
- ✅ Access Keys geradas
- ✅ Policy anexada
- ✅ Bucket S3 criado
- ✅ MFA ativado (recomendado)

### GitHub Setup
- ✅ Secrets AWS adicionados
- ✅ Variáveis públicas adicionadas
- ✅ Secrets Docker adicionados (se aplicável)

### Ambiente Local
- ✅ AWS CLI instalado e configurado
- ✅ Terraform instalado
- ✅ Docker instalado
- ✅ Node.js e pnpm instalados
- ✅ `.env` configurado

### Projeto
- ✅ Dependências instaladas (`pnpm install`)
- ✅ Build local funciona (`pnpm build`)
- ✅ Docker local funciona (`docker run`)
- ✅ Terraform inicializado (`terraform init`)
- ✅ Workflow CI/CD criado

---

## 🆘 Troubleshooting

### Erro: "AWS credentials not found"
```bash
aws configure
```

### Erro: "Terraform state bucket not found"
Crie o bucket S3:
```bash
aws s3 mb s3://devops-a3-tfstate-seu-usuario
```

### Erro: "ECR login failed"
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin seu-account-id.dkr.ecr.us-east-1.amazonaws.com
```

### Erro: "Docker build failed"
```bash
docker system prune -a
pnpm install
docker build -t devops-a3:latest .
```

---

## 📚 Documentação Adicional

- 🔐 `POLITICAS_AWS.md` - Políticas IAM detalhadas
- 🔧 `VARIAVEIS_GITHUB.md` - Variáveis e secrets
- 📖 [AWS Docs](https://docs.aws.amazon.com)
- 📖 [Terraform Docs](https://www.terraform.io/docs)
- 📖 [Strapi Docs](https://docs.strapi.io)
