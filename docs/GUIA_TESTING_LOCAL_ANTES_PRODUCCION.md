# 🧪 Guía: Testing Local Antes de Producción

> **Última actualización:** 2025-11-21 22:00:00  
> **Versión:** 1.0  
> **Componente:** `packages/core-api/`

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Flujo de Desarrollo Local vs Producción](#flujo-de-desarrollo-local-vs-producción)
3. [Testing Local Completo](#testing-local-completo)
4. [Testing de Webhooks Localmente](#testing-de-webhooks-localmente)
5. [Preview Deployments en Vercel](#preview-deployments-en-vercel)
6. [Ambiente de Staging (Opcional)](#ambiente-de-staging-opcional)
7. [Checklist Antes de Deploy](#checklist-antes-de-deploy)
8. [Troubleshooting](#troubleshooting)

---

## 1. Introducción

A diferencia de una app móvil (que se compila en APK), **Next.js/Vercel** tiene un flujo diferente:

- ✅ **Desarrollo Local:** Cambias código → Ejecutas `npm run dev` → Testas inmediatamente
- ✅ **Producción:** Push a Git → Vercel hace build automático → Deploy a producción
- ✅ **Preview Deployments:** Cada PR crea un preview deployment para testear

Esta guía te muestra cómo testear **completamente** en local antes de subir a Vercel.

---

## 2. Flujo de Desarrollo Local vs Producción

### Flujo Típico

```
1. Desarrollo Local
   └─> npm run dev (localhost:3002)
       └─> Haces cambios
       └─> Testas inmediatamente
       └─> Repites hasta que funciona

2. Testing Completo
   └─> ngrok (para webhooks de Meta)
       └─> Configuras webhook de Meta con URL de ngrok
       └─> Testas webhooks reales

3. Git Push
   └─> git add .
   └─> git commit -m "Cambios"
   └─> git push origin main

4. Vercel Deploy Automático
   └─> Vercel detecta push
   └─> Hace build automático
   └─> Deploy a producción (si es main/master)
       O Preview deployment (si es PR/branch)

5. Verificación en Producción
   └─> Testas en producción
   └─> Monitoreas logs
   └─> Si hay problemas → Rollback o fix
```

---

## 3. Testing Local Completo

### 3.1 Configuración Inicial

**1. Verificar variables de entorno:**

```bash
# En packages/core-api/
# Verifica que .env.local existe y tiene todas las variables
cat .env.local
```

**Variables mínimas requeridas:**
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Groq
GROQ_API_KEY=gsk_XWj6THQOUyWeL2evcfq0...

# WhatsApp
WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkAB...
WHATSAPP_PHONE_NUMBER_ID=840593392476984
WHATSAPP_WEBHOOK_VERIFY_TOKEN=7edf98ac...
WHATSAPP_SUPPORT_NUMBER=+59161600190

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXAAQ...

# Cron (para testing local, opcional)
CRON_SECRET=test-cron-secret-local-123

# Sentry (opcional para local)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**2. Iniciar servidor de desarrollo:**

```bash
cd packages/core-api
npm run dev
```

**Salida esperada:**
```
▲ Next.js 15.5.4
- Local:        http://localhost:3002
- Network:      http://192.168.56.1:3002

✓ Starting...
✓ Ready in 4.1s
```

---

### 3.2 Testing de Endpoints Básicos

**1. Test de Health Check:**

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3002/api/ping" -Method GET

# Debe retornar: { "status": "ok" }
```

**2. Test de Endpoint con Validación:**

```bash
# Test de endpoint protegido (debe requerir autenticación)
Invoke-WebRequest -Uri "http://localhost:3002/api/audio/process" -Method POST
```

**3. Test de Cron Job (local):**

```bash
# Sin autenticación (en desarrollo local, opcional)
Invoke-WebRequest -Uri "http://localhost:3002/api/cron/confirm-expired" -Method GET

# Con autenticación (recomendado)
Invoke-WebRequest -Uri "http://localhost:3002/api/cron/confirm-expired" -Method GET -Headers @{"Authorization"="Bearer test-cron-secret-local-123"}
```

---

### 3.3 Testing de Funcionalidades Específicas

#### Testing de Procesamiento de Audio

```bash
# 1. Preparar archivo de audio de prueba
# (usar un audio corto de 10-15 segundos)

# 2. Hacer POST a /api/audio/process
$body = @{
    audio = [System.IO.File]::ReadAllBytes("ruta/al/audio.ogg")
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3002/api/audio/process" -Method POST -Body $body -ContentType "application/json"
```

#### Testing de Procesamiento de Texto

```bash
# Simular mensaje de texto
$body = @{
    text = "Gasté 100 en taxi"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3002/api/process-expense" -Method POST -Body $body -ContentType "application/json"
```

#### Testing de Códigos de Verificación

```bash
# Enviar código de verificación (requiere usuario existente)
$body = @{
    phone = "+59176990076"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3002/api/whatsapp/send-verification-code" -Method POST -Body $body -ContentType "application/json"
```

---

## 4. Testing de Webhooks Localmente

### 4.1 Configurar ngrok

**1. Instalar ngrok:**

Descarga desde: https://ngrok.com/download

**2. Iniciar túnel:**

```bash
ngrok http 3002
```

**Salida esperada:**
```
ngrok                                                                   (Ctrl+C to quit)

Session Status                online
Account                       tu-email@example.com (Plan: Free)
Version                       3.33.0
Region                        South America (sa)
Latency                       89ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.dev -> http://localhost:3002

Connections                   ttl     opn     rt1     rt5     p50     p90
                              1       0       0.00    0.00    8.33    8.33
```

**3. Copiar la URL de ngrok:**

```
https://abc123xyz.ngrok-free.dev
```

**⚠️ IMPORTANTE:** La URL de ngrok cambia cada vez que lo inicias (plan gratuito). Para producción, necesitas URL fija (plan de pago).

---

### 4.2 Configurar Webhook de Meta para Testing Local

**1. Ir a Meta for Developers:**

- Ve a: https://developers.facebook.com/
- Selecciona tu app de WhatsApp Business
- Ve a **WhatsApp > Configuration > Webhooks**

**2. Configurar Webhook:**

- **Callback URL:** `https://abc123xyz.ngrok-free.dev/api/webhooks/whatsapp`
- **Verify Token:** El mismo que `WHATSAPP_WEBHOOK_VERIFY_TOKEN` en `.env.local`
- Haz clic en **"Verify and Save"**

**3. Suscribir a eventos:**

- Selecciona **"messages"**
- Haz clic en **"Subscribe"**

**4. Testar Webhook:**

Ahora puedes enviar mensajes de WhatsApp y deberías verlos en tu servidor local.

**Monitorear logs:**

En tu terminal donde corre `npm run dev`, verás:
```
📨 Mensaje recibido de WhatsApp Cloud API - Tipo: audio, From: 59176...
📱 WhatsApp audio received from user
✅ Usuario encontrado: d70c685f-b22f-4aa2-90d3-494e594cd043
🎤 Transcribiendo audio con Groq Whisper...
```

---

### 4.3 Testing de Webhook GET (Verificación)

**1. Test manual de verificación:**

```bash
# En PowerShell
$verifyToken = "7edf98ac6d544020a4c49b6ff9ed2883ad9464e401ba8658b5ddd860a4ab876"
$challenge = "1234567890"

Invoke-WebRequest -Uri "http://localhost:3002/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=$verifyToken&hub.challenge=$challenge" -Method GET

# Debe retornar: 1234567890 (el challenge)
```

**2. Verificar en Meta Dashboard:**

Meta hace esta llamada automáticamente cuando configuras el webhook. Debes ver un ✅ verde si funciona.

---

### 4.4 Testing de Webhook POST (Mensajes Reales)

**1. Opción 1: Enviar mensaje real desde WhatsApp**

- Envía un mensaje de audio o texto al número de WhatsApp Business
- Meta enviará el webhook a tu URL de ngrok
- Verás el log en tu terminal local

**2. Opción 2: Simular webhook POST (testing)**

```bash
# Simular webhook de Meta (mensaje de texto)
$webhookBody = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            id = "1554733609063961"
            changes = @(
                @{
                    value = @{
                        messaging_product = "whatsapp"
                        metadata = @{
                            display_phone_number = "59160360908"
                            phone_number_id = "840593392476984"
                        }
                        contacts = @(
                            @{
                                profile = @{
                                    name = "Usuario Test"
                                }
                                wa_id = "59176990076"
                            }
                        )
                        messages = @(
                            @{
                                from = "59176990076"
                                id = "wamid.test123"
                                timestamp = [Math]::Floor((Get-Date -UFormat %s))
                                type = "text"
                                text = @{
                                    body = "Gasté 100 en taxi"
                                }
                            }
                        )
                    }
                    field = "messages"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3002/api/webhooks/whatsapp" -Method POST -Body $webhookBody -ContentType "application/json"
```

---

## 5. Preview Deployments en Vercel

### 5.1 ¿Qué son Preview Deployments?

Vercel crea automáticamente un **preview deployment** (URL temporal) para cada:
- Pull Request (PR)
- Branch diferente de `main/master`

Esto te permite testear en un ambiente **similar a producción** sin afectar producción.

---

### 5.2 Flujo con Preview Deployments

```
1. Crear Branch
   └─> git checkout -b feature/nueva-funcionalidad

2. Hacer Cambios
   └─> Editas código
   └─> Commits locales

3. Push Branch
   └─> git push origin feature/nueva-funcionalidad

4. Crear Pull Request
   └─> GitHub/GitLab crea PR

5. Vercel Auto-Deploy
   └─> Vercel detecta PR
   └─> Hace build automático
   └─> Crea preview deployment
   └─> URL: https://core-api-git-feature-nueva-funcionalidad.vercel.app

6. Testear Preview
   └─> Testas en URL de preview
   └─> Si funciona → Merge a main
   └─> Si no funciona → Fix y push (auto-redeploy)
```

---

### 5.3 Configurar Webhook en Preview Deployment

**Problema:** Meta solo puede tener **una URL de webhook** configurada.

**Solución:** Usa diferentes apps de Meta para:
- **Producción:** URL de producción de Vercel
- **Preview/Staging:** URL de ngrok (para testing)

O usa un servicio como **webhook.site** para testing temporal.

---

## 6. Ambiente de Staging (Opcional)

### 6.1 Crear Branch de Staging

**1. Crear branch permanente:**

```bash
git checkout -b staging
git push origin staging
```

**2. Configurar en Vercel:**

- Ve a Vercel Dashboard
- Selecciona tu proyecto
- Ve a **Settings > Git**
- Configura **Production Branch:** `main`
- Configura **Preview Branches:** Incluye `staging`

**3. URL de Staging:**

Vercel creará: `https://core-api-git-staging.vercel.app`

---

### 6.2 Variables de Entorno para Staging

**En Vercel:**

1. Ve a **Settings > Environment Variables**
2. Agrega variables específicas para `staging`:
   - Misma `WHATSAPP_ACCESS_TOKEN` (puede ser diferente para testing)
   - Mismo `SUPABASE_SERVICE_ROLE_KEY`
   - Etc.

**Nota:** Puedes usar diferentes apps de Meta para staging vs producción.

---

### 6.3 Flujo con Staging

```
1. Desarrollo Local
   └─> npm run dev
   └─> Testas localmente

2. Deploy a Staging
   └─> git checkout staging
   └─> git merge feature/nueva-funcionalidad
   └─> git push origin staging
   └─> Vercel auto-deploy a staging

3. Testing en Staging
   └─> Testas en https://core-api-git-staging.vercel.app
   └─> Configuras webhook de Meta con URL de staging (temporal)

4. Deploy a Producción
   └─> Si funciona en staging
   └─> git checkout main
   └─> git merge staging
   └─> git push origin main
   └─> Vercel auto-deploy a producción
```

---

## 7. Checklist Antes de Deploy

### Checklist Pre-Deploy

#### Desarrollo Local
- [ ] ✅ Cambios testeados localmente (`npm run dev`)
- [ ] ✅ Endpoints básicos funcionan
- [ ] ✅ Webhooks funcionan (con ngrok si aplica)
- [ ] ✅ No hay errores en consola
- [ ] ✅ Logs muestran comportamiento esperado

#### Variables de Entorno
- [ ] ✅ Todas las variables están en `.env.local`
- [ ] ✅ Variables configuradas en Vercel (Settings > Environment Variables)
- [ ] ✅ Secrets no están en código (verificado con `grep`)
- [ ] ✅ `.env.local` está en `.gitignore`

#### Código
- [ ] ✅ Linting sin errores (`npm run lint`)
- [ ] ✅ Build exitoso (`npm run build`)
- [ ] ✅ No hay `console.log` de debug (solo `logger`)
- [ ] ✅ No hay `TODO` o `FIXME` críticos

#### Testing
- [ ] ✅ Endpoints críticos testeados
- [ ] ✅ Webhooks testeados (local o preview)
- [ ] ✅ Rate limiting funciona
- [ ] ✅ Error handling funciona correctamente
- [ ] ✅ Security headers aplicados

#### Git
- [ ] ✅ Cambios commiteados
- [ ] ✅ Mensaje de commit descriptivo
- [ ] ✅ Branch actualizado (si es branch diferente de main)

#### Documentación
- [ ] ✅ Cambios documentados (si son significativos)
- [ ] ✅ README actualizado (si aplica)

---

## 8. Troubleshooting

### Problema 1: Webhook de Meta No Funciona en Local

**Síntoma:** Meta no puede verificar el webhook cuando usas ngrok.

**Solución:**
1. Verifica que ngrok está corriendo: `ngrok http 3002`
2. Verifica que el servidor local está corriendo: `npm run dev`
3. Verifica que la URL en Meta es correcta: `https://abc123xyz.ngrok-free.dev/api/webhooks/whatsapp`
4. Verifica que el `WHATSAPP_WEBHOOK_VERIFY_TOKEN` coincide

---

### Problema 2: Variables de Entorno No Funcionan

**Síntoma:** El código no encuentra variables de entorno.

**Solución:**
1. Verifica que `.env.local` existe en `packages/core-api/`
2. Verifica que las variables están escritas correctamente (sin espacios)
3. Reinicia el servidor: `Ctrl+C` y luego `npm run dev`
4. Verifica que no hay `NEXT_PUBLIC_` en variables del servidor (solo frontend)

---

### Problema 3: Rate Limiting No Funciona

**Síntoma:** Rate limiting no bloquea requests.

**Solución:**
1. Verifica que `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` están configurados
2. En desarrollo, rate limiting puede ser permisivo (verifica logs)
3. Verifica que Redis está funcionando: `curl https://xxx.upstash.io/ping`

---

### Problema 4: Build Falla en Vercel pero Funciona Localmente

**Síntoma:** `npm run build` funciona localmente pero falla en Vercel.

**Solución:**
1. Verifica que todas las dependencias están en `package.json`
2. Verifica que no hay código que depende de `.env.local` (solo `.env.production`)
3. Verifica que las variables de entorno están configuradas en Vercel
4. Revisa los logs de build en Vercel Dashboard

---

### Problema 5: Preview Deployment No Se Crea

**Solución:**
1. Verifica que Vercel está conectado a tu repositorio
2. Verifica que el branch tiene commits recientes
3. Verifica que el PR está abierto (no cerrado)
4. Revisa los logs en Vercel Dashboard

---

## 9. Comandos Útiles

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
cd packages/core-api
npm run dev

# Build de producción (para verificar que compila)
npm run build

# Linting
npm run lint

# Ejecutar en modo producción localmente
npm run build
npm run start
```

### Testing de Endpoints

```powershell
# PowerShell - Test básico
Invoke-WebRequest -Uri "http://localhost:3002/api/ping" -Method GET

# PowerShell - Test con body
$body = @{ text = "test" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3002/api/test" -Method POST -Body $body -ContentType "application/json"

# PowerShell - Test con headers
Invoke-WebRequest -Uri "http://localhost:3002/api/test" -Method GET -Headers @{"Authorization"="Bearer token"}
```

### ngrok

```bash
# Iniciar túnel
ngrok http 3002

# Ver requests en tiempo real
# Abre: http://127.0.0.1:4040

# Reiniciar túnel (si cambia la URL)
# Ctrl+C y luego ngrok http 3002 de nuevo
```

---

## 10. Flujo Recomendado para Cambios Importantes

### Para Cambios Menores (Hotfix)

```
1. Desarrollo Local (5 min)
   └─> npm run dev
   └─> Testas cambio
   └─> Commit y push a main
   └─> Vercel auto-deploy (2-3 min)
   └─> Testas en producción
```

### Para Cambios Importantes (Feature)

```
1. Desarrollo Local (1-2 horas)
   └─> npm run dev
   └─> Testas localmente con ngrok
   └─> Verificas logs

2. Preview Deployment (30 min)
   └─> git checkout -b feature/nueva-feature
   └─> git push origin feature/nueva-feature
   └─> Crear PR
   └─> Vercel crea preview deployment
   └─> Testas en preview URL

3. Staging (opcional, 1 hora)
   └─> git checkout staging
   └─> git merge feature/nueva-feature
   └─> git push origin staging
   └─> Testas en staging URL

4. Producción (5 min)
   └─> git checkout main
   └─> git merge feature/nueva-feature
   └─> git push origin main
   └─> Vercel auto-deploy
   └─> Monitoreas logs primera hora
```

---

## 11. Monitoreo Post-Deploy

### Después de Deploy a Producción

**1. Primera hora:**
- ✅ Monitorear logs en Vercel Dashboard
- ✅ Verificar que no hay errores
- ✅ Testar funcionalidad básica

**2. Primera semana:**
- ✅ Monitorear métricas (Sentry, Vercel Analytics)
- ✅ Revisar errores diariamente
- ✅ Testar flujos críticos

**3. Alertas:**
- ✅ Configurar alertas en Sentry
- ✅ Monitorear rate limiting
- ✅ Revisar uso de recursos (Groq API, etc.)

---

## 12. Historial de Cambios

### 2025-11-21 - Guía de Testing Local Creada

**Hora:** 22:00:00  
**Tipo:** `DOCUMENTATION`  
**Descripción:** Guía completa para testear cambios localmente antes de subir a Vercel

**Razón:** Facilitar el proceso de testing y reducir errores en producción.

---

**Documento creado:** 2025-11-21 22:00:00  
**Última actualización:** 2025-11-21 22:00:00  
**Versión:** 1.0

