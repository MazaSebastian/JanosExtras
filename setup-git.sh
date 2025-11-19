#!/bin/bash

# Script para inicializar Git y conectar con el repositorio

echo "🚀 Configurando repositorio Git..."

# Verificar si Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado. Por favor instálalo primero."
    exit 1
fi

# Inicializar Git si no está inicializado
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    git branch -M main
fi

# Agregar el remoto (o actualizarlo si ya existe)
if git remote get-url origin &> /dev/null; then
    echo "🔄 Actualizando remoto origin..."
    git remote set-url origin https://github.com/MazaSebastian/JanosExtras.git
else
    echo "➕ Agregando remoto origin..."
    git remote add origin https://github.com/MazaSebastian/JanosExtras.git
fi

echo "✅ Repositorio configurado correctamente!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. git add ."
echo "   2. git commit -m 'Initial commit: Sistema de control de eventos DJs'"
echo "   3. git push -u origin main"
echo ""
echo "🌐 Luego ve a vercel.com y conecta este repositorio para desplegar."

