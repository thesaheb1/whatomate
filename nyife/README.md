# Nyife — WhatsApp Marketing SaaS Platform

A production-grade, multi-tenant WhatsApp Marketing SaaS platform built with Node.js microservices.

## Architecture

18 independently deployable microservices, each with its own MySQL database, Redis namespace, Kafka topics, and Docker container.

```
nyife/
├── services/               # 18 microservices
│   ├── api-gateway/        # Port 3000 — entry point, auth, routing
│   ├── auth-service/       # Port 3001 — JWT, OAuth, 2FA
│   ├── user-service/       # Port 3002 — profiles, API tokens
│   ├── organization-service/ # Port 3003 — orgs, teams, RBAC
│   ├── admin-service/      # Port 3004 — super admin panel
│   ├── subscription-service/ # Port 3005 — plans, billing
│   ├── wallet-service/     # Port 3006 — credits, transactions
│   ├── payment-service/    # Port 3007 — Razorpay + Stripe
│   ├── whatsapp-service/   # Port 3008 — WABA, webhook receiver
│   ├── contact-service/    # Port 3009 — contacts, tags, groups
│   ├── template-service/   # Port 3010 — templates, WA Flows
│   ├── campaign-service/   # Port 3011 — bulk campaigns
│   ├── message-service/    # Port 3012 — message storage + status
│   ├── chat-service/       # Port 3013 — live chat, Socket.IO
│   ├── automation-service/ # Port 3014 — chatbot, workflows
│   ├── notification-service/ # Port 3015 — in-app + email
│   ├── support-service/    # Port 3016 — tickets
│   └── analytics-service/  # Port 3017 — metrics, dashboards
├── shared/                 # Shared utilities (errors, logger, Kafka, etc.)
├── scripts/
│   └── mysql-init/         # DB + user creation SQL
├── docker-compose.yml
├── .env.example
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js LTS |
| Framework | Express.js |
| Database | MySQL 8.0 + Sequelize ORM |
| Message Broker | Apache Kafka (KafkaJS) |
| Cache / Sessions | Redis 7 (ioredis) |
| Real-time | Socket.IO |
| Auth | JWT (RS256 / HS256) + CSRF double-submit |
| Validation | Zod |
| Logging | Winston + Morgan |
| File Upload | Multer |
| Security | Helmet, bcrypt, express-rate-limit |
| Testing | Jest + Supertest |
| Containerization | Docker + docker-compose |

## Quick Start

### Prerequisites
- Docker Desktop ≥ 24.0
- Node.js 20 LTS (for local dev without Docker)
- 8GB RAM recommended

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 2. Start infrastructure only (MySQL, Redis, Kafka)

```bash
docker-compose up -d mysql redis zookeeper kafka
# Wait ~30 seconds for Kafka to be ready
docker-compose up -d kafka-init
```

### 3. Start all services

```bash
docker-compose up -d
```

### 4. Check health

```bash
docker-compose ps
curl http://localhost:3000/health
```

### 5. Run migrations and seeders (first time only)

```bash
# From each service directory:
cd services/auth-service && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all
# Or use the convenience script:
./scripts/migrate-all.sh
./scripts/seed-all.sh
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password |
| `JWT_ACCESS_SECRET` | 32+ char JWT access token secret |
| `JWT_REFRESH_SECRET` | 32+ char JWT refresh token secret |
| `ADMIN_JWT_SECRET` | 32+ char admin JWT secret (separate!) |
| `ENCRYPTION_KEY` | 32+ char AES-256 encryption key |
| `CSRF_SECRET` | 32+ char CSRF token secret |
| `FACEBOOK_APP_ID` | Meta App ID for Embedded Signup |
| `FACEBOOK_APP_SECRET` | Meta App Secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `SMTP_HOST` | SMTP server for transactional emails |

## API Documentation

Once running, Swagger UI is available at:
- `http://localhost:3000/api/v1/docs` — User API
- `http://localhost:3000/api/v1/admin/docs` — Admin API

## Kafka Topics

| Topic | Producer | Consumers |
|-------|----------|-----------|
| `campaign.messages.send` | campaign-service | message-service |
| `campaign.message.status` | message-service | campaign-service |
| `whatsapp.webhook.inbound` | whatsapp-service | message-service, automation-service |
| `whatsapp.webhook.status` | whatsapp-service | message-service, campaign-service |
| `notification.dispatch` | any service | notification-service |
| `email.dispatch` | any service | notification-service |
| `wallet.transaction.created` | wallet-service | analytics-service |
| `subscription.purchased` | subscription-service | analytics-service, notification-service |
| `user.registered` | auth-service | notification-service, analytics-service |
| `message.sent` | message-service | wallet-service |

## Service Communication

**Synchronous (REST over internal Docker network):**
- Every request: api-gateway → auth-service (token verification)
- Plan limits: service → subscription-service
- Wallet deduction: message-service → wallet-service

**Asynchronous (Kafka):**
- Bulk campaigns, delivery status, notifications, analytics events

## Security

- Passwords: bcrypt cost 12
- JWT: HS256, short-lived access tokens (15min), rotating refresh tokens
- CSRF: double-submit cookie pattern
- Encryption: AES-256-GCM for WhatsApp access tokens at rest
- Rate limiting: login (5/min), API (100/min), webhook (1000/min)
- Input validation: Zod on every route
- XSS: sanitize-html on all user content

## Development

```bash
# Start a single service locally
cd services/auth-service
npm install
cp .env.example .env
npm run dev

# Run tests
npm test

# Run migrations
npm run migrate
npm run seed
```
