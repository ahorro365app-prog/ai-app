#!/bin/bash

echo "🔍 Verificando si flyctl está instalado..."

if command -v flyctl &> /dev/null; then
    echo "✅ flyctl ya está instalado"
    flyctl version
else
    echo "📥 Instalando flyctl..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

echo ""
echo "📋 PASO 1: Verificar volumen en Fly.io"
echo "════════════════════════════════════════"
flyctl volumes list -a ahorro365-baileys-worker

echo ""
echo "📋 PASO 2: Conectar por SSH a Fly.io"
echo "════════════════════════════════════════"
echo "Dentro del SSH, ejecuta estos comandos:"
echo "  ls -la /app/"
echo "  ls -la /app/auth_info/"
echo "  exit"
echo ""
echo "Presiona Enter para conectar por SSH..."
read -p ""

flyctl ssh console -a ahorro365-baileys-worker

echo ""
echo "📋 PASO 3: Copiar auth_info desde tu PC al volumen"
echo "════════════════════════════════════════"
echo "Abriendo SFTP shell..."
echo ""
echo "Dentro de SFTP, ejecuta:"
echo "  put -r auth_info /app/auth_info"
echo "  exit"
echo ""
echo "Presiona Enter para abrir SFTP..."
read -p ""

flyctl sftp shell -a ahorro365-baileys-worker

echo ""
echo "✅ ¡Sesión copiada! Ahora verifica en SSH:"
echo "  flyctl ssh console -a ahorro365-baileys-worker"
echo "  ls -la /app/auth_info/"

