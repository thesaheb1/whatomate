# Auth Service

Handles all authentication and identity management for Nyife.

## Port: 3001

## Responsibilities
- User registration with email verification
- Login (email/password) with account lockout protection
- JWT access token (15min) + HTTP-only refresh token (7d) with rotation
- CSRF double-submit cookie protection
- Google and Facebook OAuth 2.0
- Forgot password / reset password via OTP email
- 2FA (TOTP) setup, confirm, and disable
- Session management (logout, logout-all)
- Internal `/verify` endpoint for api-gateway token validation

## Kafka Topics
| Direction | Topic | When |
|-----------|-------|------|
| Producer | `user.registered` | On new user registration |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new user |
| POST | `/api/v1/auth/verify-email` | Public | Verify email token |
| POST | `/api/v1/auth/resend-verification` | Public | Resend verification email |
| POST | `/api/v1/auth/login` | Public | Login with email+password |
| POST | `/api/v1/auth/login/2fa` | Public | Complete login with TOTP OTP |
| POST | `/api/v1/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/api/v1/auth/logout` | JWT | Logout (invalidate tokens) |
| POST | `/api/v1/auth/forgot-password` | Public | Send reset email |
| POST | `/api/v1/auth/reset-password` | Public | Reset with token |
| GET | `/api/v1/auth/oauth/google` | Public | Google OAuth initiate |
| GET | `/api/v1/auth/oauth/google/callback` | Public | Google OAuth callback |
| GET | `/api/v1/auth/oauth/facebook` | Public | Facebook OAuth initiate |
| GET | `/api/v1/auth/oauth/facebook/callback` | Public | Facebook OAuth callback |
| GET | `/api/v1/auth/me` | JWT | Get current user |
| POST | `/api/v1/auth/2fa/setup` | JWT | Initiate 2FA setup (get QR) |
| POST | `/api/v1/auth/2fa/confirm` | JWT | Confirm 2FA with OTP |
| POST | `/api/v1/auth/2fa/disable` | JWT | Disable 2FA |
| GET | `/api/v1/auth/verify` | JWT | Internal token verify (for gateway) |

## Security
- Passwords: bcrypt cost 12
- JWT: HS256, access=15min, refresh=7d, single-use JTI in Redis
- CSRF: double-submit cookie (nyife_csrf cookie + X-CSRF-Token header)
- Rate limiting: login 5/min, auth endpoints 10/min
- Account lockout: 5 failed attempts → 15 min lock
- OAuth tokens stored in HTTP-only cookies only

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
