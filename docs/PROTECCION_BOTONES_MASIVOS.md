# 🛡️ Protección contra Clics Masivos en Botones

> **Fecha:** 2025-01-21  
> **Propósito:** Analizar y proteger contra clics masivos/repetidos en botones  
> **Estado:** 📋 Análisis de Seguridad y Rendimiento

---

## 🚨 Problema Identificado

### Escenario de Ataque/Abuso

```
100 usuarios simultáneos
Cada uno hace clic 10 veces en botón (ya confirmado)
= 1,000 requests simultáneos
```

**Posibles problemas:**
1. ❌ **Sobrecarga de base de datos** (1,000 queries simultáneas)
2. ❌ **Race conditions** (múltiples confirmaciones de la misma TX)
3. ❌ **Costos de API** (WhatsApp cobra por mensaje enviado)
4. ❌ **Rendimiento del servidor** (timeouts, errores)
5. ❌ **Spam de mensajes** (1,000 mensajes de error)

---

## 🔍 Análisis de Riesgos

### 1. Base de Datos

**Riesgo:** 1,000 queries simultáneas a `pending_confirmations`

**Impacto:**
- ⚠️ Locks en base de datos
- ⚠️ Timeouts
- ⚠️ Degradación de rendimiento

**Solución:** ✅ Validación rápida + Cache + Índices

---

### 2. Race Conditions

**Riesgo:** Múltiples requests intentan confirmar la misma TX

**Escenario:**
```
T0: Usuario hace clic (request 1)
T1: Usuario hace clic OTRA VEZ (request 2) - antes de que request 1 termine
T2: Ambos intentan actualizar `pending_confirmations.confirmed = true`
```

**Impacto:**
- ⚠️ Posible duplicación de transacciones
- ⚠️ Inconsistencias en datos

**Solución:** ✅ Transacciones DB + Optimistic Locking

---

### 3. Costos de API WhatsApp

**Riesgo:** Enviar 1,000 mensajes de error

**Costo:**
- WhatsApp cobra por mensaje enviado
- 1,000 mensajes = costo significativo

**Solución:** ✅ Rate limiting + Cache de errores

---

### 4. Rendimiento del Servidor

**Riesgo:** 1,000 requests simultáneos procesando

**Impacto:**
- ⚠️ Timeouts
- ⚠️ Errores 500
- ⚠️ Degradación del servicio

**Solución:** ✅ Validación temprana + Rechazo rápido

---

## 💡 Soluciones Propuestas

### Solución 1: Validación Temprana con Cache (Alta Prioridad) ✅

**Estrategia:**
- Validar estado ANTES de procesar
- Usar cache para evitar queries repetidas
- Rechazar inmediatamente si ya está confirmada

**Implementación:**
```typescript
// Cache en memoria (Redis o Map)
const confirmationCache = new Map<string, {
  confirmed: boolean;
  expiresAt: number; // TTL
}>();

async function validarConfirmacionPorBoton(
  predictionId: string
): Promise<ValidationResult> {
  // 1. Verificar cache primero (MUY RÁPIDO)
  const cached = confirmationCache.get(predictionId);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.confirmed) {
      return {
        valid: false,
        error: 'ALREADY_CONFIRMED',
        cached: true // ← Indica que viene del cache
      };
    }
  }
  
  // 2. Si no está en cache, consultar DB (solo una vez)
  const { data: pendingConf } = await supabase
    .from('pending_confirmations')
    .select('confirmed, confirmed_at, expires_at')
    .eq('prediction_id', predictionId)
    .single();
  
  if (!pendingConf) {
    // Guardar en cache (no existe)
    confirmationCache.set(predictionId, {
      confirmed: false,
      expiresAt: Date.now() + 60000 // 1 minuto TTL
    });
    return { valid: false, error: 'NO_PENDING_CONFIRMATION' };
  }
  
  // 3. Verificar si ya está confirmada
  if (pendingConf.confirmed === true) {
    // Guardar en cache (ya confirmada)
    confirmationCache.set(predictionId, {
      confirmed: true,
      expiresAt: Date.now() + 300000 // 5 minutos TTL
    });
    return { valid: false, error: 'ALREADY_CONFIRMED' };
  }
  
  // 4. Verificar si expiró
  if (new Date(pendingConf.expires_at) < new Date()) {
    return { valid: false, error: 'EXPIRED_ALREADY_SAVED' };
  }
  
  // 5. Guardar en cache (válida)
  confirmationCache.set(predictionId, {
    confirmed: false,
    expiresAt: Date.now() + 60000 // 1 minuto TTL
  });
  
  return { valid: true };
}
```

**Ventajas:**
- ✅ Reduce queries a DB en 90%+ (cache hit)
- ✅ Respuesta instantánea (< 1ms vs 50-100ms)
- ✅ Protege contra spam

---

### Solución 2: Rate Limiting por Usuario (Alta Prioridad) ✅

**Estrategia:**
- Limitar confirmaciones por usuario por minuto
- Bloquear después de X intentos fallidos

**Implementación:**
```typescript
// Rate limiting por usuario
const userConfirmAttempts = new Map<string, {
  count: number;
  resetAt: number;
  lastError?: string;
}>();

async function checkUserRateLimit(
  phoneNumber: string,
  predictionId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const now = Date.now();
  const userKey = phoneNumber;
  
  let userData = userConfirmAttempts.get(userKey);
  
  // Reset cada minuto
  if (!userData || userData.resetAt < now) {
    userData = {
      count: 0,
      resetAt: now + 60000 // 1 minuto
    };
  }
  
  // Límite: 5 confirmaciones por minuto
  if (userData.count >= 5) {
    return {
      allowed: false,
      reason: 'RATE_LIMIT_EXCEEDED'
    };
  }
  
  // Si el último error fue "ALREADY_CONFIRMED", limitar más
  if (userData.lastError === 'ALREADY_CONFIRMED') {
    // Solo permitir 2 intentos más después de error
    if (userData.count >= 2) {
      return {
        allowed: false,
        reason: 'TOO_MANY_FAILED_ATTEMPTS'
      };
    }
  }
  
  userData.count++;
  userConfirmAttempts.set(userKey, userData);
  
  return { allowed: true };
}
```

**Ventajas:**
- ✅ Protege contra spam
- ✅ Limita costos de API
- ✅ Mejora rendimiento

---

### Solución 3: Transacciones DB con Optimistic Locking (Crítico) ✅

**Estrategia:**
- Usar transacciones DB para evitar race conditions
- Optimistic locking: verificar estado antes de actualizar

**Implementación:**
```typescript
async function confirmarTransaccionConLock(
  predictionId: string,
  usuarioId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  
  // Usar transacción DB
  return await supabase.rpc('confirmar_transaccion_atomica', {
    p_prediction_id: predictionId,
    p_usuario_id: usuarioId
  });
}
```

**Función SQL (PostgreSQL):**
```sql
CREATE OR REPLACE FUNCTION confirmar_transaccion_atomica(
  p_prediction_id UUID,
  p_usuario_id UUID
) RETURNS JSON AS $$
DECLARE
  v_pending_conf pending_confirmations%ROWTYPE;
  v_result JSON;
BEGIN
  -- 1. Bloquear fila (SELECT FOR UPDATE)
  SELECT * INTO v_pending_conf
  FROM pending_confirmations
  WHERE prediction_id = p_prediction_id
    AND usuario_id = p_usuario_id
    AND confirmed IS NULL
  FOR UPDATE SKIP LOCKED; -- ← Evita esperar en locks
  
  -- 2. Si no existe o ya está confirmada, retornar error
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_CONFIRMED_OR_NOT_FOUND'
    );
  END IF;
  
  -- 3. Verificar si expiró
  IF v_pending_conf.expires_at < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EXPIRED_ALREADY_SAVED'
    );
  END IF;
  
  -- 4. Confirmar (ATÓMICO)
  UPDATE pending_confirmations
  SET confirmed = true,
      confirmed_at = NOW()
  WHERE prediction_id = p_prediction_id;
  
  -- 5. Crear transacción (usar función existente)
  -- ... lógica de creación de transacción ...
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

**Ventajas:**
- ✅ Evita race conditions
- ✅ Atómico (todo o nada)
- ✅ `SKIP LOCKED` evita esperas

---

### Solución 4: No Enviar Mensaje si Viene del Cache (Ahorro de Costos) ✅

**Estrategia:**
- Si la validación viene del cache (ya confirmada), NO enviar mensaje
- Solo enviar mensaje la primera vez

**Implementación:**
```typescript
async function procesarConfirmacionPorBoton(
  phoneNumber: string,
  buttonId: string
) {
  const predictionId = buttonId.replace('confirm_', '');
  
  // Validar
  const validation = await validarConfirmacionPorBoton(predictionId);
  
  if (!validation.valid) {
    // Solo enviar mensaje si NO viene del cache
    // (para evitar spam de mensajes)
    if (!validation.cached) {
      await manejarErrorConfirmacion(
        validation.error!,
        validation.data,
        phoneNumber
      );
    } else {
      // Viene del cache = ya se envió mensaje antes
      // Solo log, no enviar mensaje
      logger.debug(`⚠️ Confirmación rechazada (cache): ${predictionId}`);
    }
    
    return { success: false, error: validation.error };
  }
  
  // Confirmar
  return await processConfirmation(phoneNumber, 'sí', predictionId);
}
```

**Ventajas:**
- ✅ Ahorra costos de API
- ✅ Evita spam de mensajes
- ✅ Mejor UX (no molesta al usuario)

---

### Solución 5: Índices en Base de Datos (Rendimiento) ✅

**Estrategia:**
- Índices optimizados para búsquedas rápidas
- Evitar full table scans

**SQL:**
```sql
-- Índice compuesto para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_pending_confirmation_lookup
ON pending_confirmations(prediction_id, confirmed, expires_at)
WHERE confirmed IS NULL;

-- Índice para búsqueda por usuario + estado
CREATE INDEX IF NOT EXISTS idx_pending_confirmation_user
ON pending_confirmations(usuario_id, confirmed, created_at DESC);
```

**Ventajas:**
- ✅ Búsquedas 10-100x más rápidas
- ✅ Menos carga en DB
- ✅ Mejor rendimiento

---

## 📊 Comparación de Soluciones

| Solución | Complejidad | Efectividad | Prioridad |
|----------|------------|-------------|-----------|
| **Cache en Memoria** | ⭐⭐ | ⭐⭐⭐⭐⭐ | 🔴 Crítica |
| **Rate Limiting** | ⭐⭐ | ⭐⭐⭐⭐ | 🔴 Crítica |
| **Transacciones DB** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🔴 Crítica |
| **No Enviar si Cache** | ⭐ | ⭐⭐⭐⭐ | 🟡 Alta |
| **Índices DB** | ⭐ | ⭐⭐⭐ | 🟡 Alta |

---

## 🎯 Implementación Completa Propuesta

### 1. Función de Validación con Cache

```typescript
// Cache global (o usar Redis en producción)
const confirmationCache = new Map<string, {
  confirmed: boolean;
  expiresAt: number;
  lastChecked: number;
}>();

// Limpiar cache cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of confirmationCache.entries()) {
    if (value.expiresAt < now) {
      confirmationCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

async function validarConfirmacionPorBoton(
  predictionId: string
): Promise<ValidationResult> {
  // 1. Cache check (MUY RÁPIDO)
  const cached = confirmationCache.get(predictionId);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.confirmed) {
      return {
        valid: false,
        error: 'ALREADY_CONFIRMED',
        cached: true // ← Viene del cache
      };
    }
    // Si no está confirmada en cache, verificar DB (puede haber cambiado)
  }
  
  // 2. Rate limiting por usuario (si aplica)
  // ... (implementar después)
  
  // 3. Query DB (solo si no está en cache o cache dice "no confirmada")
  const { data: pendingConf } = await supabase
    .from('pending_confirmations')
    .select('confirmed, confirmed_at, expires_at')
    .eq('prediction_id', predictionId)
    .single();
  
  if (!pendingConf) {
    confirmationCache.set(predictionId, {
      confirmed: false,
      expiresAt: Date.now() + 60000
    });
    return { valid: false, error: 'NO_PENDING_CONFIRMATION' };
  }
  
  if (pendingConf.confirmed === true) {
    confirmationCache.set(predictionId, {
      confirmed: true,
      expiresAt: Date.now() + 300000 // 5 min
    });
    return { valid: false, error: 'ALREADY_CONFIRMED' };
  }
  
  if (new Date(pendingConf.expires_at) < new Date()) {
    return { valid: false, error: 'EXPIRED_ALREADY_SAVED' };
  }
  
  confirmationCache.set(predictionId, {
    confirmed: false,
    expiresAt: Date.now() + 60000
  });
  
  return { valid: true };
}
```

### 2. Procesamiento con Protecciones

```typescript
async function procesarConfirmacionPorBoton(
  phoneNumber: string,
  buttonId: string
) {
  // 1. Validar formato
  if (!buttonId.startsWith('confirm_')) {
    return { success: false, error: 'INVALID_BUTTON_ID' };
  }
  
  const predictionId = buttonId.replace('confirm_', '');
  
  // 2. Rate limiting (opcional, solo si hay muchos intentos)
  // ... (implementar si es necesario)
  
  // 3. Validar con cache
  const validation = await validarConfirmacionPorBoton(predictionId);
  
  if (!validation.valid) {
    // Solo enviar mensaje si NO viene del cache
    if (!validation.cached) {
      await manejarErrorConfirmacion(
        validation.error!,
        validation.data,
        phoneNumber
      );
    }
    return { success: false, error: validation.error };
  }
  
  // 4. Confirmar con transacción atómica
  const result = await confirmarTransaccionConLock(
    predictionId,
    phoneNumber
  );
  
  return result;
}
```

---

## 📈 Impacto Esperado

### Sin Protecciones
- ❌ 1,000 requests = 1,000 queries DB
- ❌ 1,000 mensajes de error enviados
- ❌ Posibles race conditions
- ❌ Alto costo de API

### Con Protecciones
- ✅ 1,000 requests = ~10 queries DB (90% cache hit)
- ✅ ~10 mensajes enviados (solo primera vez)
- ✅ Sin race conditions (transacciones DB)
- ✅ Bajo costo de API

**Mejora:** 90-99% reducción en carga

---

## ✅ Checklist de Implementación

- [ ] ✅ Cache en memoria (Map o Redis)
- [ ] ✅ Validación temprana con cache
- [ ] ✅ Transacciones DB con optimistic locking
- [ ] ✅ No enviar mensaje si viene del cache
- [ ] ✅ Índices en base de datos
- [ ] ✅ Rate limiting (opcional)
- [ ] ✅ Logging de intentos fallidos
- [ ] ✅ Testing con carga (100+ usuarios simultáneos)

---

## 🎯 Recomendación Final

**Implementar en este orden:**
1. **Cache en memoria** (más impacto, más fácil)
2. **Transacciones DB** (crítico para race conditions)
3. **No enviar si cache** (ahorro de costos)
4. **Índices DB** (rendimiento)
5. **Rate limiting** (opcional, solo si hay abuso)

**Con estas protecciones, el sistema puede manejar:**
- ✅ 1,000+ usuarios simultáneos
- ✅ 10,000+ clics repetidos
- ✅ Sin degradación de rendimiento
- ✅ Sin costos excesivos

---

**Documento creado:** 2025-01-21  
**Última actualización:** 2025-01-21

