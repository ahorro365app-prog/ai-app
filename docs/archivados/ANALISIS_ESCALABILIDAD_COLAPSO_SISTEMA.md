# 🔍 Análisis de Escalabilidad y Riesgo de Colapso

> **Fecha:** 2025-01-22  
> **Objetivo:** Analizar probabilidades de colapso del sistema ante picos de carga

---

## 📊 Resumen Ejecutivo

### Probabilidad de Colapso: **MEDIA-ALTA** ⚠️

**Razones:**
1. ⚠️ **Sin cola de procesamiento** (procesamiento síncrono)
2. ⚠️ **Límites de Vercel** (10 segundos por request)
3. ⚠️ **Límites de APIs externas** (Groq, WhatsApp)
4. ⚠️ **Rate limiting básico** (100 req/15min por IP)
5. ⚠️ **Sin reintentos automáticos** para APIs externas

---

## 🔴 Cuellos de Botella Identificados

### 1. **Vercel Function Timeout** ⚠️ CRÍTICO

**Límite Actual:**
- `maxDuration: 10 segundos` (configurado en `vercel.json`)

**Problema:**
- Si un webhook tarda más de 10 segundos, Vercel lo cancela
- Esto puede pasar si:
  - Groq API es lenta (>3 segundos)
  - Descarga de audio es lenta (>2 segundos)
  - Supabase es lenta (>2 segundos)
  - Procesamiento múltiple (>3 segundos)

**Escenario de Colapso:**
```
100 usuarios envían audio simultáneamente
→ 100 webhooks procesándose
→ Cada uno tarda ~8-12 segundos
→ Vercel cancela los que exceden 10s
→ Usuarios no reciben respuesta
→ Meta reintenta (más carga)
→ Sistema colapsa
```

**Probabilidad:** 🔴 **ALTA** (con 50+ usuarios simultáneos)

---

### 2. **Groq API Rate Limits** ⚠️ CRÍTICO

**Límites de Groq:**
- **Free tier:** ~30 requests/minuto
- **Paid tier:** Varía según plan
- **Rate limit error:** 429 (Too Many Requests)

**Problema Actual:**
- ❌ **No hay manejo de rate limit 429**
- ❌ **No hay cola de espera**
- ❌ **No hay reintentos automáticos**
- ❌ **Falla inmediata si Groq rechaza**

**Código Actual:**
```typescript
// packages/core-api/src/services/groqService.ts
const response = await fetch(GROQ_ENDPOINT, { ... });
if (!response.ok) {
  throw new Error(`Groq API error: ${response.status}`);
}
// ❌ Si es 429, falla inmediatamente
```

**Escenario de Colapso:**
```
50 usuarios envían audio en 1 minuto
→ 50 requests a Groq
→ Groq rechaza 20 (rate limit)
→ 20 usuarios no reciben respuesta
→ Meta reintenta (más requests)
→ Más rate limits
→ Sistema colapsa
```

**Probabilidad:** 🔴 **ALTA** (con 30+ usuarios/minuto)

---

### 3. **WhatsApp Cloud API Rate Limits** ⚠️ MEDIO

**Límites de WhatsApp:**
- **Tier 1 (0-1000 usuarios):** 1,000 conversaciones/24h
- **Tier 2 (1000-10k usuarios):** 10,000 conversaciones/24h
- **Rate limit:** 429 (Too Many Requests)

**Problema Actual:**
- ⚠️ **Manejo básico de errores**
- ❌ **No hay cola de mensajes**
- ❌ **No hay reintentos con backoff**

**Escenario de Colapso:**
```
100 usuarios confirman simultáneamente
→ 100 mensajes de WhatsApp
→ WhatsApp rechaza algunos (rate limit)
→ Usuarios no reciben confirmación
→ Intentan confirmar de nuevo
→ Más rate limits
→ Sistema colapsa
```

**Probabilidad:** 🟡 **MEDIA** (con 100+ usuarios simultáneos)

---

### 4. **Supabase Connection Pool** ⚠️ MEDIO

**Límites de Supabase:**
- **Free tier:** 50 conexiones simultáneas
- **Pro tier:** 200 conexiones simultáneas
- **Connection timeout:** 30 segundos

**Problema Actual:**
- ⚠️ **Cada request abre nueva conexión**
- ⚠️ **Sin pool de conexiones optimizado**
- ⚠️ **Sin manejo de timeouts**

**Escenario de Colapso:**
```
200 webhooks simultáneos
→ 200 conexiones a Supabase
→ Free tier: solo 50 conexiones
→ 150 requests esperan
→ Timeout después de 30s
→ Sistema colapsa
```

**Probabilidad:** 🟡 **MEDIA** (con 50+ conexiones simultáneas en free tier)

---

### 5. **Rate Limiting Básico** ⚠️ MEDIO

**Límite Actual:**
- **Webhooks:** 100 requests / 15 minutos por IP
- **Problema:** Usa IP, no número de teléfono

**Problema:**
- ⚠️ **Meta envía desde misma IP** (todos los webhooks comparten IP)
- ⚠️ **Rate limit por IP afecta a todos los usuarios**
- ⚠️ **No diferencia entre usuarios**

**Escenario de Colapso:**
```
100 usuarios envían mensaje en 15 minutos
→ 100 webhooks desde misma IP (Meta)
→ Rate limit: 100/15min
→ 101° webhook rechazado
→ Usuario no recibe respuesta
→ Meta reintenta
→ Sistema colapsa
```

**Probabilidad:** 🟡 **MEDIA** (con 100+ usuarios/15min)

---

## 🚨 Problemas Potenciales

### 1. **Pérdida de Mensajes** 🔴

**Causa:**
- Timeout de Vercel (10s)
- Rate limit de Groq (429)
- Error en Supabase

**Impacto:**
- Usuario envía mensaje pero no se procesa
- No hay confirmación
- Usuario confundido

**Probabilidad:** 🔴 **ALTA**

---

### 2. **Mensajes Duplicados** 🟡

**Causa:**
- Meta reintenta webhooks fallidos
- Deduplicación falla si `wa_message_id` no está disponible
- Race conditions en base de datos

**Impacto:**
- Transacciones duplicadas
- Usuario confundido

**Probabilidad:** 🟡 **MEDIA**

---

### 3. **Timeout de Confirmaciones** 🟡

**Causa:**
- Cron job procesa 5 transacciones/minuto
- Si hay 100 transacciones pendientes, tarda 20 minutos
- Algunas se procesan después de 30 minutos

**Impacto:**
- Transacciones se guardan automáticamente sin confirmación
- Usuario no puede confirmar a tiempo

**Probabilidad:** 🟡 **MEDIA**

---

### 4. **Costo Excesivo** 🟡

**Causa:**
- Groq API: cada request cuesta
- Si hay rate limits, Meta reintenta
- Más requests = más costo

**Impacto:**
- Costos inesperados
- Presupuesto excedido

**Probabilidad:** 🟡 **MEDIA**

---

## 💡 Soluciones Propuestas

### 1. **Cola de Procesamiento (Queue)** ✅ RECOMENDADO

**Solución:**
- Usar **BullMQ** o **Inngest** para cola de procesamiento
- Webhook recibe mensaje → Encola → Responde 200 inmediatamente
- Worker procesa en background

**Beneficios:**
- ✅ No hay timeouts de Vercel
- ✅ Puede procesar miles de mensajes
- ✅ Reintentos automáticos
- ✅ Priorización

**Implementación:**
```typescript
// Webhook recibe y encola
await queue.add('process-whatsapp-message', {
  wa_message_id,
  phoneNumber,
  messageType,
  audioId
});

// Responde inmediatamente
return NextResponse.json({ status: 'queued' }, { status: 200 });

// Worker procesa en background
worker.process('process-whatsapp-message', async (job) => {
  // Procesar sin límite de tiempo
});
```

**Costo:** ~$10-20/mes (Redis + Worker)

**Prioridad:** 🔴 **ALTA**

---

### 2. **Manejo de Rate Limits de Groq** ✅ RECOMENDADO

**Solución:**
- Detectar error 429
- Encolar request para reintento
- Usar exponential backoff

**Implementación:**
```typescript
async function callGroqWithRetry(text: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(GROQ_ENDPOINT, { ... });
      
      if (response.status === 429) {
        // Rate limit: esperar y reintentar
        const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (!response.ok) throw new Error(`Groq error: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

**Prioridad:** 🔴 **ALTA**

---

### 3. **Rate Limiting Mejorado** ✅ RECOMENDADO

**Solución:**
- Rate limit por número de teléfono, no por IP
- Límites más altos para usuarios registrados
- Límites más bajos para usuarios no registrados

**Implementación:**
```typescript
// Rate limit por teléfono
const identifier = phoneNumber; // En lugar de IP
const rateLimitResult = await checkRateLimit(webhookRateLimit, identifier);

// Límites diferenciados
const userRateLimit = user ? userRateLimit : anonymousRateLimit;
```

**Prioridad:** 🟡 **MEDIA**

---

### 4. **Connection Pooling de Supabase** ✅ RECOMENDADO

**Solución:**
- Usar connection pooler de Supabase
- Configurar límites de conexiones
- Reutilizar conexiones

**Implementación:**
```typescript
// Usar connection pooler
const supabaseUrl = process.env.SUPABASE_URL.replace('supabase.co', 'pooler.supabase.com');
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});
```

**Prioridad:** 🟡 **MEDIA**

---

### 5. **Monitoreo y Alertas** ✅ RECOMENDADO

**Solución:**
- Monitorear rate limits
- Alertar cuando hay muchos errores
- Dashboard de métricas

**Implementación:**
- Sentry para errores
- Vercel Analytics para métricas
- Custom dashboard para rate limits

**Prioridad:** 🟢 **BAJA** (pero importante)

---

## 📊 Matriz de Riesgo

| Escenario | Probabilidad | Impacto | Prioridad |
|-----------|--------------|---------|-----------|
| **Timeout Vercel (10s)** | 🔴 Alta | 🔴 Alto | 🔴 Crítica |
| **Rate Limit Groq (429)** | 🔴 Alta | 🔴 Alto | 🔴 Crítica |
| **Rate Limit WhatsApp** | 🟡 Media | 🟡 Medio | 🟡 Media |
| **Supabase Connections** | 🟡 Media | 🟡 Medio | 🟡 Media |
| **Rate Limiting Básico** | 🟡 Media | 🟡 Medio | 🟡 Media |
| **Pérdida de Mensajes** | 🔴 Alta | 🔴 Alto | 🔴 Crítica |
| **Mensajes Duplicados** | 🟡 Media | 🟡 Medio | 🟡 Media |

---

## 🎯 Plan de Acción Recomendado

### Fase 1: Crítico (Inmediato)
1. ✅ **Manejo de Rate Limits de Groq** (1-2 días)
   - Detectar 429
   - Reintentos con backoff
   - Mensaje al usuario

2. ✅ **Cola de Procesamiento** (3-5 días)
   - Implementar BullMQ o Inngest
   - Mover procesamiento a background
   - Eliminar límite de 10s

### Fase 2: Importante (1-2 semanas)
3. ✅ **Rate Limiting Mejorado** (2-3 días)
   - Por teléfono, no IP
   - Límites diferenciados

4. ✅ **Connection Pooling** (1-2 días)
   - Configurar pooler de Supabase
   - Optimizar conexiones

### Fase 3: Mejoras (1 mes)
5. ✅ **Monitoreo y Alertas** (3-5 días)
   - Dashboard de métricas
   - Alertas automáticas

---

## 💰 Costos de Soluciones

| Solución | Costo/Mes | Beneficio |
|----------|-----------|-----------|
| **BullMQ + Redis** | $10-20 | ✅ Elimina timeouts |
| **Groq Paid Tier** | $20-50 | ✅ Más rate limits |
| **Supabase Pro** | $25 | ✅ Más conexiones |
| **Monitoreo (Sentry)** | $0-26 | ✅ Visibilidad |

**Total:** ~$55-121/mes para sistema robusto

---

## 📈 Capacidad Actual vs. Esperada

### Capacidad Actual (Sin Mejoras)
- **Usuarios simultáneos:** ~10-20
- **Mensajes/minuto:** ~20-30
- **Riesgo de colapso:** 🔴 **ALTO**

### Capacidad con Mejoras
- **Usuarios simultáneos:** ~500-1000
- **Mensajes/minuto:** ~500-1000
- **Riesgo de colapso:** 🟢 **BAJO**

---

## ✅ Conclusión

### Estado Actual
⚠️ **Sistema vulnerable a colapsos** con 30+ usuarios simultáneos

### Recomendación
🔴 **Implementar cola de procesamiento** (Fase 1) antes de escalar

### Prioridad
1. Manejo de rate limits de Groq (inmediato)
2. Cola de procesamiento (esta semana)
3. Rate limiting mejorado (próxima semana)

---

**Documento creado:** 2025-01-22  
**Última actualización:** 2025-01-22

