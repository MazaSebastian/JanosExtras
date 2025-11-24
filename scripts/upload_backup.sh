#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." &>/dev/null && pwd)"
LATEST_BACKUP="$(ls -t "$ROOT_DIR/backups"/*.sql | head -n 1)"
REMOTE_FOLDER="gdrive:RespaldosBD"

if [ -z "${LATEST_BACKUP:-}" ]; then
  echo "No se encontró ningún archivo en backups/. Ejecutá primero el script de backup."
  exit 1
fi

echo "📤 Subiendo $LATEST_BACKUP a $REMOTE_FOLDER..."
rclone copy "$LATEST_BACKUP" "$REMOTE_FOLDER"
echo "✅ Copia enviada a Google Drive."