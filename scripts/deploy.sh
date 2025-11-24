#!/bin/bash

# Script de deploy automático a Vercel
# Este script hace commit y push de los cambios, lo que activa el deploy automático en Vercel

set -e  # Salir si hay algún error

echo "🚀 Iniciando deploy automático..."

# Cambiar al directorio del proyecto
cd "$(dirname "$0")/.."

# Verificar que estamos en un repositorio Git
if [ ! -d .git ]; then
    echo "❌ Error: No se encontró un repositorio Git"
    exit 1
fi

# Verificar si hay cambios para commitear
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No hay cambios para commitear"
    exit 0
fi

# Obtener el mensaje de commit (puede venir como argumento o usar uno por defecto)
COMMIT_MESSAGE="${1:-Deploy automático: Actualización del sistema}"

# Agregar todos los cambios
echo "📦 Agregando cambios..."
git add .

# Hacer commit
echo "💾 Haciendo commit..."
git commit -m "$COMMIT_MESSAGE" || {
    echo "⚠️  No se pudo hacer commit (posiblemente no hay cambios nuevos)"
    exit 0
}

# Obtener la rama actual
CURRENT_BRANCH=$(git branch --show-current)

# Hacer push
echo "📤 Haciendo push a origin/$CURRENT_BRANCH..."
git push origin "$CURRENT_BRANCH" || {
    echo "❌ Error al hacer push"
    exit 1
}

echo "✅ Push completado exitosamente"
echo "🔄 Vercel detectará el cambio y comenzará el deploy automáticamente"
echo "📊 Puedes ver el progreso en: https://vercel.com"

