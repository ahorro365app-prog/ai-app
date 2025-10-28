# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

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

# Instalar dumb-init y git para manejar señales y dependencias
RUN apk add --no-cache dumb-init git

# Copiar package.json
COPY package*.json ./

# Instalar solo dependencias de producción (usar install en lugar de ci)
RUN npm install --only=production

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Crear directorio para sesión de WhatsApp
RUN mkdir -p /app/auth_info

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Cambiar propietario de archivos
RUN chown -R nodejs:nodejs /app

# Usar usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3004

# Usar dumb-init para manejar signals
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio
CMD ["node", "dist/index.js"]
