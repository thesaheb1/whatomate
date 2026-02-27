#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Nyife — Run Sequelize migrations for all services in order
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

SERVICES=(
  auth-service
  user-service
  organization-service
  admin-service
  subscription-service
  wallet-service
  payment-service
  whatsapp-service
  contact-service
  template-service
  campaign-service
  message-service
  chat-service
  automation-service
  notification-service
  support-service
  analytics-service
  api-gateway
)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for service in "${SERVICES[@]}"; do
  service_dir="$ROOT_DIR/services/$service"
  if [ -d "$service_dir" ]; then
    echo "──────────────────────────────────────────────────"
    echo "Migrating: $service"
    echo "──────────────────────────────────────────────────"
    cd "$service_dir"
    if [ -f "package.json" ]; then
      NODE_ENV="${NODE_ENV:-development}" npx sequelize-cli db:migrate
      echo "✓ $service migrations complete"
    else
      echo "⚠ No package.json found in $service_dir, skipping"
    fi
    cd "$ROOT_DIR"
  else
    echo "⚠ Service directory not found: $service_dir"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════"
echo "All migrations completed successfully."
echo "═══════════════════════════════════════════════════"
