# ⏱️ Análisis Real: Tiempo de Ejecución del Cron

> **Fecha:** 2025-01-22  
> **Pregunta:** ¿El tiempo depende de cuántas transacciones expiradas haya?  
> **Respuesta:** ✅ **SÍ, el tiempo SÍ depende de la cantidad**

---

## 🔍 Análisis del Código del Cron

### Operaciones por Transacción Expirada

Para cada transacción expirada, el cron ejecuta:

1. **Obtener predicción de BD** (~0.1-0.2s)
   ```typescript
   await supabase.from('predicciones_groq').select(...).eq('id', exp.prediction_id).single();
   ```

2. **Obtener usuario de BD** (~0.1-0.2s)
   ```typescript
   await supabase.from('usuarios').select('telefono, country_code').eq('id', usuario_id).single();
   ```

3. **Actualizar predicción** (~0.1-0.2s)
   ```typescript
   await supabase.from('predicciones_groq').update({ confirmado: true, ... }).eq('id', exp.prediction_id);
   ```

4. **Crear transacción** (~0.1-0.2s)
   ```typescript
   await supabase.from('transacciones').insert({ ... });
   ```

5. **Actualizar pending_confirmations** (~0.1-0.2s)
   ```typescript
   await supabase.from('pending_confirmations').update({ confirmed: true, ... }).eq('id', exp.id);
   ```

6. **Agrupar para mensajes** (en memoria, ~0.001s)

**Total por transacción:** ~0.5-1 segundo

### Operaciones Adicionales

Después de procesar todas las transacciones:

7. **Enviar mensajes WhatsApp** (1 mensaje por usuario)
   - Tiempo: ~0.5-2 segundos por mensaje
   - Si hay 10 usuarios: ~5-20 segundos

---

## 📊 Cálculo de Tiempo Real

### Escenario 1: Sin Transacciones Expiradas
```
Consulta BD: ~0.2s
Respuesta: ~0.1s
Total: ~0.3 segundos = 0.005 minutos
```

### Escenario 2: 1 Transacción Expirada
```
Consulta BD: ~0.2s
Procesar 1 transacción: ~0.8s
Enviar 1 mensaje: ~1s
Total: ~2 segundos = 0.033 minutos
```

### Escenario 3: 10 Transacciones Expiradas (mismo usuario)
```
Consulta BD: ~0.2s
Procesar 10 transacciones: ~8s (10 × 0.8s)
Enviar 1 mensaje (agrupado): ~1s
Total: ~9.2 segundos = 0.153 minutos
```

### Escenario 4: 100 Transacciones Expiradas (10 usuarios)
```
Consulta BD: ~0.2s
Procesar 100 transacciones: ~80s (100 × 0.8s)
Enviar 10 mensajes: ~10s (10 × 1s)
Total: ~90 segundos = 1.5 minutos
```

### Escenario 5: 1,000 Transacciones Expiradas (100 usuarios)
```
Consulta BD: ~0.2s
Procesar 1,000 transacciones: ~800s (1,000 × 0.8s)
Enviar 100 mensajes: ~100s (100 × 1s)
Total: ~900 segundos = 15 minutos
```

---

## 📈 Proyección para 1 Millón de Usuarios

### Suposiciones
- **Usuarios activos/día:** 100,000
- **Transacciones/día:** 500,000
- **Confirmaciones pendientes/día:** 300,000
- **Timeouts/día:** 200,000 (40% no confirman)
- **Timeouts/minuto:** ~139 transacciones (200,000 / 1,440 minutos)

### Tiempo por Ejecución del Cron

#### Caso Promedio (139 transacciones/minuto)
```
Consulta BD: ~0.2s
Procesar 139 transacciones: ~111s (139 × 0.8s)
Enviar ~14 mensajes (agrupados): ~14s
Total: ~125 segundos = 2.08 minutos
```

#### Caso Pico (500 transacciones/minuto)
```
Consulta BD: ~0.2s
Procesar 500 transacciones: ~400s (500 × 0.8s)
Enviar ~50 mensajes: ~50s
Total: ~450 segundos = 7.5 minutos
```

#### Caso Mínimo (0 transacciones/minuto)
```
Consulta BD: ~0.2s
Total: ~0.3 segundos = 0.005 minutos
```

---

## 💰 Cálculo de Minutos/Mes Realista

### Escenario Realista (Promedio)

#### Por Ejecución
- **Tiempo promedio:** 2 minutos (caso promedio)
- **Tiempo mínimo:** 0.005 minutos (sin transacciones)
- **Tiempo máximo:** 7.5 minutos (caso pico)

#### Por Día
- **Ejecuciones:** 1,440 (cada minuto)
- **Tiempo promedio:** 1,440 × 2 = 2,880 minutos/día
- **Tiempo mínimo:** 1,440 × 0.005 = 7.2 minutos/día
- **Tiempo máximo:** 1,440 × 7.5 = 10,800 minutos/día

**⚠️ PROBLEMA:** El tiempo promedio (2,880 min/día) **EXCEDE** el límite de GitHub (2,000 min/mes)

---

## 🔧 Optimizaciones Necesarias

### Problema Identificado
Si procesamos todas las transacciones expiradas en cada ejecución, el tiempo puede ser muy alto.

### Solución: Procesar en Lotes

#### Opción 1: Limitar Transacciones por Ejecución
```typescript
// Procesar máximo 50 transacciones por ejecución
const { data: expired } = await supabase
  .from('pending_confirmations')
  .select('*')
  .lt('expires_at', new Date().toISOString())
  .is('confirmed', null)
  .limit(50); // ← LIMITAR
```

**Tiempo por ejecución:** ~40 segundos (50 × 0.8s)
**Minutos/día:** 1,440 × 0.67 = ~960 minutos/día
**Minutos/mes:** 960 × 30 = **28,800 minutos/mes** ❌ **AÚN EXCEDE**

#### Opción 2: Procesar Solo las Más Urgentes
```typescript
// Procesar solo las que expiraron hace más de 1 minuto
const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
const { data: expired } = await supabase
  .from('pending_confirmations')
  .select('*')
  .lt('expires_at', oneMinuteAgo.toISOString()) // ← Solo las que ya expiraron
  .is('confirmed', null)
  .limit(10); // ← Procesar pocas por vez
```

**Tiempo por ejecución:** ~8 segundos (10 × 0.8s)
**Minutos/día:** 1,440 × 0.13 = ~192 minutos/día
**Minutos/mes:** 192 × 30 = **5,760 minutos/mes** ❌ **AÚN EXCEDE**

---

## 💡 Solución Real: Procesar en Lotes Pequeños

### Estrategia Recomendada

```typescript
// Procesar máximo 5 transacciones por ejecución
const { data: expired } = await supabase
  .from('pending_confirmations')
  .select('*')
  .lt('expires_at', new Date().toISOString())
  .is('confirmed', null)
  .limit(5); // ← Solo 5 por ejecución
```

**Tiempo por ejecución:** ~4 segundos (5 × 0.8s)
**Minutos/día:** 1,440 × 0.067 = ~96 minutos/día
**Minutos/mes:** 96 × 30 = **2,880 minutos/mes** ❌ **AÚN EXCEDE**

### Solución Final: Reducir Frecuencia

#### Opción A: Cron cada 2 minutos
```
Ejecuciones/día: 720 (cada 2 minutos)
Tiempo/ejecución: ~4 segundos (5 transacciones)
Minutos/día: 720 × 0.067 = ~48 minutos/día
Minutos/mes: 48 × 30 = 1,440 minutos/mes ✅ **DENTRO DEL LÍMITE**
```

#### Opción B: Cron cada 5 minutos (actual)
```
Ejecuciones/día: 288 (cada 5 minutos)
Tiempo/ejecución: ~10 segundos (12 transacciones promedio)
Minutos/día: 288 × 0.17 = ~49 minutos/día
Minutos/mes: 49 × 30 = 1,470 minutos/mes ✅ **DENTRO DEL LÍMITE**
```

---

## 🎯 Recomendación Final

### Para Plan Gratuito de GitHub Actions

**Opción Recomendada: Cron cada 2 minutos + Límite de 5 transacciones**

```typescript
// .github/workflows/confirm-expired-cron.yml
schedule:
  - cron: '*/2 * * * *'  // Cada 2 minutos

// packages/core-api/src/app/api/cron/confirm-expired/route.ts
const { data: expired } = await supabase
  .from('pending_confirmations')
  .select('*')
  .lt('expires_at', new Date().toISOString())
  .is('confirmed', null)
  .limit(5); // Procesar máximo 5 por ejecución
```

**Resultado:**
- **Precisión:** 30-32 minutos (vs 30-35 min antes)
- **Tiempo/ejecución:** ~4 segundos
- **Minutos/mes:** ~1,440 minutos/mes
- **Dentro del límite:** ✅ Sí (1,440 < 2,000)

---

## 📊 Comparación de Opciones

| Opción | Frecuencia | Transacciones/Ejec | Tiempo/Ejec | Min/Mes | Dentro Límite |
|--------|------------|-------------------|-------------|---------|---------------|
| **Cada 1 min, 5 tx** | 1 min | 5 | ~4s | 2,880 | ❌ No |
| **Cada 2 min, 5 tx** | 2 min | 5 | ~4s | 1,440 | ✅ Sí |
| **Cada 5 min, 12 tx** | 5 min | 12 | ~10s | 1,470 | ✅ Sí |

---

**Documento creado:** 2025-01-22  
**Última actualización:** 2025-01-22

