# ✅ Checklist de Despliegue en Vercel - Core API

**Fecha**: 2025-01-20  
**Proyecto**: Core API - WhatsApp Webhooks

---

## 📋 Pasos para Completar el Despliegue

### 1. **Conectar Repositorio en Vercel**

- [ ] Ir a [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click en "Add New Project"
- [ ] Seleccionar el repositorio `ai-app`
- [ ] Configurar:
  - **Project Name**: `ahorro365-core-api` (IMPORTANTE: usar este nombre exacto)
  - **Framework Preset**: Next.js
  - **Root Directory**: `packages/core-api`
  - **Build Command**: `npm run build` (ya configurado en `vercel.json`)
  - **Output Directory**: `.next` (automático)

### 2. **Configurar Variables de Entorno**

Ir a `Settings > Environment Variables` y agregar:

#### ✅ Supabase (Críticas)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

#### ✅ WhatsApp Cloud API (Críticas)
- [ ] `WHATSAPP_ACCESS_TOKEN` (renovar periódicamente)
- [ ] `WHATSAPP_PHONE_NUMBER_ID` = `796240860248587`
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` = `766200063108245`
- [ ] `WHATSAPP_WEBHOOK_VERIFY_TOKEN` = `7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876`
- [ ] `WHATSAPP_API_VERSION` = `v22.0`

#### ✅ Groq API (Crítica)
- [ ] `GROQ_API_KEY`

#### ✅ Upstash Redis (Recomendado)
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

#### ✅ Opcionales
- [ ] `SENTRY_ORG` (si usas Sentry)
- [ ] `SENTRY_PROJECT` (si usas Sentry)
- [ ] `SENTRY_DSN` (si usas Sentry)
- [ ] `NODE_ENV` = `production`

**Importante**: Marca todas las variables para **Production**, **Preview** y **Development**.

### 3. **Configurar el Webhook en Meta Business Suite**

Una vez desplegado, obtener la URL del webhook desde Vercel:

- [ ] URL del webhook: `https://ahorro365-core-api.vercel.app/api/webhooks/whatsapp`
- [ ] Ir a [Meta Business Suite](https://business.facebook.com/)
- [ ] Navegar a: **WhatsApp > Configuración > Configuración de API**
- [ ] Click en "Editar" en la sección "Webhook"
- [ ] Configurar:
  - **URL de devolución de llamada**: `https://ahorro365-core-api.vercel.app/api/webhooks/whatsapp`
  - **Token de verificación**: `7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876`
- [ ] Click en "Verificar y guardar"
- [ ] Suscribirse a eventos:
  - [ ] `messages`
  - [ ] `message_status`

### 4. **Verificar el Despliegue**

- [ ] El build en Vercel fue exitoso
- [ ] Las funciones están disponibles en `/api/webhooks/whatsapp`
- [ ] El webhook responde correctamente a Meta (verificación exitosa)

### 5. **Testing Post-Deploy**

- [ ] Enviar un mensaje de prueba desde WhatsApp
- [ ] Verificar logs en Vercel (`Deployments > [último] > Functions`)
- [ ] Verificar que se crea una predicción en Supabase
- [ ] Verificar que se envía un mensaje de confirmación
- [ ] Confirmar una transacción y verificar que se crea en Supabase

---

## 🔗 URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Meta Business Suite**: https://business.facebook.com/
- **Documentación Completa**: Ver `docs/DEPLOY_VERCEL.md`

---

## ⚠️ Notas Importantes

1. **WHATSAPP_ACCESS_TOKEN**: Expira periódicamente. Renovar desde Meta Business Suite y actualizar en Vercel.

2. **Rate Limiting**: Sin Upstash Redis, el rate limiting funcionará en modo "fail-open" (menos seguro).

3. **Timeout**: Los webhooks tienen 10 segundos de timeout. Si necesitas más tiempo, edita `vercel.json` y aumenta `maxDuration` (máximo 30 segundos).

4. **CORS**: El middleware ya está configurado para permitir webhooks de Meta (no requieren origin).

---

## 🐛 Troubleshooting

Si algo falla, revisa:
- ✅ Variables de entorno están configuradas correctamente
- ✅ El webhook está configurado en Meta con la URL correcta
- ✅ El `WHATSAPP_WEBHOOK_VERIFY_TOKEN` coincide en Vercel y Meta
- ✅ Los logs en Vercel para ver errores específicos

---

**Última actualización**: 2025-01-20

