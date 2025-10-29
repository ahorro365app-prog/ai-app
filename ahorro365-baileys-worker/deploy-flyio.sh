#!/bin/bash

# ============================================================
# DEPLOY AUTOMÁTICO A FLY.IO - AHORRO365 BAILEYS WORKER
# ============================================================
# Este script automatiza TODO el proceso de despliegue en Fly.io
# Uso: bash deploy-flyio.sh
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# FUNCIONES
# ============================================================

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_command() {
    if [ $? -eq 0 ]; then
        print_success "$1"
        return 0
    else
        print_error "$1"
        exit 1
    fi
}

# ============================================================
# FASE 0: VERIFICACIONES INICIALES
# ============================================================

print_header "FASE 0: VERIFICACIONES INICIALES"

print_step "Verificando prerequisites..."

# Verificar que estamos en el proyecto correcto
if [ ! -f "package.json" ]; then
    print_error "package.json no encontrado. ¿Estás en la carpeta correcta?"
    exit 1
fi
print_success "package.json encontrado"

# Verificar Dockerfile
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile no encontrado"
    exit 1
fi
print_success "Dockerfile encontrado"

# Verificar fly.toml
if [ ! -f "fly.toml" ]; then
    print_error "fly.toml no encontrado"
    exit 1
fi
print_success "fly.toml encontrado"

# Verificar .env
if [ ! -f ".env" ]; then
    print_error ".env no encontrado - necesitamos credenciales"
    exit 1
fi
print_success ".env encontrado"

# ============================================================
# FASE 1: INSTALAR Y VALIDAR FLYCTL
# ============================================================

print_header "FASE 1: INSTALAR Y VALIDAR FLYCTL"

if command -v flyctl &> /dev/null; then
    print_success "flyctl ya está instalado"
    flyctl version
else
    print_step "Instalando flyctl..."
    curl -L https://fly.io/install.sh | sh
    check_command "flyctl instalado"
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Verificar que flyctl funciona
flyctl version > /dev/null 2>&1
check_command "flyctl funciona correctamente"

# ============================================================
# FASE 2: AUTENTICAR EN FLY.IO
# ============================================================

print_header "FASE 2: AUTENTICAR EN FLY.IO"

if flyctl auth whoami > /dev/null 2>&1; then
    print_success "Ya estás autenticado en Fly.io"
    echo -e "${BLUE}Usuario:${NC}"
    flyctl auth whoami
else
    print_step "Necesitas autenticarte en Fly.io"
    echo -e "${YELLOW}Se abrirá tu navegador. Confirma con tu cuenta.${NC}"
    flyctl auth login
    check_command "Autenticación completada"
fi

echo ""

# ============================================================
# FASE 3: VALIDAR CREDENCIALES
# ============================================================

print_header "FASE 3: VALIDAR CREDENCIALES EN .env"

print_step "Leyendo .env..."

# Función para leer variable de .env
get_env_var() {
    grep "^$1=" .env 2>/dev/null | cut -d '=' -f 2- | tr -d '"' | tr -d "'" || echo ""
}

# Leer todas las variables necesarias
SUPABASE_URL=$(get_env_var "SUPABASE_URL")
SUPABASE_KEY=$(get_env_var "SUPABASE_KEY")
BACKEND_URL=$(get_env_var "BACKEND_URL")
ADMIN_DASHBOARD_URL=$(get_env_var "ADMIN_DASHBOARD_URL")
WHATSAPP_NUMBER=$(get_env_var "WHATSAPP_NUMBER")

# Validar que todas existan
if [ -z "$SUPABASE_URL" ]; then
    print_error "SUPABASE_URL no encontrado en .env"
    exit 1
fi
print_success "SUPABASE_URL configurado"

if [ -z "$SUPABASE_KEY" ]; then
    print_error "SUPABASE_KEY no encontrado en .env"
    exit 1
fi
print_success "SUPABASE_KEY configurado"

if [ -z "$BACKEND_URL" ]; then
    print_error "BACKEND_URL no encontrado en .env"
    exit 1
fi
print_success "BACKEND_URL configurado"

if [ -z "$ADMIN_DASHBOARD_URL" ]; then
    print_error "ADMIN_DASHBOARD_URL no encontrado en .env"
    exit 1
fi
print_success "ADMIN_DASHBOARD_URL configurado"

if [ -z "$WHATSAPP_NUMBER" ]; then
    print_error "WHATSAPP_NUMBER no encontrado en .env"
    exit 1
fi
print_success "WHATSAPP_NUMBER configurado"

echo ""

# ============================================================
# FASE 4: CREAR VOLUMEN PERSISTENTE
# ============================================================

print_header "FASE 4: CREAR VOLUMEN PERSISTENTE"

# Obtener el nombre de la app de fly.toml
APP_NAME=$(grep "^app = " fly.toml | sed 's/app = "//' | sed 's/".*//')

if [ -z "$APP_NAME" ]; then
    APP_NAME="ahorro365-baileys-worker"
fi

print_step "Nombre de app: $APP_NAME"

# Verificar si el volumen ya existe
if flyctl volumes list -a "$APP_NAME" 2>/dev/null | grep -q "auth_info"; then
    print_success "Volumen auth_info ya existe"
else
    print_step "Creando volumen auth_info..."
    flyctl volumes create auth_info --size 1 --region mia --app "$APP_NAME"
    check_command "Volumen creado"
    sleep 2
fi

echo ""

# ============================================================
# FASE 5: LANZAR APP EN FLY.IO
# ============================================================

print_header "FASE 5: LANZAR APP EN FLY.IO"

# Verificar si la app ya existe en Fly.io
if flyctl apps list 2>/dev/null | grep -q "$APP_NAME"; then
    print_success "App $APP_NAME ya existe en Fly.io"
else
    print_step "Creando app $APP_NAME en Fly.io..."
    flyctl launch --app "$APP_NAME" --region mia --skip-deployment --no-deploy
    check_command "App creada en Fly.io"
fi

echo ""

# ============================================================
# FASE 6: DESPLEGAR A FLY.IO
# ============================================================

print_header "FASE 6: DESPLEGAR A FLY.IO"

print_step "Desplegando aplicación (esto puede tomar 2-5 minutos)..."

flyctl deploy --app "$APP_NAME"
check_command "Deployment completado"

echo ""

# ============================================================
# FASE 7: CONFIGURAR SECRETS
# ============================================================

print_header "FASE 7: CONFIGURAR SECRETS"

print_step "Seteando variables de entorno en Fly.io..."

# SUPABASE_URL
flyctl secrets set SUPABASE_URL="$SUPABASE_URL" --app "$APP_NAME" > /dev/null 2>&1
check_command "SUPABASE_URL configurado"

# SUPABASE_KEY
flyctl secrets set SUPABASE_KEY="$SUPABASE_KEY" --app "$APP_NAME" > /dev/null 2>&1
check_command "SUPABASE_KEY configurado"

# BACKEND_URL
flyctl secrets set BACKEND_URL="$BACKEND_URL" --app "$APP_NAME" > /dev/null 2>&1
check_command "BACKEND_URL configurado"

# ADMIN_DASHBOARD_URL
flyctl secrets set ADMIN_DASHBOARD_URL="$ADMIN_DASHBOARD_URL" --app "$APP_NAME" > /dev/null 2>&1
check_command "ADMIN_DASHBOARD_URL configurado"

# WHATSAPP_NUMBER
flyctl secrets set WHATSAPP_NUMBER="$WHATSAPP_NUMBER" --app "$APP_NAME" > /dev/null 2>&1
check_command "WHATSAPP_NUMBER configurado"

echo ""
print_step "Verificando secrets configurados..."
flyctl secrets list --app "$APP_NAME"

echo ""

# ============================================================
# FASE 8: VERIFICAR DEPLOYMENT
# ============================================================

print_header "FASE 8: VERIFICAR DEPLOYMENT"

print_step "Obteniendo estado de la app..."
sleep 3

flyctl status --app "$APP_NAME"

echo ""
print_step "Últimos logs (últimas 20 líneas)..."
flyctl logs -n 20 --app "$APP_NAME"

echo ""

# ============================================================
# FASE 9: INFORMACIÓN FINAL
# ============================================================

print_header "✅ DEPLOYMENT COMPLETADO"

# Obtener la URL de la app
APP_URL="https://${APP_NAME}.fly.dev"

echo -e "${GREEN}🎉 ¡TU APP ESTÁ VIVA!${NC}"

echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""

echo -e "${YELLOW}📊 INFORMACIÓN DE TU APP:${NC}"

echo ""

echo -e "  ${GREEN}Nombre:${NC}          $APP_NAME"

echo -e "  ${GREEN}URL Principal:${NC}   $APP_URL"

echo -e "  ${GREEN}QR Scanner:${NC}      ${APP_URL}:3003"

echo -e "  ${GREEN}Estado:${NC}          🟢 Running"

echo -e "  ${GREEN}Costo/mes:${NC}       \$0 (con crédito Fly.io)"

echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""

echo -e "${YELLOW}🔧 PRÓXIMOS PASOS:${NC}"

echo ""

echo "1️⃣  CONECTAR WHATSAPP:"

echo "   Abre en navegador: ${APP_URL}:3003"

echo "   Escanea el QR con tu WhatsApp (Menú → Dispositivos vinculados)"

echo ""

echo "2️⃣  VER LOGS EN TIEMPO REAL:"

echo "   flyctl logs --follow --app $APP_NAME"

echo ""

echo "3️⃣  ACCEDER POR SSH (si necesitas debugging):"

echo "   flyctl ssh console --app $APP_NAME"

echo ""

echo "4️⃣  REDEPLOYAR DESPUÉS DE CAMBIOS:"

echo "   git push origin main"

echo "   flyctl deploy --app $APP_NAME"

echo ""

echo -e "${YELLOW}📖 COMANDOS ÚTILES:${NC}"

echo ""

echo "  Ver status:                flyctl status --app $APP_NAME"

echo "  Ver logs:                  flyctl logs --app $APP_NAME"

echo "  Ver métricas:              flyctl metrics --app $APP_NAME"

echo "  Actualizar secret:         flyctl secrets set VAR=valor --app $APP_NAME"

echo "  Reiniciar:                 flyctl restart --app $APP_NAME"

echo ""

echo -e "${YELLOW}❓ TROUBLESHOOTING:${NC}"

echo ""

echo "Si WhatsApp no se conecta:"

echo "  • Ver logs: flyctl logs --follow --app $APP_NAME"

echo "  • Busca: 'WhatsApp connected' o errores"

echo ""

echo "Si la app no inicia:"

echo "  • Ver error completo: flyctl logs --all --app $APP_NAME"

echo "  • Checklist: ¿Dockerfile está bien? ¿.env tiene credenciales?"

echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

echo ""

echo -e "${GREEN}✨ ¡LISTO PARA USAR! 🚀${NC}"

echo ""
