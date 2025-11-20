#!/bin/bash

# Script de Testing de Security Headers
# Verifica que todas las respuestas incluyen security headers

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔒 Testing de Security Headers${NC}\n"

# Configuración
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001}"

# Headers esperados
EXPECTED_HEADERS=(
    "Content-Security-Policy"
    "X-Frame-Options"
    "X-Content-Type-Options"
    "X-XSS-Protection"
    "Referrer-Policy"
    "Permissions-Policy"
)

# Función para verificar headers
check_headers() {
    local url=$1
    local name=$2
    
    echo -e "${YELLOW}Verificando: $name ($url)${NC}"
    
    # Obtener headers
    HEADERS=$(curl -s -I "$url" | grep -iE "^($(IFS='|'; echo "${EXPECTED_HEADERS[*]}")):")
    
    # Verificar cada header esperado
    MISSING=0
    for header in "${EXPECTED_HEADERS[@]}"; do
        if echo "$HEADERS" | grep -qi "^$header:"; then
            VALUE=$(echo "$HEADERS" | grep -i "^$header:" | cut -d':' -f2- | xargs)
            echo -e "  ${GREEN}✅${NC} $header: $VALUE"
        else
            echo -e "  ${RED}❌${NC} $header: FALTANTE"
            MISSING=$((MISSING + 1))
        fi
    done
    
    if [ $MISSING -eq 0 ]; then
        echo -e "${GREEN}✅ Todos los headers presentes${NC}\n"
        return 0
    else
        echo -e "${RED}❌ Faltan $MISSING headers${NC}\n"
        return 1
    fi
}

# Test 1: App Principal
echo -e "${YELLOW}📱 Test 1: App Principal${NC}"
check_headers "$APP_URL" "App Principal"
APP_RESULT=$?

# Test 2: Core API
echo -e "${YELLOW}🔌 Test 2: Core API${NC}"
check_headers "$API_URL/api/health" "Core API"
API_RESULT=$?

# Resumen
echo -e "${YELLOW}📊 Resumen:${NC}"
if [ $APP_RESULT -eq 0 ] && [ $API_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Todos los tests pasaron${NC}"
    exit 0
else
    echo -e "${RED}❌ Algunos tests fallaron${NC}"
    exit 1
fi

