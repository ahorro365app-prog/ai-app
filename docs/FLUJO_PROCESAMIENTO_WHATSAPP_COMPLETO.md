# 📱 Flujo Completo: Procesamiento de Mensajes WhatsApp (Texto y Audio)

**Última actualización:** 19 Nov 2025  
**Versión:** 1.0

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Flujo: Mensaje de Texto](#flujo-mensaje-de-texto)
4. [Flujo: Mensaje de Audio](#flujo-mensaje-de-audio)
5. [Flujo: Confirmación Manual](#flujo-confirmación-manual)
6. [Flujo: Auto-Guardado (Timeout 30 min)](#flujo-auto-guardado-timeout-30-min)
7. [Componentes Clave](#componentes-clave)
8. [Validaciones y Límites](#validaciones-y-límites)
9. [Manejo de Errores](#manejo-de-errores)
10. [Diagramas de Flujo](#diagramas-de-flujo)

---

## 📊 Resumen Ejecutivo

### Flujo General

```
Usuario → WhatsApp → Baileys Worker → Backend (Vercel) → Groq AI → Supabase → Usuario
```

### Tipos de Mensajes Soportados

| Tipo | Procesamiento | Límites |
|------|---------------|---------|
| **Texto** | Extracción directa con Groq LLM | 100 caracteres máximo |
| **Audio** | Transcripción (Groq Whisper) + Extracción (Groq LLM) | 15 segundos máximo |
| **Confirmación** | Procesamiento de respuesta (sí/ok/perfecto) | - |

### Estados de Transacción

1. **Pendiente** → Esperando confirmación del usuario (30 min)
2. **Confirmada** → Usuario respondió "sí/ok/perfecto"
3. **Auto-guardada** → Timeout de 30 minutos sin respuesta
4. **Guardada** → Transacción creada en tabla `transacciones`

---

## 🏗️ Arquitectura General

### Componentes

```
┌─────────────────┐
│   WhatsApp      │
│   (Usuario)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Baileys Worker │  ← Fly.io (ahorro365-baileys-worker-v2)
│  (Receptor)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │  ← Vercel (admin-dashboard)
│  /api/webhooks/ │
│     baileys     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Groq   │ │Supabase│
│ Whisper│ │  (BD)  │
│  + LLM │ │        │
└────────┘ └────────┘
```

### Archivos Clave

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| **Worker** | `ahorro365-baileys-worker/src/index.ts` | Recibir mensajes, enviar al backend |
| **Worker Service** | `ahorro365-baileys-worker/src/services/whatsapp.ts` | Manejar conexión Baileys, descargar audio |
| **Backend Endpoint** | `admin-dashboard/src/app/api/webhooks/baileys/route.ts` | Procesar mensajes, extraer datos |
| **Transcripción** | `admin-dashboard/src/services/groqWhisperService.ts` | Transcribir audio con Groq Whisper |
| **Extracción** | `admin-dashboard/src/services/groqService.ts` | Extraer datos con Groq LLM |
| **Confirmación** | `admin-dashboard/src/app/api/webhooks/whatsapp/confirm/route.ts` | Procesar confirmaciones |
| **Auto-guardado** | `admin-dashboard/src/app/api/cron/confirm-expired/route.ts` | Guardar transacciones expiradas |

---

## 📝 Flujo: Mensaje de Texto

### Paso a Paso

#### 1. Usuario Envía Mensaje de Texto
```
Usuario: "Gasté 50 bs en pan"
```

#### 2. Baileys Worker Recibe Mensaje
**Archivo:** `ahorro365-baileys-worker/src/index.ts`

```typescript
whatsapp.onMessage(async (message: IWhatsAppMessage) => {
  // message.type === 'text'
  // message.message === "Gasté 50 bs en pan"
  // message.from === "59160360908@s.whatsapp.net"
})
```

**Validaciones:**
- ✅ Verificar que no sea mensaje propio (`fromMe`)
- ✅ Verificar que sea tipo `text` o `audio`
- ✅ Si es confirmación (sí/ok/perfecto), procesar en endpoint separado

#### 3. Worker Envía al Backend
**Payload:**
```json
{
  "from": "59160360908@s.whatsapp.net",
  "type": "text",
  "text": "Gasté 50 bs en pan",
  "timestamp": 1732046400000,
  "wa_message_id": "3EB0C767F26A1B2AF123"
}
```

**Endpoint:** `POST ${BACKEND_URL}/api/webhooks/baileys`  
**Headers:**
```json
{
  "Authorization": "Bearer ${BACKEND_API_KEY}",
  "Content-Type": "application/json"
}
```

#### 4. Backend Valida y Procesa
**Archivo:** `admin-dashboard/src/app/api/webhooks/baileys/route.ts`

**4.1. Rate Limiting**
```typescript
const rateLimitResult = await checkRateLimit(webhookRateLimit, identifier);
if (!rateLimitResult.success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

**4.2. Validar Usuario**
```typescript
// Buscar usuario por teléfono (con y sin +)
const { data: user } = await supabase
  .from('usuarios')
  .select('*')
  .eq('telefono', phoneWithPlus)
  .single();

if (!user) {
  return NextResponse.json({
    success: false,
    error: 'user_not_registered',
    should_send_invitation: debeEnviarMensaje
  });
}
```

**4.3. Verificar Duplicados**
```typescript
if (wa_message_id) {
  const cached = await checkDuplicateWhatsAppMessage(wa_message_id);
  if (cached) {
    return NextResponse.json({ success: true, cached: true, ... });
  }
}
```

**4.4. Validar Límites**
```typescript
// Texto: máximo 100 caracteres
if (type === 'text' && text.length > 100) {
  return NextResponse.json({
    success: false,
    error: 'TEXT_LENGTH_EXCEEDED',
    message: `El texto no puede exceder 100 caracteres.`
  }, { status: 400 });
}
```

**4.5. Obtener Transcripción**
```typescript
// Para texto, usar directamente
transcription = text; // "Gasté 50 bs en pan"
```

#### 5. Extraer Datos con Groq LLM
**Archivo:** `admin-dashboard/src/services/groqService.ts`

```typescript
const groqResult: GroqMultipleResponse = await groqService.processTranscriptionMultiple(
  transcription,
  user.country_code || 'BOL'
);
```

**Resultado:**
```json
{
  "esMultiple": false,
  "transacciones": [
    {
      "monto": 50,
      "moneda": "BOB",
      "tipo": "gasto",
      "categoria": "alimentos",
      "descripcion": "Pan",
      "metodoPago": "efectivo"
    }
  ]
}
```

#### 6. Guardar Predicción
**Tabla:** `predicciones_groq`

```typescript
const { data: prediction } = await insertPredictionWithDedup({
  usuario_id: user.id,
  country_code: user.country_code || 'BOL',
  transcripcion: transcription,
  resultado: expenseData,
  wa_message_id: wa_message_id,
  mensaje_origen: 'whatsapp',
  original_timestamp: now
});
```

**Deduplicación:**
- Si `wa_message_id` ya existe, devolver predicción existente (caché)
- Evita reprocesar el mismo mensaje

#### 7. Crear Confirmación Pendiente
**Tabla:** `pending_confirmations`

```typescript
if (requireConfirmation) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);
  
  await supabase.from('pending_confirmations').insert({
    prediction_id: prediction.id,
    usuario_id: user.id,
    country_code: user.country_code || 'BOL',
    wa_message_id: wa_message_id,
    expires_at: expiresAt.toISOString()
  });
}
```

**Configuración por País:**
- `feedback_confirmation_config.require_confirmation` determina si se requiere confirmación
- Si `require_confirmation = false`, se guarda automáticamente

#### 8. Construir Preview Message
```typescript
previewMessage = `✅ *TEXTO PROCESADO*
*Monto (Bs):* 50
*Tipo de transacción:* gasto
*Método de Pago:* efectivo
*Categoría:* alimentos
*Descripción:* Pan

*¿Está bien?*
✅ *Responde:* sí / ok / perfecto / está bien
⏰ Sin confirmación se guarda automáticamente en 30 minutos
📱 (Tienes 48h para editarla en la app)`;
```

#### 9. Worker Envía Preview al Usuario
```typescript
await whatsapp.sendMessage(message.from, previewMessage);
```

**Usuario Recibe:**
```
✅ TEXTO PROCESADO
Monto (Bs): 50
Tipo de transacción: gasto
Método de Pago: efectivo
Categoría: alimentos
Descripción: Pan

¿Está bien?
✅ Responde: sí / ok / perfecto / está bien
⏰ Sin confirmación se guarda automáticamente en 30 minutos
📱 (Tienes 48h para editarla en la app)
```

---

## 🎤 Flujo: Mensaje de Audio

### Paso a Paso

#### 1. Usuario Envía Mensaje de Audio
```
Usuario: [Audio de 10 segundos] "Gasté 50 bs en pan"
```

#### 2. Baileys Worker Recibe y Descarga Audio
**Archivo:** `ahorro365-baileys-worker/src/services/whatsapp.ts`

```typescript
// En 'messages.upsert' event
if (msg.message?.audioMessage) {
  const audioBuffer = await downloadMediaMessage(
    msg,
    'audio',
    { logger }
  );
  
  messageData.type = 'audio';
  messageData.audioBuffer = audioBuffer;
}
```

**Formato:** OGG Opus (formato nativo de WhatsApp)

#### 3. Worker Convierte a Base64 y Envía
**Payload:**
```json
{
  "from": "59160360908@s.whatsapp.net",
  "type": "audio",
  "audioBase64": "T2dnUwACAAAAAAAAAAD...",
  "timestamp": 1732046400000,
  "wa_message_id": "3EB0C767F26A1B2AF123"
}
```

#### 4. Backend Convierte Base64 a File
```typescript
const audioBuffer = Buffer.from(audioBase64, 'base64');
const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg; codecs=opus' });
const audioFile = new File([audioBlob], 'audio.ogg', { type: 'audio/ogg; codecs=opus' });
```

#### 5. Transcribir con Groq Whisper
**Archivo:** `admin-dashboard/src/services/groqWhisperService.ts`

```typescript
const transcription = await groqWhisperService.transcribe(audioFile, 'es');
// Resultado: "Gasté 50 bs en pan"
```

**API:** `POST https://api.groq.com/openai/v1/audio/transcriptions`  
**Modelo:** `whisper-large-v3`  
**Idioma:** `es` (español)

#### 6. Extraer Datos (Igual que Texto)
```typescript
const groqResult = await groqService.processTranscriptionMultiple(
  transcription,
  user.country_code || 'BOL'
);
```

**Resto del flujo igual que texto** (pasos 6-9)

---

## ✅ Flujo: Confirmación Manual

### Paso a Paso

#### 1. Usuario Responde "Sí" o "Ok"
```
Usuario: "sí"
```

#### 2. Worker Detecta Confirmación
**Archivo:** `ahorro365-baileys-worker/src/index.ts`

```typescript
function isConfirmation(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  const confirmations = ['sí', 'si', 'yes', 'ok', 'okay', 'perfecto', 'está bien', 'esta bien', 'correcto', 'confirmado'];
  return confirmations.includes(normalized);
}

if (message.type === 'text' && isConfirmation(message.message)) {
  // Procesar confirmación
}
```

#### 3. Worker Envía al Endpoint de Confirmación
**Endpoint:** `POST ${BACKEND_URL}/api/webhooks/whatsapp/confirm`

**Payload:**
```json
{
  "phone_number": "59160360908@s.whatsapp.net",
  "message": "sí"
}
```

#### 4. Backend Obtiene Transacción Pendiente
**Archivo:** `admin-dashboard/src/app/api/webhooks/whatsapp/confirm/route.ts`

```typescript
// Si no viene prediction_id, obtener la más reciente
const { data: pendingConf } = await supabase
  .from('pending_confirmations')
  .select('prediction_id, parent_message_id')
  .eq('usuario_id', usuario_id)
  .is('confirmed', null)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

#### 5. Verificar si es Múltiple
```typescript
if (parent_message_id) {
  // MODO MÚLTIPLE: Confirmar todas las del grupo
  const { data: allGroupPendings } = await supabase
    .from('pending_confirmations')
    .select('prediction_id')
    .eq('usuario_id', usuario_id)
    .eq('parent_message_id', parent_message_id)
    .is('confirmed', null);
  
  // Confirmar todas
  for (const pred of predictionsToConfirm) {
    // Actualizar predicción
    await supabase
      .from('predicciones_groq')
      .update({
        confirmado: true,
        confirmado_por: 'whatsapp_reaction'
      })
      .eq('id', pred.id);
    
    // Crear transacción
    await supabase.from('transacciones').insert({
      usuario_id,
      tipo: pred.resultado?.tipo || 'gasto',
      monto: pred.resultado?.monto,
      categoria: pred.resultado?.categoria,
      descripcion: pred.resultado?.descripcion,
      fecha: pred.original_timestamp, // ← TIMESTAMP ORIGINAL
      metodo_pago: pred.resultado?.metodoPago,
      moneda: pred.resultado?.moneda || 'BOB'
    });
    
    // Marcar confirmación
    await supabase
      .from('pending_confirmations')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString()
      })
      .eq('prediction_id', pred.id);
  }
}
```

#### 6. Guardar Feedback
```typescript
await supabase.from('feedback_usuarios').insert({
  prediction_id: pred.id,
  usuario_id,
  era_correcto: true,
  country_code,
  origen: 'whatsapp_reaction',
  confiabilidad: 1.0
});
```

#### 7. Recalcular Accuracy
```typescript
const { accuracy, verified_count } = await calculateWeightedAccuracy(supabase, country_code);

await supabase
  .from('feedback_confirmation_config')
  .update({
    total_transactions: verified_count,
    accuracy: accuracy
  })
  .eq('country_code', country_code);
```

#### 8. Verificar si Cambiar a Automático
```typescript
if (accuracy >= 90 && verified_count >= 1000) {
  // Cambiar a modo automático
  await supabase
    .from('feedback_confirmation_config')
    .update({
      require_confirmation: false,
      is_auto_enabled: true
    })
    .eq('country_code', country_code);
}
```

#### 9. Worker Envía Confirmación
```typescript
await whatsapp.sendMessage(message.from, '✅ Transacción confirmada y guardada exitosamente! 🎉');
```

---

## ⏰ Flujo: Auto-Guardado (Timeout 30 min)

### Paso a Paso

#### 1. Cron Job Ejecuta Cada X Minutos
**Archivo:** `admin-dashboard/src/app/api/cron/confirm-expired/route.ts`  
**Endpoint:** `GET /api/cron/confirm-expired`  
**Autenticación:** `Bearer ${CRON_SECRET}`

#### 2. Buscar Confirmaciones Expiradas
```typescript
const { data: expired } = await supabase
  .from('pending_confirmations')
  .select('*')
  .lt('expires_at', new Date().toISOString())
  .is('confirmed', null);
```

#### 3. Procesar Cada Expirada
```typescript
for (const exp of expired) {
  // Obtener predicción
  const { data: prediction } = await supabase
    .from('predicciones_groq')
    .select('resultado, usuario_id, original_timestamp')
    .eq('id', exp.prediction_id)
    .single();
  
  // Actualizar predicción
  await supabase
    .from('predicciones_groq')
    .update({
      confirmado: true,
      confirmado_por: 'timeout'
    })
    .eq('id', exp.prediction_id);
  
  // Crear transacción con timestamp original
  await supabase.from('transacciones').insert({
    usuario_id: prediction.usuario_id,
    tipo: prediction.resultado?.tipo || 'gasto',
    monto: prediction.resultado?.monto,
    categoria: prediction.resultado?.categoria,
    descripcion: prediction.resultado?.descripcion,
    fecha: prediction.original_timestamp, // ← TIMESTAMP ORIGINAL
    metodo_pago: prediction.resultado?.metodoPago,
    moneda: prediction.resultado?.moneda || 'BOB'
  });
  
  // Marcar confirmación
  await supabase
    .from('pending_confirmations')
    .update({
      confirmed: true,
      confirmed_at: new Date().toISOString()
    })
    .eq('id', exp.id);
}
```

**Nota:** No se envía mensaje al usuario cuando se auto-guarda (evita spam)

---

## 🔧 Componentes Clave

### 1. Groq Whisper Service
**Archivo:** `admin-dashboard/src/services/groqWhisperService.ts`

**Función:**
```typescript
transcribe(audioFile: File, language: string): Promise<string>
```

**API:** Groq Whisper (compatible con OpenAI Whisper)  
**Modelo:** `whisper-large-v3`  
**Idioma:** `es` (español)

### 2. Groq Service
**Archivo:** `admin-dashboard/src/services/groqService.ts`

**Función Principal:**
```typescript
processTranscriptionMultiple(
  text: string,
  userCountryCode: string
): Promise<GroqMultipleResponse>
```

**Modelo:** `llama-3.1-8b-instant`  
**Capacidades:**
- Extraer múltiples transacciones de un mensaje
- Detectar tipo (gasto/ingreso)
- Identificar categoría, método de pago, moneda
- Procesar fechas relativas (ayer, hace 2 días, etc.)

**Ejemplo de Respuesta:**
```json
{
  "esMultiple": true,
  "transacciones": [
    {
      "monto": 50,
      "moneda": "BOB",
      "tipo": "gasto",
      "categoria": "alimentos",
      "descripcion": "Pan",
      "metodoPago": "efectivo"
    },
    {
      "monto": 100,
      "moneda": "BOB",
      "tipo": "gasto",
      "categoria": "transporte",
      "descripcion": "Taxi",
      "metodoPago": "efectivo"
    }
  ]
}
```

### 3. Deduplicación
**Archivo:** `admin-dashboard/src/lib/whatsapp-deduplication-endpoint.ts`

**Función:**
```typescript
checkDuplicateWhatsAppMessage(wa_message_id: string): Promise<any>
```

**Lógica:**
- Buscar en `predicciones_groq` por `wa_message_id`
- Si existe, devolver resultado en caché
- Evita reprocesar el mismo mensaje (útil si WhatsApp reenvía)

### 4. Configuración por País
**Tabla:** `feedback_confirmation_config`

**Campos:**
- `country_code`: Código del país (BOL, ARG, etc.)
- `require_confirmation`: Si requiere confirmación manual
- `is_auto_enabled`: Si está en modo automático
- `accuracy`: Precisión ponderada
- `total_transactions`: Total de transacciones verificadas

**Lógica:**
- Si `require_confirmation = false`, se guarda automáticamente
- Si `accuracy >= 90%` y `total_transactions >= 1000`, cambiar a automático

---

## 🛡️ Validaciones y Límites

### Validaciones de Entrada

| Validación | Tipo | Límite | Acción |
|------------|------|--------|--------|
| **Longitud de texto** | Texto | 100 caracteres | Rechazar si excede |
| **Duración de audio** | Audio | 15 segundos | Rechazar si excede |
| **Usuario registrado** | Ambos | - | Enviar mensaje de invitación si no existe |
| **Rate limiting** | Ambos | Por IP/identificador | Rechazar con 429 si excede |
| **Mensaje duplicado** | Ambos | Por `wa_message_id` | Devolver caché si existe |

### Límites por Plan

| Plan | Texto | Audio | Confirmación |
|------|-------|-------|--------------|
| **Free** | 100 chars | 15s | Requerida |
| **Smart** | 100 chars | 15s | Requerida |
| **Pro** | 100 chars | 15s | Requerida |

**Nota:** Actualmente todos los planes tienen los mismos límites.

---

## ⚠️ Manejo de Errores

### Errores Comunes

#### 1. Usuario No Registrado
```typescript
return NextResponse.json({
  success: false,
  error: 'user_not_registered',
  should_send_invitation: debeEnviarMensaje
}, { status: 200 });
```

**Acción del Worker:**
- Si `should_send_invitation = true`, enviar mensaje de invitación
- Si `should_send_invitation = false`, ignorar (rate limit activo)

#### 2. Texto Muy Largo
```typescript
return NextResponse.json({
  success: false,
  error: 'TEXT_LENGTH_EXCEEDED',
  message: `El texto no puede exceder 100 caracteres. (${text.length}/100 caracteres)`
}, { status: 400 });
```

#### 3. Audio Muy Largo
```typescript
return NextResponse.json({
  success: false,
  error: 'AUDIO_DURATION_EXCEEDED',
  message: `El audio no puede exceder 15 segundos. Duración recibida: ${audioDurationSeconds} segundos.`
}, { status: 400 });
```

#### 4. Rate Limit Excedido
```typescript
return NextResponse.json(
  { error: 'Rate limit exceeded' },
  {
    status: 429,
    headers: {
      'Retry-After': '900' // 15 minutos
    }
  }
);
```

#### 5. Error de Groq
```typescript
try {
  const transcription = await groqWhisperService.transcribe(audioFile, 'es');
} catch (error) {
  logger.error('❌ Error transcribiendo con Groq:', error);
  return handleError(error, 'Error al transcribir audio');
}
```

#### 6. Backend No Disponible
**En Worker:**
```typescript
catch (error: any) {
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
    console.error('⚠️ Backend no disponible, no se envió mensaje de error al usuario');
    // No enviar mensaje de error si el backend está caído
  }
}
```

---

## 📊 Diagramas de Flujo

### Flujo Completo: Texto

```
┌─────────┐
│ Usuario │
└────┬────┘
     │ "Gasté 50 bs en pan"
     ▼
┌─────────────────┐
│ Baileys Worker  │
│ (Fly.io)        │
└────┬────────────┘
     │ POST /api/webhooks/baileys
     ▼
┌─────────────────┐
│ Backend (Vercel)│
│ Validar usuario │
│ Validar límites  │
│ Verificar dup   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Groq LLM        │
│ Extraer datos   │
└────┬────────────┘
     │ { monto: 50, tipo: "gasto", ... }
     ▼
┌─────────────────┐
│ Supabase        │
│ Guardar pred    │
│ Crear pending   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Backend         │
│ Construir       │
│ preview         │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Baileys Worker  │
│ Enviar preview  │
└────┬────────────┘
     │
     ▼
┌─────────┐
│ Usuario │
│ (Preview)│
└─────────┘
```

### Flujo Completo: Audio

```
┌─────────┐
│ Usuario │
└────┬────┘
     │ [Audio 10s]
     ▼
┌─────────────────┐
│ Baileys Worker  │
│ Descargar audio │
│ Convertir base64│
└────┬────────────┘
     │ POST /api/webhooks/baileys
     │ { audioBase64: "..." }
     ▼
┌─────────────────┐
│ Backend         │
│ Convertir a File│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Groq Whisper    │
│ Transcribir     │
└────┬────────────┘
     │ "Gasté 50 bs en pan"
     ▼
┌─────────────────┐
│ Groq LLM        │
│ Extraer datos   │
└────┬────────────┘
     │ { monto: 50, tipo: "gasto", ... }
     ▼
┌─────────────────┐
│ Supabase        │
│ Guardar pred    │
│ Crear pending   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Backend         │
│ Construir       │
│ preview         │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Baileys Worker  │
│ Enviar preview  │
└────┬────────────┘
     │
     ▼
┌─────────┐
│ Usuario │
│ (Preview)│
└─────────┘
```

### Flujo: Confirmación

```
┌─────────┐
│ Usuario │
└────┬────┘
     │ "sí"
     ▼
┌─────────────────┐
│ Baileys Worker  │
│ Detectar conf   │
└────┬────────────┘
     │ POST /api/webhooks/whatsapp/confirm
     ▼
┌─────────────────┐
│ Backend         │
│ Obtener pending │
│ (simple/múltiple)│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Supabase        │
│ Actualizar pred │
│ Crear transacción│
│ Guardar feedback│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Backend         │
│ Recalcular      │
│ accuracy        │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Baileys Worker  │
│ "✅ Confirmada"  │
└────┬────────────┘
     │
     ▼
┌─────────┐
│ Usuario │
└─────────┘
```

### Flujo: Auto-Guardado

```
┌─────────────────┐
│ Cron Job        │
│ (Cada X min)    │
└────┬────────────┘
     │ GET /api/cron/confirm-expired
     ▼
┌─────────────────┐
│ Backend         │
│ Buscar expiradas│
│ expires_at < now│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Para cada exp:  │
│ - Actualizar pred│
│ - Crear transacción│
│ - Marcar pending│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Supabase        │
│ Transacciones   │
│ guardadas       │
└─────────────────┘
```

---

## 📝 Notas Importantes

### Timestamps

- **`original_timestamp`**: Timestamp del mensaje original (cuando el usuario lo envió)
- **`fecha` en transacciones**: Se usa `original_timestamp` para mantener la fecha correcta
- **Timezone**: Se respeta la zona horaria del país del usuario

### Múltiples Transacciones

- Si un mensaje contiene múltiples transacciones, se crean múltiples predicciones
- Todas comparten el mismo `parent_message_id`
- Al confirmar, se confirman todas juntas
- Preview muestra todas las transacciones en un solo mensaje

### Deduplicación

- Se usa `wa_message_id` para evitar reprocesar el mismo mensaje
- Si WhatsApp reenvía un mensaje, se devuelve el resultado en caché
- Ahorra recursos de Groq y mejora la experiencia del usuario

### Rate Limiting

- **Mensajes de invitación**: Máximo 1 cada 24 horas por teléfono
- **Webhooks**: Límite por IP/identificador (configurado en `rateLimit.ts`)
- **Groq API**: Límites propios de Groq (no controlados por nosotros)

---

**Última actualización:** 19 Nov 2025  
**Versión:** 1.0

