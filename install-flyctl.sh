#!/bin/bash

echo "📥 Instalando flyctl..."
curl -L https://fly.io/install.sh | sh

echo ""
echo "✅ flyctl instalado"

echo ""
echo "🔧 Agregando flyctl al PATH..."

# Agregar al PATH
export PATH="$HOME/.fly/bin:$PATH"

# Verificar instalación
echo ""
echo "📋 Verificando instalación:"
flyctl version

echo ""
echo "✅ Ahora puedes usar flyctl"

echo ""
echo "Ejecuta:"
echo "  flyctl volumes list -a ahorro365-baileys-worker"

