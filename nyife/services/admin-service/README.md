# Admin Service

Complete super admin panel backend for Nyife. Handles admin authentication, sub-admin RBAC, user management, site settings, email templates, i18n translations, and audit logging.

## Port: 3004

## Responsibilities
- **Admin Auth** — separate JWT (`nyife-admin` issuer, `ADMIN_JWT_SECRET`) — never interchangeable with user tokens
- **Sub-admin management** — create sub-admins with role-based permissions (C/R/U/D per resource)
- **Admin RBAC** — 12 admin resources: `dashboard | users | subscriptions | plans | wallet | support | notifications | emails | analytics | settings | access_control | coupons`
- **User management** (proxy to auth/subscription/wallet services) — list, detail, activate/deactivate, impersonate, wallet adjust
- **Site settings** — full key-value store (site name, logo, SEO, auth/OAuth, payment gateways, tax, SMTP, content pages)
- **Email templates** — HTML/text templates with `{{variable}}` placeholders, preview endpoint
- **i18n translations** — per-locale key management, bulk import/export as JSON, language enable/disable
- **Audit logs** — every admin action recorded (who, what, when, on which resource)
- **Seeders** — super admin, default site settings, 6 languages, 8 email templates

## Kafka Topics
| Direction | Topic | When |
|-----------|-------|------|
| Producer | `admin.broadcast` | On bulk notification send |
| Producer | `notification.dispatch` | On admin sending individual notifications |

## API Endpoints (all under `/api/v1/admin/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Admin login |
| POST | `/auth/logout` | Admin JWT | Logout |
| GET | `/auth/me` | Admin JWT | Current admin profile |
| PUT | `/auth/me` | Admin JWT | Update profile |
| PUT | `/auth/me/password` | Admin JWT | Change password |
| GET | `/access-control/admins` | `access_control:read` | List sub-admins |
| POST | `/access-control/admins` | `access_control:create` | Create sub-admin |
| GET/PUT/DELETE | `/access-control/admins/:id` | `access_control:*` | Sub-admin CRUD |
| GET/POST/PUT/DELETE | `/access-control/roles` | `access_control:*` | Admin roles CRUD |
| GET | `/users` | `users:read` | List platform users |
| GET | `/users/:id` | `users:read` | User detail |
| PATCH | `/users/:id/status` | `users:update` | Activate/deactivate |
| POST | `/users/:id/impersonate` | `users:read` | Impersonate session |
| POST | `/users/:id/wallet` | `wallet:update` | Credit/debit wallet |
| GET | `/audit-logs` | `settings:read` | Admin audit trail |
| GET/PUT | `/settings` | `settings:*` | Site settings |
| POST | `/settings/smtp/test` | `settings:update` | Test SMTP |
| GET/POST/PUT/DELETE | `/emails/templates` | `emails:*` | Email templates CRUD |
| POST | `/emails/templates/:id/preview` | `emails:read` | Preview with variables |
| GET | `/translations/languages` | Admin JWT | List languages |
| POST | `/translations/languages` | `settings:create` | Add language |
| PATCH | `/translations/languages/:locale` | `settings:update` | Toggle language |
| GET | `/translations/:locale` | Admin JWT | Get translations |
| GET | `/translations/:locale/export` | Admin JWT | Export as JSON |
| POST | `/translations/:locale` | `settings:update` | Upsert translation |
| POST | `/translations/:locale/import` | `settings:update` | Bulk import |

## Security
- Admin JWT uses completely separate `ADMIN_JWT_SECRET` — cannot authenticate user routes
- Super admin has implicit all-permissions bypass
- Sub-admins checked against `admin_role_permissions` per resource+action
- Every mutation auto-records to `admin_audit_logs`

## Setup

```bash
cp .env.example .env
npm install
npm run migrate
npm run seed  # Creates super admin + default settings + email templates
npm run dev
```

## Default Credentials (change in production!)
- Email: `superadmin@nyife.com`
- Password: `SuperAdmin@123!`

## Tests

```bash
npm test
```
