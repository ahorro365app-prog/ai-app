#!/bin/bash

echo "📥 Instalando flyctl manualmente..."

# Crear directorio si no existe
mkdir -p ~/.fly/bin

# URL de descarga directa
FLYCTL_VERSION="0.4.59"
FLYCTL_URL="https://github.com/superfly/flyctl/releases/download/v${FLYCTL_VERSION}/flyctl_${FLYCTL_VERSION}_Windows_x86_64.tar.gz"

echo "📥 Descargando flyctl..."
curl -L "$FLYCTL_URL" -o /tmp/flyctl.tar.gz

echo "📦 Extrayendo..."
cd /tmp
tar -xzf flyctl.tar.gz

echo "📋 Moviendo binario..."
mv flyctl.exe ~/.fly/bin/

# Agregar al PATH
export PATH="$HOME/.fly/bin:$PATH"

echo ""
echo "✅ flyctl instalado"

# Verificar
echo ""
echo "📋 Verificando:"
~/.fly/bin/flyctl.exe version

echo ""
echo "✅ Ahora puedes usar flyctl"

