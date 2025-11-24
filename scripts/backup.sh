#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." &>/dev/null && pwd)"
ENV_FILE="$ROOT_DIR/.env.backup"
DEST_DIR="$ROOT_DIR/backups"
TIMESTAMP="$(date +"%Y-%m-%d-%H%M%S")"
OUTPUT_FILE="$DEST_DIR/backup_$TIMESTAMP.sql"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ No se encontró $ENV_FILE"
  echo "Crea el archivo .env.backup en la raíz con SUPABASE_DB_URL=<cadena>"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "❌ La variable SUPABASE_DB_URL no está definida en $ENV_FILE"
  exit 1
fi

PG_DUMP_BIN="${PG_DUMP_BIN:-pg_dump}"

if ! command -v "$PG_DUMP_BIN" >/dev/null 2>&1; then
  echo "❌ No se encontró pg_dump (comando: $PG_DUMP_BIN)."
  echo "Instala PostgreSQL 16 con Homebrew:  brew install postgresql@16"
  echo "O especificá la ruta exportando PG_DUMP_BIN=/ruta/a/pg_dump antes de ejecutar este script."
  exit 1
fi

mkdir -p "$DEST_DIR"

echo "📦 Generando backup en $OUTPUT_FILE..."
"$PG_DUMP_BIN" "$SUPABASE_DB_URL" \
  --clean \
  --if-exists \
  --format=plain \
  --file="$OUTPUT_FILE"

echo "✅ Backup creado correctamente."