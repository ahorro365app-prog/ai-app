# 📊 Análisis: Validación de Límites de Texto y Audio

> **Fecha:** 2025-11-21 22:30:00  
> **Componente:** `packages/core-api/src/app/api/webhooks/whatsapp/route.ts`  
> **Tipo:** `ANALYSIS` + `IMPLEMENTATION`

---

## 📋 Resumen Ejecutivo

**Pregunta del usuario:**
- ¿Qué pasa si un usuario manda un texto de más de 100 caracteres por WhatsApp?
- ¿Qué pasa si un usuario manda un audio de más de 15 segundos por WhatsApp?

**Respuesta:**
✅ **ANTES:** Las validaciones existían en el código pero NO se aplicaban antes de procesar, causando desperdicio de recursos (Groq API, descarga de audio, transcripción).

✅ **AHORA:** Las validaciones se aplican ANTES de procesar, ahorrando recursos y enviando mensajes de error claros al usuario.

---

## 🔍 Análisis Inicial

### Estado Anterior

**Problema 1: Validación de Texto (>100 caracteres)**
- ❌ La validación existía en `validateTextLength()` y `validateCanCreateTransaction()`
- ❌ NO se validaba ANTES de procesar con Groq
- ❌ Se procesaba el texto completo con Groq, luego se validaba (si es que se validaba)
- ❌ Desperdicio de recursos de Groq API

**Problema 2: Validación de Audio (>15 segundos)**
- ❌ La validación existía en `validateCanCreateTransaction()`
- ❌ NO se validaba ANTES de descargar el audio de Meta
- ❌ Se descargaba el audio, se transcribía, y luego se validaba (si es que se validaba)
- ❌ Desperdicio de recursos: descarga de Meta, transcripción con Groq Whisper

**Problema 3: Mensajes de Error**
- ❌ Los mensajes de error no se enviaban al usuario cuando se excedían los límites
- ❌ El sistema procesaba igualmente, consumiendo recursos innecesarios

---

## ✅ Implementación Realizada

### Cambio 1: Validación de Texto ANTES de Groq

**Ubicación:** `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (líneas 367-389)

**Antes:**
```typescript
// NO es confirmación → Procesar como transacción
const transcription = textMessage;
return await processTranscription(transcription, ...); // ❌ Procesaba sin validar
```

**Ahora:**
```typescript
// VALIDAR LONGITUD DE TEXTO ANTES de procesar con Groq (ahorro de recursos)
const currentPlan = (user.suscripcion || 'free') as SubscriptionPlan;
const textValidation = await validateCanCreateTransaction(
  currentPlan,
  user.id,
  supabase,
  undefined, // audioDurationSeconds
  textMessage // textContent
);

if (!textValidation.valid) {
  logger.warn(`⚠️ Texto excede límite: ${textMessage.length} caracteres`);
  try {
    await sendWhatsAppMessage(rawPhoneNumber, textValidation.message || '⚠️ Texto demasiado largo');
  } catch (error: any) {
    logger.error('❌ Error enviando mensaje de límite de texto:', error);
  }
  return NextResponse.json({
    success: false,
    error: textValidation.errorCode || 'TEXT_LENGTH_EXCEEDED',
    message: textValidation.message
  }, { status: 200 });
}

// ✅ Solo procesa con Groq si pasa la validación
return await processTranscription(transcription, ...);
```

**Beneficio:**
- ✅ Ahorro de recursos: NO llama a Groq API si el texto excede 100 caracteres
- ✅ Mensaje claro al usuario: "El texto no puede exceder 100 caracteres. Por favor, envía un mensaje más corto. (XXX/100 caracteres)"
- ✅ Respuesta inmediata sin procesar

---

### Cambio 2: Validación de Audio ANTES de Descargar

**Ubicación:** `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (líneas 414-436)

**Antes:**
```typescript
// Descargar audio de Meta
const mediaResponse = await fetch(mediaUrl, ...); // ❌ Descargaba sin validar
const audioResponse = await fetch(audioDownloadUrl, ...); // ❌ Descargaba archivo sin validar
const transcription = await groqWhisperService.transcribe(audioFile, 'es'); // ❌ Transcribía sin validar
```

**Ahora:**
```typescript
// VALIDAR DURACIÓN DE AUDIO ANTES de descargar de Meta (ahorro de recursos)
const currentPlan = (user.suscripcion || 'free') as SubscriptionPlan;
const audioDuration = audio?.duration ? parseInt(audio.duration) : undefined;

if (audioDuration !== undefined) {
  const audioValidation = await validateCanCreateTransaction(
    currentPlan,
    user.id,
    supabase,
    audioDuration, // audioDurationSeconds
    undefined // textContent
  );
  
  if (!audioValidation.valid) {
    logger.warn(`⚠️ Audio excede límite: ${audioDuration} segundos`);
    try {
      await sendWhatsAppMessage(rawPhoneNumber, audioValidation.message || '⚠️ Audio demasiado largo');
    } catch (error: any) {
      logger.error('❌ Error enviando mensaje de límite de audio:', error);
    }
    return NextResponse.json({
      success: false,
      error: audioValidation.errorCode || 'AUDIO_DURATION_EXCEEDED',
      message: audioValidation.message
    }, { status: 200 });
  }
}

// ✅ Solo descarga y transcribe si pasa la validación
// 2. Descargar audio de Meta
const mediaResponse = await fetch(mediaUrl, ...);
```

**Beneficio:**
- ✅ Ahorro de recursos: NO descarga audio de Meta si excede 15 segundos
- ✅ Ahorro de transcripción: NO transcribe con Groq Whisper si excede 15 segundos
- ✅ Mensaje claro al usuario: "El audio no puede exceder 15 segundos. Por favor, envía un audio más corto."
- ✅ Respuesta inmediata sin descargar/transcribir

---

## 📊 Flujo Actualizado

### Flujo de Texto

```
1. Usuario envía texto por WhatsApp
   ↓
2. Sistema recibe webhook de Meta
   ↓
3. Sistema valida longitud (100 caracteres máximo)
   ↓
4a. Si excede:
    → Envía mensaje de error al usuario
    → NO procesa con Groq (ahorro de recursos)
    → Retorna error 200 (OK para Meta)
   ↓
4b. Si OK:
    → Procesa con Groq LLM
    → Crea transacción(es)
    → Envía preview al usuario
```

### Flujo de Audio

```
1. Usuario envía audio por WhatsApp
   ↓
2. Sistema recibe webhook de Meta
   ↓
3. Sistema lee `audio.duration` del webhook
   ↓
4. Sistema valida duración (15 segundos máximo)
   ↓
5a. Si excede:
    → Envía mensaje de error al usuario
    → NO descarga audio de Meta (ahorro de recursos)
    → NO transcribe con Groq Whisper (ahorro de recursos)
    → Retorna error 200 (OK para Meta)
   ↓
5b. Si OK:
    → Descarga audio de Meta
    → Transcribe con Groq Whisper
    → Procesa con Groq LLM
    → Crea transacción(es)
    → Envía preview al usuario
```

---

## 💬 Mensajes al Usuario

### Texto > 100 caracteres

**Mensaje:**
```
El texto no puede exceder 100 caracteres. Por favor, envía un mensaje más corto. (XXX/100 caracteres)
```

**Ejemplo:**
```
El texto no puede exceder 100 caracteres. Por favor, envía un mensaje más corto. (150/100 caracteres)
```

**Ubicación:** `packages/core-api/src/lib/planLimits.ts` (línea 162)

---

### Audio > 15 segundos

**Mensaje:**
```
El audio no puede exceder 15 segundos. Por favor, envía un audio más corto.
```

**Ubicación:** `packages/core-api/src/lib/planLimits.ts` (línea 187)

---

## ⚠️ Limitaciones Conocidas

### Duración de Audio en Webhook de Meta

**Problema:**
- Meta puede enviar `audio.duration` en el webhook, pero NO siempre está disponible
- Si `audio.duration` es `undefined`, NO se valida la duración antes de descargar

**Solución Actual:**
- Si `audio.duration` está disponible → Valida antes de descargar ✅
- Si `audio.duration` NO está disponible → Descarga y procesa normalmente ⚠️
- La validación final se hace en `processTranscription()` (pero ya después de descargar)

**Mejora Futura (Opcional):**
- Después de descargar el audio, calcular su duración real
- Validar antes de transcribir
- Esto requiere leer el archivo de audio y calcular su duración (puede ser costoso)

**Prioridad:** Baja (la mayoría de webhooks incluyen `duration`)

---

## 📈 Beneficios de la Implementación

### Ahorro de Recursos

**Antes:**
- ❌ Texto > 100 caracteres → Procesaba con Groq → Desperdicio
- ❌ Audio > 15 segundos → Descargaba de Meta → Transcribía → Desperdicio

**Ahora:**
- ✅ Texto > 100 caracteres → Mensaje de error inmediato → Sin procesar con Groq
- ✅ Audio > 15 segundos → Mensaje de error inmediato → Sin descargar/transcribir

### Experiencia del Usuario

**Antes:**
- ❌ No recibía mensaje claro cuando excedía límites
- ❌ El sistema procesaba igualmente (confusión)

**Ahora:**
- ✅ Recibe mensaje claro: "El texto no puede exceder 100 caracteres..."
- ✅ Recibe mensaje claro: "El audio no puede exceder 15 segundos..."
- ✅ Respuesta inmediata sin esperar procesamiento innecesario

### Costos

**Antes:**
- ❌ Llamadas innecesarias a Groq API (textos largos)
- ❌ Descargas innecesarias de Meta (audios largos)
- ❌ Transcripciones innecesarias con Groq Whisper (audios largos)

**Ahora:**
- ✅ Solo llama a Groq API si el texto es válido (<100 caracteres)
- ✅ Solo descarga de Meta si el audio es válido (<15 segundos)
- ✅ Solo transcribe si el audio es válido (<15 segundos)

---

## 🧪 Testing

### Casos de Prueba

**1. Texto < 100 caracteres:**
```
Input: "Gasté 50 en taxi"
Expected: ✅ Procesa normalmente
```

**2. Texto = 100 caracteres:**
```
Input: "A" * 100 (100 caracteres exactos)
Expected: ✅ Procesa normalmente
```

**3. Texto > 100 caracteres:**
```
Input: "A" * 150 (150 caracteres)
Expected: ❌ Mensaje de error: "El texto no puede exceder 100 caracteres. Por favor, envía un mensaje más corto. (150/100 caracteres)"
Expected: ❌ NO procesa con Groq
```

**4. Audio < 15 segundos:**
```
Input: Audio de 10 segundos
Expected: ✅ Procesa normalmente (descarga, transcribe, procesa)
```

**5. Audio = 15 segundos:**
```
Input: Audio de 15 segundos exactos
Expected: ✅ Procesa normalmente
```

**6. Audio > 15 segundos:**
```
Input: Audio de 20 segundos (si Meta envía duration en webhook)
Expected: ❌ Mensaje de error: "El audio no puede exceder 15 segundos. Por favor, envía un audio más corto."
Expected: ❌ NO descarga audio de Meta
Expected: ❌ NO transcribe con Groq Whisper
```

**7. Audio sin duration en webhook:**
```
Input: Audio de 20 segundos (pero Meta NO envía duration)
Expected: ⚠️ Descarga y procesa normalmente (no se puede validar sin duration)
```

---

## 📝 Notas de Implementación

### Límites por Plan

Todos los planes tienen los mismos límites de texto y audio:
- **Texto:** 100 caracteres máximo (todos los planes)
- **Audio:** 15 segundos máximo (todos los planes)

**Ubicación:** `packages/core-api/src/lib/planLimits.ts` (líneas 46-116)

```typescript
maxTextLength: 100, // Máximo 100 caracteres por texto
maxAudioDurationSeconds: 15, // Máximo 15 segundos para todos los planes
```

### Funciones de Validación

**1. `validateTextLength()`**
- **Ubicación:** `packages/core-api/src/lib/planLimits.ts` (líneas 153-168)
- **Parámetros:** `plan: SubscriptionPlan, text: string`
- **Retorna:** `ValidationResult { valid: boolean, message?: string, errorCode?: string }`

**2. `validateCanCreateTransaction()`**
- **Ubicación:** `packages/core-api/src/lib/planLimits.ts` (líneas 173-246)
- **Parámetros:** `plan, userId, supabase, audioDurationSeconds?, textContent?`
- **Retorna:** `ValidationResult { valid: boolean, message?: string, errorCode?: string }`
- **Valida:** Duración de audio, longitud de texto, límite diario de transacciones

---

## 🔄 Historial de Cambios

### 2025-11-21 - Validaciones Implementadas

**Hora:** 22:30:00  
**Tipo:** `IMPLEMENTATION`  
**Descripción:** Validación de longitud de texto y duración de audio ANTES de procesar

**Cambios:**
1. ✅ Validación de texto (100 caracteres) ANTES de Groq
2. ✅ Validación de audio (15 segundos) ANTES de descargar de Meta
3. ✅ Mensajes de error enviados al usuario
4. ✅ Ahorro de recursos (no procesa si excede límites)

**Archivos modificados:**
- `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (líneas 367-389, 414-436)

---

**Documento creado:** 2025-11-21 22:30:00  
**Última actualización:** 2025-11-21 22:30:00  
**Versión:** 1.0

