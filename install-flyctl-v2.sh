#!/bin/bash

echo "📥 Instalando flyctl desde GitHub..."

# Crear directorio
mkdir -p ~/.fly/bin

# Descargar con wget (mejor que curl en Git Bash)
echo "📥 Descargando flyctl..."
wget -O ~/.fly/bin/flyctl.exe "https://github.com/superfly/flyctl/releases/download/v0.4.59/flyctl_Windows_x86_64.zip"

if [ ! -f ~/.fly/bin/flyctl.exe ]; then
    echo "❌ Error descargando flyctl"
    echo "📥 Intentando descarga alternativa..."
    
    # Método alternativo: descargar como ZIP
    wget -O /tmp/flyctl.zip "https://github.com/superfly/flyctl/releases/latest/download/flyctl_Windows_x86_64.zip"
    
    if [ -f /tmp/flyctl.zip ]; then
        echo "📦 Extrayendo ZIP..."
        cd /tmp
        unzip -q flyctl.zip
        mv flyctl.exe ~/.fly/bin/ 2>/dev/null || true
    fi
fi

# Agregar al PATH
export PATH="$HOME/.fly/bin:$PATH"

echo ""
echo "📋 Verificando instalación..."
if [ -f ~/.fly/bin/flyctl.exe ]; then
    ~/.fly/bin/flyctl.exe version
    echo ""
    echo "✅ flyctl instalado correctamente"
else
    echo "❌ Error: flyctl no se instaló correctamente"
    echo ""
    echo "💡 Instalación manual:"
    echo "   1. Ve a: https://github.com/superfly/flyctl/releases"
    echo "   2. Descarga: flyctl_Windows_x86_64.zip"
    echo "   3. Extrae flyctl.exe a: C:/Users/Usuario/.fly/bin/"
fi

