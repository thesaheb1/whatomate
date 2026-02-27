# User Service

Manages user profiles, settings, agent availability, developer API tokens, and WooCommerce integration.

## Port: 3002

## Responsibilities
- User profile CRUD (name, phone, avatar, language, theme, timezone)
- Notification preference management (email/in-app toggles, per-event prefs)
- Agent availability tracking with log history
- Avatar upload via Multer (local storage, organized by userId)
- API token lifecycle: create (shows raw token ONCE) → list → revoke
  - Format: `nfy_<64hex>` — prefix stored for lookup, bcrypt hash stored for verification
  - Max 10 active tokens per org
- Internal endpoint `/internal/api-tokens/verify` — called by api-gateway to authenticate API token requests (Redis cached 60s at gateway)
- Internal endpoint `/internal/users/:userId/profile` — called by other services needing user profile data
- WooCommerce plugin integration (store URL + encrypted consumer key/secret)

## Kafka Topics
None — user-service is event consumer only via Kafka (listens for `user.registered` to auto-create profile). Producer via notification-service for profile-change emails.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/me` | Get current user profile |
| PUT | `/api/v1/me` | Update profile (name, phone, language, theme, timezone) |
| PUT | `/api/v1/me/settings` | Update notification settings |
| PUT | `/api/v1/me/availability` | Toggle agent availability |
| POST | `/api/v1/me/avatar` | Upload avatar (multipart/form-data) |
| DELETE | `/api/v1/me/avatar` | Remove avatar |
| GET | `/api/v1/api-tokens` | List API tokens (no raw tokens) |
| POST | `/api/v1/api-tokens` | Create API token (raw token returned once) |
| DELETE | `/api/v1/api-tokens/:tokenId` | Revoke API token |
| GET | `/api/v1/me/integrations/woocommerce` | Get WooCommerce integration |
| PUT | `/api/v1/me/integrations/woocommerce` | Save WooCommerce integration |
| DELETE | `/api/v1/me/integrations/woocommerce` | Remove WooCommerce integration |
| GET | `/api/v1/internal/users/:userId/profile` | Internal: fetch profile by userId |
| POST | `/api/v1/internal/api-tokens/verify` | Internal: verify raw API token |

## Security
- All routes trust `x-user-id`, `x-organization-id`, `x-user-email` headers injected by api-gateway
- Internal endpoints require `x-internal-service` header (not exposed through gateway)
- WooCommerce consumer key/secret encrypted at rest (AES-256-GCM)
- API tokens: bcrypt hash stored, raw token shown once, never stored in plain text
- Avatar uploads: file type validation (JPEG/PNG/WebP/GIF only), 5MB limit

## Setup

```bash
cp .env.example .env
npm install
npm run migrate
npm run dev
```

## Tests

```bash
npm test
```
