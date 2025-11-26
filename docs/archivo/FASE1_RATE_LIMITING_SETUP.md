# ✅ FASE 1.3: RATE LIMITING CON UPSTASH REDIS - CONFIGURACIÓN

**Fecha**: 2025  
**Tiempo estimado**: 1 hora  
**Estado**: ⚙️ CONFIGURACIÓN REQUERIDA

---

## 📋 RESUMEN

Se ha implementado el sistema de rate limiting usando Upstash Redis. Ahora necesitas crear una cuenta gratuita en Upstash y configurar las variables de entorno.

---

## 🔧 CAMBIOS REALIZADOS

### 1. Paquetes Instalados
- ✅ `@upstash/ratelimit` - Librería de rate limiting
- ✅ `@upstash/redis` - Cliente Redis para Upstash

### 2. Helpers Creados
- ✅ `src/lib/rateLimit.ts` - Rate limiters para app principal
- ✅ `admin-dashboard/src/lib/rateLimit.ts` - Rate limiters para admin

### 3. Endpoints Protegidos
- ✅ `/api/auth/simple-login` - 5 intentos por 15 minutos
- ✅ `/api/webhooks/whatsapp` - 100 requests por 15 minutos
- ✅ `/api/webhooks/baileys` - 100 requests por 15 minutos

---

## 🚀 CONFIGURACIÓN REQUERIDA

### Paso 1: Crear Cuenta en Upstash (5 minutos)

1. Ve a https://upstash.com
2. Crea una cuenta gratuita (con GitHub, Google, o email)
3. Una vez dentro, haz clic en "Create Database"
4. Selecciona "Redis" como tipo
5. Elige la región más cercana a tus usuarios
6. Haz clic en "Create"

### Paso 2: Obtener Credenciales

Después de crear la base de datos:

1. Ve a la página de tu base de datos
2. Haz clic en "REST API" en el menú lateral
3. Copia estos dos valores:
   - **UPSTASH_REDIS_REST_URL** (ejemplo: `https://xxx.upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (ejemplo: `AXxxxxx...`)

### Paso 3: Configurar Variables de Entorno

#### Para la App Principal (`src/`)

Agrega a tu archivo `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx...
```

#### Para Admin Dashboard (`admin-dashboard/`)

Agrega a `admin-dashboard/.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx...
```

**Nota**: Puedes usar la misma base de datos Redis para ambos, o crear una separada.

### Paso 4: Configurar en Vercel (Producción)

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Repite para el proyecto del admin-dashboard si está separado

---

## 📊 LÍMITES CONFIGURADOS

### App Principal

| Endpoint | Límite | Ventana | Propósito |
|----------|--------|---------|-----------|
| Login | 5 intentos | 15 minutos | Prevenir fuerza bruta |
| Webhooks WhatsApp | 100 requests | 15 minutos | Prevenir spam |
| Webhooks Baileys | 100 requests | 15 minutos | Prevenir spam |
| API General | 100 requests | 15 minutos | Protección general |
| Audio Processing | 20 requests | 1 hora | Limitar procesamiento costoso |
| Pagos | 10 requests | 1 hora | Prevenir abuso de pagos |

### Admin Dashboard

| Endpoint | Límite | Ventana | Propósito |
|----------|--------|---------|-----------|
| Login Admin | 5 intentos | 15 minutos | Prevenir fuerza bruta |
| API Admin | 200 requests | 15 minutos | Protección general |

---

## ✅ VERIFICACIÓN

### 1. Verificar Conexión

Después de configurar las variables de entorno, reinicia los servidores:

```bash
# App principal
npm run dev

# Admin dashboard
cd admin-dashboard
npm run dev
```

### 2. Probar Rate Limiting

#### Test de Login (Admin)
1. Intenta hacer login 6 veces seguidas con credenciales incorrectas
2. En el 6to intento deberías recibir:
   ```json
   {
     "success": false,
     "message": "Demasiados intentos de login. Por favor, intenta de nuevo más tarde.",
     "retryAfter": "2025-01-XX..."
   }
   ```
3. Status code: `429 Too Many Requests`
4. Headers incluyen: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

#### Test de Webhook
1. Envía múltiples requests al webhook
2. Después de 100 requests en 15 minutos, deberías recibir `429`

---

## 💰 COSTOS

### Plan Gratuito de Upstash
- ✅ **10,000 requests/día** gratis
- ✅ **256 MB** de almacenamiento
- ✅ **Sin tarjeta de crédito** requerida
- ✅ **Ilimitado** en tiempo

### Escalamiento
- Si superas 10k requests/día: $0.20 por millón de requests adicionales
- Para 100k requests/día: ~$2-5/mes
- Para 1M requests/día: ~$20-50/mes

**Recomendación**: El plan gratis es suficiente para MVP (0-100 usuarios).

---

## 🔍 TROUBLESHOOTING

### Error: "Invalid URL"
- Verifica que `UPSTASH_REDIS_REST_URL` no tenga espacios
- Debe empezar con `https://`

### Error: "Invalid token"
- Verifica que `UPSTASH_REDIS_REST_TOKEN` esté completo
- No debe tener espacios ni saltos de línea

### Rate limiting no funciona
1. Verifica que las variables de entorno estén configuradas
2. Reinicia el servidor después de agregar las variables
3. Revisa los logs del servidor para errores de conexión
4. Verifica que Upstash Redis esté activo en el dashboard

### Rate limiting demasiado estricto
- Puedes ajustar los límites en `src/lib/rateLimit.ts`
- Cambia `slidingWindow(5, '15 m')` a valores más altos si es necesario

---

## 📚 REFERENCIAS

- [Upstash Documentation](https://docs.upstash.com/)
- [Upstash Rate Limiting](https://docs.upstash.com/redis/sdks/ratelimit)
- `src/lib/rateLimit.ts` - Configuración de rate limiters
- `admin-dashboard/src/lib/rateLimit.ts` - Rate limiters para admin

---

## ✅ CHECKLIST

- [ ] Cuenta creada en Upstash
- [ ] Base de datos Redis creada
- [ ] Credenciales obtenidas (URL y TOKEN)
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Variables de entorno configuradas en Vercel (producción)
- [ ] Servidores reiniciados
- [ ] Rate limiting probado (login y webhooks)
- [ ] Documentación revisada

---

## 🎯 PRÓXIMOS PASOS

Después de completar la configuración, continúa con:

1. **1.4 Error Handling Seguro** (1h)
2. **1.5 Validación Inputs con Zod** (2h)

---

**Estado**: ⚙️ Esperando configuración de Upstash

