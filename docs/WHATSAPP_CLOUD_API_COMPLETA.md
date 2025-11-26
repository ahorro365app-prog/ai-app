# 📱 WhatsApp Cloud API - Documentación Completa

> **Versión:** 1.0  
> **Última actualización:** 2025-11-21  
> **Estado:** ✅ Producción

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Configuración](#configuración)
3. [Arquitectura](#arquitectura)
4. [Funciones Implementadas](#funciones-implementadas)
5. [Endpoints](#endpoints)
6. [Flujos de Trabajo](#flujos-de-trabajo)
7. [Reglas y Validaciones](#reglas-y-validaciones)
8. [Base de Datos](#base-de-datos)
9. [Cron Jobs](#cron-jobs)
10. [Mensajes](#mensajes)
11. [Historial de Cambios](#historial-de-cambios)
12. [Troubleshooting](#troubleshooting)

---

## 1. Introducción

Este documento describe completamente la implementación de **WhatsApp Cloud API** en el proyecto Ahorro365. El sistema permite recibir mensajes de usuarios, procesar transacciones de audio y texto, confirmar transacciones, y enviar notificaciones automáticas.

### 1.1 Migración desde Baileys

El sistema fue migrado desde un worker basado en **Baileys** a **WhatsApp Cloud API** para:
- ✅ Mayor estabilidad y confiabilidad
- ✅ Mejor escalabilidad
- ✅ Sin necesidad de mantener sesión activa
- ✅ Integración oficial con Meta

### 1.2 Funcionalidades Principales

- 📥 **Recepción de mensajes** (audio y texto)
- 🎤 **Transcripción de audio** (Groq Whisper)
- 🤖 **Extracción de datos** (Groq LLM)
- ✅ **Confirmación de transacciones**
- ⏰ **Auto-guardado** después de 30 minutos
- 📊 **Límites diarios** por plan de suscripción
- 🔐 **Códigos de verificación**
- 👋 **Mensajes de invitación** para usuarios no registrados

---

## 2. Configuración

### 2.1 Variables de Entorno

Todas las variables deben estar configuradas en `.env.local` (desarrollo) y **Vercel** (producción):

```env
# WhatsApp Cloud API - REQUERIDAS
WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkAB...  # Token de acceso de Meta (longitud ~300 caracteres)
WHATSAPP_PHONE_NUMBER_ID=840593392476984  # ID del número de teléfono de WhatsApp Business
WHATSAPP_API_VERSION=v24.0                # Versión de la API (actualmente v24.0)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=7edf98ac... # Token para verificación de webhook (Meta Dashboard)
WHATSAPP_SUPPORT_NUMBER=+59161600190      # Número de soporte para invitaciones

# Cron Jobs - REQUERIDA para producción
CRON_SECRET=tu-secreto-cron-super-seguro  # Secreto para autenticar cron jobs

# Supabase - REQUERIDAS
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # Key de service_role (longitud ~219 caracteres)

# Groq - REQUERIDAS
GROQ_API_KEY=gsk_XWj6THQOUyWeL2evcfq0...  # API Key de Groq (longitud ~56 caracteres)
```

### 2.2 Obtención de Credenciales

#### WhatsApp Access Token

1. Ir a [Meta for Developers](https://developers.facebook.com/)
2. Seleccionar tu app de WhatsApp Business
3. Ir a **Tools & Settings > Graph API Explorer**
4. Generar token con permisos:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. **⚠️ IMPORTANTE:** El token expira. Renovarlo cuando sea necesario.

#### Phone Number ID

1. Meta Dashboard > Tu App > WhatsApp > **API Setup**
2. Copiar el **Phone Number ID** (ejemplo: `840593392476984`)

#### Webhook Verify Token

1. Crear un token seguro (puede ser cualquier string)
2. Configurarlo en **Meta Dashboard > Webhooks**
3. **⚠️ CRÍTICO:** Debe ser el mismo en Meta Dashboard y en `.env.local`

### 2.3 Configuración en Vercel

El archivo `vercel.json` contiene:

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "crons": [
    {
      "path": "/api/cron/confirm-expired",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Cron Job:** Se ejecuta cada **5 minutos** para auto-guardar transacciones expiradas.

---

## 3. Arquitectura

### 3.1 Estructura de Archivos

```
packages/core-api/src/
├── app/api/
│   ├── webhooks/whatsapp/
│   │   ├── route.ts              # Webhook principal (GET/POST)
│   │   └── confirm/route.ts      # Endpoint de confirmación
│   ├── cron/
│   │   └── confirm-expired/route.ts  # Cron job auto-guardado
│   └── whatsapp/
│       └── send-verification-code/route.ts  # Envío de códigos
├── lib/
│   ├── whatsappCloudApi.ts       # Servicio de envío de mensajes
│   ├── construirPreview.ts       # Construcción de previews
│   ├── planLimits.ts             # Validación de límites
│   ├── parseConfirmation.ts      # Parser de confirmaciones
│   └── whatsapp-deduplication-endpoint.ts  # Deduplicación
└── services/
    ├── groqWhisperService.ts     # Transcripción de audio
    └── groqService.ts            # Extracción de datos
```

### 3.2 Flujo General

```
Usuario envía mensaje (WhatsApp)
    ↓
Meta envía webhook POST a /api/webhooks/whatsapp
    ↓
Verificar duplicado (wa_message_id)
    ↓
Buscar usuario en BD
    ↓
Procesar mensaje:
  - Audio → Descargar → Transcribir (Groq Whisper)
  - Texto → Usar directamente
    ↓
Extraer datos (Groq LLM)
    ↓
Validar límites diarios
    ↓
Guardar predicción en BD
    ↓
Crear confirmación pendiente (si requiere confirmación)
    ↓
Enviar preview por WhatsApp
    ↓
Usuario confirma o expira (30 min)
    ↓
Auto-guardar (cron job) o crear transacción (confirmación)
```

---

## 4. Funciones Implementadas

### 4.1 `sendWhatsAppMessage()`

**Ubicación:** `packages/core-api/src/lib/whatsappCloudApi.ts`

**Descripción:** Función central para enviar mensajes de texto por WhatsApp Cloud API.

**Parámetros:**
- `to: string` - Número de teléfono (formato: `59176990076` o `+59176990076`)
- `message: string` - Texto del mensaje a enviar

**Retorna:**
```typescript
{
  success: boolean;
  message_id?: string;  // ID del mensaje si fue exitoso
  error?: string;       // Mensaje de error si falló
}
```

**Funcionamiento:**
1. Valida que `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` estén configurados
2. Normaliza el número de teléfono (remueve `+` si existe)
3. Hace POST a `https://graph.facebook.com/v24.0/{PHONE_NUMBER_ID}/messages`
4. Retorna resultado con `message_id` si fue exitoso

**Uso:**
```typescript
import { sendWhatsAppMessage } from '@/lib/whatsappCloudApi';

const result = await sendWhatsAppMessage('59176990076', 'Hola! 👋');
if (result.success) {
  console.log('Mensaje enviado:', result.message_id);
}
```

**Reglas:**
- ✅ Normaliza números automáticamente
- ✅ Maneja errores de Meta API
- ✅ No expone números de teléfono en logs (seguridad)

---

### 4.2 `processConfirmation()`

**Ubicación:** `packages/core-api/src/app/api/webhooks/whatsapp/confirm/route.ts`

**Descripción:** Procesa confirmaciones de usuarios (sí/ok/perfecto/está bien).

**Parámetros:**
- `phone_number: string` - Número de teléfono del usuario
- `message: string` - Mensaje de confirmación
- `prediction_id?: string` - ID de predicción específica (opcional)

**Retorna:**
```typescript
{
  success: boolean;
  message?: string;
  confirmado?: boolean;
  auto_enabled?: boolean;  // Si se activó auto-guardado
  accuracy?: number;       // Precisión calculada
  error?: string;
}
```

**Funcionamiento:**
1. Normaliza número de teléfono
2. Busca usuario en BD
3. Parse del mensaje para detectar confirmación
4. Busca predicción pendiente más reciente (o por `prediction_id`)
5. Actualiza `predicciones_groq.confirmado = true`
6. Crea transacciones en BD (preserva `original_timestamp`)
7. Marca `pending_confirmations.confirmed = true`
8. Recalcula `weightedAccuracy` en `feedback_confirmation_config`
9. Auto-activa `require_confirmation = false` si `weightedAccuracy >= 0.9`

**Reglas:**
- ✅ Preserva timestamp original del mensaje
- ✅ Maneja transacciones múltiples (agrupadas por `parent_message_id`)
- ✅ Recalcula precisión con pesos según origen (whatsapp_reaction > app_edit > timeout)
- ✅ Auto-activa si precisión >= 90%

---

### 4.3 `processTranscription()`

**Ubicación:** `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (función interna)

**Descripción:** Procesa transcripciones (audio o texto) y extrae datos de transacciones.

**Parámetros:**
- `transcription: string` - Texto transcrito o mensaje de texto
- `phoneNumber: string` - Número normalizado
- `rawPhoneNumber: string` - Número original
- `wa_message_id: string` - ID del mensaje de WhatsApp
- `user: any` - Objeto de usuario de BD
- `supabase: any` - Cliente Supabase
- `startTime: number` - Timestamp de inicio (para logs)
- `messageType: 'audio' | 'text'` - Tipo de mensaje

**Funcionamiento:**
1. Valida límites básicos (puede crear al menos 1 transacción?)
2. Llama a `groqService.processTranscriptionMultiple()` para extraer datos
3. Guarda predicciones en `predicciones_groq` con deduplicación
4. Valida límites diarios después de Groq
5. Crea confirmaciones pendientes si `require_confirmation = true`
6. Construye preview (simple o múltiple)
7. Envía preview por WhatsApp
8. Retorna respuesta JSON

**Reglas:**
- ✅ Deduplicación por `wa_message_id`
- ✅ Validación de límites antes y después de Groq
- ✅ Soporte para múltiples transacciones en un mensaje
- ✅ Timeout de 30 minutos para confirmación

---

### 4.4 `checkDuplicateWhatsAppMessage()`

**Ubicación:** `packages/core-api/src/lib/whatsapp-deduplication-endpoint.ts`

**Descripción:** Verifica si un mensaje ya fue procesado previamente.

**Parámetros:**
- `wa_message_id: string` - ID del mensaje de WhatsApp

**Retorna:**
- `null` si no existe duplicado
- Objeto con `id`, `created_at`, etc. si existe duplicado

**Funcionamiento:**
1. Busca en `predicciones_groq` por `wa_message_id`
2. Si encuentra, retorna la predicción existente
3. Si no encuentra, retorna `null`

**Reglas:**
- ✅ Evita procesar mensajes duplicados (ahorro de recursos Groq)
- ✅ Se ejecuta ANTES de llamar a Groq

---

### 4.5 `construirPreviewSimple()` y `construirPreviewMultiple()`

**Ubicación:** `packages/core-api/src/lib/construirPreview.ts`

**Descripción:** Construye mensajes de preview para transacciones.

**Parámetros:**
- `expenseData: GroqTransaction | null` - Datos de transacción simple
- `transactions: GroqTransaction[]` - Array de transacciones múltiples
- `processedType: string` - Tipo procesado ('AUDIO' o 'TEXTO')
- `previousPendingCount: number` - Cantidad de confirmaciones pendientes anteriores

**Retorna:** `string` - Mensaje formateado para WhatsApp

**Ejemplo de Preview Simple:**
```
✅ *TEXTO PROCESADO*
📉 *GASTO*
*Monto (BOB):* 400
*Método de Pago:* efectivo
*Categoría:* hogar
*Descripción:* televisión

*¿Está bien?*
✅ *Responde:* sí / ok / perfecto / está bien
⏰ Sin confirmación se guarda automáticamente en 30 minutos
📱 (Tienes 48h para editarla o eliminarla en la app)
```

**Ejemplo de Preview Múltiple:**
```
✅ *3 TEXTOS PROCESADOS*

1) 📉 *GASTO*
   *Monto:* 50 BOB
   *Categoría:* transporte
   *Descripción:* taxi
   💳 efectivo

2) 📉 *GASTO*
   *Monto:* 30 BOB
   *Categoría:* comida
   *Descripción:* pan
   💳 efectivo

3) 📈 *INGRESO*
   *Monto:* +350 BOB
   *Categoría:* otros
   *Descripción:* cardio plus
   💳 efectivo

*¿Están bien estas 3?*
✅ *Responde:* sí / ok / perfecto / está bien
⏰ Sin confirmación se guardan automáticamente en 30 minutos
📱 (Puedes editarlas o eliminarlas en 48h en la app)
```

**Reglas:**
- ✅ Usa emojis 📉 para GASTO y 📈 para INGRESO
- ✅ Muestra signo `+` solo en INGRESOS
- ✅ Incluye instrucciones de confirmación
- ✅ Menciona tiempo de expiración (30 min)

---

### 4.6 `validateCanCreateTransaction()` y `validateTransactionLimitForMultiple()`

**Ubicación:** `packages/core-api/src/lib/planLimits.ts`

**Descripción:** Valida límites diarios de transacciones según plan de suscripción.

**Planes y Límites:**
- `free`: 5 transacciones/día
- `smart`: 10 transacciones/día
- `pro`: 20 transacciones/día
- `caducado`: 0 transacciones/día

**Funcionamiento:**
1. Obtiene plan del usuario desde BD
2. Obtiene límites según plan
3. Cuenta transacciones del día actual
4. Compara con límite máximo
5. Retorna validación con mensaje apropiado

**Reglas:**
- ✅ Solo cuenta transacciones **confirmadas/guardadas** (no pendientes)
- ✅ Si no puede guardar todas las transacciones de un mensaje múltiple, **no guarda ninguna**
- ✅ Informa cuántas transacciones puede guardar aún

---

## 5. Endpoints

### 5.1 `GET /api/webhooks/whatsapp`

**Descripción:** Verificación de webhook por Meta (durante configuración inicial).

**Parámetros Query:**
- `hub.mode` - Debe ser `"subscribe"`
- `hub.verify_token` - Debe coincidir con `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `hub.challenge` - Token que debe retornarse

**Respuesta:**
- Si `verify_token` coincide: retorna `hub.challenge` (status 200)
- Si no coincide: retorna error (status 403)

**Uso:**
Meta llama este endpoint automáticamente al configurar el webhook en el dashboard.

---

### 5.2 `POST /api/webhooks/whatsapp`

**Descripción:** Webhook principal que recibe mensajes de usuarios.

**Body:** Webhook payload de Meta (formato JSON)

**Flujo:**
1. Valida estructura del webhook
2. Extrae mensaje (audio o texto)
3. Verifica duplicado
4. Busca usuario
5. Procesa mensaje (audio → transcribir, texto → usar directamente)
6. Extrae datos con Groq
7. Valida límites
8. Guarda predicción
9. Crea confirmación pendiente
10. Envía preview
11. Retorna respuesta JSON

**Tipos de Mensaje Soportados:**
- ✅ `audio` - Mensajes de voz
- ✅ `text` - Mensajes de texto

**Respuesta:**
```json
{
  "success": true,
  "cached": false,
  "prediction_id": "uuid",
  "transactions_created": 1,
  "preview_message": "...",
  "pending_confirmations": 1
}
```

**Reglas:**
- ✅ Rate limiting habilitado (ver `@/lib/rateLimit`)
- ✅ Deduplicación automática
- ✅ Si usuario no está registrado: envía mensaje de invitación (rate limited)

---

### 5.3 `POST /api/webhooks/whatsapp/confirm`

**Descripción:** Endpoint para procesar confirmaciones de usuarios.

**Body:**
```json
{
  "phone_number": "59176990076",
  "message": "sí",
  "prediction_id": "uuid" // opcional
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Transacción confirmada",
  "confirmado": true,
  "auto_enabled": false,
  "accuracy": 0.85
}
```

**Funcionamiento:**
Llama a `processConfirmation()` internamente.

---

### 5.4 `GET /api/cron/confirm-expired`

**Descripción:** Cron job que auto-guarda transacciones expiradas (30 minutos).

**Autenticación:**
- Header: `Authorization: Bearer {CRON_SECRET}`
- En desarrollo: Autenticación opcional si no viene header

**Funcionamiento:**
1. Busca confirmaciones pendientes con `expires_at < NOW()`
2. Para cada expiración:
   - Actualiza `predicciones_groq.confirmado = true`, `confirmado_por = 'timeout'`
   - Crea transacción en BD (preserva `original_timestamp`)
   - Marca `pending_confirmations.confirmed = true`
3. Agrupa por usuario
4. Envía notificación WhatsApp a cada usuario

**Notificación por Usuario:**
- **1 transacción:** Muestra detalles completos
- **Múltiples:** Muestra cantidad total

**Programación:**
- Vercel: Cada 5 minutos (`*/5 * * * *`)
- Configurado en `vercel.json`

---

### 5.5 `POST /api/whatsapp/send-verification-code`

**Descripción:** Genera y envía código de verificación de 6 dígitos por WhatsApp.

**Body:**
```json
{
  "phone": "+59176990076",
  "isPhoneChange": false,  // opcional
  "userId": "uuid"         // opcional (solo para cambio de teléfono)
}
```

**Funcionamiento:**
1. Valida que usuario existe
2. Genera código de 6 dígitos
3. Guarda en `codigos_verificacion` (expira en 10 minutos)
4. Envía código por WhatsApp usando `sendWhatsAppMessage()`

**Mensaje Enviado:**
```
🔐 Tu código de verificación de Ahorro365 es: *123456*

Este código expira en 10 minutos.
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Código de verificación generado",
  "expiresIn": 600
}
```

**Reglas:**
- ✅ No retorna el código por seguridad
- ✅ Expira en 10 minutos
- ✅ Si falla el envío, no falla la petición (código ya está guardado)

---

## 6. Flujos de Trabajo

### 6.1 Flujo: Mensaje de Audio

```
1. Usuario envía audio por WhatsApp
2. Meta envía webhook POST a /api/webhooks/whatsapp
3. Sistema verifica duplicado (wa_message_id)
4. Sistema busca usuario en BD
5. Sistema descarga audio de Meta (2 pasos):
   a. GET https://graph.facebook.com/v24.0/{audio_id}
   b. GET {media_url} desde respuesta anterior
6. Sistema transcribe audio con Groq Whisper
7. Sistema extrae datos con Groq LLM
8. Sistema valida límites diarios
9. Sistema guarda predicción en BD
10. Sistema crea confirmación pendiente (30 min)
11. Sistema envía preview por WhatsApp
12. Usuario confirma o expira (30 min)
13. Sistema guarda transacción
```

### 6.2 Flujo: Mensaje de Texto

```
1. Usuario envía texto por WhatsApp
2. Meta envía webhook POST a /api/webhooks/whatsapp
3. Sistema verifica si es confirmación (sí/ok/perfecto/está bien)
   - Si es confirmación → llama processConfirmation()
   - Si NO es confirmación → continúa
4. Sistema verifica duplicado
5. Sistema busca usuario
6. Sistema usa texto directamente (sin transcripción)
7. Sistema extrae datos con Groq LLM
8. Sistema valida límites diarios
9. Sistema guarda predicción
10. Sistema crea confirmación pendiente (30 min)
11. Sistema envía preview por WhatsApp
12. Usuario confirma o expira (30 min)
13. Sistema guarda transacción
```

### 6.3 Flujo: Confirmación de Usuario

```
1. Usuario responde "sí" / "ok" / "perfecto" / "está bien"
2. Meta envía webhook POST a /api/webhooks/whatsapp
3. Sistema detecta que es confirmación
4. Sistema llama processConfirmation()
5. Sistema busca predicción pendiente más reciente
6. Sistema actualiza predicciones_groq.confirmado = true
7. Sistema crea transacción(es) en BD
8. Sistema marca pending_confirmations.confirmed = true
9. Sistema recalcula weightedAccuracy
10. Sistema auto-activa si accuracy >= 0.9
11. Sistema envía mensaje de confirmación exitosa
```

### 6.4 Flujo: Auto-Guardado (Timeout)

```
1. Usuario NO confirma en 30 minutos
2. Cron job ejecuta GET /api/cron/confirm-expired (cada 5 min)
3. Sistema busca confirmaciones con expires_at < NOW()
4. Sistema actualiza predicciones_groq:
   - confirmado = true
   - confirmado_por = 'timeout'
5. Sistema crea transacción(es) en BD
6. Sistema marca pending_confirmations.confirmed = true
7. Sistema agrupa por usuario
8. Sistema envía notificación WhatsApp a cada usuario
```

### 6.5 Flujo: Usuario No Registrado

```
1. Usuario envía mensaje (audio o texto)
2. Sistema busca usuario en BD
3. Sistema NO encuentra usuario
4. Sistema verifica rate limit (debe_enviar_mensaje_invitacion)
   - Si ya envió en últimas 24h → ignora mensaje
   - Si NO ha enviado → continúa
5. Sistema envía mensaje de invitación:
   "*¡Hola!* 👋
   Aún no tienes una cuenta en *Ahorro365* 💜
   Este número se usa solo para registrar transacciones ✍️
   Para obtener la app, escríbenos aquí:
   📲 +59161600190
   🎁 Al enviarte la app, recibirás *14 días GRATIS* para probar todas las funciones."
6. Sistema registra invitación (registrar_mensaje_invitacion)
7. Sistema retorna error sin procesar mensaje (ahorro de recursos)
```

---

## 7. Reglas y Validaciones

### 7.1 Deduplicación

**Regla:** Un mensaje con el mismo `wa_message_id` solo se procesa **una vez**.

**Implementación:**
1. Verificación temprana antes de procesar (en `/api/webhooks/whatsapp`)
2. Verificación en `processTranscription()` (por si acaso)
3. Guardado en `predicciones_groq` con `wa_message_id` único

**Ventajas:**
- ✅ Evita procesar mensajes duplicados (ahorro de recursos Groq)
- ✅ Evita crear transacciones duplicadas

---

### 7.2 Límites Diarios

**Regla:** Usuarios tienen límite de transacciones diarias según su plan.

**Planes:**
- `free`: 5/día
- `smart`: 10/día
- `pro`: 20/día
- `caducado`: 0/día

**Validación:**
- ✅ **ANTES de Groq:** Valida que puede crear al menos 1 transacción
- ✅ **DESPUÉS de Groq:** Valida que puede guardar todas las transacciones del mensaje

**Comportamiento:**
- Si puede guardar **todas** → crea confirmación pendiente
- Si puede guardar **algunas** (mensaje múltiple) → **no guarda ninguna**, informa al usuario
- Si **no puede guardar ninguna** → informa límite alcanzado

**Mensajes:**
- Límite alcanzado: `🚨 Has alcanzado el límite de *20 transacciones diarias.* Puedes crear más transacciones mañana o actualizar a un plan superior. 💜`
- Límite parcial: `⚠️ *Límite parcial*\n\nYa has realizado 18 transacciones hoy. Solo puedes guardar 2 más.\n\nPor favor, envía un nuevo mensaje con solo 2 transacción(es) (o menos).`

---

### 7.3 Confirmación de Transacciones

**Regla:** Transacciones requieren confirmación si `require_confirmation = true` (configuración por país).

**Timeout:** 30 minutos

**Comportamiento:**
- Si usuario confirma → guarda inmediatamente, recalcula precisión
- Si NO confirma → auto-guarda después de 30 minutos (cron job)

**Palabras de Confirmación:**
- `sí`, `ok`, `perfecto`, `está bien` (case-insensitive, sin acentos)

---

### 7.4 Precisión y Auto-Activación

**Regla:** Si `weightedAccuracy >= 0.9` (90%), se auto-activa `require_confirmation = false`.

**Pesos según Origen:**
- `whatsapp_reaction`: 1.0 (confirmación explícita)
- `app_edit`: 0.7 (usuario editó en app)
- `timeout`: 0.5 (auto-guardado)

**Cálculo:**
```typescript
weightedAccuracy = (
  (whatsapp_reaction_count * 1.0 + 
   app_edit_count * 0.7 + 
   timeout_count * 0.5) / 
  total_count
)
```

**Tabla:** `feedback_confirmation_config`
- `country_code`: código del país (ej: 'BOL')
- `require_confirmation`: boolean
- `weighted_accuracy`: número (0-1)

---

### 7.5 Rate Limiting

**Regla:** Mensajes de invitación tienen rate limiting (1 vez cada 24 horas).

**Implementación:**
- RPC de Supabase: `debe_enviar_mensaje_invitacion(telefono_param)`
- Retorna `true` si puede enviar, `false` si ya envió en últimas 24h
- RPC de Supabase: `registrar_mensaje_invitacion(telefono_param)`

**Tabla:** `invitaciones_no_registrados`
- `telefono`: número de teléfono
- `fecha_envio`: timestamp
- `mensaje_enviado`: texto del mensaje

---

### 7.6 Clasificación de Transacciones (GASTO vs INGRESO)

**Regla:** Transacciones se clasifican automáticamente según palabras clave.

**GASTO (por defecto):**
- Todos los textos que NO mencionen recibir dinero
- Ejemplos: "30 de taxi", "20 de pan", "compré 400"

**INGRESO:**
- Menciones explícitas de recibir dinero
- Palabras clave: "me pagaron", "gané", "vendí", "cobré", "recibí"
- Ejemplo: "me pagaron 350 de cardio plus"

**Implementación:** Prompt de Groq LLM con ejemplos específicos.

---

### 7.7 Normalización de Números de Teléfono

**Regla:** Todos los números se normalizan (remover `+` si existe).

**Implementación:**
- `sendWhatsAppMessage()`: remueve `+` automáticamente
- Búsqueda en BD: busca con y sin `+` usando `.or()`
- Meta API: requiere números sin `+`

**Ejemplo:**
- Usuario envía: `+59176990076`
- Sistema busca: `59176990076` y `+59176990076` en BD
- Sistema envía: `59176990076` a Meta

---

## 8. Base de Datos

### 8.1 Tablas Principales

#### `predicciones_groq`
Almacena predicciones de Groq antes de confirmación.

**Campos relevantes:**
- `id`: UUID
- `usuario_id`: UUID (FK a usuarios)
- `transcripcion`: TEXT
- `resultado`: JSONB (datos extraídos)
- `confirmado`: BOOLEAN
- `confirmado_por`: TEXT ('whatsapp_reaction', 'app_edit', 'timeout')
- `wa_message_id`: TEXT (único, para deduplicación)
- `parent_message_id`: TEXT (para agrupar transacciones múltiples)
- `original_timestamp`: TIMESTAMP (preserva fecha/hora del mensaje)
- `created_at`: TIMESTAMP

**Índices:**
- `wa_message_id` (único)
- `parent_message_id`

---

#### `pending_confirmations`
Almacena confirmaciones pendientes con timeout.

**Campos relevantes:**
- `id`: UUID
- `prediction_id`: UUID (FK a predicciones_groq)
- `usuario_id`: UUID
- `wa_message_id`: TEXT
- `parent_message_id`: TEXT (para agrupar múltiples)
- `expires_at`: TIMESTAMP (30 minutos después de creación)
- `confirmed`: BOOLEAN
- `created_at`: TIMESTAMP

**Índices:**
- `parent_message_id`
- `expires_at`

---

#### `transacciones`
Almacena transacciones confirmadas/guardadas.

**Campos relevantes:**
- `id`: UUID
- `usuario_id`: UUID
- `tipo`: TEXT ('gasto' o 'ingreso')
- `monto`: NUMERIC
- `categoria`: TEXT
- `descripcion`: TEXT
- `fecha`: TIMESTAMP (usa `original_timestamp` de predicción)
- `created_at`: TIMESTAMP

---

#### `feedback_confirmation_config`
Configuración de confirmación por país.

**Campos relevantes:**
- `country_code`: TEXT (ej: 'BOL')
- `require_confirmation`: BOOLEAN
- `weighted_accuracy`: NUMERIC (0-1)
- `is_auto_enabled`: BOOLEAN

---

#### `feedback_usuarios`
Feedback de usuarios sobre transacciones.

**Campos relevantes:**
- `prediction_id`: UUID
- `usuario_id`: UUID
- `origen`: TEXT ('whatsapp_reaction', 'app_edit', 'timeout')
- `confiabilidad`: NUMERIC (0-1)

---

#### `codigos_verificacion`
Códigos de verificación de 6 dígitos.

**Campos relevantes:**
- `id`: UUID
- `telefono`: TEXT
- `codigo`: TEXT (6 dígitos)
- `usado`: BOOLEAN
- `expira_en`: TIMESTAMP (10 minutos)
- `fecha_creacion`: TIMESTAMP

---

#### `invitaciones_no_registrados`
Registro de invitaciones enviadas a usuarios no registrados.

**Campos relevantes:**
- `telefono`: TEXT
- `fecha_envio`: TIMESTAMP
- `mensaje_enviado`: TEXT

---

### 8.2 Funciones RPC de Supabase

#### `debe_enviar_mensaje_invitacion(telefono_param)`
Verifica si se puede enviar mensaje de invitación (rate limiting).

**Retorna:** `BOOLEAN`
- `true`: Puede enviar (no ha enviado en últimas 24h)
- `false`: No puede enviar (ya envió en últimas 24h)

---

#### `registrar_mensaje_invitacion(telefono_param)`
Registra que se envió mensaje de invitación.

**Retorna:** `void`

---

## 9. Cron Jobs

### 9.1 Auto-Guardado de Transacciones Expiradas

**Endpoint:** `GET /api/cron/confirm-expired`

**Programación:** Cada 5 minutos (`*/5 * * * *`)

**Configuración:** `vercel.json`

**Funcionamiento:**
1. Busca `pending_confirmations` con:
   - `expires_at < NOW()`
   - `confirmed = NULL` o `confirmed = false`
2. Para cada confirmación expirada:
   - Actualiza `predicciones_groq.confirmado = true`, `confirmado_por = 'timeout'`
   - Crea `transacciones` (preserva `original_timestamp`)
   - Marca `pending_confirmations.confirmed = true`
3. Agrupa por usuario
4. Envía notificación WhatsApp a cada usuario

**Notificación:**
- **1 transacción:**
  ```
  ✅ Transacción guardada automáticamente

  *Monto:* 400 BOB
  *Categoría:* hogar
  *Descripción:* televisión

  📱 Puedes editarla o eliminarla en la app en las próximas 48h
  ```

- **Múltiples:**
  ```
  ✅ 3 transacciones guardadas automáticamente

  📱 Puedes editarlas o eliminarlas en la app en las próximas 48h
  ```

**Autenticación:**
- Producción: Header `Authorization: Bearer {CRON_SECRET}`
- Desarrollo: Opcional (permite sin header si `NODE_ENV === 'development'`)

---

## 10. Mensajes

### 10.1 Preview de Transacción Simple

```
✅ *{TIPO} PROCESADO*
{EMOJI} *{TIPO_TRANSACCION}*
*Monto ({MONEDA}):* {MONTO}
*Método de Pago:* {METODO}
*Categoría:* {CATEGORIA}
*Descripción:* {DESCRIPCION}

*¿Está bien?*
✅ *Responde:* sí / ok / perfecto / está bien
⏰ Sin confirmación se guarda automáticamente en 30 minutos
📱 (Tienes 48h para editarla o eliminarla en la app)
```

**Emojis:**
- GASTO: 📉
- INGRESO: 📈

---

### 10.2 Preview de Transacciones Múltiples

```
✅ *{N} {TIPOS} PROCESADOS*

1) {EMOJI} *{TIPO}*
   *Monto:* {SIGNO}{MONTO} {MONEDA}
   *Categoría:* {CATEGORIA}
   *Descripción:* {DESCRIPCION}
   💳 {METODO}

2) {EMOJI} *{TIPO}*
   ...

{ADVERTENCIA_PENDIENTES}

*¿Están bien estas {N}?*
✅ *Responde:* sí / ok / perfecto / está bien
⏰ Sin confirmación se guardan automáticamente en 30 minutos
📱 (Puedes editarlas o eliminarlas en 48h en la app)
```

**Advertencia de Pendientes:**
```
⚠️ Tienes {TOTAL} transacciones pendientes ({ANTERIORES} anteriores + {NUEVAS} nuevas)
```

---

### 10.3 Mensaje de Invitación (Usuario No Registrado)

```
*¡Hola!* 👋
Aún no tienes una cuenta en *Ahorro365* 💜
Este número se usa solo para registrar transacciones ✍️
Para obtener la app, escríbenos aquí:
📲 {WHATSAPP_SUPPORT_NUMBER}
🎁 Al enviarte la app, recibirás *14 días GRATIS* para probar todas las funciones.
```

---

### 10.4 Mensaje de Límite Alcanzado

```
🚨 Has alcanzado el límite de *{LIMITE} transacciones diarias.* Puedes crear más transacciones mañana o actualizar a un plan superior. 💜
```

---

### 10.5 Mensaje de Límite Parcial

```
⚠️ *Límite parcial*

Ya has realizado {ACTUAL} transacciones hoy. Solo puedes guardar {RESTANTES} más.

Por favor, envía un nuevo mensaje con solo {RESTANTES} transacción(es) (o menos).

Ejemplo: 'Gasté 50 en taxi'
```

---

### 10.6 Código de Verificación

```
🔐 Tu código de verificación de Ahorro365 es: *{CODIGO}*

Este código expira en 10 minutos.
```

---

## 11. Historial de Cambios

### 11.1 Estructura del Historial

Cada cambio debe incluir:
- **Fecha y hora:** `YYYY-MM-DD HH:MM:SS`
- **Autor:** Nombre o iniciales
- **Tipo:** `FEATURE`, `FIX`, `IMPROVEMENT`, `REFACTOR`, `CONFIG`
- **Descripción:** Breve descripción del cambio
- **Archivos modificados:** Lista de archivos
- **Razón:** Por qué se hizo el cambio

---

### 11.2 Registro de Cambios

#### 2025-11-21 - Implementación Completa de WhatsApp Cloud API

**Hora:** 14:30:00  
**Tipo:** `FEATURE`  
**Descripción:** Migración completa desde Baileys a WhatsApp Cloud API

**Cambios:**
- ✅ Webhook principal implementado (`/api/webhooks/whatsapp`)
- ✅ Procesamiento de mensajes de audio y texto
- ✅ Sistema de confirmación de transacciones
- ✅ Cron job de auto-guardado (30 minutos)
- ✅ Validación de límites diarios
- ✅ Mensajes de invitación para usuarios no registrados
- ✅ Códigos de verificación por WhatsApp

**Archivos:**
- `packages/core-api/src/app/api/webhooks/whatsapp/route.ts`
- `packages/core-api/src/lib/whatsappCloudApi.ts`
- `packages/core-api/src/app/api/webhooks/whatsapp/confirm/route.ts`
- `packages/core-api/src/app/api/cron/confirm-expired/route.ts`
- `packages/core-api/src/app/api/whatsapp/send-verification-code/route.ts`

**Razón:** Migración desde Baileys para mayor estabilidad y escalabilidad.

---

#### 2025-11-21 - Timeout de Confirmación Ajustado a 30 Minutos

**Hora:** 15:45:00  
**Tipo:** `CONFIG`  
**Descripción:** Cambio de timeout de 2 minutos (pruebas) a 30 minutos (producción)

**Cambios:**
- `expiresAt.setMinutes(expiresAt.getMinutes() + 2)` → `+ 30`
- Eliminados comentarios temporales "TEMPORAL PARA PRUEBAS"
- Actualizados logs para mostrar "30 min"

**Archivos:**
- `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (líneas ~674 y ~711)

**Razón:** Restaurar timeout de producción después de pruebas.

---

#### 2025-11-21 - Mensaje de Invitación Mejorado

**Hora:** 16:20:00  
**Tipo:** `IMPROVEMENT`  
**Descripción:** Mejora del mensaje de invitación para usuarios no registrados

**Cambios:**
- Eliminado enlace `wa.me/...`
- Agregado número de soporte directo
- Mensaje más compacto (eliminadas líneas vacías)
- Texto actualizado: "Para obtener la app" en lugar de "Para registrarte o pedir la app"

**Archivos:**
- `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (líneas ~274-285)

**Razón:** Mejorar experiencia de usuario y simplificar mensaje.

---

#### 2025-11-21 - Integración de Códigos de Verificación con WhatsApp

**Hora:** 17:00:00  
**Tipo:** `FEATURE`  
**Descripción:** Integración del envío de códigos de verificación por WhatsApp Cloud API

**Cambios:**
- Integrado `sendWhatsAppMessage()` en endpoint de envío de códigos
- Eliminado código antiguo de Baileys Worker (TODO)
- Mensaje formateado con código de 6 dígitos

**Archivos:**
- `packages/core-api/src/app/api/whatsapp/send-verification-code/route.ts`

**Razón:** Completar funcionalidad de códigos de verificación con WhatsApp Cloud API.

---

#### 2025-11-21 - Clasificación Mejorada de Transacciones (GASTO vs INGRESO)

**Hora:** 18:30:00  
**Tipo:** `IMPROVEMENT`  
**Descripción:** Mejora del prompt de Groq para clasificar correctamente GASTO vs INGRESO

**Cambios:**
- Regla explícita: "Todo lo que NO mencione recibir dinero es GASTO"
- Palabras clave para INGRESO: "me pagaron", "gané", "vendí", "cobré", "recibí"
- Ejemplos agregados al prompt

**Archivos:**
- `packages/core-api/src/services/groqService.ts` (función `processTranscriptionMultiple`)

**Razón:** Corregir clasificación incorrecta de transacciones (ej: "10 de zanahoria" marcado como INGRESO).

---

#### 2025-11-21 - Preview Messages Mejorados

**Hora:** 19:00:00  
**Tipo:** `IMPROVEMENT`  
**Descripción:** Mejora de previews para mostrar GASTO/INGRESO con emojis

**Cambios:**
- 📉 *GASTO* en lugar de "Tipo de transacción: gasto"
- 📈 *INGRESO* en lugar de "Tipo de transacción: ingreso"
- Mensaje de edición/eliminación actualizado: "editarla o eliminarla" / "editarlas o eliminarlas"

**Archivos:**
- `packages/core-api/src/lib/construirPreview.ts` (`construirPreviewSimple` y `construirPreviewMultiple`)

**Razón:** Hacer previews más visuales y claros para el usuario.

---

#### 2025-11-21 - Límites Diarios de Transacciones

**Hora:** 20:00:00  
**Tipo:** `FEATURE`  
**Descripción:** Implementación de límites diarios según plan de suscripción

**Cambios:**
- Validación antes y después de Groq
- Planes: `free` (5), `smart` (10), `pro` (20), `caducado` (0)
- Mensajes informativos para límite alcanzado y límite parcial
- Regla: Si no puede guardar todas las transacciones de un mensaje múltiple, no guarda ninguna

**Archivos:**
- `packages/core-api/src/lib/planLimits.ts`
- `packages/core-api/src/app/api/webhooks/whatsapp/route.ts`

**Razón:** Implementar límites por plan de suscripción.

---

#### 2025-11-21 - Notificaciones de Auto-Guardado

**Hora:** 20:30:00  
**Tipo:** `FEATURE`  
**Descripción:** Agregado de notificaciones WhatsApp cuando transacciones se auto-guardan

**Cambios:**
- Agrupación por usuario en cron job
- Mensaje de notificación para 1 transacción (con detalles)
- Mensaje de notificación para múltiples (solo cantidad)

**Archivos:**
- `packages/core-api/src/app/api/cron/confirm-expired/route.ts`

**Razón:** Informar a usuarios cuando sus transacciones se auto-guardan.

---

## 12. Troubleshooting

### 12.1 Error: "Failed to download audio from Meta: 401 Unauthorized"

**Causa:** `WHATSAPP_ACCESS_TOKEN` expirado o inválido.

**Solución:**
1. Ir a Meta for Developers > Graph API Explorer
2. Generar nuevo token con permisos:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
3. Actualizar `.env.local` y Vercel

---

### 12.2 Error: "Object with ID '...' does not exist"

**Causa:** `WHATSAPP_PHONE_NUMBER_ID` incorrecto o faltante.

**Solución:**
1. Verificar en Meta Dashboard > API Setup
2. Copiar correctamente el Phone Number ID
3. Actualizar `.env.local` y Vercel

---

### 12.3 Webhook Verification Fallando

**Causa:** `WHATSAPP_WEBHOOK_VERIFY_TOKEN` no coincide.

**Solución:**
1. Verificar que el token en `.env.local` y Vercel sea exactamente el mismo
2. Verificar que en Meta Dashboard > Webhooks esté configurado el mismo token
3. **⚠️ CRÍTICO:** No usar `WHATSAPP_ACCESS_TOKEN` como `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

---

### 12.4 Mensajes Duplicados

**Causa:** Meta envía webhook múltiples veces.

**Solución:**
- El sistema ya tiene deduplicación por `wa_message_id`
- Verificar que la tabla `predicciones_groq` tenga índice único en `wa_message_id`
- Si persiste, revisar logs para ver `wa_message_id` duplicados

---

### 12.5 Códigos de Verificación No Llegan

**Causa:** Fallo en envío por WhatsApp.

**Solución:**
1. Verificar logs: `sendWhatsAppMessage()` debe retornar `success: true`
2. Verificar que `WHATSAPP_ACCESS_TOKEN` tenga permisos de envío
3. Verificar que el número de destino sea válido
4. El código ya está guardado en BD, puede verificarse manualmente

---

### 12.6 Cron Job No Ejecuta en Producción

**Causa:** Configuración incorrecta en Vercel.

**Solución:**
1. Verificar `vercel.json` tiene la configuración de cron
2. Verificar que `CRON_SECRET` esté configurado en Vercel
3. Verificar logs de Vercel para errores de autenticación
4. Verificar que el path sea exactamente `/api/cron/confirm-expired`

---

### 12.7 Transacciones No Se Auto-Guardan

**Causa:** Cron job no encuentra confirmaciones expiradas.

**Solución:**
1. Verificar que `expires_at` esté correctamente configurado (30 minutos)
2. Verificar que `pending_confirmations.confirmed` sea `NULL` o `false`
3. Revisar logs del cron job en Vercel
4. Verificar query SQL en `confirm-expired/route.ts`

---

### 12.8 Límites Diarios No Funcionan

**Causa:** Plan de usuario incorrecto o query de conteo fallando.

**Solución:**
1. Verificar que `usuarios.suscripcion` tenga valor válido ('free', 'smart', 'pro', 'caducado')
2. Verificar que el conteo de transacciones use `fecha` (no `created_at`)
3. Verificar que solo cuente transacciones del día actual (timezone correcto)

---

## 13. Notas Adicionales

### 13.1 Seguridad

- ✅ Números de teléfono no se exponen en logs completos
- ✅ Tokens y claves API no se exponen en respuestas
- ✅ Códigos de verificación no se retornan en respuestas API
- ✅ Autenticación de cron jobs con `CRON_SECRET`

### 13.2 Performance

- ✅ Deduplicación evita llamadas innecesarias a Groq
- ✅ Validación de límites antes de Groq (ahorro de recursos)
- ✅ Rate limiting en webhook principal
- ✅ Rate limiting en mensajes de invitación

### 13.3 Escalabilidad

- ✅ Sistema preparado para múltiples países (configuración por `country_code`)
- ✅ Soporte para múltiples transacciones en un mensaje
- ✅ Cron job procesa expiraciones en batch

---

## 14. Contacto y Soporte

Para dudas o problemas:
- 📧 Email: soporte@ahorro365.com
- 📱 WhatsApp: +59161600190

---

**Documento actualizado:** 2025-11-21 21:00:00  
**Versión:** 1.0  
**Autor:** Sistema de Documentación Automática

