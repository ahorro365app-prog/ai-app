# 🧪 Guía de Pruebas: Validaciones de WhatsApp

> **Última actualización:** 2025-11-22  
> **Versión:** 1.0  
> **Propósito:** Verificar cómo responde el sistema a diferentes casos de uso

---

## 📋 Casos de Prueba

### 1. Audio de Más de 15 Segundos

**Escenario:** Usuario envía un audio de más de 15 segundos.

**Comportamiento Esperado:**
- ✅ Sistema valida duración ANTES de descargar el audio
- ✅ Envía mensaje de error al usuario
- ✅ NO descarga el audio de Meta (ahorro de recursos)
- ✅ NO transcribe con Groq Whisper (ahorro de recursos)

**Mensaje Esperado:**
```
El audio no puede exceder 15 segundos. Por favor, envía un audio más corto.
```

**Cómo Probar:**
1. Envía un audio de más de 15 segundos por WhatsApp
2. Verifica que recibes el mensaje de error
3. Verifica en los logs que NO se descargó el audio

**Nota:** 
- Si Meta envía `audio.duration` en el webhook: Se valida ANTES de descargar (ahorro máximo de recursos)
- Si Meta NO envía `audio.duration`: Se descarga el audio y se lee la duración del archivo usando `music-metadata`, luego se valida. Si excede 15 segundos, se envía el mensaje de error y NO se transcribe.

---

### 2. Texto Mayor a 100 Caracteres

**Escenario:** Usuario envía un mensaje de texto de más de 100 caracteres.

**Comportamiento Esperado:**
- ✅ Sistema valida longitud ANTES de procesar con Groq
- ✅ Envía mensaje de error al usuario
- ✅ NO procesa con Groq LLM (ahorro de recursos)

**Mensaje Esperado:**
```
El texto no puede exceder 100 caracteres. Por favor, envía un mensaje más corto. (XXX/100 caracteres)
```

**Cómo Probar:**
1. Envía un mensaje de texto de más de 100 caracteres
2. Verifica que recibes el mensaje de error con el conteo
3. Verifica en los logs que NO se procesó con Groq

**Ejemplo de Texto Largo:**
```
Este es un mensaje de prueba muy largo que excede los 100 caracteres permitidos para verificar que el sistema valida correctamente la longitud del texto antes de procesarlo con Groq y así ahorrar recursos de la API.
```
(Total: ~200 caracteres)

---

### 3. Audio Menor a 15 Segundos pero Sin Sentido

**Escenarios:**
- Audio sin sonido (silencio)
- Audio con ruido pero sin palabras
- Audio que no se puede transcribir
- Transcripción vacía o muy corta

**Comportamiento Esperado:**

#### Caso 3.1: Transcripción Vacía

**Mensaje Esperado:**
```
❌ No se pudo entender tu audio

Lo sentimos, no pudimos transcribir tu mensaje de audio.

Por favor, intenta enviarlo nuevamente hablando más claro o más cerca del micrófono. 💜
```

#### Caso 3.2: Transcripción Muy Corta (< 3 caracteres)

**Mensaje Esperado:**
```
❌ Audio no se entendió

Lo sentimos, no pudimos entender tu audio.

Por favor, intenta enviarlo nuevamente hablando más claro. 💜
```

#### Caso 3.3: Groq No Puede Extraer Datos

**Mensaje Esperado:**
```
❌ No se pudo procesar tu mensaje

Lo sentimos, no pudimos entender tu audio.

Por favor, intenta enviarlo nuevamente de forma más clara. 💜
```

**Cómo Probar:**
1. Envía un audio de menos de 15 segundos pero:
   - Sin sonido (silencio)
   - Solo ruido de fondo
   - Hablando muy bajo o muy rápido
   - En otro idioma
2. Verifica que recibes el mensaje de error apropiado
3. Verifica en los logs qué tipo de error se generó

---

## 🔍 Verificación en Logs

### Logs Esperados para Cada Caso

#### Audio > 15 segundos:
```
🔍 Validando duración de audio: { rawDuration: 20, parsedDuration: 20 }
⚠️ Audio excede límite: 20 segundos
❌ Error enviando mensaje de límite de audio: (si falla el envío)
```

#### Texto > 100 caracteres:
```
🔍 Validando límite diario: { ... }
⚠️ Texto excede límite: 150 caracteres
❌ Error enviando mensaje de límite de texto: (si falla el envío)
```

#### Transcripción vacía:
```
✅ Transcription: (vacío o muy corto)
⚠️ Transcripción vacía o sin contenido
❌ Error enviando mensaje de transcripción vacía: (si falla el envío)
```

#### Transcripción muy corta:
```
✅ Transcription: "a"
⚠️ Transcripción muy corta: a
❌ Error enviando mensaje de transcripción corta: (si falla el envío)
```

#### Groq no puede extraer datos:
```
✅ Groq multiple result: null
❌ No se pudo extraer datos del audio. Resultado vacío de Groq.
❌ Error enviando mensaje de error: (si falla el envío)
```

---

## 📊 Checklist de Pruebas

### Pruebas de Validación

- [ ] **Audio > 15 segundos:**
  - [ ] Recibe mensaje de error
  - [ ] No descarga audio de Meta
  - [ ] No transcribe con Groq Whisper
  - [ ] Logs muestran validación correcta

- [ ] **Texto > 100 caracteres:**
  - [ ] Recibe mensaje de error con conteo
  - [ ] No procesa con Groq LLM
  - [ ] Logs muestran validación correcta

- [ ] **Transcripción vacía:**
  - [ ] Recibe mensaje de error apropiado
  - [ ] No procesa con Groq LLM
  - [ ] Logs muestran transcripción vacía

- [ ] **Transcripción muy corta (< 3 caracteres):**
  - [ ] Recibe mensaje de error apropiado
  - [ ] No procesa con Groq LLM
  - [ ] Logs muestran transcripción corta

- [ ] **Groq no puede extraer datos:**
  - [ ] Recibe mensaje de error apropiado
  - [ ] No crea transacciones
  - [ ] Logs muestran resultado vacío de Groq

---

## 🧪 Casos de Prueba Específicos

### Prueba 1: Audio de 20 Segundos

**Input:** Audio de 20 segundos hablando "Gasté 100 en taxi"

**Resultado Esperado:**
- ❌ Mensaje: "El audio no puede exceder 15 segundos..."
- ❌ NO descarga audio
- ❌ NO transcribe
- ✅ Respuesta inmediata

---

### Prueba 2: Texto de 150 Caracteres

**Input:** 
```
Este es un mensaje de prueba muy largo que excede los 100 caracteres permitidos para verificar que el sistema valida correctamente la longitud del texto antes de procesarlo con Groq.
```

**Resultado Esperado:**
- ❌ Mensaje: "El texto no puede exceder 100 caracteres. Por favor, envía un mensaje más corto. (150/100 caracteres)"
- ❌ NO procesa con Groq
- ✅ Respuesta inmediata

---

### Prueba 3: Audio Silencioso

**Input:** Audio de 5 segundos sin sonido (silencio)

**Resultado Esperado:**
- ✅ Descarga audio (duración OK)
- ✅ Intenta transcribir
- ❌ Transcripción vacía o muy corta
- ❌ Mensaje: "No se pudo entender tu audio..."

---

### Prueba 4: Audio con Ruido pero Sin Palabras

**Input:** Audio de 10 segundos con ruido de fondo pero sin palabras claras

**Resultado Esperado:**
- ✅ Descarga audio (duración OK)
- ✅ Intenta transcribir
- ❌ Transcripción vacía o sin sentido
- ❌ Mensaje: "No se pudo procesar tu mensaje..." (si Groq no puede extraer datos)

---

### Prueba 5: Audio Hablando Muy Bajo

**Input:** Audio de 8 segundos hablando muy bajo o susurrando

**Resultado Esperado:**
- ✅ Descarga audio (duración OK)
- ✅ Intenta transcribir
- ❌ Transcripción vacía o muy corta
- ❌ Mensaje: "No se pudo entender tu audio..."

---

## 📝 Notas de Implementación

### Validaciones Implementadas

1. **Duración de Audio:**
   - Ubicación: `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (líneas 414-467)
   - Se valida ANTES de descargar el audio
   - Solo funciona si Meta envía `audio.duration` en el webhook

2. **Longitud de Texto:**
   - Ubicación: `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (líneas 367-389)
   - Se valida ANTES de procesar con Groq
   - Siempre funciona (el texto viene en el webhook)

3. **Transcripción Vacía:**
   - Ubicación: `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (líneas 640-680)
   - Se valida ANTES de procesar con Groq
   - Valida que no esté vacía y que tenga al menos 3 caracteres

4. **Groq No Puede Extraer Datos:**
   - Ubicación: `packages/core-api/src/app/api/webhooks/whatsapp/route.ts` (líneas 722-740)
   - Se valida DESPUÉS de procesar con Groq
   - Envía mensaje de error si el resultado está vacío

---

## 🔄 Flujo de Validaciones

### Flujo para Audio

```
1. Recibe webhook de Meta
   ↓
2. Valida duración (si está disponible)
   ├─> Si > 15 segundos → Error, NO descarga
   └─> Si OK → Continúa
   ↓
3. Descarga audio de Meta
   ↓
4. Transcribe con Groq Whisper
   ├─> Si error → Mensaje de error
   └─> Si OK → Continúa
   ↓
5. Valida transcripción
   ├─> Si vacía → Error
   ├─> Si muy corta (< 3 caracteres) → Error
   └─> Si OK → Continúa
   ↓
6. Procesa con Groq LLM
   ├─> Si resultado vacío → Error
   └─> Si OK → Crea transacción(es)
```

### Flujo para Texto

```
1. Recibe webhook de Meta
   ↓
2. Valida longitud (100 caracteres)
   ├─> Si > 100 caracteres → Error, NO procesa
   └─> Si OK → Continúa
   ↓
3. Valida transcripción (texto)
   ├─> Si vacía → Error
   ├─> Si muy corta (< 3 caracteres) → Error
   └─> Si OK → Continúa
   ↓
4. Procesa con Groq LLM
   ├─> Si resultado vacío → Error
   └─> Si OK → Crea transacción(es)
```

---

## 🎯 Resultados Esperados

### ✅ Casos Exitosos

- Audio < 15 segundos con transcripción válida → Procesa normalmente
- Texto < 100 caracteres con contenido válido → Procesa normalmente
- Audio con transcripción clara → Procesa normalmente

### ❌ Casos con Error

- Audio > 15 segundos → Mensaje de error, NO procesa
- Texto > 100 caracteres → Mensaje de error, NO procesa
- Transcripción vacía → Mensaje de error, NO procesa
- Transcripción muy corta → Mensaje de error, NO procesa
- Groq no puede extraer datos → Mensaje de error, NO procesa

---

## 📋 Checklist de Verificación

Antes de probar, verifica:

- [ ] Servidor corriendo (`npm run dev`)
- [ ] Token de WhatsApp válido
- [ ] ngrok corriendo (para webhooks)
- [ ] Webhook configurado en Meta con URL de ngrok
- [ ] Usuario registrado en Supabase

---

## 🔍 Cómo Verificar los Resultados

### 1. Verificar Mensajes Recibidos

Revisa tu WhatsApp para ver los mensajes de error o confirmación.

### 2. Verificar Logs del Servidor

Revisa la terminal donde corre `npm run dev` para ver los logs detallados.

### 3. Verificar en Supabase

Revisa las tablas:
- `predicciones_groq` - Para ver si se guardaron predicciones
- `pending_confirmations` - Para ver confirmaciones pendientes
- `transacciones` - Para ver transacciones guardadas

---

## 📝 Notas Importantes

### Limitaciones Conocidas

1. **Validación de Duración de Audio:**
   - Solo funciona si Meta envía `audio.duration` en el webhook
   - Si no lo envía, el audio se procesará normalmente
   - Meta no siempre envía `duration` en el webhook inicial

2. **Transcripción Vacía:**
   - Groq Whisper puede devolver una transcripción vacía si el audio no tiene sonido
   - El sistema valida esto y envía un mensaje de error apropiado

3. **Groq No Puede Extraer Datos:**
   - Puede ocurrir si la transcripción no tiene sentido o no contiene información de transacciones
   - El sistema envía un mensaje de error pero no bloquea el webhook

---

**Documento creado:** 2025-11-22  
**Última actualización:** 2025-11-22  
**Versión:** 1.0

