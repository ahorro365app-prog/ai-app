# Plan de Monitoreo: Múltiples Transacciones Pendientes

## 📅 Timeline: 4 Meses

**Fecha inicio:** ${new Date().toLocaleDateString('es-BO')}  
**Fecha revisión 1:** ${new Date(Date.now() + 15*24*60*60*1000).toLocaleDateString('es-BO')} (15 días)  
**Fecha revisión 2:** ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('es-BO')} (30 días)  
**Fecha revisión 3:** ${new Date(Date.now() + 60*24*60*60*1000).toLocaleDateString('es-BO')} (60 días)  
**Fecha decisión final:** ${new Date(Date.now() + 120*24*60*60*1000).toLocaleDateString('es-BO')} (120 días)

---

## 🎯 OBJETIVO

Determinar si es necesario implementar auto-confirmación cascada basándose en datos reales de producción.

---

## 📊 MÉTRICAS A RECOPILAR

### 1. Distribución de Transacciones Pendientes

Query SQL:
```sql
SELECT 
  usuario_id,
  COUNT(*) as pending_count
FROM pending_confirmations
WHERE confirmed IS NULL
  AND expires_at > NOW()
GROUP BY usuario_id
ORDER BY pending_count DESC;
```

**Métricas clave:**
- % usuarios con 1 pendiente
- % usuarios con 2-3 pendientes
- % usuarios con 4-5 pendientes
- % usuarios con 6+ pendientes

### 2. Tiempo Promedio Antes de Confirmar

Query SQL:
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at))/60) as avg_minutes,
  MIN(EXTRACT(EPOCH FROM (confirmed_at - created_at))/60) as min_minutes,
  MAX(EXTRACT(EPOCH FROM (confirmed_at - created_at))/60) as max_minutes,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (confirmed_at - created_at))/60) as median_minutes
FROM pending_confirmations
WHERE confirmed = true
  AND confirmed_at IS NOT NULL
  AND confirmed_at > NOW() - INTERVAL '30 days';
```

**Objetivos:**
- Promedio < 15 minutos
- Mediana < 10 minutos

### 3. Transacciones Perdidas por Timeout

Query SQL:
```sql
SELECT 
  COUNT(*) as timeout_count,
  COUNT(DISTINCT usuario_id) as affected_users
FROM pending_confirmations
WHERE confirmed = true
  AND confirmed_at IS NOT NULL
  AND created_at < confirmed_at - INTERVAL '29 minutes'; -- Timeout
  AND created_at > NOW() - INTERVAL '30 days';
```

**Objetivo:** < 1% de transacciones perdidas

### 4. Patrón de Uso: Sesiones con Múltiples TX

Query SQL:
```sql
WITH user_sessions AS (
  SELECT 
    usuario_id,
    DATE_TRUNC('hour', created_at) as session_hour,
    COUNT(*) as txs_in_session
  FROM pending_confirmations
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY usuario_id, DATE_TRUNC('hour', created_at)
)
SELECT 
  txs_in_session,
  COUNT(*) as session_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_sessions
GROUP BY txs_in_session
ORDER BY txs_in_session;
```

**Análisis:** ¿En qué % de sesiones hay múltiples TX?

---

## 📝 LOGS DE DEBUGGING

### Código a Agregar (próximos pasos):

```typescript
// En admin-dashboard/src/app/api/webhooks/baileys/route.ts
// Después de crear pending_confirmations (línea 177 aprox)

const { count } = await supabase
  .from('pending_confirmations')
  .select('*', { count: 'exact', head: true })
  .eq('usuario_id', user.id)
  .is('confirmed', null);

if (count && count > 1) {
  console.warn(`⚠️ [METRIC] Usuario ${user.id} tiene ${count} transacciones pendientes`);
}

// Solo warning, no acción
```

### Logs Adicionales:

1. Cuando usuario confirma manualmente → Log: "Manual confirmation"
2. Cuando timeout ejecuta → Log: "Timeout confirmation"  
3. Contador total de pendientes al momento de crear nueva

---

## 📋 CHECKLIST DE REVISIONES

### Revisión 1 (15 días)

**Tareas:**
- [ ] Ejecutar queries de métricas
- [ ] Revisar logs de debugging
- [ ] Contar casos de usuarios con 4+ pendientes
- [ ] Verificar feedback de usuarios (si hay app de admin)

**Decisión:**
- [ ] Continuar monitoreo
- [ ] Implementar auto-confirmación (si % > 10 usuarios afectados)

---

### Revisión 2 (30 días)

**Tareas:**
- [ ] Ejecutar queries de métricas
- [ ] Comparar con revisión 1 (tendencias)
- [ ] Identificar usuarios más afectados
- [ ] Revisar si hubo quejas de usuarios

**Decisión:**
- [ ] Continuar monitoreo
- [ ] Implementar auto-confirmación

---

### Revisión 3 (60 días)

**Tareas:**
- [ ] Ejecutar queries de métricas
- [ ] Análisis estadístico completo
- [ ] Identificar patrones de uso

**Decisión:**
- [ ] Continuar monitoreo
- [ ] Implementar auto-confirmación
- [ ] Mantener simple (timeout suficiente)

---

### Decisión Final (120 días)

**Análisis completo:**
- [ ] Estadísticas consolidadas de 4 meses
- [ ] Patrones de uso identificados
- [ ] % usuarios afectados calculado
- [ ] ROI de implementación estimado

**Decisión:**
- [ ] ✅ Implementar auto-confirmación cascada
- [ ] ❌ Mantener solución actual (timeout)
- [ ] 📝 Otra acción: _______________

---

## 🔢 UMBRALES DE DECISIÓN

### Implementar SI:

1. **% usuarios con 4+ pendientes** > 15% → Implementar
2. **Tiempo promedio > 20 min** → Implementar
3. **TX perdidas por timeout** > 5% → Implementar
4. **Feedback negativo de usuarios** > 10 casos → Implementar

### NO Implementar SI:

1. **% usuarios con 4+ pendientes** < 5% → NO necesario
2. **Tiempo promedio < 10 min** → Timeout suficiente
3. **TX perdidas < 1%** → Sistema funciona bien
4. **Sin feedback negativo** → UX aceptable

---

## 📧 RECORDATORIOS

### Configurar en Calendario:

1. **Revisión 1:** ${new Date(Date.now() + 15*24*60*60*1000).toLocaleDateString('es-BO')}
2. **Revisión 2:** ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('es-BO')}
3. **Revisión 3:** ${new Date(Date.now() + 60*24*60*60*1000).toLocaleDateString('es-BO')}
4. **Decisión Final:** ${new Date(Date.now() + 120*24*60*60*1000).toLocaleDateString('es-BO')}

### Plantilla de Revisión:

```
REVISIÓN DE CONFIRMACIONES - [FECHA]

Métricas:
- Usuarios con 4+ pendientes: X%
- Tiempo promedio: X minutos
- TX perdidas: X%
- Sesiones multi-TX: X%

Observaciones:
- 

Decisión:
- [ ] Continuar monitoreo
- [ ] Implementar auto-confirmación
- [ ] Otra: _______
```

---

## 🎯 RESULTADO ESPERADO

Después de 4 meses, tendremos:
1. ✅ Datos reales de uso
2. ✅ Estadísticas consolidadas
3. ✅ Evidencia para decisión informada
4. ✅ ROE (Return on Engineering) calculado

**Mejor decisión con datos** > **Decisión basada en suposiciones**

---

## 🔗 ARCHIVO DE REFERENCIA

Ver propuesta original de Claude en historial de commits (si es necesario)

