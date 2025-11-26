# ✅ CHECKLISTS - DOCUMENTO MAESTRO

**Última actualización**: 2025-01-17 16:30:00 UTC  
**Versión**: 1.0  
**Este es el documento oficial y único de referencia para checklists**

> ⚠️ **IMPORTANTE**: Este es el único documento de checklists que debes consultar. Los demás documentos están obsoletos o son históricos.

---

## 📋 REGLAS DE USO Y ACTUALIZACIÓN

### 🔴 REGLAS OBLIGATORIAS

1. **SIEMPRE actualizar fecha y hora** al completar un checklist
2. **SIEMPRE marcar items completados** con `[x]`
3. **SIEMPRE documentar problemas encontrados** en `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md`
4. **NO modificar este documento** sin seguir estas reglas

---

## 📊 ÍNDICE DE CHECKLISTS

### 1. 🚀 Pre-Lanzamiento
### 2. 🔍 Post-Incidente
### 3. 🔒 Seguridad (Referencia)

---

## 1. 🚀 CHECKLIST PRE-LANZAMIENTO

### 1.1 Verificación de Desarrollo (localhost:3000)

- [ ] Ejecutar `npm run dev` y verificar que inicia correctamente
- [ ] Verificar que `http://localhost:3000` carga la app
- [ ] Verificar que las APIs responden en `http://localhost:3000/api/*`
- [ ] Probar login/signup en localhost
- [ ] Verificar que el dashboard carga correctamente
- [ ] Verificar que no hay errores en consola del navegador

### 1.2 Revisión de Seguridad

#### Autenticación y Autorización
- [ ] Supabase Auth implementado y funcionando
- [ ] Headers `x-user-id` NO se usan sin validación
- [ ] Session timeout configurado
- [ ] Rate limiting en login (5 intentos/15 min)
- [ ] Verificar RLS policies en Supabase Dashboard

#### Rate Limiting
**Endpoints con Rate Limiting:**
- [ ] `/api/webhooks/whatsapp` - 100 req/15min
- [ ] `/api/webhooks/baileys` - 100 req/15min
- [ ] `/api/audio/process` - 20 req/hora
- [ ] `/api/notifications/send` - Rate limiting implementado
- [ ] `/api/payments/create` - Verificar rate limiting
- [ ] Otros endpoints críticos

#### CSRF Protection
**Endpoints con CSRF:**
- [ ] `/api/payments/create`
- [ ] `/api/audio/process`
- [ ] `/api/feedback/confirm`
- [ ] `/api/payments/upload-receipt`
- [ ] Otros endpoints POST/PUT/DELETE

#### Validación de Inputs (Zod)
**Endpoints con Validación Zod:**
- [ ] `/api/audio/process`
- [ ] `/api/referrals/activate-smart`
- [ ] `/api/whatsapp/verify-code`
- [ ] `/api/feedback/confirm`
- [ ] `/api/payments/create`
- [ ] Verificar que TODOS los endpoints tengan validación

#### Security Headers
- [ ] Verificar que `src/lib/securityHeaders.ts` existe
- [ ] Verificar que se aplican en producción
- [ ] CSP headers configurados
- [ ] X-Frame-Options configurado
- [ ] X-Content-Type-Options configurado

**Referencia completa**: Ver `SEGURIDAD_ESTADO_ACTUAL.md`

### 1.3 Configuración de Entorno

#### Variables de Entorno Requeridas
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

#### Verificación
- [ ] Todas las variables configuradas en `.env.local`
- [ ] Variables configuradas en Vercel (producción)
- [ ] `.env.local` en `.gitignore`
- [ ] No hay secrets en código

**Referencia completa**: Ver `GUÍAS_CONFIGURACION_ESTADO_ACTUAL.md` - Sección Variables de Entorno

### 1.4 Configuración de Capacitor

- [ ] `capacitor.config.ts` configurado correctamente
- [ ] `webDir: 'out'` configurado
- [ ] `server.url` NO configurado (carga desde archivos locales)
- [ ] APIs apuntan a servidor remoto
- [ ] Permisos configurados (micrófono, etc.)

### 1.5 Testing

#### Funcionalidad Básica
- [ ] Login funciona
- [ ] Signup funciona
- [ ] Dashboard carga
- [ ] Navegación entre páginas funciona
- [ ] APIs responden correctamente
- [ ] No hay errores en consola

#### Seguridad
- [ ] Rate limiting funciona (probar con múltiples requests)
- [ ] CSRF protection funciona
- [ ] Validación de inputs funciona
- [ ] Errores no exponen información sensible

#### Performance
- [ ] Tiempo de carga razonable (< 3 segundos)
- [ ] No hay errores 500
- [ ] No hay errores 404 en recursos estáticos

### 1.6 Preparación para Lanzamiento

#### Build y Deploy
- [ ] Build de producción exitoso (`npm run build`)
- [ ] APK compilada y probada
- [ ] Deploy en Vercel verificado
- [ ] Core-API deployado y funcionando

#### Monitoreo
- [ ] Sentry configurado (si se usa)
- [ ] Logs configurados
- [ ] Alertas configuradas

**Referencia completa**: Ver `DEPLOYMENT_ESTADO_ACTUAL.md`

---

## 2. 🔍 CHECKLIST POST-INCIDENTE

### 2.1 Verificar que el Incidente se Resolvió

#### Vercel Status
- [ ] Ir a: https://www.vercel-status.com/
- [ ] Debe decir "Resolved" o "All Systems Operational"
- [ ] Dashboard de Vercel: Banner naranja desapareció
- [ ] Otros deployments deberían empezar a funcionar

#### Railway Status (si aplica)
- [ ] Verificar status de Railway
- [ ] Verificar que los servicios están operativos

### 2.2 Verificar Deployment

#### Core API
- [ ] Ve a proyecto `ahorro365-core-api` en Vercel
- [ ] Pestaña "Deployments"
- [ ] Estado debe cambiar de "Queued" a "Building" a "Ready" (verde)
- [ ] Si NO inicia automáticamente:
  - [ ] Clic en los 3 puntos del deployment en cola
  - [ ] Seleccionar "Redeploy"
  - [ ] O hacer clic en "Deploy" (botón grande)

#### App Principal
- [ ] Verificar deployment de app principal
- [ ] Estado debe ser "Ready" (verde)
- [ ] Si hay errores, revisar logs

#### Admin Panel
- [ ] Verificar deployment de admin panel
- [ ] Estado debe ser "Ready" (verde)
- [ ] Si hay errores, revisar logs

### 2.3 Verificar que Funciona

#### Test de Endpoints
- [ ] Probar endpoint de ping:
  ```bash
  curl https://ahorro365-core-api.vercel.app/api/ping
  ```
- [ ] Debe retornar JSON con `{"ok": true, ...}`

#### Test de App
- [ ] Abrir URL de la app en navegador
- [ ] Verificar que carga correctamente
- [ ] Probar login/signup
- [ ] Verificar que las APIs responden

### 2.4 Actualizar Configuración (si es necesario)

#### Capacitor Config
- [ ] Actualizar `capacitor.config.ts` si la URL cambió
- [ ] Cambiar URL a: `https://ahorro365-core-api.vercel.app`
- [ ] O el dominio que Vercel asigne

#### Re-compilar APK (si es necesario)
- [ ] `npm run build:android`
- [ ] O usar GitHub Actions
- [ ] Probar APK compilada

#### Variables de Entorno
- [ ] Verificar que todas las variables están en Vercel
- [ ] Especialmente: `NEXT_PUBLIC_GROQ_API_KEY` (completa)
- [ ] Verificar que no hay variables faltantes

### 2.5 Monitoreo Post-Incidente

#### Primera Hora
- [ ] Revisar logs cada 15 minutos
- [ ] Verificar que no hay errores nuevos
- [ ] Probar funcionalidades críticas

#### Primera Semana
- [ ] Revisar logs diariamente
- [ ] Verificar métricas de Sentry (si está configurado)
- [ ] Ajustar si es necesario

### 2.6 Si Sigue Sin Funcionar

#### Opciones
- [ ] Esperar 10 minutos más (a veces hay delays)
- [ ] Redeploy manual:
  - [ ] Cancelar deployment en cola
  - [ ] Deploy nuevo
- [ ] Alternativa Railway:
  - [ ] Si Vercel sigue con problemas
  - [ ] Usar Railway como backup

#### Documentar Problema
- [ ] Documentar en `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md`
- [ ] Incluir: fecha, hora, descripción, solución intentada

---

## 3. 🔒 CHECKLIST DE SEGURIDAD (Referencia)

**Nota**: Este checklist es una referencia rápida. Para el checklist completo, ver `SEGURIDAD_ESTADO_ACTUAL.md`.

### Items Críticos
- [ ] Rate Limiting implementado en endpoints críticos
- [ ] CSRF Protection implementado
- [ ] Validación de inputs con Zod
- [ ] Security Headers configurados
- [ ] Error handling seguro (no expone detalles)
- [ ] RLS policies verificadas en Supabase

**Referencia completa**: Ver `SEGURIDAD_ESTADO_ACTUAL.md` - Sección Checklist Pre-Lanzamiento

---

## 🔄 HISTORIAL DE CAMBIOS

### 2025-01-17 16:30:00 UTC - Versión 1.0
**Autor**: Sistema de consolidación  
**Cambios**:
- ✅ Consolidación completa de checklists
- ✅ Agregadas reglas de uso y actualización
- ✅ Organizados por tipo (Pre-Lanzamiento, Post-Incidente, Seguridad)
- ✅ Referencias a documentos maestros relacionados
- ✅ Historial de cambios implementado

**Componentes afectados**: Todos (documentación)

---

## 📝 NOTAS IMPORTANTES

1. **Este es el único documento oficial** de checklists
2. **Los demás documentos** están obsoletos o son históricos
3. **Siempre marcar items completados** con `[x]`
4. **Siempre documentar problemas** en `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md`
5. **Referencias a otros documentos maestros** para información detallada

---

**Última actualización**: 2025-01-17 16:30:00 UTC  
**Próxima revisión programada**: 2025-02-17

