#!/bin/bash

# Script de Testing de Rate Limiting
# Verifica que el rate limiting funciona correctamente

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚦 Testing de Rate Limiting${NC}\n"

# Configuración
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001}"
ENDPOINT="${1:-/api/auth/login}"
LIMIT="${2:-5}"
DELAY="${3:-0.5}"

echo "📋 Configuración:"
echo "   API URL: $API_URL"
echo "   Endpoint: $ENDPOINT"
echo "   Límite esperado: $LIMIT solicitudes"
echo "   Delay entre requests: ${DELAY}s"
echo ""

# Contadores
SUCCESS_COUNT=0
RATE_LIMIT_COUNT=0
OTHER_COUNT=0

# Función para hacer request
make_request() {
    local num=$1
    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}' 2>/dev/null)
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    echo "$http_code"
}

# Hacer requests hasta alcanzar el límite
echo -e "${YELLOW}Haciendo $((LIMIT + 2)) solicitudes...${NC}\n"

for i in $(seq 1 $((LIMIT + 2))); do
    HTTP_CODE=$(make_request $i)
    
    case $HTTP_CODE in
        200|201)
            echo -e "  Request $i: ${GREEN}✅ 200 OK${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            ;;
        401|400)
            echo -e "  Request $i: ${YELLOW}⚠️  $HTTP_CODE (Esperado para credenciales inválidas)${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            ;;
        429)
            echo -e "  Request $i: ${GREEN}✅ 429 Rate Limited${NC}"
            RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
            ;;
        *)
            echo -e "  Request $i: ${RED}❌ $HTTP_CODE${NC}"
            OTHER_COUNT=$((OTHER_COUNT + 1))
            ;;
    esac
    
    sleep $DELAY
done

# Resumen
echo ""
echo -e "${YELLOW}📊 Resumen:${NC}"
echo "   Solicitudes exitosas (antes del límite): $SUCCESS_COUNT"
echo "   Solicitudes rate limited (429): $RATE_LIMIT_COUNT"
echo "   Otras respuestas: $OTHER_COUNT"
echo ""

if [ $RATE_LIMIT_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ Rate limiting funciona correctamente${NC}"
    echo "   El sistema bloqueó solicitudes después del límite"
    exit 0
else
    echo -e "${RED}❌ Rate limiting NO funciona${NC}"
    echo "   No se recibió ninguna respuesta 429"
    exit 1
fi

