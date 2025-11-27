# 🔧 Variáveis GitHub (Secrets e Environment)

## 📋 Resumo

Este documento lista todas as variáveis que você precisa configurar no GitHub para CI/CD do Docker e deploy na AWS.

---

## 1️⃣ Acessar Secrets do GitHub

1. Vá ao seu repositório no GitHub
2. Clique em **Settings** (engrenagem no canto superior direito)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret** para cada variável abaixo

---

## 2️⃣ Secrets AWS (Obrigatório)

| Nome | Valor | Origem |
|------|-------|--------|
| `AWS_ACCESS_KEY_ID` | Sua chave de acesso | IAM User → Security Credentials |
| `AWS_SECRET_ACCESS_KEY` | Sua chave secreta | IAM User → Security Credentials |
| `AWS_REGION` | `us-east-1` | Escolha sua região |

### Como Adicionar:

1. Clique em **New repository secret**
2. Nome: `AWS_ACCESS_KEY_ID`
3. Valor: Cole a chave obtida em IAM
4. Clique em **Add secret**
5. Repita para os outros dois

---

## 3️⃣ Secrets Docker (Para Docker Hub)

Se você usa Docker Hub para armazenar imagens:

| Nome | Valor | Origem |
|------|-------|--------|
| `DOCKER_USERNAME` | Seu usuário Docker Hub | https://hub.docker.com/settings/security |
| `DOCKER_PASSWORD` | Seu token de acesso | https://hub.docker.com/settings/security |

### Como Gerar Token Docker Hub:

1. Acesse https://hub.docker.com/settings/security
2. Clique em **New Access Token**
3. Nome: `github-devops-a3`
4. Permissões: Deixe padrão
5. Clique em **Generate**
6. Copie o token
7. Adicione como `DOCKER_PASSWORD` no GitHub

---

## 4️⃣ Secrets GitHub Container Registry (Alternativa)

Se usar GitHub Container Registry (ghcr.io) - não precisa de token separado:

| Nome | Valor |
|------|-------|
| `REGISTRY_USERNAME` | `${{ github.actor }}` |
| `REGISTRY_PASSWORD` | `${{ secrets.GITHUB_TOKEN }}` |

---

## 5️⃣ Variáveis de Environment (Públicas)

Clique em **Secrets and variables** → **Variables** para variáveis públicas:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `AWS_REGION` | `us-east-1` | Região AWS |
| `ECR_REGISTRY` | `seu-account-id.dkr.ecr.us-east-1.amazonaws.com` | Registry ECR |
| `IMAGE_NAME` | `devops-a3` | Nome da imagem |
| `IMAGE_TAG` | `latest` | Tag padrão (pode ser dinâmica no workflow) |
| `CLUSTER_NAME` | `devops-a3-cluster` | Nome do cluster ECS |
| `SERVICE_NAME` | `strapi-a3-service` | Nome do serviço ECS |
| `TERRAFORM_VERSION` | `1.6.0` | Versão do Terraform |
| `TF_STATE_BUCKET` | `devops-a3-tfstate-seu-usuario` | Bucket S3 para state |

### Como Adicionar:

1. Clique em **Secrets and variables** → **Variables**
2. Clique em **New repository variable**
3. Nome: Ex: `AWS_REGION`
4. Valor: Ex: `us-east-1`
5. Clique em **Add variable**

---

## 6️⃣ Environment Variables do Strapi (Secrets)

Para a aplicação Strapi rodar na AWS:

| Nome | Valor | Exemplo |
|------|-------|---------|
| `STRAPI_ADMIN_URL` | URL do admin | `https://seu-dominio.com/admin` |
| `STRAPI_API_URL` | URL da API | `https://seu-dominio.com` |
| `NODE_ENV` | Ambiente | `production` |
| `DATABASE_CLIENT` | Cliente do banco | `postgres` (se usar RDS) |
| `DATABASE_HOST` | Host do BD | RDS endpoint |
| `DATABASE_PORT` | Porta do BD | `5432` |
| `DATABASE_NAME` | Nome do BD | `strapi_db` |
| `DATABASE_USERNAME` | Usuário BD | Seu usuário |
| `DATABASE_PASSWORD` | Senha BD | ⚠️ Usar Secret |
| `JWT_SECRET` | Token JWT | Gerar um hash seguro |

---

## 7️⃣ Criar JWT_SECRET

Execute no terminal:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Ou online: https://www.uuidgenerator.net/

---

## 8️⃣ Exemplo de Arquivo `.env` para Strapi

Crie um arquivo `.env` na raiz do projeto (⚠️ **não commitar no Git**):

```env
# App
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys-here
API_TOKEN_SALT=your-api-token-salt-here
JWT_SECRET=your-jwt-secret-here
ADMIN_JWT_SECRET=your-admin-jwt-secret-here

# Database (se usar RDS)
DATABASE_CLIENT=postgres
DATABASE_HOST=seu-rds-endpoint.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=admin
DATABASE_PASSWORD=sua-senha-forte

# URLs
STRAPI_ADMIN_URL=https://seu-dominio.com/admin
STRAPI_API_URL=https://seu-dominio.com
```

---

## 9️⃣ Adicionar ao `.gitignore`

Certifique-se que `.env` está no `.gitignore`:

```gitignore
# Environment
.env
.env.local
.env.*.local

# AWS
.aws/

# Terraform
*.tfstate
*.tfstate.*
.terraform/
```

---

## 🔟 Checklist Final

- ✅ `AWS_ACCESS_KEY_ID` adicionado
- ✅ `AWS_SECRET_ACCESS_KEY` adicionado
- ✅ `AWS_REGION` adicionado
- ✅ `DOCKER_USERNAME` e `DOCKER_PASSWORD` adicionados (ou usar GitHub Container Registry)
- ✅ Variáveis públicas adicionadas (AWS_REGION, ECR_REGISTRY, etc)
- ✅ JWT_SECRET gerado e armazenado com segurança
- ✅ `.env` criado localmente (não no Git)
- ✅ `.gitignore` configurado corretamente

---

## 🔐 Boas Práticas de Segurança

1. **Nunca** commite `.env` ou secrets no Git
2. **Sempre** use Secrets do GitHub para dados sensíveis
3. **Rotacione** access keys regularmente (a cada 90 dias)
4. **Monitore** CloudTrail para atividades suspeitas
5. **Use** MFA no console AWS
6. **Revise** permissões IAM periodicamente

---

## 📚 Próximas Etapas

1. Adicione todos os secrets conforme este documento
2. Verifique o arquivo `POLITICAS_AWS.md` para configurar IAM
3. Crie o workflow de CI/CD em `.github/workflows/deploy.yml`
4. Teste o build local: `pnpm build`
5. Teste o Docker: `docker build -t devops-a3:latest .`
