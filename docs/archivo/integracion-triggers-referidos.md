# Integración de Triggers de Referidos en Tiempo Real

## 📋 Resumen

Este documento describe cómo integrar los triggers de notificaciones de referidos (`triggerReferralInvitedForId` y `triggerReferralVerifiedForId`) en el flujo de la aplicación para que se ejecuten en tiempo real cuando ocurren los eventos correspondientes.

## 🎯 Objetivo

Los triggers deben ejecutarse automáticamente cuando:
1. **Referido Invitado**: Se crea un nuevo registro en la tabla `referidos` (cuando un usuario se registra con un código de referido)
2. **Referido Verificado**: Un referido verifica su WhatsApp (cuando `verifico_whatsapp` cambia a `true` y se actualiza `fecha_verificacion`)

## 🔧 Implementación

### Opción 1: Endpoints de API (Recomendado para integración manual)

Se han creado dos endpoints de API que pueden ser invocados desde el código:

#### 1. Trigger de Referido Invitado
```typescript
POST /api/notifications/triggers/referral-invited
Body: { referralId: string }
```

**Ejemplo de uso:**
```typescript
// Después de insertar un referido en la tabla `referidos`
const { data: newReferral } = await supabase
  .from('referidos')
  .insert({
    referidor_id: referidorId,
    referido_id: referidoId,
    codigo_usado: referralCode,
    fecha_registro: new Date().toISOString(),
  })
  .select()
  .single();

// Invocar trigger
if (newReferral?.id) {
  await fetch('/api/notifications/triggers/referral-invited', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referralId: newReferral.id }),
  });
}
```

#### 2. Trigger de Referido Verificado
```typescript
POST /api/notifications/triggers/referral-verified
Body: { referralId: string }
```

**Ejemplo de uso:**
```typescript
// Después de actualizar verifico_whatsapp = true en la tabla `referidos`
const { data: updatedReferral } = await supabase
  .from('referidos')
  .update({
    verifico_whatsapp: true,
    fecha_verificacion: new Date().toISOString(),
  })
  .eq('id', referralId)
  .select()
  .single();

// Invocar trigger
if (updatedReferral?.id) {
  await fetch('/api/notifications/triggers/referral-verified', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referralId: updatedReferral.id }),
  });
}
```

### Opción 2: Triggers de Base de Datos (⚠️ NO recomendado para app mundial)

**⚠️ ADVERTENCIA:** Los triggers de PostgreSQL tienen limitaciones importantes para apps de escala mundial:
- ❌ Pueden bloquear transacciones de DB
- ❌ Difíciles de debuggear
- ❌ Requieren extensiones especiales (`pg_net` o `http`)
- ❌ Sin manejo de errores robusto
- ❌ No escalan bien con millones de usuarios

**Solo usar si:**
- Hay múltiples sistemas externos que insertan en `referidos`
- Necesitas garantía absoluta (aunque sea costoso)
- Tienes equipo de DBAs dedicado

**Ver:** `docs/estrategia-triggers-mundial.md` para análisis completo.

**Si decides usarlos (no recomendado):**
```sql
-- Requiere extensión pg_net habilitada en Supabase
CREATE OR REPLACE FUNCTION notify_referral_invited()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://tu-dominio.com/api/notifications/triggers/referral-invited',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object('referralId', NEW.id)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_referral_invited
  AFTER INSERT ON referidos
  FOR EACH ROW
  EXECUTE FUNCTION notify_referral_invited();
```

## 📍 Ubicaciones donde DEBERÍAN invocarse

### 1. Creación de Referido

**Archivos a revisar/modificar:**
- `src/contexts/SupabaseContext.tsx` - función `createUser` (si crea referidos)
- Cualquier endpoint de API que maneje registro de usuarios con código de referido
- Triggers de base de datos en Supabase (si existen)

**Cuándo invocar:**
- Inmediatamente después de insertar un nuevo registro en `referidos`
- Cuando `fecha_registro` se establece por primera vez

### 2. Verificación de WhatsApp

**Archivos a revisar/modificar:**
- `src/components/WhatsAppVerificationModal.tsx` - función `handleVerifyCode`
- Cualquier endpoint de API que verifique WhatsApp
- Triggers de base de datos en Supabase (si existen)

**Cuándo invocar:**
- Inmediatamente después de actualizar `verifico_whatsapp = true`
- Cuando `fecha_verificacion` se establece por primera vez
- Solo si el estado anterior era `false` (para evitar notificaciones duplicadas)

## 🔍 Cómo encontrar dónde se crean/actualizan referidos

1. **Buscar en el código:**
   ```bash
   grep -r "referidos" --include="*.ts" --include="*.tsx"
   grep -r "\.from('referidos')" --include="*.ts" --include="*.tsx"
   ```

2. **Revisar triggers de Supabase:**
   - Ir a Supabase Dashboard → Database → Triggers
   - Buscar triggers relacionados con la tabla `referidos`

3. **Revisar funciones de Supabase:**
   - Ir a Supabase Dashboard → Database → Functions
   - Buscar funciones que inserten/actualicen en `referidos`

## ⚠️ Notas Importantes

1. **Deduplicación**: Los triggers ya tienen lógica de deduplicación basada en `notification_trigger_logs`, por lo que es seguro invocarlos múltiples veces.

2. **Cron como red de seguridad**: El cron programado (`/api/notifications/campaigns/run`) seguirá ejecutándose cada 15 minutos como red de seguridad para procesar referidos que no fueron notificados en tiempo real.

3. **Manejo de errores**: Los endpoints de API manejan errores y registran logs. Si un trigger falla, el cron lo procesará más tarde.

4. **Rate limiting**: Los triggers respetan las preferencias de usuario (`push_enabled`, `quiet_hours`, etc.) y el rate limiting configurado.

## ✅ Próximos Pasos

1. ✅ Crear endpoints de API para invocar triggers
2. ⏳ Identificar dónde se crean referidos en el código
3. ⏳ Integrar invocación de triggers en esos lugares
4. ⏳ Identificar dónde se verifica WhatsApp
5. ⏳ Integrar invocación de triggers en esos lugares
6. ⏳ (Opcional) Crear triggers de base de datos en Supabase para automatización completa

