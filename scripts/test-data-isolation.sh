#!/bin/bash

# Script de Testing de Aislamiento de Datos
# Verifica que un usuario no puede acceder a datos de otro usuario

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing de Aislamiento de Datos${NC}\n"

# Configuración
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001}"
USER_A_EMAIL="test-user-a@example.com"
USER_B_EMAIL="test-user-b@example.com"
PASSWORD="TestPassword123!"

echo "📋 Configuración:"
echo "   API URL: $API_URL"
echo "   Usuario A: $USER_A_EMAIL"
echo "   Usuario B: $USER_B_EMAIL"
echo ""

# Función para hacer login y obtener token
login() {
    local email=$1
    local response=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}")
    
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Función para obtener userId del token (simplificado - en producción usar JWT decode)
get_user_id() {
    local token=$1
    # Esto es un placeholder - en producción deberías decodificar el JWT
    # Por ahora, asumimos que el endpoint retorna el userId
    echo "USER_ID_PLACEHOLDER"
}

# Test 1: Login de Usuario A
echo -e "${YELLOW}Test 1: Login de Usuario A${NC}"
TOKEN_A=$(login "$USER_A_EMAIL")
if [ -z "$TOKEN_A" ]; then
    echo -e "${RED}❌ Error: No se pudo obtener token de Usuario A${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Token de Usuario A obtenido${NC}\n"

# Test 2: Login de Usuario B
echo -e "${YELLOW}Test 2: Login de Usuario B${NC}"
TOKEN_B=$(login "$USER_B_EMAIL")
if [ -z "$TOKEN_B" ]; then
    echo -e "${RED}❌ Error: No se pudo obtener token de Usuario B${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Token de Usuario B obtenido${NC}\n"

# Test 3: Usuario A intenta acceder a datos de Usuario B
echo -e "${YELLOW}Test 3: Usuario A intenta acceder a datos de Usuario B${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/transactions?userId=USER_B_ID" \
    -H "Authorization: Bearer $TOKEN_A")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "404" ]; then
    echo -e "${GREEN}✅ Test 3 PASÓ: Usuario A NO puede acceder a datos de Usuario B (Status: $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Test 3 FALLÓ: Usuario A pudo acceder a datos de Usuario B (Status: $HTTP_CODE)${NC}"
    echo "   Respuesta: $BODY"
fi
echo ""

# Test 4: Usuario A accede a sus propios datos (debe funcionar)
echo -e "${YELLOW}Test 4: Usuario A accede a sus propios datos${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/transactions?userId=USER_A_ID" \
    -H "Authorization: Bearer $TOKEN_A")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Test 4 PASÓ: Usuario A puede acceder a sus propios datos (Status: $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Test 4 FALLÓ: Usuario A no pudo acceder a sus propios datos (Status: $HTTP_CODE)${NC}"
fi
echo ""

# Resumen
echo -e "${YELLOW}📊 Resumen de Tests:${NC}"
echo "   Test 1: Login Usuario A - ✅"
echo "   Test 2: Login Usuario B - ✅"
echo "   Test 3: Aislamiento de datos - [Verificar arriba]"
echo "   Test 4: Acceso propio - [Verificar arriba]"
echo ""

echo -e "${YELLOW}⚠️  Nota: Este script es un ejemplo básico.${NC}"
echo "   Para testing completo, usa la guía completa en:"
echo "   docs/VERIFICACION_RLS_POLICIES.md"

