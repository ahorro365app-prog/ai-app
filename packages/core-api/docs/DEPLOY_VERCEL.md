# 🚀 Guía de Despliegue de Core API en Vercel

**Fecha**: 2025-01-20  
**Revisado por**: Auto (AI Assistant)

---

## 📋 Prerequisitos

1. **Cuenta de Vercel** con acceso al proyecto
2. **Repositorio de GitHub** conectado a Vercel
3. **Variables de entorno** configuradas en Vercel (ver sección siguiente)

---

## 🔐 Variables de Entorno Requeridas en Vercel

Configura estas variables en el dashboard de Vercel (`Settings > Environment Variables`):

### ✅ **Supabase (Críticas)**

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### ✅ **WhatsApp Cloud API (Críticas)**

```
WHATSAPP_ACCESS_TOKEN=EAA...tu_token_de_acceso
WHATSAPP_PHONE_NUMBER_ID=796240860248587
WHATSAPP_BUSINESS_ACCOUNT_ID=766200063108245
WHATSAPP_WEBHOOK_VERIFY_TOKEN=7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876
WHATSAPP_API_VERSION=v22.0
```

**Nota**: El `WHATSAPP_ACCESS_TOKEN` expira periódicamente. Debes renovarlo desde Meta Business Suite.

### ✅ **Groq API (Crítica para procesamiento de audio y LLM)**

```
GROQ_API_KEY=tu_groq_api_key_aqui
```

O alternativamente:

```
NEXT_PUBLIC_GROQ_API_KEY=tu_groq_api_key_aqui
```

### ✅ **Upstash Redis (Opcional pero Recomendado para Rate Limiting)**

```
UPSTASH_REDIS_REST_URL=https://tu-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu_redis_token_aqui
```

**Nota**: Si no configuras Redis, el rate limiting funcionará en modo "fail-open" en producción (menos seguro).

### ✅ **Sentry (Opcional para Monitoreo)**

```
SENTRY_ORG=tu_org
SENTRY_PROJECT=tu_proyecto
SENTRY_DSN=https://tu_dsn@sentry.io/proyecto
```

### ✅ **Node Environment**

```
NODE_ENV=production
```

---

## 🔧 Configuración de Vercel

### 1. **Framework Preset**

- **Framework**: Next.js
- **Build Command**: `npm run build` (ya configurado en `vercel.json`)
- **Output Directory**: `.next` (automático para Next.js)
- **Install Command**: `npm install`

### 2. **Root Directory**

Si el proyecto está en un monorepo, configura:
- **Root Directory**: `packages/core-api`

### 3. **Environment Variables**

Asegúrate de configurar todas las variables de entorno listadas arriba para:
- ✅ **Production**
- ✅ **Preview** (opcional, para testing)
- ✅ **Development** (opcional, para desarrollo local)

### 4. **Function Timeout**

Los webhooks de WhatsApp pueden tardar en procesar (especialmente con audio). El `vercel.json` ya está configurado con:

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

Esto permite hasta **10 segundos** de ejecución para las funciones API.

### 5. **Región**

El `vercel.json` está configurado para usar la región `iad1` (US East). Puedes cambiarla según tus necesidades:

```json
{
  "regions": ["iad1"]
}
```

Opciones disponibles:
- `iad1` - US East (Virginia)
- `sfo1` - US West (San Francisco)
- `hnd1` - Asia Pacific (Tokyo)
- `syd1` - Asia Pacific (Sydney)
- `fra1` - Europe (Frankfurt)
- `cdg1` - Europe (Paris)

---

## 🔗 Configuración del Webhook de WhatsApp

Una vez desplegado, configura el webhook en Meta Business Suite:

### 1. **URL del Webhook**

```
https://tu-proyecto-core-api.vercel.app/api/webhooks/whatsapp
```

### 2. **Verify Token**

Usa el mismo valor que configuraste en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`:
```
7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876
```

### 3. **Eventos a Suscribir**

Asegúrate de suscribirte a estos eventos en Meta Business Suite:
- ✅ `messages`
- ✅ `message_status`

### 4. **Verificación**

Meta enviará un GET request a tu webhook para verificar. El endpoint `/api/webhooks/whatsapp` maneja esto automáticamente.

---

## 🧪 Testing Post-Deploy

### 1. **Verificar el Webhook**

Envía un mensaje de prueba desde WhatsApp a tu número de negocio. Deberías ver logs en Vercel indicando que el webhook fue recibido.

### 2. **Verificar Logs**

En el dashboard de Vercel, ve a `Deployments > [último deployment] > Functions` y revisa los logs de:
- `/api/webhooks/whatsapp`
- `/api/webhooks/whatsapp/confirm`

### 3. **Verificar Transacciones**

Envía un mensaje de transacción (ej: "gasté 50 en comida") y verifica que:
- Se crea una predicción en Supabase
- Se envía un mensaje de confirmación
- Al confirmar, se crea la transacción

---

## 🐛 Troubleshooting

### ❌ **Error: "Webhook verification failed"**

**Causa**: El `WHATSAPP_WEBHOOK_VERIFY_TOKEN` no coincide.

**Solución**: 
1. Verifica que el token en Vercel sea exactamente el mismo que configuraste en Meta Business Suite
2. Asegúrate de que no haya espacios en blanco al inicio o final

### ❌ **Error: "Function timeout"**

**Causa**: El procesamiento de audio o LLM está tardando más de 10 segundos.

**Solución**:
1. Aumenta el `maxDuration` en `vercel.json` a 30 segundos (máximo permitido)
2. Optimiza el procesamiento de audio o usa un servicio externo

### ❌ **Error: "CORS policy blocked"**

**Causa**: El middleware está bloqueando requests de Meta.

**Solución**: El middleware ya está configurado para permitir webhooks de Meta (no requieren origin). Si persiste, verifica que el middleware no esté bloqueando requests sin origin.

### ❌ **Error: "Rate limit exceeded"**

**Causa**: Upstash Redis no está configurado o está fallando.

**Solución**:
1. Configura `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en Vercel
2. Verifica que Upstash Redis esté activo y accesible

### ❌ **Error: "Supabase connection failed"**

**Causa**: Variables de entorno de Supabase incorrectas o faltantes.

**Solución**:
1. Verifica que `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas
2. Asegúrate de que las keys sean válidas y no hayan expirado

---

## 📝 Notas Importantes

1. **Tokens de WhatsApp**: El `WHATSAPP_ACCESS_TOKEN` expira periódicamente. Debes renovarlo desde Meta Business Suite y actualizarlo en Vercel.

2. **Rate Limiting**: Sin Upstash Redis, el rate limiting funcionará en modo "fail-open" en producción, lo cual es menos seguro pero permite que la aplicación funcione.

3. **Logs**: Los logs de Vercel son útiles para debugging, pero ten cuidado de no exponer información sensible (tokens, keys, etc.).

4. **CORS**: El middleware está configurado para permitir requests desde la app móvil y el admin panel. Los webhooks de Meta no requieren CORS ya que vienen directamente del servidor.

5. **Monorepo**: Si estás usando un monorepo, asegúrate de configurar el "Root Directory" en Vercel a `packages/core-api`.

---

## ✅ Checklist Pre-Deploy

- [ ] Todas las variables de entorno están configuradas en Vercel
- [ ] El `vercel.json` está correctamente configurado
- [ ] El `next.config.js` tiene la configuración correcta
- [ ] El middleware permite webhooks de Meta (sin origin)
- [ ] El repositorio está conectado a Vercel
- [ ] El webhook está configurado en Meta Business Suite con la URL correcta
- [ ] El `WHATSAPP_WEBHOOK_VERIFY_TOKEN` coincide en Vercel y Meta

---

## 🚀 Deploy

Una vez completado el checklist:

1. **Push a GitHub**: Los cambios se desplegarán automáticamente si tienes CI/CD configurado
2. **O Deploy Manual**: Ve a Vercel Dashboard > Deployments > Deploy

Después del deploy, verifica que:
- ✅ El build fue exitoso
- ✅ Las funciones están disponibles
- ✅ El webhook responde correctamente a Meta

---

**Última actualización**: 2025-01-20

