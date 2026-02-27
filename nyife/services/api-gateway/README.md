# API Gateway

Central entry point for all Nyife API traffic. Handles authentication verification, RBAC, rate limiting, request routing to downstream services, and WebSocket (Socket.IO) orchestration.

## Port: 3000

## Responsibilities
- Single public-facing entry point for all client requests
- JWT access token verification (local — no network call to auth-service)
- Admin JWT verification (separate secret — completely non-interchangeable)
- API token validation (via user-service — Redis cached 60s)
- CSRF double-submit cookie validation on all state-mutating routes
- RBAC permission check (via org-service — Redis cached 5min)
- Subscription active-status check (via subscription-service — Redis cached 5min)
- Reverse proxy to all 17 downstream services via `http-proxy-middleware`
- Socket.IO server (organization rooms, typing, presence, real-time broadcasts)
- Redis pub/sub relay: downstream services publish → gateway forwards to Socket.IO rooms
- Rate limiting: per-route, per-IP/user (configurable in DB `rate_limit_rules`)

## Route Routing Map

| Path Prefix | Downstream Service |
|------------|-------------------|
| `/api/v1/auth/*` | auth-service:3001 |
| `/api/v1/me`, `/api/v1/users`, `/api/v1/api-tokens` | user-service:3002 |
| `/api/v1/organizations`, `/api/v1/org`, `/api/v1/teams`, `/api/v1/roles` | organization-service:3003 |
| `/api/v1/admin/*` | admin-service:3004 |
| `/api/v1/subscriptions`, `/api/v1/plans` | subscription-service:3005 |
| `/api/v1/wallet` | wallet-service:3006 |
| `/api/v1/payment`, `/api/v1/invoices` | payment-service:3007 |
| `/api/v1/whatsapp`, `/api/v1/webhook`, `/api/v1/webhooks` | whatsapp-service:3008 |
| `/api/v1/contacts`, `/api/v1/tags`, `/api/v1/groups`, `/api/v1/import` | contact-service:3009 |
| `/api/v1/templates`, `/api/v1/flows` | template-service:3010 |
| `/api/v1/campaigns` | campaign-service:3011 |
| `/api/v1/messages` | message-service:3012 |
| `/api/v1/conversations`, `/api/v1/chat`, `/api/v1/transfers` | chat-service:3013 |
| `/api/v1/automation`, `/api/v1/chatbot`, `/api/v1/workflows` | automation-service:3014 |
| `/api/v1/notifications` | notification-service:3015 |
| `/api/v1/support`, `/api/v1/tickets` | support-service:3016 |
| `/api/v1/analytics`, `/api/v1/widgets` | analytics-service:3017 |

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `typing:start` | `{ contactId }` | Agent started typing |
| `typing:stop` | `{ contactId }` | Agent stopped typing |
| `messages:read` | `{ contactId, messageIds }` | Mark messages as read |
| `conversation:join` | `{ contactId }` | Join conversation room |
| `conversation:leave` | `{ contactId }` | Leave conversation room |

### Server → Client (via Redis pub/sub relay)
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | message object | New inbound/outbound message |
| `message:status` | `{ wamid, status }` | Delivery status update |
| `campaign:update` | campaign stats | Campaign progress update |
| `notification:new` | notification object | New in-app notification |
| `user:online` | `{ userId }` | Agent came online |
| `user:offline` | `{ userId }` | Agent went offline |
| `typing:start` | `{ contactId, userId }` | Remote agent typing |
| `typing:stop` | `{ contactId, userId }` | Remote agent stopped |

## Security
- JWT verified locally (no auth-service call on every request)
- Admin JWT uses completely separate secret — cannot be used on user routes
- CSRF: double-submit cookie + Redis validation
- RBAC: org-service query, Redis cached 5min
- Rate limits: login=5/min, API=100/min, webhook=1000/min

## Setup

```bash
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
```

## Tests

```bash
npm test
```
