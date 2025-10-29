FROM node:18-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git python3 make g++

COPY package*.json ./

RUN npm install

COPY src ./src
COPY tsconfig.json ./

RUN npm run build

# Production stage
FROM node:18-alpine

RUN apk add --no-cache git chromium chromium-chromedriver nss dumb-init

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production || npm install --only=production

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/auth_info

# Variables de entorno para Puppeteer/Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_EXECUTABLE_PATH=/usr/bin/chromium-browser

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["npm", "start"]
