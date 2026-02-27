# nyife

Enterprise WhatsApp Marketing SaaS Platform. Multi-tenant, subscription-based, built for scale.

## Overview

**nyife** is an enterprise-grade WhatsApp marketing and engagement platform built for businesses that need scale, reliability, and developer-grade control. It provides a complete multi-tenant SaaS solution for managing WhatsApp Business campaigns, automation, and real-time customer engagement.

## Key Features

### Multi-Tenant Architecture
- Isolated organization workspaces with independent data, settings, and billing
- Platform-level admin panel for tenant lifecycle management
- Subdomain or path-based tenant routing

### Subscription & Billing
- Monthly, yearly, and lifetime subscription plans
- Wallet system with per-message billing and top-up support
- Usage dashboards with cost breakdowns per tenant

### Role-Based Access Control
- Four roles: **Super Admin**, **Admin**, **Manager**, **Agent**
- Granular permission scoping per workspace
- SSO support (Google, Microsoft, GitHub, Facebook, custom OIDC)

### WhatsApp Cloud API Integration
- Native Meta WhatsApp Business Cloud API integration
- Multi-account support per organization
- Template management with Meta approval flow

### Real-Time Messaging
- WebSocket-powered live inbox with full message history
- Incoming/outgoing messages, media, interactive buttons, reactions
- Agent availability and transfer queue management

### Campaign Engine
- Bulk campaigns with Redis-backed queue for high-throughput sending
- Retry logic for failed messages, pause/resume/cancel controls
- Per-campaign analytics and recipient import via CSV

### Automation Engine
- Keyword-triggered auto-replies
- Visual conversation flow builder with branching logic
- AI-powered responses (OpenAI, Anthropic, Google)
- Custom webhook actions with one-time token redirects

### Developer API
- Token-based API key authentication
- Full REST API with webhook support for all platform events
- Custom action endpoints with dynamic redirects

### Analytics & Reporting
- Platform-wide analytics dashboard (messages, contacts, campaigns)
- Per-agent performance analytics with SLA tracking
- Campaign performance breakdowns

## Architecture

nyife follows a service-oriented architecture based on the proven Go + Vue.js stack:

| Layer | Technology |
|---|---|
| Backend | Go (Fastglue + fasthttp) |
| Frontend | Vue.js 3, Tailwind CSS, shadcn-vue |
| Database | PostgreSQL (GORM) |
| Cache / Queue | Redis (streams + pub/sub) |
| Real-time | WebSocket (hub per instance) |
| Auth | JWT + SSO (OAuth2/OIDC) |
| Storage | Local or S3-compatible |

## Installation

### Docker

```bash
# Download compose file and sample config
curl -LO https://raw.githubusercontent.com/nyife/nyife/main/docker/docker-compose.yml
curl -LO https://raw.githubusercontent.com/nyife/nyife/main/config.example.toml

# Copy and edit config
cp config.example.toml config.toml

# Run services
docker compose up -d
```

Go to `http://localhost:8080` and login with `admin@admin.com` / `admin`

### Binary

Download the [latest release](https://github.com/nyife/nyife/releases) and extract the binary.

```bash
cp config.example.toml config.toml
./nyife server -migrate
```

### Build from Source

```bash
git clone https://github.com/nyife/nyife.git
cd nyife

# Production build (single binary with embedded frontend)
make build-prod
./nyife server -migrate
```

## CLI Usage

```bash
./nyife server              # API + 1 worker (default)
./nyife server -workers=0   # API only
./nyife worker -workers=4   # Workers only (for scaling)
./nyife version             # Show version
```

## Configuration

Environment variables use the `NYIFE_` prefix, e.g.:

```
NYIFE_DATABASE_HOST=db
NYIFE_JWT_SECRET=your-secret
```

See [configuration docs](docs/src/content/docs/getting-started/configuration.mdx) for full reference.

## Development

```bash
# Backend (port 8080)
make run-migrate

# Frontend (port 3000)
cd frontend && npm run dev
```

## License

See [LICENSE](LICENSE) for details.
