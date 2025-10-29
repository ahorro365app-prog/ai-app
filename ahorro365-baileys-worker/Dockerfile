# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar git para dependencias que lo necesitan
RUN apk add --no-cache git

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (usar npm install en lugar de ci porque puede no haber lockfile)
RUN npm install

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Instalar dumb-init, git y chromium para WhatsApp
RUN apk add --no-cache dumb-init git chromium chromium-chromedriver nss

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Copiar package.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev --legacy-peer-deps

# Crear directorio para sesión de WhatsApp
RUN mkdir -p /app/auth_info

# Variables de entorno para Puppeteer/Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Cambiar propietario de archivos y dar permisos a Chromium
RUN chown -R nodejs:nodejs /app && \
    chmod 755 /usr/bin/chromium-browser

# Usar usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3004

# Usar dumb-init para manejar signals
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio
CMD ["node", "dist/index.js"]
