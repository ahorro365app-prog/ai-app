# Análisis de la Función `actualizar_contador_referidos`

## 📋 Código SQL Analizado

```sql
BEGIN
  -- Si un referido verifica WhatsApp, actualizar contador del referidor
  IF NEW.verifico_whatsapp = true AND (OLD.verifico_whatsapp IS NULL OR OLD.verifico_whatsapp = false) THEN
    UPDATE usuarios 
    SET referidos_verificados = referidos_verificados + 1
    WHERE id = NEW.referidor_id;
    
    -- Actualizar fecha_verificacion
    NEW.fecha_verificacion = NOW();
  END IF;
  
  RETURN NEW;
END;
```

## ✅ Lo que Hace la Función

1. **Detecta verificación de WhatsApp:**
   - Se ejecuta cuando `verifico_whatsapp` cambia de `false/null` a `true`
   - Solo se ejecuta la primera vez que se verifica (evita duplicados)

2. **Actualiza contador:**
   - Incrementa `referidos_verificados` en la tabla `usuarios` del referidor
   - Esto es para tracking interno

3. **Actualiza fecha:**
   - Establece `fecha_verificacion = NOW()` en el registro de `referidos`

## 🎯 Dónde Integrar el Trigger de Notificación

### Opción A: Modificar esta Función (⚠️ NO recomendado)

**Problema:** Es `BEFORE UPDATE`, se ejecuta ANTES de guardar. Si invocamos el endpoint aquí:
- Requiere extensión `pg_net` o `http` en Supabase
- Bloquea la transacción mientras hace HTTP
- Difícil de debuggear
- No escalable para app mundial

### Opción B: Crear Trigger `AFTER UPDATE` (✅ Recomendado si queremos automatización)

**Ventajas:**
- Se ejecuta DESPUÉS de que se guarda el cambio
- Puede invocar el endpoint de API
- Automático, no requiere cambios en código

**Desventajas:**
- Requiere extensión `pg_net` o `http`
- Menos control que integración en código

**Código sugerido:**
```sql
CREATE OR REPLACE FUNCTION notificar_referido_verificado()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si verifico_whatsapp cambió a true
  IF NEW.verifico_whatsapp = true AND (OLD.verifico_whatsapp IS NULL OR OLD.verifico_whatsapp = false) THEN
    -- Invocar endpoint de API (requiere pg_net)
    PERFORM net.http_post(
      url := 'https://tu-dominio.com/api/notifications/triggers/referral-verified',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object('referralId', NEW.id)::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_referido_verificado
  AFTER UPDATE ON referidos
  FOR EACH ROW
  WHEN (NEW.verifico_whatsapp = true AND (OLD.verifico_whatsapp IS NULL OR OLD.verifico_whatsapp = false))
  EXECUTE FUNCTION notificar_referido_verificado();
```

### Opción C: Integración en Código (🏆 MEJOR para app mundial)

**Ventajas:**
- ✅ No requiere extensiones especiales
- ✅ Mejor control y debugging
- ✅ Escalable
- ✅ Manejo de errores robusto
- ✅ No bloquea transacciones de DB

**Implementación:**
- Encontrar dónde en el código se actualiza `verifico_whatsapp = true`
- Después de actualizar, invocar `/api/notifications/triggers/referral-verified`

## 🔍 Dónde se Actualiza `verifico_whatsapp`?

**Necesitamos encontrar:**
1. Función `verifyWhatsAppCode` (usada en `WhatsAppVerificationModal.tsx`)
2. Endpoint de API que verifica WhatsApp
3. Cualquier lugar donde se actualice `referidos.verifico_whatsapp = true`

## 📋 Plan de Acción Recomendado

### Paso 1: Encontrar dónde se actualiza `verifico_whatsapp`

Buscar en el código:
- Función `verifyWhatsAppCode` (no encontrada aún)
- Endpoints de API relacionados con WhatsApp
- Cualquier UPDATE a la tabla `referidos`

### Paso 2: Integrar trigger de notificación

**En el código, después de actualizar `verifico_whatsapp = true`:**

```typescript
// 1. Actualizar verifico_whatsapp en referidos
const { data: updatedReferral } = await supabase
  .from('referidos')
  .update({
    verifico_whatsapp: true,
    fecha_verificacion: new Date().toISOString(),
  })
  .eq('referido_id', userId)
  .select()
  .single();

// 2. Invocar trigger de notificación (no bloquea si falla)
if (updatedReferral?.id) {
  try {
    await fetch('/api/notifications/triggers/referral-verified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralId: updatedReferral.id }),
    });
  } catch (error) {
    console.error('Error invocando trigger:', error);
    // No fallar la verificación si el trigger falla
    // El cron lo procesará más tarde
  }
}
```

## ✅ Conclusión

**La función `actualizar_contador_referidos` ya hace su trabajo correctamente:**
- ✅ Actualiza contadores
- ✅ Actualiza `fecha_verificacion`
- ✅ Detecta cuando se verifica WhatsApp

**Lo que falta:**
- ❌ Invocar el trigger de notificación cuando se verifica WhatsApp

**Mejor solución:**
- Integrar en el código donde se actualiza `verifico_whatsapp`
- Mantener la función de DB como está (solo actualiza contadores)
- Usar el cron como red de seguridad

