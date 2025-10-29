#!/bin/bash

# ============================================================
# LIMPIAR HETZNER Y PREPARAR PARA FLY.IO (NO INTERACTIVO)
# ============================================================
# Usage: bash cleanup-hetzner-setup-flyio-auto.sh
# Este script NO hace preguntas - ejecuta todo automáticamente
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_phase() {
    local title=$1
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}${title}${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ Error: $1${NC}"
        exit 1
    fi
}

# ============================================================
# INICIO
# ============================================================

print_phase "🧹 LIMPIEZA AUTOMÁTICA: ELIMINANDO HETZNER Y CONFIGURANDO FLY.IO"

echo -e "${YELLOW}Este script eliminará:${NC}"
echo "  ❌ scripts/deploy-hetzner.sh"
echo "  ❌ scripts/logs-hetzner.sh"
echo "  ❌ docker-compose.yml (si es de Hetzner)"
echo ""
echo -e "${YELLOW}Y configurará:${NC}"
echo "  ✅ fly.toml"
echo "  ✅ .env para Fly.io"
echo ""
echo -e "${YELLOW}Comenzando en 3 segundos...${NC}"
sleep 3

# ============================================================
# FASE 1: ELIMINAR ARCHIVOS DE HETZNER
# ============================================================

print_phase "FASE 1: ELIMINANDO ARCHIVOS DE HETZNER"

echo -e "${YELLOW}Eliminando scripts de Hetzner...${NC}"

# Eliminar scripts de Hetzner
if [ -f "scripts/deploy-hetzner.sh" ]; then
    rm -f scripts/deploy-hetzner.sh
    echo -e "${GREEN}✓ scripts/deploy-hetzner.sh eliminado${NC}"
fi

if [ -f "scripts/logs-hetzner.sh" ]; then
    rm -f scripts/logs-hetzner.sh
    echo -e "${GREEN}✓ scripts/logs-hetzner.sh eliminado${NC}"
fi

# Eliminar docker-compose.yml si existe
if [ -f "docker-compose.yml" ]; then
    rm -f docker-compose.yml
    echo -e "${GREEN}✓ docker-compose.yml eliminado${NC}"
fi

# Limpiar archivos de backup
rm -f .env.*.backup 2>/dev/null || true
rm -f .env.hetzner 2>/dev/null || true
echo -e "${GREEN}✓ Archivos de backup eliminados${NC}"

# ============================================================
# FASE 2: ACTUALIZAR .gitignore
# ============================================================

print_phase "FASE 2: ACTUALIZANDO .gitignore"

echo -e "${YELLOW}Configurando .gitignore para Fly.io...${NC}"

# Crear .gitignore limpio
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/
.next/
.nuxt/
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Persistent storage (Fly.io)
auth_info/

# Old deployment configs
scripts/deploy-*.sh
scripts/logs-*.sh
docker-compose.yml
.railway.json
railway.json
.railwayignore
EOF

echo -e "${GREEN}✓ .gitignore creado/actualizado${NC}"

# ============================================================
# FASE 3: CREAR FLY.TOML
# ============================================================

print_phase "FASE 3: CREANDO FLY.TOML PARA FLY.IO"

echo -e "${YELLOW}Generando configuración de Fly.io...${NC}"

cat > fly.toml << 'EOF'
# ============================================================
# FLY.IO CONFIGURATION FOR AHORRO365 BAILEYS WORKER
# ============================================================

app = "ahorro365-baileys-worker"
primary_region = "mia"  # Miami - Closest to Latin America
console_command = "/bin/sh"

# ============================================================
# BUILD CONFIGURATION
# ============================================================
[build]
  dockerfile = "Dockerfile"

# ============================================================
# ENV VARIABLES
# ============================================================
[env]
  NODE_ENV = "production"
  PORT = "3003"
  BAILEYS_PORT = "3003"
  BAILEYS_SESSION_PATH = "/app/auth_info"

# ============================================================
# MOUNTS (Persistent Storage)
# ============================================================
[[mounts]]
  source = "auth_info"
  destination = "/app/auth_info"

# ============================================================
# SERVICES (HTTP & Internal Communication)
# ============================================================
[[services]]
  internal_port = 3003
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_options]]
    compress = true

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

# ============================================================
# DEPLOY CONFIGURATION
# ============================================================
[deploy]
  strategy = "canary"

# ============================================================
# HTTP SERVICE
# ============================================================
[http_service]
  internal_port = 3003
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

  [http_service.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[http_service.checks]]
    grace_period = "30s"
    interval = "15s"
    method = "get"
    path = "/health"
    protocol = "http"
    timeout = "5s"
    tls_server_name = ""
    tls_skip_verify = false

# ============================================================
# MACHINE CONFIGURATION
# ============================================================
[vm]
  size = "shared-cpu-1x"
  memory_mb = 256

# ============================================================
# MONITORING
# ============================================================
[monitoring]
  enabled = true
EOF

echo -e "${GREEN}✓ fly.toml creado${NC}"

# ============================================================
# FASE 4: VERIFICAR DOCKERFILE
# ============================================================

print_phase "FASE 4: VERIFICANDO DOCKERFILE"

if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}✗ Dockerfile no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dockerfile existe${NC}"

if grep -q "FROM node" Dockerfile; then
    echo -e "${GREEN}✓ Dockerfile tiene FROM node${NC}"
fi

if grep -q "EXPOSE 3003" Dockerfile; then
    echo -e "${GREEN}✓ Dockerfile expone puerto 3003${NC}"
fi

# ============================================================
# FASE 5: VERIFICAR .ENV
# ============================================================

print_phase "FASE 5: VERIFICANDO .ENV"

if [ ! -f ".env" ]; then
    echo -e "${RED}✗ .env no encontrado${NC}"
    echo -e "${YELLOW}Crea un .env con:${NC}"
    echo "  SUPABASE_URL=https://..."
    echo "  SUPABASE_KEY=eyJ..."
    echo "  BACKEND_URL=https://..."
    echo "  ADMIN_DASHBOARD_URL=https://..."
    echo "  WHATSAPP_NUMBER=591..."
    exit 1
fi

echo -e "${GREEN}✓ .env existe${NC}"

if grep -q "SUPABASE_URL" .env; then
    echo -e "${GREEN}✓ SUPABASE_URL configurado${NC}"
fi

if grep -q "SUPABASE_KEY" .env; then
    echo -e "${GREEN}✓ SUPABASE_KEY configurado${NC}"
fi

if grep -q "WHATSAPP_NUMBER" .env; then
    echo -e "${GREEN}✓ WHATSAPP_NUMBER configurado${NC}"
fi

# ============================================================
# FASE 6: GIT COMMIT Y PUSH
# ============================================================

print_phase "FASE 6: COMMITEANDO CAMBIOS A GIT"

echo -e "${YELLOW}Preparando Git...${NC}"

git add -A
check_success "Archivos añadidos a staging"

echo -e "${YELLOW}Archivos a commitear:${NC}"
git status --short
echo ""

git commit -m "chore: migrate from hetzner to fly.io - remove hetzner config, add fly.io setup"
check_success "Commit realizado"

git push origin main
check_success "Push realizado a main"

# ============================================================
# FINAL
# ============================================================

print_phase "✅ LIMPIEZA COMPLETADA"

echo -e "${GREEN}🎉 ¡PROYECTO LISTO PARA FLY.IO!${NC}"
echo ""

echo -e "${YELLOW}Archivos eliminados:${NC}"
echo "  ✓ scripts/deploy-hetzner.sh"
echo "  ✓ scripts/logs-hetzner.sh"
echo "  ✓ docker-compose.yml"
echo ""

echo -e "${YELLOW}Archivos creados/actualizados:${NC}"
echo "  ✓ fly.toml"
echo "  ✓ .gitignore"
echo ""

echo -e "${YELLOW}Próximos pasos:${NC}"
echo ""
echo "1. Ejecuta en Git Bash:"
echo "   flyctl auth login"
echo ""
echo "2. Luego:"
echo "   bash deploy-flyio.sh"
echo ""

echo -e "${GREEN}¡Listo para Fly.io! 🚀${NC}"
