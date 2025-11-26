# ⏰ Análisis: Timeout Exacto de 30 Minutos

> **Fecha:** 2025-01-22  
> **Problema:** Timeout actual depende del cron (30-35 min, no exacto)  
> **Objetivo:** Timeout exacto de 30 minutos por transacción

---

## 🔍 Problema Actual

### Configuración Actual
- **Timeout configurado:** 30 minutos
- **Cron frequency:** Cada 5 minutos (`*/5 * * * *`)
- **Precisión real:** 30-35 minutos (depende de cuándo se ejecute el cron)

### Ejemplo Real
```
Transacción creada: 10:00:00
Expira teóricamente: 10:30:00
Cron ejecuta: 10:30:00, 10:35:00, 10:40:00...
Auto-guardado real: Entre 10:30:00 y 10:35:00
```

**Retraso máximo:** 5 minutos  
**Retraso promedio:** 2.5 minutos

---

## 📊 Alternativas Disponibles

### 1️⃣ Cron Más Frecuente (Más Simple)

#### Implementación
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/confirm-expired",
      "schedule": "* * * * *"  // Cada 1 minuto
    }
  ]
}
```

#### Pros
- ✅ **Muy fácil de implementar** (cambiar 1 línea)
- ✅ **Sin infraestructura adicional**
- ✅ **Precisión mejorada:** 30-31 minutos (retraso máximo 1 min)
- ✅ **Sin cambios en código existente**

#### Contras
- ⚠️ **Más llamadas a la BD** (60x más que cada 5 min)
- ⚠️ **Más costos en Vercel** (60 ejecuciones/hora vs 12)
- ⚠️ **Aún no es exacto** (puede tardar hasta 1 minuto)

#### Complejidad
- **Implementación:** ⭐ (Muy fácil)
- **Mantenimiento:** ⭐ (Muy fácil)
- **Costo:** ⭐⭐ (Moderado - más ejecuciones)

#### Recomendación
✅ **Buen balance** si 1 minuto de precisión es aceptable

---

### 2️⃣ Sistema de Colas (BullMQ / Inngest / Trigger.dev)

#### ✅ NO Requiere Plan Pagado de Supabase
- **Trigger.dev, Inngest, BullMQ** son servicios EXTERNOS
- **NO dependen** de tu plan de Supabase
- **Funcionan** con plan gratuito de Supabase

#### Implementación con Trigger.dev
```typescript
// Al crear pending_confirmations
import { triggerClient } from '@/lib/trigger';

await triggerClient.sendEvent({
  name: 'confirm-timeout',
  payload: {
    predictionId: pred.id,
    userId: user.id
  },
  delay: {
    seconds: 30 * 60 // 30 minutos exactos
  }
});

// Worker procesa exactamente a los 30 minutos
```

#### Pros
- ✅ **Timeout exacto** (30 minutos precisos)
- ✅ **Escalable** (maneja millones de jobs)
- ✅ **Retry automático** si falla
- ✅ **Monitoreo incluido** (dashboards)
- ✅ **NO requiere plan pagado de Supabase**

#### Contras
- ⚠️ **Requiere servicio externo** (pero gratuito hasta cierto límite)
- ⚠️ **Más complejo de configurar** que cron simple
- ⚠️ **Más puntos de falla** (depende de servicio externo)

#### Opciones de Colas

**Trigger.dev** ⭐ RECOMENDADO
- Complejidad: ⭐⭐
- Costo: **Gratis hasta 10k jobs/mes**
- Precisión: ✅ Exacta
- Ventaja: Integración nativa con Next.js, no requiere Redis
- **NO requiere plan pagado de Supabase**

**Inngest**
- Complejidad: ⭐⭐
- Costo: **Gratis hasta 25k eventos/mes**
- Precisión: ✅ Exacta
- Ventaja: Serverless, no requiere Redis
- **NO requiere plan pagado de Supabase**

**BullMQ (Redis)**
- Complejidad: ⭐⭐⭐
- Costo: ~$10-50/mes (Upstash Redis)
- Precisión: ✅ Exacta
- **NO requiere plan pagado de Supabase** (pero requiere Redis)

#### Complejidad
- **Implementación:** ⭐⭐⭐ (Moderada)
- **Mantenimiento:** ⭐⭐ (Moderada)
- **Costo:** ⭐ (Bajo - gratis hasta cierto límite)

#### Recomendación
✅ **Mejor opción** si necesitas precisión exacta sin plan pagado de Supabase

---

### 3️⃣ Supabase pg_cron (Database Scheduled Jobs)

#### ⚠️ IMPORTANTE: Requiere Plan Pagado
- **pg_cron extension** NO está disponible en plan gratuito de Supabase
- **Requiere:** Plan Pro o superior (~$25/mes mínimo)
- **Alternativa gratuita:** Database Triggers (sin pg_cron) - pero no pueden programar delays

#### Implementación
```sql
-- Crear función que procesa una confirmación específica
CREATE OR REPLACE FUNCTION auto_confirm_transaction(prediction_id UUID)
RETURNS void AS $$
BEGIN
  -- Lógica de auto-confirmación
  UPDATE predicciones_groq SET confirmado = true WHERE id = prediction_id;
  -- Crear transacción, etc.
END;
$$ LANGUAGE plpgsql;

-- Programar job para cada transacción (requiere pg_cron extension)
SELECT cron.schedule(
  'confirm-' || prediction_id,
  '30 minutes',
  $$SELECT auto_confirm_transaction('prediction_id_aqui')$$
);
```

#### Pros
- ✅ **Timeout exacto** (ejecuta a los 30 min)
- ✅ **Sin infraestructura externa** (usa Supabase)
- ✅ **Escalable** (Supabase maneja el scheduling)

#### Contras
- ❌ **Requiere plan pagado de Supabase** (~$25/mes mínimo)
- ❌ **pg_cron extension** no disponible en plan gratuito
- ❌ **Complejidad SQL** (más difícil de debuggear)
- ❌ **Límites de Supabase** (máximo jobs simultáneos)
- ❌ **No hay retry automático** si falla

#### Complejidad
- **Implementación:** ⭐⭐⭐⭐ (Compleja)
- **Mantenimiento:** ⭐⭐⭐ (Compleja)
- **Costo:** ⭐⭐⭐ (Alto - requiere plan pagado Supabase)

#### Recomendación
❌ **No recomendado** si estás en plan gratuito de Supabase

---

### 4️⃣ Database Triggers + pg_cron (Híbrido)

#### Implementación
```sql
-- Trigger que crea un job programado cuando se inserta pending_confirmations
CREATE OR REPLACE FUNCTION schedule_auto_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- Programar job para ejecutar en 30 minutos
  PERFORM cron.schedule(
    'confirm-' || NEW.id,
    NOW() + INTERVAL '30 minutes',
    $$SELECT process_expired_confirmation('$$ || NEW.id || $$')$$
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_auto_confirm_trigger
AFTER INSERT ON pending_confirmations
FOR EACH ROW
EXECUTE FUNCTION schedule_auto_confirm();
```

#### Pros
- ✅ **Completamente automático** (trigger en BD)
- ✅ **Timeout exacto** (30 minutos precisos)
- ✅ **Sin cambios en código de aplicación**

#### Contras
- ❌ **Muy complejo** (SQL avanzado)
- ❌ **Difícil de debuggear** (lógica en BD)
- ❌ **Requiere pg_cron** (puede no estar disponible)
- ❌ **Limpieza de jobs** (necesita cleanup si se confirma manualmente)

#### Complejidad
- **Implementación:** ⭐⭐⭐⭐⭐ (Muy compleja)
- **Mantenimiento:** ⭐⭐⭐⭐ (Muy compleja)
- **Costo:** ⭐ (Bajo)

#### Recomendación
❌ **No recomendado** - demasiado complejo para el beneficio

---

### 5️⃣ Vercel Edge Functions con Delay (No Viable)

#### Problema
Vercel Edge Functions tienen un límite de 30 segundos de ejecución, no pueden esperar 30 minutos.

#### Conclusión
❌ **No es viable** para timeouts de 30 minutos

---

### 6️⃣ Webhooks Programados (Vercel Cron + Scheduling)

#### Implementación
```typescript
// Al crear pending_confirmations, calcular cuándo debe ejecutarse
const executeAt = new Date();
executeAt.setMinutes(executeAt.getMinutes() + 30);

// Guardar en BD con timestamp exacto
await supabase.from('scheduled_confirmations').insert({
  prediction_id: pred.id,
  execute_at: executeAt.toISOString(),
  status: 'pending'
});

// Cron cada 1 minuto busca scheduled_confirmations donde execute_at <= ahora
```

#### Pros
- ✅ **Más preciso** (ejecuta cuando expire, no cuando cron corre)
- ✅ **Sin infraestructura adicional**
- ✅ **Fácil de implementar**

#### Contras
- ⚠️ **Aún depende del cron** (pero más preciso)
- ⚠️ **Requiere tabla adicional** (scheduled_confirmations)
- ⚠️ **Más complejo que cron simple**

#### Complejidad
- **Implementación:** ⭐⭐ (Fácil)
- **Mantenimiento:** ⭐⭐ (Fácil)
- **Costo:** ⭐⭐ (Moderado - cron cada 1 min)

#### Recomendación
✅ **Buena opción** si quieres mejor precisión sin servicios externos

---

## 📊 Comparación de Opciones

| Opción | Precisión | Complejidad | Costo | Escalabilidad |
|--------|-----------|-------------|-------|---------------|
| **Cron cada 1 min** | 30-31 min | ⭐ | ⭐⭐ | ✅ Buena |
| **Cron cada 5 min** (actual) | 30-35 min | ⭐ | ⭐ | ✅ Buena |
| **BullMQ/Inngest** | 30 min exacto | ⭐⭐⭐ | ⭐⭐⭐ | ✅✅ Excelente |
| **pg_cron** | 30 min exacto | ⭐⭐⭐⭐ | ⭐ | ⚠️ Limitada |
| **Triggers + pg_cron** | 30 min exacto | ⭐⭐⭐⭐⭐ | ⭐ | ⚠️ Limitada |
| **Webhooks programados** | 30-31 min | ⭐⭐ | ⭐⭐ | ✅ Buena |

---

## 🎯 Recomendaciones por Escenario

### Escenario 1: Precisión de 1 minuto es aceptable
**✅ Opción 1: Cron cada 1 minuto**
- Cambio mínimo (1 línea en vercel.json)
- Precisión: 30-31 minutos
- Costo adicional: ~$5-10/mes (más ejecuciones)

### Escenario 2: Necesitas precisión exacta (30 min)
**✅ Opción 2: Inngest o Trigger.dev**
- Precisión: 30 minutos exactos
- Serverless, sin infraestructura propia
- Costo: Gratis hasta cierto límite

### Escenario 3: Balance entre precisión y simplicidad
**✅ Opción 6: Webhooks programados**
- Precisión: 30-31 minutos
- Sin servicios externos
- Implementación moderada

---

## 💡 Recomendación Final

### Para 1 Millón de Usuarios (Sin Plan Pagado de Supabase)

**Opción recomendada: Trigger.dev o Inngest**

**Razones:**
1. ✅ **Precisión exacta** (30 minutos)
2. ✅ **Escalable** (maneja millones de jobs)
3. ✅ **Serverless** (sin infraestructura propia)
4. ✅ **Retry automático** si falla
5. ✅ **Monitoreo incluido**
6. ✅ **Gratis hasta cierto límite** (10k-25k jobs/mes)
7. ✅ **NO requiere plan pagado de Supabase** ⭐

**Implementación estimada:** 2-3 días  
**Complejidad:** Moderada  
**ROI:** Alto (precisión + escalabilidad + sin costo adicional de Supabase)

### Si Tienes Plan Pagado de Supabase

**Opción alternativa: pg_cron**
- Precisión exacta
- Sin servicios externos
- Requiere plan Pro de Supabase (~$25/mes)

---

## 📝 Próximos Pasos

Si decides implementar una de estas opciones:

1. **Cron cada 1 min:** Cambiar `vercel.json` (5 minutos)
2. **Inngest/Trigger.dev:** Setup + migración (2-3 días)
3. **Webhooks programados:** Nueva tabla + lógica (1 día)

---

**Documento creado:** 2025-01-22  
**Última actualización:** 2025-01-22

