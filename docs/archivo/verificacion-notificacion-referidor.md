# Verificación: Notificación al Referidor

**Objetivo:** Verificar que el referidor recibe notificación cuando se crea un nuevo referido.

**Fecha:** 2025-11-12

---

## 📋 Requisitos para que se Envíe la Notificación

Para que el referidor reciba notificación, deben cumplirse **TODOS** estos requisitos:

1. ✅ **`push_enabled = true`** en `notification_preferences`
2. ✅ **Tokens FCM activos** en `fcm_tokens` (al menos 1 token con `is_active = true`)
3. ✅ **Trigger activado** en `trigger_configs` (`is_active = true` para `trigger.referral.invited`)

---

## 🔍 Paso 1: Verificar Preferencias de Notificación

**Tabla:** `notification_preferences`  
**Usuario referidor:** `d70c685f-b22f-4aa2-90d3-494e594cd043`

### Consulta SQL en Supabase:
```sql
SELECT 
  user_id,
  push_enabled,
  reminder_enabled,
  marketing_enabled,
  transaction_enabled
FROM notification_preferences
WHERE user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043';
```

### Resultado esperado:
- Si **NO existe registro**: Se creará automáticamente con `push_enabled = true` (default)
- Si **existe registro**: Debe tener `push_enabled = true`

### Si `push_enabled = false`:
```sql
UPDATE notification_preferences
SET push_enabled = true
WHERE user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043';
```

---

## 🔍 Paso 2: Verificar Tokens FCM

**Tabla:** `fcm_tokens`  
**Usuario referidor:** `d70c685f-b22f-4aa2-90d3-494e594cd043`

### Consulta SQL en Supabase:
```sql
SELECT 
  id,
  user_id,
  token,
  is_active,
  device_type,
  created_at,
  last_used_at
FROM fcm_tokens
WHERE user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043'
  AND is_active = true;
```

### Resultado esperado:
- Debe haber **al menos 1 token** con `is_active = true`

### Si NO hay tokens:
**Opción A: Registrar token desde la app**
1. Iniciar sesión con la cuenta del referidor
2. La app debería registrar automáticamente el token FCM al iniciar
3. Verificar que aparezca en `fcm_tokens`

**Opción B: Crear token de prueba (solo para testing)**
```sql
-- ⚠️ SOLO PARA TESTING - No usar en producción
INSERT INTO fcm_tokens (user_id, token, is_active, device_type)
VALUES (
  'd70c685f-b22f-4aa2-90d3-494e594cd043',
  'test-token-' || gen_random_uuid()::text,
  true,
  'web'
);
```

---

## 🔍 Paso 3: Verificar Estado del Trigger

**Tabla:** `notification_triggers`  
**Trigger key:** `trigger.referral.invited`

### Consulta SQL en Supabase:
```sql
SELECT 
  trigger_key,
  is_active,
  settings,
  created_at,
  updated_at
FROM notification_triggers
WHERE trigger_key = 'trigger.referral.invited';
```

### Resultado esperado:
- Si **NO existe registro**: El trigger está activado por defecto (`is_active = true`)
- Si **existe registro**: Debe tener `is_active = true`

### Si `is_active = false`:
```sql
-- Opción 1: Actualizar registro existente
UPDATE notification_triggers
SET is_active = true
WHERE trigger_key = 'trigger.referral.invited';

-- Opción 2: Crear registro si no existe (se crea automáticamente, pero por si acaso)
INSERT INTO notification_triggers (trigger_key, is_active, settings)
VALUES (
  'trigger.referral.invited',
  true,
  '{"limit": 200, "lookbackDays": 7}'::jsonb
)
ON CONFLICT (trigger_key) DO UPDATE
SET is_active = true;
```

---

## 🧪 Paso 4: Probar el Flujo Completo

### Test 1: Crear nuevo referido y verificar notificación

1. **Verificar estado inicial:**
   - ✅ `push_enabled = true`
   - ✅ Tokens FCM activos
   - ✅ Trigger activado

2. **Crear nuevo usuario con código de referido:**
   - Ir a `/sign-up`
   - Usar código: `E69BD962`
   - Completar registro

3. **Verificar en consola del navegador:**
   ```
   🔔 Invocando trigger referral-invited para referido: [ID]
   ✅ Trigger referral-invited ejecutado: {
     success: true,
     message: "Notificaciones de nuevos referidos enviadas a 1 usuarios.",
     summary: {
       notifiedUsers: 1,
       notificationsSent: 1,
       ...
     }
   }
   ```

4. **Verificar en Supabase - `notification_trigger_logs`:**
   ```sql
   SELECT 
     id,
     trigger_key,
     user_id,
     context,
     sent_at
   FROM notification_trigger_logs
   WHERE trigger_key = 'trigger.referral.invited'
     AND user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043'
   ORDER BY sent_at DESC
   LIMIT 5;
   ```

5. **Verificar que el referidor recibió la notificación:**
   - Si está en la app: Debe aparecer notificación push
   - Si no está en la app: Verificar en logs de FCM

---

## 📊 Checklist de Verificación

### Antes de Probar:
- [ ] `push_enabled = true` en `notification_preferences`
- [ ] Al menos 1 token FCM activo en `fcm_tokens`
- [ ] `is_active = true` en `notification_triggers` para `trigger.referral.invited`

### Después de Probar:
- [ ] Log en consola muestra `notifiedUsers: 1`
- [ ] Log en consola muestra `notificationsSent: 1` (o más si hay múltiples tokens)
- [ ] Registro en `notification_trigger_logs` con `sent > 0`
- [ ] El referidor recibió la notificación push (si está en la app)

---

## 🐛 Troubleshooting

### Problema: "No se enviaron notificaciones de nuevos referidos"

**Posibles causas:**
1. `push_enabled = false` → Verificar y actualizar en `notification_preferences`
2. No hay tokens FCM → Registrar token desde la app o crear token de prueba
3. Trigger desactivado → Activar en `trigger_configs`
4. Ya se procesó este referido → Verificar en `notification_trigger_logs` si ya existe registro

### Problema: "skipped: { optOut: 1, noTokens: 0 }"

- **Causa:** `push_enabled = false`
- **Solución:** Actualizar `push_enabled = true` en `notification_preferences`

### Problema: "skipped: { optOut: 0, noTokens: 1 }"

- **Causa:** No hay tokens FCM activos
- **Solución:** Registrar token desde la app o crear token de prueba

### Problema: "Trigger de referidos (invitados) desactivado"

- **Causa:** `is_active = false` en `notification_triggers`
- **Solución:** Activar trigger con SQL mostrado arriba

---

## 📝 Notas

- El trigger verifica si ya se procesó este referido para evitar duplicados
- Si ya existe un log en `notification_trigger_logs` para este `referido_id`, no se enviará otra notificación
- Los tokens FCM deben estar activos (`is_active = true`) para que se envíen notificaciones
- El sistema respeta las preferencias de notificación del usuario

---

## ✅ Resultado Esperado

Cuando todo está configurado correctamente, al crear un nuevo referido:

1. ✅ Se crea registro en `referidos`
2. ✅ Se invoca trigger `referral-invited`
3. ✅ Se envía notificación push al referidor
4. ✅ Se registra en `notification_trigger_logs`
5. ✅ El referidor ve la notificación: "🎉 Nuevo referido usando tu código"

