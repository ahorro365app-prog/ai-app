#!/bin/bash
set -e

HETZNER_HOST="${HETZNER_HOST:-your_hetzner_ip}"
HETZNER_USER="root"
HETZNER_PORT="22"
REMOTE_PATH="/root/ahorro365-baileys"

[ "$HETZNER_HOST" != "your_hetzner_ip" ] || (echo "✗ Configura HETZNER_HOST" && exit 1)

rsync -avz --delete \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.env.railway.backup \
  --exclude=logs \
  --exclude=auth_info \
  -e "ssh -p $HETZNER_PORT" \
  ./ $HETZNER_USER@$HETZNER_HOST:$REMOTE_PATH/

ssh -p $HETZNER_PORT $HETZNER_USER@$HETZNER_HOST << 'REMOTE'
cd /root/ahorro365-baileys

apt-get update && apt-get upgrade -y

# Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

# Instalar docker-compose si no está instalado
if ! command -v docker-compose &> /dev/null; then
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

mkdir -p auth_info logs

docker-compose down 2>/dev/null || true

docker-compose build --no-cache

docker-compose up -d

echo "✅ Deploy completado"
REMOTE

