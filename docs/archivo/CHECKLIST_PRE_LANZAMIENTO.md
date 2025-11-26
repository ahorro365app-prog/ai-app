# ✅ CHECKLIST PRE-LANZAMIENTO

## 📅 Fecha: 2025-11-17

---

## 🔍 1. VERIFICACIÓN DE DESARROLLO (localhost:3000)

### Estado Actual
- ✅ `next.config.js` configurado correctamente
  - `output: 'export'` solo en producción
  - `distDir: '.next-dev'` en desarrollo
  - Las APIs deberían funcionar en desarrollo

### Verificación Requerida
- [ ] Ejecutar `npm run dev` y verificar que inicia correctamente
- [ ] Verificar que `http://localhost:3000` carga la app
- [ ] Verificar que las APIs responden en `http://localhost:3000/api/*`
- [ ] Probar login/signup en localhost
- [ ] Verificar que el dashboard carga correctamente

---

## 🔒 2. REVISIÓN DE SEGURIDAD

### 2.1 Autenticación y Autorización
- [ ] ✅ Supabase Auth implementado (verificado)
- [ ] ✅ Headers `x-user-id` NO se usan sin validación (verificar)
- [ ] ✅ Session timeout configurado
- [ ] ✅ Rate limiting en login (5 intentos/15 min)
- [ ] ⚠️ Verificar RLS policies en Supabase

### 2.2 Rate Limiting
**Endpoints con Rate Limiting:**
- ✅ `/api/webhooks/whatsapp` - 100 req/15min
- ✅ `/api/webhooks/baileys` - 100 req/15min
- ✅ `/api/audio/process` - 20 req/hora
- ✅ `/api/notifications/send` - Rate limiting implementado
- ⚠️ Verificar otros endpoints críticos

**Endpoints que necesitan Rate Limiting:**
- [ ] `/api/payments/create` - Verificar si tiene rate limiting
- [ ] `/api/whatsapp/*` - Verificar rate limiting
- [ ] `/api/referrals/*` - Verificar rate limiting
- [ ] Otros endpoints de modificación

### 2.3 CSRF Protection
**Endpoints con CSRF:**
- ✅ `/api/payments/create`
- ✅ `/api/audio/process`
- ✅ `/api/feedback/confirm`
- ✅ `/api/payments/upload-receipt`
- ⚠️ Verificar otros endpoints POST/PUT/DELETE

### 2.4 Validación de Inputs (Zod)
**Endpoints con Validación Zod:**
- ✅ `/api/audio/process`
- ✅ `/api/referrals/activate-smart`
- ✅ `/api/whatsapp/verify-code`
- ✅ `/api/whatsapp/send-verification-code`
- ✅ `/api/feedback/confirm`
- ✅ `/api/notifications/preferences`
- ✅ `/api/payments/create`
- ✅ `/api/process-expense`
- ⚠️ Verificar que TODOS los endpoints tengan validación

### 2.5 Security Headers
- [ ] Verificar que `src/lib/securityHeaders.ts` existe
- [ ] Verificar que se aplican en producción
- [ ] CSP headers configurados
- [ ] X-Frame-Options configurado
- [ ] X-Content-Type-Options configurado

---

## 🌐 3. CONFIGURACIÓN DE ENTORNO

### Variables de Entorno Requeridas
- [ ] `NEXT_PUBLIC_API_URL` - URL del core-api
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - URL de Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role (solo backend)
- [ ] `UPSTASH_REDIS_REST_URL` - Para rate limiting
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Para rate limiting
- [ ] `SENTRY_*` - Si se usa Sentry
- [ ] `FIREBASE_SERVICE_ACCOUNT` - Si se usa Firebase
- [ ] `META_WHATSAPP_TOKEN` - Si se usa WhatsApp
- [ ] `WEBHOOK_VERIFY_TOKEN` - Para webhooks

### Verificación
- [ ] Todas las variables configuradas en `.env.local`
- [ ] Variables configuradas en Vercel (producción)
- [ ] `.env.local` en `.gitignore`
- [ ] No hay secrets en código

---

## 📱 4. CONFIGURACIÓN DE CAPACITOR

### Verificación
- [ ] `capacitor.config.ts` configurado correctamente
- [ ] `webDir: 'out'` configurado
- [ ] `server.url` NO configurado (carga desde archivos locales)
- [ ] APIs apuntan a servidor remoto
- [ ] Permisos configurados (micrófono, etc.)

---

## 🧪 5. TESTING

### Funcionalidad Básica
- [ ] Login funciona
- [ ] Signup funciona
- [ ] Dashboard carga
- [ ] Navegación entre páginas funciona
- [ ] APIs responden correctamente
- [ ] No hay errores en consola

### Seguridad
- [ ] Rate limiting funciona (probar con múltiples requests)
- [ ] CSRF protection funciona
- [ ] Validación de inputs funciona
- [ ] Errores no exponen información sensible

---

## 📝 6. CAMBIOS EN LA APP

**Pendiente de especificar por el usuario:**
- [ ] Cambio 1: ________________
- [ ] Cambio 2: ________________
- [ ] Cambio 3: ________________

---

## 🚀 7. PREPARACIÓN PARA LANZAMIENTO

### Build y Deploy
- [ ] Build de producción exitoso (`npm run build`)
- [ ] APK compilada y probada
- [ ] Deploy en Vercel verificado
- [ ] Core-API deployado y funcionando

### Monitoreo
- [ ] Sentry configurado (si se usa)
- [ ] Logs configurados
- [ ] Alertas configuradas

---

## ⚠️ ACCIONES PENDIENTES

1. **Verificar localhost:3000** - Ejecutar `npm run dev` y probar
2. **Revisar seguridad** - Completar checklist de seguridad
3. **Especificar cambios** - El usuario debe indicar qué cambios quiere hacer
4. **Testing final** - Probar todas las funcionalidades

---

## 📋 NOTAS

- La configuración de `next.config.js` está correcta para desarrollo
- Las APIs están separadas en `packages/core-api/`
- El renderizado directo está implementado para todas las páginas principales
- Rate limiting y CSRF están implementados en varios endpoints

