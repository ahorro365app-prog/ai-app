# 🔍 Verificación de Límites: Audio 15s y Texto 100 chars

**Fecha:** 19 Nov 2025  
**Objetivo:** Verificar que los límites estén correctamente implementados en todos los endpoints de WhatsApp

---

## 📋 Resumen de Límites

| Tipo | Límite | Estado |
|------|--------|--------|
| **Audio** | 15 segundos máximo | ⚠️ **Parcialmente validado** |
| **Texto** | 100 caracteres máximo | ✅ **Validado** |

---

## ✅ Texto: 100 Caracteres

### Endpoint: `/api/webhooks/baileys` (Baileys Worker)

**Archivo:** `admin-dashboard/src/app/api/webhooks/baileys/route.ts`

**Líneas:** 162-173

```typescript
// Validar longitud de texto (100 caracteres máximo para todos los planes)
if (type === 'text' && text) {
  const maxTextLength = 100; // Límite igual para todos los planes
  if (text.length > maxTextLength) {
    logger.warn(`❌ Texto excede límite: ${text.length}/${maxTextLength} caracteres`);
    return NextResponse.json({
      success: false,
      error: 'TEXT_LENGTH_EXCEEDED',
      message: `El texto no puede exceder ${maxTextLength} caracteres. Por favor, envía un mensaje más corto. (${text.length}/${maxTextLength} caracteres)`,
    }, { status: 400 });
  }
}
```

**Estado:** ✅ **CORRECTO** - Validación implementada

---

## ⚠️ Audio: 15 Segundos

### Endpoint: `/api/webhooks/whatsapp` (Meta WhatsApp)

**Archivo:** `src/app/api/webhooks/whatsapp/route.ts`

**Líneas:** 75-88

```typescript
// 1.5. Validar duración del audio (máximo 15 segundos para todos los planes)
const audioDurationSeconds = audio.duration || null;
if (audioDurationSeconds !== null && audioDurationSeconds > 15) {
  logger.error(`Audio too long: ${audioDurationSeconds}s (max 15s)`);
  return NextResponse.json(
    { 
      error: 'AUDIO_DURATION_EXCEEDED',
      message: `El audio no puede exceder 15 segundos. Duración recibida: ${audioDurationSeconds} segundos. Por favor, envía un audio más corto.`,
      duration: audioDurationSeconds,
      maxDuration: 15
    },
    { status: 400 }
  );
}
```

**Estado:** ✅ **CORRECTO** - Validación implementada

**Nota:** Meta WhatsApp envía `audio.duration` en el webhook, por lo que la validación es directa.

---

### Endpoint: `/api/webhooks/baileys` (Baileys Worker)

**Archivo:** `admin-dashboard/src/app/api/webhooks/baileys/route.ts`

**Líneas:** 175-178

```typescript
// Nota: Para audio, la validación de duración (15s) se hace en el frontend
// ya que obtener la duración del audio en el backend requiere librerías adicionales
// El frontend ya valida antes de enviar, pero si se necesita validar aquí también,
// se requeriría usar una librería como 'ffprobe' o 'node-ffmpeg'
```

**Estado:** ⚠️ **NO VALIDADO** - Falta implementación

**Problema:**
- Baileys Worker envía audio como `base64`, pero **NO incluye la duración** en el payload
- El comentario indica que se valida en el frontend, pero **WhatsApp no tiene frontend**
- Los usuarios envían audio directamente desde WhatsApp, sin pasar por nuestra app

**Solución Necesaria:**
1. **Opción A:** Calcular duración del audio en el backend usando una librería
2. **Opción B:** Enviar duración desde Baileys Worker (si está disponible en el mensaje)

---

## 🔍 Análisis: Información Disponible en Baileys

### Mensaje de Audio de Baileys

**Estructura del mensaje:**
```typescript
{
  from: "59160360908@s.whatsapp.net",
  type: "audio",
  audioBase64: "T2dnUwAC...", // Buffer convertido a base64
  timestamp: 1732046400000,
  wa_message_id: "3EB0C767F26A1B2AF123"
}
```

**Información disponible en `msg.message.audioMessage`:**
- `url`: URL del audio (temporal)
- `mimetype`: Tipo MIME (ej: `audio/ogg; codecs=opus`)
- `fileSha256`: Hash del archivo
- `fileLength`: Tamaño del archivo en bytes
- `seconds`: ⚠️ **¿Duración en segundos?** (necesita verificación)
- `ptt`: Si es push-to-talk (voice message)
- `mediaKey`: Clave para descargar
- `directPath`: Ruta directa

**Posible solución:**
- Verificar si `msg.message.audioMessage.seconds` contiene la duración
- Si está disponible, enviarla en el payload desde Baileys Worker
- Validar en el backend antes de procesar

---

## 🛠️ Solución Propuesta

### Paso 1: Verificar si Baileys incluye duración

**Archivo:** `ahorro365-baileys-worker/src/services/whatsapp.ts`

**Modificar para incluir duración si está disponible:**
```typescript
if (msg.message?.audioMessage && this.socket) {
  // ... código existente ...
  
  // Agregar duración si está disponible
  const audioMessage = msg.message.audioMessage;
  if (audioMessage.seconds) {
    (messageData as any).audioDurationSeconds = audioMessage.seconds;
  }
}
```

### Paso 2: Enviar duración en el payload

**Archivo:** `ahorro365-baileys-worker/src/index.ts`

**Modificar payload para incluir duración:**
```typescript
if (message.type === 'audio') {
  const audioBuffer = (message as any).audioBuffer;
  payload.audioBase64 = audioBuffer ? audioBuffer.toString('base64') : null;
  payload.audioDurationSeconds = (message as any).audioDurationSeconds || null; // ← NUEVO
}
```

### Paso 3: Validar en el backend

**Archivo:** `admin-dashboard/src/app/api/webhooks/baileys/route.ts`

**Agregar validación después de recibir el payload:**
```typescript
const { audioBase64, text, from, type, timestamp, wa_message_id, audioDurationSeconds } = body;

// Validar duración de audio (15 segundos máximo)
if (type === 'audio' && audioDurationSeconds !== null && audioDurationSeconds !== undefined) {
  if (audioDurationSeconds > 15) {
    logger.error(`❌ Audio excede límite: ${audioDurationSeconds}s (max 15s)`);
    return NextResponse.json({
      success: false,
      error: 'AUDIO_DURATION_EXCEEDED',
      message: `El audio no puede exceder 15 segundos. Duración recibida: ${audioDurationSeconds} segundos. Por favor, envía un audio más corto.`,
      duration: audioDurationSeconds,
      maxDuration: 15
    }, { status: 400 });
  }
}
```

### Paso 4: Fallback si no hay duración

Si Baileys no proporciona duración, calcular desde el buffer:

**Opción A:** Usar librería `node-ffmpeg` o `ffprobe` (requiere instalación)

**Opción B:** Estimar basado en tamaño del archivo (menos preciso)

**Opción C:** Procesar el audio y validar después (menos eficiente)

---

## 📊 Estado Actual

| Endpoint | Tipo | Validación | Estado |
|----------|------|------------|--------|
| `/api/webhooks/whatsapp` (Meta) | Audio | ✅ 15s | ✅ Implementado |
| `/api/webhooks/whatsapp` (Meta) | Texto | N/A | N/A (solo audio) |
| `/api/webhooks/baileys` (Baileys) | Audio | ⚠️ Falta | ⚠️ **PENDIENTE** |
| `/api/webhooks/baileys` (Baileys) | Texto | ✅ 100 chars | ✅ Implementado |

---

## ✅ Acciones Requeridas

1. **Verificar si Baileys incluye `audioMessage.seconds`**
   - Revisar logs cuando llega un audio
   - Verificar estructura del mensaje

2. **Si está disponible:**
   - Modificar Baileys Worker para enviar `audioDurationSeconds`
   - Agregar validación en backend

3. **Si NO está disponible:**
   - Implementar cálculo de duración en backend
   - O usar librería externa (ffprobe, node-ffmpeg)

4. **Testing:**
   - Enviar audio de 10s → Debe procesar ✅
   - Enviar audio de 20s → Debe rechazar ❌
   - Enviar texto de 50 chars → Debe procesar ✅
   - Enviar texto de 150 chars → Debe rechazar ❌

---

## 📝 Notas

- **Meta WhatsApp:** Incluye `audio.duration` en el webhook → Validación directa ✅
- **Baileys:** No incluye duración en el payload actual → Necesita implementación ⚠️
- **Frontend (App):** Valida antes de enviar, pero WhatsApp no pasa por frontend
- **Texto:** Validación completa en ambos endpoints ✅

---

**Última actualización:** 19 Nov 2025  
**Estado:** ⚠️ Validación de audio en Baileys pendiente

