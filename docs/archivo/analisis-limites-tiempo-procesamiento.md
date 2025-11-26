# 📊 Análisis de Límites de Tiempo para Procesamiento de Transacciones

**Fecha**: 2025-01-XX  
**Estado**: ✅ Análisis Completo

---

## 🔍 RESUMEN EJECUTIVO

### ❌ **NO hay límites de tiempo de procesamiento diferentes por plan**
Todos los planes (free, smart, pro, caducado) tienen los mismos límites de tiempo de procesamiento.

### ✅ **SÍ hay límites de tamaño/duración del input**
- **Audio**: Máximo 15 segundos para TODOS los planes
- **Texto**: Máximo 100 caracteres para TODOS los planes

---

## ⏱️ LÍMITES DE TIEMPO ENCONTRADOS

### 1. **Límites de Input (Tamaño/Duración)**

#### Audio
- **Límite**: 15 segundos máximo
- **Aplicable a**: Todos los planes (free, smart, pro, caducado)
- **Ubicación**: `src/lib/planLimits.ts` (líneas 44, 68, 91, 114)
- **Validación**: `validateCanCreateTransaction()` verifica `audioDurationSeconds <= 15`

#### Texto
- **Límite**: 100 caracteres máximo
- **Aplicable a**: Todos los planes (free, smart, pro, caducado)
- **Ubicación**: `src/lib/planLimits.ts` (líneas 45, 68, 91, 114)
- **Validación**: `validateTextLength()` verifica `text.length <= 100`

---

### 2. **Timeouts de Cliente (Baileys Worker - WhatsApp)**

#### Audio desde WhatsApp
- **Timeout**: 30 segundos (30000ms)
- **Ubicación**: `ahorro365-baileys-worker/src/index.ts` (línea 107)
- **Nota**: Si el backend no responde en 30 segundos, el worker cancela la petición

#### Texto desde WhatsApp
- **Timeout**: 15 segundos (15000ms)
- **Ubicación**: `ahorro365-baileys-worker/src/index.ts` (línea 107)
- **Nota**: Timeout más corto porque no requiere transcripción

---

### 3. **Timeout de Confirmación**

#### Transacciones Pendientes
- **Timeout**: 30 minutos
- **Ubicación**: `EJEMPLOS_FLUJO_CONFIRMACION.md`
- **Comportamiento**: Si el usuario no confirma en 30 minutos, la transacción se guarda automáticamente
- **Cron Job**: `admin-dashboard/src/app/api/cron/confirm-expired/route.ts`

---

### 4. **Límites de Next.js/Vercel (Por defecto)**

#### Hobby Plan (Gratis)
- **Timeout máximo**: 10 segundos
- **Nota**: Si el procesamiento tarda más de 10 segundos, Vercel cancela la función

#### Pro Plan
- **Timeout máximo**: 60 segundos
- **Nota**: Funciones serverless pueden ejecutarse hasta 60 segundos

#### Enterprise Plan
- **Timeout máximo**: 300 segundos (5 minutos)
- **Nota**: Funciones serverless pueden ejecutarse hasta 5 minutos

**⚠️ IMPORTANTE**: Estos límites son de Vercel, no están configurados explícitamente en el código. Si estás en el plan Hobby, cualquier procesamiento que tarde más de 10 segundos fallará.

---

## 📋 ENDPOINTS DE PROCESAMIENTO

### 1. `/api/audio/process` (App)
- **No tiene timeout configurado explícitamente**
- **Depende de**: Límite de Vercel (10s Hobby, 60s Pro)
- **Procesos**:
  1. Transcripción con Groq Whisper (puede tardar 2-5 segundos)
  2. Extracción con Groq LLM (puede tardar 1-3 segundos)
  3. Guardado en BD (puede tardar 0.5-1 segundo)
- **Tiempo total estimado**: 3.5-9 segundos

### 2. `/api/webhooks/baileys` (WhatsApp - Admin Dashboard)
- **No tiene timeout configurado explícitamente**
- **Depende de**: Límite de Vercel (10s Hobby, 60s Pro)
- **Procesos**:
  1. Conversión base64 a File (instantáneo)
  2. Transcripción con Groq Whisper (si es audio, 2-5 segundos)
  3. Extracción con Groq LLM (1-3 segundos)
  4. Guardado en BD (0.5-1 segundo)
- **Tiempo total estimado**: 
  - Audio: 3.5-9 segundos
  - Texto: 1.5-4 segundos

### 3. `/api/webhooks/whatsapp` (WhatsApp - Core App)
- **No tiene timeout configurado explícitamente**
- **Depende de**: Límite de Vercel (10s Hobby, 60s Pro)
- **Procesos similares a `/api/webhooks/baileys`**

---

## ⚠️ PROBLEMAS POTENCIALES

### 1. **Plan Hobby de Vercel (10 segundos)**
Si estás usando el plan Hobby de Vercel:
- ❌ Procesamiento de audio largo (>10s) puede fallar
- ❌ Si Groq Whisper tarda mucho, puede exceder el límite
- ❌ Si hay latencia de red, puede exceder el límite

### 2. **Sin Timeout Explícito en Endpoints**
Los endpoints no tienen `maxDuration` configurado, lo que significa:
- ✅ Usan el límite por defecto de Vercel
- ⚠️ No hay control explícito del timeout
- ⚠️ No hay mensajes de error personalizados para timeouts

### 3. **Timeout del Cliente (Baileys Worker)**
El Baileys Worker tiene timeouts más cortos que Vercel:
- Audio: 30 segundos (más que suficiente para Hobby)
- Texto: 15 segundos (más que suficiente para Hobby)
- ✅ No debería haber problemas aquí

---

## 💡 RECOMENDACIONES

### 1. **Agregar `maxDuration` explícito a endpoints críticos**

```typescript
// src/app/api/audio/process/route.ts
export const maxDuration = 30; // 30 segundos

// src/app/api/webhooks/baileys/route.ts
export const maxDuration = 30; // 30 segundos
```

### 2. **Manejar errores de timeout**

```typescript
try {
  // Procesamiento
} catch (error: any) {
  if (error.message?.includes('timeout') || error.message?.includes('exceeded')) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'El procesamiento tardó demasiado. Por favor, intenta con un audio más corto o texto más breve.' 
      },
      { status: 408 } // Request Timeout
    );
  }
}
```

### 3. **Monitorear tiempos de procesamiento**

Agregar logs de tiempo de procesamiento para identificar cuellos de botella:
```typescript
const startTime = Date.now();
// ... procesamiento ...
const processingTime = Date.now() - startTime;
console.log(`⏱️ Tiempo de procesamiento: ${processingTime}ms`);
```

### 4. **Considerar upgrade a Vercel Pro**

Si los timeouts son un problema frecuente:
- Upgrade a Vercel Pro (60 segundos)
- O implementar procesamiento asíncrono con colas

---

## 📊 COMPARACIÓN POR PLAN

| Plan | Audio Max | Texto Max | Timeout Procesamiento | Timeout Confirmación |
|------|-----------|-----------|----------------------|---------------------|
| **Free** | 15s | 100 chars | Vercel default (10s/60s) | 30 min |
| **Smart** | 15s | 100 chars | Vercel default (10s/60s) | 30 min |
| **Pro** | 15s | 100 chars | Vercel default (10s/60s) | 30 min |
| **Caducado** | 15s | 100 chars | Vercel default (10s/60s) | 30 min |

**Conclusión**: ❌ **NO hay diferencias por plan en límites de tiempo de procesamiento**

---

## ✅ CONCLUSIÓN

1. **Límites de input**: 15s audio, 100 chars texto (igual para todos)
2. **Timeouts de procesamiento**: Dependen del plan de Vercel, no del plan del usuario
3. **Timeouts de cliente**: 30s audio, 15s texto (suficientes)
4. **Timeout de confirmación**: 30 minutos (igual para todos)

**Recomendación**: Agregar `maxDuration` explícito y manejo de errores de timeout para mejor UX.

# 📊 Análisis de Límites de Tiempo para Procesamiento de Transacciones

**Fecha**: 2025-01-XX  
**Estado**: ✅ Análisis Completo

---

## 🔍 RESUMEN EJECUTIVO

### ❌ **NO hay límites de tiempo de procesamiento diferentes por plan**
Todos los planes (free, smart, pro, caducado) tienen los mismos límites de tiempo de procesamiento.

### ✅ **SÍ hay límites de tamaño/duración del input**
- **Audio**: Máximo 15 segundos para TODOS los planes
- **Texto**: Máximo 100 caracteres para TODOS los planes

---

## ⏱️ LÍMITES DE TIEMPO ENCONTRADOS

### 1. **Límites de Input (Tamaño/Duración)**

#### Audio
- **Límite**: 15 segundos máximo
- **Aplicable a**: Todos los planes (free, smart, pro, caducado)
- **Ubicación**: `src/lib/planLimits.ts` (líneas 44, 68, 91, 114)
- **Validación**: `validateCanCreateTransaction()` verifica `audioDurationSeconds <= 15`

#### Texto
- **Límite**: 100 caracteres máximo
- **Aplicable a**: Todos los planes (free, smart, pro, caducado)
- **Ubicación**: `src/lib/planLimits.ts` (líneas 45, 68, 91, 114)
- **Validación**: `validateTextLength()` verifica `text.length <= 100`

---

### 2. **Timeouts de Cliente (Baileys Worker - WhatsApp)**

#### Audio desde WhatsApp
- **Timeout**: 30 segundos (30000ms)
- **Ubicación**: `ahorro365-baileys-worker/src/index.ts` (línea 107)
- **Nota**: Si el backend no responde en 30 segundos, el worker cancela la petición

#### Texto desde WhatsApp
- **Timeout**: 15 segundos (15000ms)
- **Ubicación**: `ahorro365-baileys-worker/src/index.ts` (línea 107)
- **Nota**: Timeout más corto porque no requiere transcripción

---

### 3. **Timeout de Confirmación**

#### Transacciones Pendientes
- **Timeout**: 30 minutos
- **Ubicación**: `EJEMPLOS_FLUJO_CONFIRMACION.md`
- **Comportamiento**: Si el usuario no confirma en 30 minutos, la transacción se guarda automáticamente
- **Cron Job**: `admin-dashboard/src/app/api/cron/confirm-expired/route.ts`

---

### 4. **Límites de Next.js/Vercel (Por defecto)**

#### Hobby Plan (Gratis)
- **Timeout máximo**: 10 segundos
- **Nota**: Si el procesamiento tarda más de 10 segundos, Vercel cancela la función

#### Pro Plan
- **Timeout máximo**: 60 segundos
- **Nota**: Funciones serverless pueden ejecutarse hasta 60 segundos

#### Enterprise Plan
- **Timeout máximo**: 300 segundos (5 minutos)
- **Nota**: Funciones serverless pueden ejecutarse hasta 5 minutos

**⚠️ IMPORTANTE**: Estos límites son de Vercel, no están configurados explícitamente en el código. Si estás en el plan Hobby, cualquier procesamiento que tarde más de 10 segundos fallará.

---

## 📋 ENDPOINTS DE PROCESAMIENTO

### 1. `/api/audio/process` (App)
- **No tiene timeout configurado explícitamente**
- **Depende de**: Límite de Vercel (10s Hobby, 60s Pro)
- **Procesos**:
  1. Transcripción con Groq Whisper (puede tardar 2-5 segundos)
  2. Extracción con Groq LLM (puede tardar 1-3 segundos)
  3. Guardado en BD (puede tardar 0.5-1 segundo)
- **Tiempo total estimado**: 3.5-9 segundos

### 2. `/api/webhooks/baileys` (WhatsApp - Admin Dashboard)
- **No tiene timeout configurado explícitamente**
- **Depende de**: Límite de Vercel (10s Hobby, 60s Pro)
- **Procesos**:
  1. Conversión base64 a File (instantáneo)
  2. Transcripción con Groq Whisper (si es audio, 2-5 segundos)
  3. Extracción con Groq LLM (1-3 segundos)
  4. Guardado en BD (0.5-1 segundo)
- **Tiempo total estimado**: 
  - Audio: 3.5-9 segundos
  - Texto: 1.5-4 segundos

### 3. `/api/webhooks/whatsapp` (WhatsApp - Core App)
- **No tiene timeout configurado explícitamente**
- **Depende de**: Límite de Vercel (10s Hobby, 60s Pro)
- **Procesos similares a `/api/webhooks/baileys`**

---

## ⚠️ PROBLEMAS POTENCIALES

### 1. **Plan Hobby de Vercel (10 segundos)**
Si estás usando el plan Hobby de Vercel:
- ❌ Procesamiento de audio largo (>10s) puede fallar
- ❌ Si Groq Whisper tarda mucho, puede exceder el límite
- ❌ Si hay latencia de red, puede exceder el límite

### 2. **Sin Timeout Explícito en Endpoints**
Los endpoints no tienen `maxDuration` configurado, lo que significa:
- ✅ Usan el límite por defecto de Vercel
- ⚠️ No hay control explícito del timeout
- ⚠️ No hay mensajes de error personalizados para timeouts

### 3. **Timeout del Cliente (Baileys Worker)**
El Baileys Worker tiene timeouts más cortos que Vercel:
- Audio: 30 segundos (más que suficiente para Hobby)
- Texto: 15 segundos (más que suficiente para Hobby)
- ✅ No debería haber problemas aquí

---

## 💡 RECOMENDACIONES

### 1. **Agregar `maxDuration` explícito a endpoints críticos**

```typescript
// src/app/api/audio/process/route.ts
export const maxDuration = 30; // 30 segundos

// src/app/api/webhooks/baileys/route.ts
export const maxDuration = 30; // 30 segundos
```

### 2. **Manejar errores de timeout**

```typescript
try {
  // Procesamiento
} catch (error: any) {
  if (error.message?.includes('timeout') || error.message?.includes('exceeded')) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'El procesamiento tardó demasiado. Por favor, intenta con un audio más corto o texto más breve.' 
      },
      { status: 408 } // Request Timeout
    );
  }
}
```

### 3. **Monitorear tiempos de procesamiento**

Agregar logs de tiempo de procesamiento para identificar cuellos de botella:
```typescript
const startTime = Date.now();
// ... procesamiento ...
const processingTime = Date.now() - startTime;
console.log(`⏱️ Tiempo de procesamiento: ${processingTime}ms`);
```

### 4. **Considerar upgrade a Vercel Pro**

Si los timeouts son un problema frecuente:
- Upgrade a Vercel Pro (60 segundos)
- O implementar procesamiento asíncrono con colas

---

## 📊 COMPARACIÓN POR PLAN

| Plan | Audio Max | Texto Max | Timeout Procesamiento | Timeout Confirmación |
|------|-----------|-----------|----------------------|---------------------|
| **Free** | 15s | 100 chars | Vercel default (10s/60s) | 30 min |
| **Smart** | 15s | 100 chars | Vercel default (10s/60s) | 30 min |
| **Pro** | 15s | 100 chars | Vercel default (10s/60s) | 30 min |
| **Caducado** | 15s | 100 chars | Vercel default (10s/60s) | 30 min |

**Conclusión**: ❌ **NO hay diferencias por plan en límites de tiempo de procesamiento**

---

## ✅ CONCLUSIÓN

1. **Límites de input**: 15s audio, 100 chars texto (igual para todos)
2. **Timeouts de procesamiento**: Dependen del plan de Vercel, no del plan del usuario
3. **Timeouts de cliente**: 30s audio, 15s texto (suficientes)
4. **Timeout de confirmación**: 30 minutos (igual para todos)

**Recomendación**: Agregar `maxDuration` explícito y manejo de errores de timeout para mejor UX.

