#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-/var/backups/pspk}"
STAMP="$(date +%Y%m%d-%H%M%S)"
COMPOSE="docker compose -f docker-compose.prod.yml"
mkdir -p "$BACKUP_DIR"

# Database (format custom, bisa di-restore selektif)
$COMPOSE exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$BACKUP_DIR/db-$STAMP.dump"

# File upload
docker run --rm -v pspk-platform_uploads:/data:ro -v "$BACKUP_DIR":/backup alpine \
  tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .

# Retensi lokal 14 hari
find "$BACKUP_DIR" -type f -mtime +14 -delete
