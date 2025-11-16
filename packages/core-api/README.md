# 🚀 Ahorro365 Core API

Backend API dedicado para la app móvil Ahorro365.

## 📋 Descripción

Este es el backend separado que maneja todas las APIs utilizadas por la app móvil. Está completamente separado del admin dashboard para:

- ✅ **Seguridad**: Aislamiento completo entre admin y app móvil
- ✅ **Escalabilidad**: Escalamiento independiente
- ✅ **Mantenibilidad**: Deployments independientes
- ✅ **Observabilidad**: Logs y métricas separadas

## 🏗️ Estructura

```
packages/core-api/
├── src/
│   ├── app/
│   │   └── api/          # Todas las APIs de la app móvil
│   └── services/         # Servicios (Groq, etc.)
├── package.json
├── next.config.js
├── tsconfig.json
└── vercel.json
```

## 🚀 Deployment en Vercel

### 1. Crear Proyecto

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Clic en "Add New Project"
3. Conecta el repositorio `ai-app`
4. Configura:
   - **Root Directory**: `packages/core-api`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install` (desde root del repo)

### 2. Variables de Entorno

Agrega las mismas variables que el proyecto principal:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GROQ_API_KEY` o `GROQ_API_KEY`
- `META_WHATSAPP_TOKEN` (si aplica)
- `WEBHOOK_VERIFY_TOKEN` (si aplica)
- `SENTRY_*` (opcional)

### 3. Deploy

Vercel detectará automáticamente el proyecto y desplegará.

## 🔧 Desarrollo Local

```bash
# Desde la raíz del repo
cd packages/core-api
npm install
npm run dev

# El servidor estará en http://localhost:3002
```

## 📡 APIs Disponibles

- `/api/ping` - Health check
- `/api/ai` - Procesamiento IA
- `/api/audio/process` - Transcripción de audio
- `/api/process-expense` - Procesamiento de gastos
- `/api/webhooks/baileys` - Webhooks Baileys
- `/api/webhooks/whatsapp` - Webhooks Meta WhatsApp
- `/api/whatsapp/*` - APIs de WhatsApp
- `/api/notifications/*` - Sistema de notificaciones
- `/api/payments/*` - Pagos
- `/api/referrals/*` - Referidos
- `/api/csrf-token` - CSRF tokens

## 🔒 Seguridad

- Rate limiting: 60 req/min por IP
- Validación con Zod en todos los endpoints
- Autenticación con Supabase
- CORS restrictivo (solo dominios de la app móvil)

## 📝 Notas

- Este proyecto NO tiene frontend (solo APIs)
- No incluye el admin dashboard
- Usa código compartido de `packages/shared/`

