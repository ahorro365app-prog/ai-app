# Registrar Token FCM para Referidor

**Usuario:** `d70c685f-b22f-4aa2-90d3-494e594cd043`  
**Estado:** No hay tokens FCM activos

---

## 🎯 Opción 1: Registrar Token desde la App (RECOMENDADA)

Esta es la forma correcta de registrar un token FCM que funcionará para notificaciones reales.

### Pasos:

1. **Iniciar sesión con la cuenta del referidor:**
   - Teléfono: `+59176990076`
   - Contraseña: (la que corresponda)

2. **La app registrará automáticamente el token:**
   - Al iniciar sesión, la app detecta el navegador/dispositivo
   - Solicita permisos de notificaciones (si es la primera vez)
   - Registra el token FCM en `fcm_tokens`

3. **Verificar que se registró:**
   ```sql
   SELECT 
     id,
     token,
     is_active,
     device_type,
     created_at
   FROM fcm_tokens 
   WHERE user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043' 
     AND is_active = true;
   ```

4. **Si aparece el token:** ✅ Listo para probar

---

## 🧪 Opción 2: Crear Token de Prueba (SOLO PARA TESTING)

⚠️ **ADVERTENCIA:** Este token NO enviará notificaciones reales, solo servirá para verificar que el sistema intenta enviar.

### SQL para crear token de prueba:

```sql
INSERT INTO fcm_tokens (user_id, token, is_active, device_type)
VALUES (
  'd70c685f-b22f-4aa2-90d3-494e594cd043',
  'test-token-' || gen_random_uuid()::text,
  true,
  'web'
);
```

### Verificar que se creó:

```sql
SELECT * FROM fcm_tokens 
WHERE user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043' 
  AND is_active = true;
```

### Limitaciones del token de prueba:

- ❌ No recibirá notificaciones push reales
- ✅ El sistema intentará enviar (verás en logs)
- ✅ Verás `notificationsSent: 1` en el summary del trigger
- ✅ Se registrará en `notification_trigger_logs`
- ❌ Pero FCM rechazará el envío porque el token no es válido

---

## ✅ Recomendación

**Usar Opción 1 (Registrar desde la app):**
- Es la forma correcta
- El token funcionará para notificaciones reales
- Solo toma 1-2 minutos
- Permite probar el flujo completo

**Usar Opción 2 (Token de prueba) solo si:**
- No puedes iniciar sesión ahora
- Solo quieres verificar que el código funciona
- Entiendes que no recibirás notificación real

---

## 🧪 Después de Registrar el Token

Una vez que tengas un token (real o de prueba), puedes probar el flujo completo:

1. **Crear un nuevo usuario con código de referido:**
   - Ir a `/sign-up`
   - Usar código: `E69BD962`
   - Completar registro

2. **Verificar en consola del navegador:**
   ```
   ✅ Trigger referral-invited ejecutado: {
     success: true,
     message: "Notificaciones de nuevos referidos enviadas a 1 usuarios.",
     summary: {
       notifiedUsers: 1,
       notificationsSent: 1,  // ← Debe ser > 0
       skipped: { optOut: 0, noTokens: 0 }
     }
   }
   ```

3. **Verificar en Supabase:**
   ```sql
   SELECT * FROM notification_trigger_logs
   WHERE trigger_key = 'trigger.referral.invited'
     AND user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043'
   ORDER BY sent_at DESC
   LIMIT 1;
   ```

4. **Si usaste token real:** Deberías recibir la notificación push
5. **Si usaste token de prueba:** Verás en logs que se intentó enviar, pero FCM lo rechazará

---

## 📝 Nota Importante

Los tokens FCM se generan automáticamente cuando:
- Un usuario inicia sesión en la app
- La app solicita permisos de notificaciones
- El navegador/dispositivo genera el token FCM

No se pueden crear tokens FCM válidos manualmente - deben generarse desde el navegador/dispositivo del usuario.

