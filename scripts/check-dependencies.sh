#!/bin/bash

# Script para verificar seguridad de dependencias
# Ejecuta npm audit y verifica vulnerabilidades

set -e

echo "🔍 Verificando seguridad de dependencias..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar dependencias en un directorio
check_dependencies() {
    local dir=$1
    local name=$2
    
    echo "📦 Verificando $name..."
    
    if [ ! -f "$dir/package.json" ]; then
        echo -e "${YELLOW}⚠️  No se encontró package.json en $dir${NC}"
        return 0
    fi
    
    cd "$dir"
    
    # Ejecutar npm audit
    if npm audit --audit-level=moderate 2>/dev/null; then
        echo -e "${GREEN}✅ $name: Sin vulnerabilidades críticas o moderadas${NC}"
        cd - > /dev/null
        return 0
    else
        echo -e "${RED}❌ $name: Se encontraron vulnerabilidades${NC}"
        echo ""
        echo "Ejecuta 'npm audit fix' para intentar corregir automáticamente"
        echo "O 'npm audit' para ver detalles"
        cd - > /dev/null
        return 1
    fi
}

# Verificar cada componente
ERRORS=0

# App Principal
if [ -d "." ] && [ -f "package.json" ]; then
    check_dependencies "." "App Principal" || ERRORS=$((ERRORS + 1))
fi

# Admin Dashboard
if [ -d "admin-dashboard" ]; then
    check_dependencies "admin-dashboard" "Admin Dashboard" || ERRORS=$((ERRORS + 1))
fi

# Core API
if [ -d "packages/core-api" ]; then
    check_dependencies "packages/core-api" "Core API" || ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Todas las dependencias están seguras${NC}"
    exit 0
else
    echo -e "${RED}❌ Se encontraron vulnerabilidades en $ERRORS componente(s)${NC}"
    exit 1
fi


