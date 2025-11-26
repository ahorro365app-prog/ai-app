#!/bin/bash

# Script de Testing de Error Handling - Core API
# Verifica que los endpoints manejan errores correctamente

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🧪 Testing de Error Handling - Core API${NC}\n"

# Configuración
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3000}"
BASE_URL="${API_URL}/api"

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Función para ejecutar test
run_test() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local expected_message=$6
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}Test $TOTAL_TESTS: $test_name${NC}"
    echo "   Endpoint: $method $endpoint"
    
    # Ejecutar request
    if [ -z "$data" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    # Verificar status code
    if [ "$HTTP_CODE" == "$expected_status" ]; then
        echo -e "   ${GREEN}✅ Status code correcto: $HTTP_CODE${NC}"
        
        # Verificar mensaje (si se especificó)
        if [ -n "$expected_message" ]; then
            if echo "$BODY" | grep -q "$expected_message"; then
                echo -e "   ${GREEN}✅ Mensaje encontrado: $expected_message${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            else
                echo -e "   ${RED}❌ Mensaje no encontrado. Esperado: $expected_message${NC}"
                echo "   Respuesta: $BODY"
                TESTS_FAILED=$((TESTS_FAILED + 1))
            fi
        else
            TESTS_PASSED=$((TESTS_PASSED + 1))
        fi
        
        # Verificar que NO expone detalles internos
        if echo "$BODY" | grep -qiE "(stack|trace|at |Error:|P[0-9]{4}|PGRST|relation|column|does not exist)"; then
            echo -e "   ${RED}⚠️  ADVERTENCIA: Posible exposición de detalles internos${NC}"
            echo "   Revisar: $BODY"
        else
            echo -e "   ${GREEN}✅ No expone detalles internos${NC}"
        fi
    else
        echo -e "   ${RED}❌ Status code incorrecto. Esperado: $expected_status, Obtenido: $HTTP_CODE${NC}"
        echo "   Respuesta: $BODY"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    echo ""
}

# Verificar que el servidor está corriendo
echo -e "${CYAN}Verificando que el servidor está corriendo...${NC}"
if ! curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  No se pudo conectar al servidor en $BASE_URL${NC}"
    echo "   Asegúrate de que el servidor esté corriendo:"
    echo "   cd packages/core-api && npm run dev"
    echo ""
    echo "   O configura NEXT_PUBLIC_API_URL:"
    echo "   export NEXT_PUBLIC_API_URL=http://localhost:3000"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Servidor conectado${NC}\n"

# Tests de Validación (400)
echo -e "${CYAN}📋 Tests de Validación (400 Bad Request)${NC}\n"

run_test \
    "Validación: Token FCM requerido" \
    "POST" \
    "/notifications/register-token" \
    '{"userId":"123e4567-e89b-12d3-a456-426614174000"}' \
    "400" \
    "Token FCM requerido"

run_test \
    "Validación: Código de referido inválido" \
    "POST" \
    "/referrals/validate-code" \
    '{"code":"ABC123"}' \
    "400" \
    "8 caracteres"

# Tests de Recurso No Encontrado (404)
echo -e "${CYAN}📋 Tests de Recurso No Encontrado (404 Not Found)${NC}\n"

run_test \
    "Not Found: Template inexistente" \
    "GET" \
    "/notifications/templates/00000000-0000-0000-0000-000000000000" \
    "" \
    "404" \
    "no encontrado"

# Tests de Errores Internos (500)
echo -e "${CYAN}📋 Tests de Errores Internos (500 Internal Server Error)${NC}\n"

run_test \
    "Error interno: UUID inválido" \
    "POST" \
    "/notifications/send" \
    '{"userId":"invalid-uuid","title":"Test","body":"Test"}' \
    "400" \
    ""

# Resumen
echo -e "${CYAN}📊 Resumen de Tests${NC}\n"
echo -e "   Total: $TOTAL_TESTS"
echo -e "   ${GREEN}✅ Pasados: $TESTS_PASSED${NC}"
echo -e "   ${RED}❌ Fallidos: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos los tests pasaron${NC}\n"
    exit 0
else
    echo -e "${RED}⚠️  Algunos tests fallaron. Revisar arriba.${NC}\n"
    exit 1
fi

