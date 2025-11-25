#!/bin/bash

# Script para crear checkpoint completo de la plataforma
# Uso: ./scripts/create_checkpoint.sh

set -e

CHECKPOINT_NAME="Plataforma-Janos-2026"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
CHECKPOINT_DIR="$BACKUP_DIR/checkpoint_${CHECKPOINT_NAME// /_}"

echo "🔐 Creando checkpoint: $CHECKPOINT_NAME"
echo "📅 Fecha: $(date)"
echo ""

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"
mkdir -p "$CHECKPOINT_DIR"

# 1. Crear tag en Git
echo "📌 Creando tag en Git..."
if git rev-parse "$CHECKPOINT_NAME" >/dev/null 2>&1; then
    echo "⚠️  El tag $CHECKPOINT_NAME ya existe. ¿Deseas sobrescribirlo? (s/n)"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        git tag -d "$CHECKPOINT_NAME"
        git push origin ":refs/tags/$CHECKPOINT_NAME" 2>/dev/null || true
    else
        echo "❌ Operación cancelada"
        exit 1
    fi
fi

git tag -a "$CHECKPOINT_NAME" -m "Checkpoint: $CHECKPOINT_NAME - Punto de recupero ante error crítico"
git push origin "$CHECKPOINT_NAME"

echo "✅ Tag creado y subido a Git"
echo ""

# 2. Crear backup de información del commit
echo "📝 Guardando información del commit..."
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_DATE=$(git log -1 --format=%ci)
COMMIT_MESSAGE=$(git log -1 --format=%B)

cat > "$CHECKPOINT_DIR/commit_info.txt" << EOF
Checkpoint: $CHECKPOINT_NAME
Fecha de creación: $(date)
Commit Hash: $COMMIT_HASH
Fecha del commit: $COMMIT_DATE
Mensaje del commit: $COMMIT_MESSAGE
EOF

echo "✅ Información del commit guardada"
echo ""

# 3. Crear backup de estructura del proyecto
echo "📦 Guardando estructura del proyecto..."
tar -czf "$CHECKPOINT_DIR/project_structure.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='backups' \
    --exclude='*.log' \
    frontend/src \
    frontend/package.json \
    frontend/next.config.js \
    database \
    scripts \
    *.md 2>/dev/null || true

echo "✅ Estructura del proyecto guardada"
echo ""

# 4. Crear script de restauración
echo "🔧 Creando script de restauración..."
cat > "$CHECKPOINT_DIR/restore.sh" << 'RESTORE_SCRIPT'
#!/bin/bash
# Script de restauración desde checkpoint

set -e

CHECKPOINT_NAME="Plataforma-Janos-2026"

echo "🔄 Restaurando desde checkpoint: $CHECKPOINT_NAME"
echo ""

# Verificar que estamos en el repositorio correcto
if [ ! -d ".git" ]; then
    echo "❌ Error: No se encontró un repositorio Git"
    exit 1
fi

# Restaurar código desde tag
echo "📌 Restaurando código desde tag..."
git fetch origin
git checkout "$CHECKPOINT_NAME"

echo "✅ Código restaurado"
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Restaurar la base de datos desde Supabase Dashboard"
echo "2. Configurar variables de entorno en .env.local"
echo "3. Ejecutar: cd frontend && npm install"
echo "4. Verificar que todo funcione correctamente"
echo ""
echo "Para desplegar:"
echo "  git push origin $CHECKPOINT_NAME:main"
RESTORE_SCRIPT

chmod +x "$CHECKPOINT_DIR/restore.sh"
echo "✅ Script de restauración creado"
echo ""

# 5. Crear resumen
echo "📊 Creando resumen del checkpoint..."
cat > "$CHECKPOINT_DIR/README.md" << EOF
# Checkpoint: $CHECKPOINT_NAME

**Fecha de creación:** $(date)
**Commit:** $COMMIT_HASH
**Tag Git:** \`$CHECKPOINT_NAME\`

## Contenido

- \`commit_info.txt\` - Información del commit
- \`project_structure.tar.gz\` - Estructura del proyecto (sin node_modules)
- \`restore.sh\` - Script de restauración
- \`README.md\` - Este archivo

## Cómo Restaurar

1. Ejecutar: \`./restore.sh\`
2. Restaurar base de datos desde Supabase
3. Configurar variables de entorno
4. Instalar dependencias: \`cd frontend && npm install\`
5. Desplegar si es necesario

## Notas

- La base de datos debe restaurarse manualmente desde Supabase Dashboard
- Verificar que todas las migraciones estén aplicadas
- Probar en desarrollo antes de restaurar en producción
EOF

echo "✅ Resumen creado"
echo ""

# Resumen final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Checkpoint creado exitosamente"
echo ""
echo "📌 Tag Git: $CHECKPOINT_NAME"
echo "📁 Directorio: $CHECKPOINT_DIR"
echo "📝 Documentación: CHECKPOINT_PLATAFORMA_JANOS_2026.md"
echo ""
echo "Para restaurar desde este checkpoint:"
echo "  1. git checkout $CHECKPOINT_NAME"
echo "  2. Restaurar base de datos desde Supabase"
echo "  3. Configurar variables de entorno"
echo "  4. cd frontend && npm install"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

