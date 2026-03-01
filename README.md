# 🍇 Açaí Gest — Backend

![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![Mercado Pago](https://img.shields.io/badge/Mercado%20Pago-SDK-009EE3?style=flat)

API REST do sistema de gestão para pontos de venda de açaí. Permite gerenciar vendas, estoque, vendedores, relatórios, fluxo de caixa e assinaturas com integração completa ao Mercado Pago.

## 📋 Sumário

- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução local](#instalação-e-execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Migrations](#migrations)
- [Endpoints da API](#endpoints-da-api)
- [Planos e pagamentos](#planos-e-pagamentos)
- [Backup automático](#backup-automático)
- [Deploy na VPS](#deploy-na-vps)

## 🛠 Tecnologias

- **Node.js 18** com ES Modules
- **Express 4**
- **PostgreSQL 16**
- **Docker + Docker Compose**
- **node-pg-migrate**
- **JWT + bcryptjs**
- **Mercado Pago SDK v2**
- **node-cron**
- **Nodemailer**
- **express-rate-limit**
- **express-validator**
- **@aws-sdk/client-s3**

## ✅ Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose instalados
- [Node.js 18+](https://nodejs.org/) (apenas para criar migrations localmente)
- Conta no [Mercado Pago](https://www.mercadopago.com.br/) com credenciais de teste
- Conta na [Cloudflare](https://cloudflare.com/) com bucket R2 criado (para backup)
- Conta de email Gmail com senha de app configurada (para envio de emails)

## 🚀 Instalação e execução local

### 1. Clone o repositório

```bash
git clone https://github.com/RonaldDias/acai-gest-backend.git
cd acai-gest-backend
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais. Veja a seção [Variáveis de ambiente](#variáveis-de-ambiente).

### 3. Suba os containers

```bash
docker compose up -d
```

### 4. Rode as migrations

```bash
docker compose exec backend npm run migrate:docker
```

### 5. Acesse a API

```
http://localhost:3001/api/health
```

---

## ⚙️ Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=7d

# Banco de dados
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=acai_gest
DB_MAX_CONNECTIONS=20

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token

# Cloudflare R2 (backup)
R2_ACCOUNT_ID=seu_account_id
R2_ACCESS_KEY_ID=seu_access_key_id
R2_SECRET_ACCESS_KEY=seu_secret_access_key
R2_BUCKET_NAME=acai-gest-backups
R2_ENDPOINT=https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
```

## 🗃 Migrations

Criar nova migration:

```bash
npm run migrate:create nome-da-migration
```

Rodar migrations no container:

```bash
docker compose exec backend npm run migrate:docker
```

---

## 📡 Endpoints da API

Todas as rotas protegidas exigem o header:

```
Authorization: Bearer <token>
```

### Autenticação

| Método | Rota                                   | Descrição                      | Auth |
| ------ | -------------------------------------- | ------------------------------ | ---- |
| POST   | `/api/auth/cadastro`                   | Cadastrar empresa e usuário    | ❌   |
| POST   | `/api/auth/login`                      | Login com email ou CPF         | ❌   |
| POST   | `/api/auth/esqueci-senha`              | Solicitar recuperação de senha | ❌   |
| POST   | `/api/auth/redefinir-senha`            | Redefinir senha com token      | ❌   |
| POST   | `/api/auth/refresh`                    | Renovar access token           | ❌   |
| GET    | `/api/auth/usuarios/:empresaId/status` | Verificar status de ativação   | ❌   |

### Produtos

| Método | Rota                              | Descrição                    | Auth    |
| ------ | --------------------------------- | ---------------------------- | ------- |
| GET    | `/api/products`                   | Listar produtos do ponto     | ✅      |
| POST   | `/api/products`                   | Criar produto                | ✅ dono |
| PUT    | `/api/products/:id`               | Atualizar produto            | ✅ dono |
| DELETE | `/api/products/:id`               | Desativar produto            | ✅ dono |
| POST   | `/api/products/entrada`           | Registrar entrada de estoque | ✅ dono |
| GET    | `/api/products/:id/movimentacoes` | Histórico de movimentações   | ✅      |

### Vendas

| Método | Rota                       | Descrição       | Auth             |
| ------ | -------------------------- | --------------- | ---------------- |
| POST   | `/api/sales`               | Registrar venda | ✅               |
| GET    | `/api/sales/today`         | Vendas do dia   | ✅               |
| GET    | `/api/sales/summary/today` | Resumo do dia   | ✅               |
| POST   | `/api/sales/:id/cancel`    | Cancelar venda  | ✅ dono/vendedor |

### Vendedores

| Método | Rota                  | Descrição          | Auth    |
| ------ | --------------------- | ------------------ | ------- |
| POST   | `/api/vendedores`     | Cadastrar vendedor | ✅ dono |
| GET    | `/api/vendedores`     | Listar vendedores  | ✅ dono |
| PUT    | `/api/vendedores/:id` | Atualizar vendedor | ✅ dono |
| DELETE | `/api/vendedores/:id` | Desativar vendedor | ✅ dono |

### Pontos de venda

| Método | Rota              | Descrição       | Auth    |
| ------ | ----------------- | --------------- | ------- |
| POST   | `/api/pontos`     | Criar ponto     | ✅ dono |
| GET    | `/api/pontos`     | Listar pontos   | ✅ dono |
| PUT    | `/api/pontos/:id` | Atualizar ponto | ✅ dono |
| DELETE | `/api/pontos/:id` | Desativar ponto | ✅ dono |

### Relatórios

| Método | Rota                          | Descrição                    | Auth    |
| ------ | ----------------------------- | ---------------------------- | ------- |
| GET    | `/api/relatorios/vendas`      | Relatório de vendas agrupado | ✅ dono |
| GET    | `/api/relatorios/fluxo-caixa` | Relatório de fluxo de caixa  | ✅ dono |

### Empresas

| Método | Rota                      | Descrição                | Auth    |
| ------ | ------------------------- | ------------------------ | ------- |
| PATCH  | `/api/empresas/:id/plano` | Alterar plano da empresa | ✅ dono |

### Pagamentos

| Método | Rota                     | Descrição                        | Auth |
| ------ | ------------------------ | -------------------------------- | ---- |
| POST   | `/api/pagamentos/pix`    | Gerar pagamento PIX              | ❌   |
| POST   | `/api/pagamentos/cartao` | Criar assinatura/checkout cartão | ❌   |

### Webhooks

| Método | Rota                        | Descrição                            | Auth |
| ------ | --------------------------- | ------------------------------------ | ---- |
| POST   | `/api/webhooks/mercadopago` | Receber notificações do Mercado Pago | ❌   |

### Auditoria

| Método | Rota              | Descrição                    | Auth    |
| ------ | ----------------- | ---------------------------- | ------- |
| GET    | `/api/audit-logs` | Logs de auditoria da empresa | ✅ dono |

## 💳 Planos e pagamentos

| Plano  | Mensal    | Anual (10% off) | Pontos     |
| ------ | --------- | --------------- | ---------- |
| Básico | R$ 149,90 | R$ 1.619,10     | 1          |
| Top    | R$ 249,90 | R$ 2.699,10     | Ilimitados |

**Formas de pagamento:**

- **PIX** — QR Code gerado automaticamente, vence em 1 dia
- **Cartão mensal** — assinatura recorrente via Mercado Pago
- **Cartão anual** — pagamento único parcelável em até 12x com juros

A conta só é ativada após confirmação do pagamento via webhook.

## 💾 Backup automático

O backup do banco de dados é feito via dois scripts na pasta `scripts/`:

- `backup.sh` — executa o dump do PostgreSQL e compacta
- `uploadBackup.js` — envia o arquivo compactado para o Cloudflare R2

### Testando manualmente

```bash
docker compose exec backend sh -c "POSTGRES_HOST=postgres POSTGRES_USER=postgres POSTGRES_PASSWORD=sua_senha POSTGRES_DB=acai_gest sh /app/scripts/backup.sh"
```

### Configurando o cron na VPS (produção)

Acesse o crontab da VPS:

```bash
crontab -e
```

Adicione a linha para rodar todo dia às 03:00:

```bash
0 3 * * * cd /caminho/do/projeto && POSTGRES_HOST=localhost POSTGRES_USER=postgres POSTGRES_PASSWORD=sua_senha POSTGRES_DB=acai_gest sh scripts/backup.sh >> /var/log/acai-gest-backup.log 2>&1
```

---

## 🖥 Deploy na VPS

### 1. Acesse a VPS via SSH

```bash
ssh usuario@ip-da-vps
```

### 2. Instale Docker e Docker Compose

```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Clone o repositório

```bash
git clone https://github.com/RonaldDias/acai-gest-backend.git
cd acai-gest-backend
```

### 4. Configure o `.env` com as credenciais de produção

```bash
cp .env.example .env
nano .env
```

### 5. Suba os containers em produção

```bash
docker compose up -d
```

### 6. Rode as migrations

```bash
docker compose exec backend npm run migrate:docker
```

### 7. Configure o webhook do Mercado Pago

No painel do Mercado Pago, configure o webhook apontando para:

```
https://seu-dominio.com/api/webhooks/mercadopago
```

### 8. Configure o cron de backup

Siga as instruções da seção [Backup automático](#backup-automático).

---

## 📁 Estrutura do projeto

```
acai-gest-backend/
├── migrations/          # Migrations do banco de dados
├── scripts/             # Scripts de infraestrutura
│   ├── backup.sh        # Script de backup do PostgreSQL
│   └── uploadBackup.js  # Upload do backup para Cloudflare R2
├── src/
│   ├── config/          # Configurações (banco, Mercado Pago)
│   ├── controllers/     # Controllers da aplicação
│   ├── jobs/            # Jobs agendados (cron)
│   ├── middleware/      # Middlewares (auth, cors, rate limit, validators)
│   ├── routes/          # Rotas da API
│   ├── services/        # Serviços (email, pagamento)
│   └── utils/           # Utilitários (auth, validators)
├── .env                 # Variáveis de ambiente (não commitado)
├── .env.example         # Exemplo de variáveis de ambiente
├── compose.yml          # Docker Compose
├── Dockerfile           # Imagem do backend
└── server.js            # Entry point
```

---

## 🔐 Segurança

- Senhas com hash bcrypt 12 rounds
- JWT com expiração de 7 dias e refresh tokens de 30 dias
- Rate limiting global: 100 requisições por 15 minutos por IP
- Rate limiting no login: 5 tentativas por 15 minutos por IP
- Validação e sanitização de todos os inputs com express-validator
- Logs de auditoria para ações críticas
- Bloqueio de acesso para assinaturas vencidas
