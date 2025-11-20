#!/bin/bash

# Script para verificar que no haya secrets en el código
# Requiere: gitleaks (https://github.com/gitleaks/gitleaks)

echo "🔍 Verificando secrets en el código..."

# Verificar si gitleaks está instalado
if ! command -v gitleaks &> /dev/null; then
    echo "⚠️ gitleaks no está instalado"
    echo "   Instala con: brew install gitleaks (macOS) o descarga desde: https://github.com/gitleaks/gitleaks"
    echo ""
    echo "📋 Alternativa: Revisa manualmente estos patrones:"
    echo "   - API keys: sk-, pk_, AIza, ghp_"
    echo "   - Tokens: eyJ (JWT), xoxb- (Slack)"
    echo "   - Passwords: password.*=.*['\"].*['\"]"
    echo "   - Secrets: secret.*=.*['\"].*['\"]"
    exit 0
fi

# Ejecutar gitleaks
gitleaks detect --source . --verbose

if [ $? -eq 0 ]; then
    echo "✅ No se encontraron secrets en el código"
    exit 0
else
    echo "❌ Se encontraron posibles secrets en el código"
    echo "   Revisa el output arriba y elimina cualquier secret hardcodeado"
    exit 1
fi

