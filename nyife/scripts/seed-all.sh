#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Nyife — Run Sequelize seeders for all services in dependency order
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Seeded in strict order (admin before subscription, subscription before wallet, etc.)
SERVICES=(
  admin-service
  subscription-service
  auth-service
  organization-service
  wallet-service
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
  payment-service
  user-service
  api-gateway
)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for service in "${SERVICES[@]}"; do
  service_dir="$ROOT_DIR/services/$service"
  if [ -d "$service_dir" ]; then
    echo "──────────────────────────────────────────────────"
    echo "Seeding: $service"
    echo "──────────────────────────────────────────────────"
    cd "$service_dir"
    if [ -f "package.json" ] && [ -d "src/seeders" ] && [ "$(ls src/seeders/*.js 2>/dev/null | wc -l)" -gt 0 ]; then
      NODE_ENV="${NODE_ENV:-development}" npx sequelize-cli db:seed:all
      echo "✓ $service seeding complete"
    else
      echo "  (no seeders found, skipping)"
    fi
    cd "$ROOT_DIR"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════"
echo "All seeders completed successfully."
echo "═══════════════════════════════════════════════════"
