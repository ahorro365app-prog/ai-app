# Debug: Notificación No Llega

**Problema:** El trigger se ejecutó correctamente pero la notificación push no llegó al navegador.

**Logs del trigger:**
```
✅ Trigger referral-invited ejecutado: {
  success: true,
  message: 'Notificaciones de nuevos referidos enviadas a 1 usuarios.',
  summary: { ... }
}
```

---

## 🔍 Verificaciones Necesarias

### 1. Verificar Logs del Servidor

Revisa la consola del servidor (donde corre `npm run dev`) para ver si hay errores al enviar la notificación:

**Busca mensajes como:**
- `Error enviando notificación:`
- `FCM error:`
- `messaging/registration-token-not-registered`
- `messaging/invalid-registration-token`

### 2. Verificar en Supabase - notification_trigger_logs

Ejecuta esta consulta para ver el log del trigger:

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
LIMIT 1;
```

**Revisa el campo `context`:**
- Si `sent > 0`: La notificación se intentó enviar
- Si `skippedReason`: Indica por qué se saltó (opt_out, no_tokens, etc.)

### 3. Verificar Consola del Navegador (Ventana Principal)

Abre la consola del navegador en la ventana principal (donde debería llegar la notificación) y busca:

**Errores relacionados con:**
- `firebase`
- `messaging`
- `notification`
- `FCM`

### 4. Verificar Centro de Notificaciones del Sistema

**Windows:**
- Abre el Centro de actividades (Win + A)
- Busca si hay notificaciones de `localhost:3000`

**Chrome:**
- Verifica si Chrome está bloqueando notificaciones
- Ve a: `chrome://settings/content/notifications`
- Busca `localhost:3000` y verifica que esté permitido

### 5. Verificar Estado del Service Worker

En la consola del navegador (ventana principal), ejecuta:

```javascript
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker registrado:', registration);
});
```

---

## 🐛 Posibles Causas

### 1. Notificación en Segundo Plano

**Causa:** Si la pestaña no está activa, la notificación puede no mostrarse.

**Solución:** 
- Mantén la pestaña activa cuando se crea el referido
- O verifica el centro de notificaciones del sistema

### 2. Token FCM Inválido

**Causa:** El token puede haber expirado o ser inválido.

**Solución:**
- Verifica en los logs del servidor si hay errores de FCM
- Puede ser necesario regenerar el token

### 3. Firebase No Configurado Correctamente

**Causa:** Puede faltar configuración en Firebase Console.

**Solución:**
- Verifica que Cloud Messaging esté habilitado
- Verifica que la VAPID key sea correcta

### 4. Navegador Bloqueando Notificaciones

**Causa:** El navegador puede estar bloqueando notificaciones aunque se aceptaron.

**Solución:**
- Verifica configuración del navegador
- Intenta en otro navegador

---

## 🔧 Pasos de Debug

### Paso 1: Verificar Logs del Servidor

1. Revisa la consola donde corre `npm run dev`
2. Busca errores relacionados con FCM o notificaciones
3. Comparte cualquier error que encuentres

### Paso 2: Verificar notification_trigger_logs

Ejecuta la consulta SQL mostrada arriba y comparte:
- El contenido del campo `context`
- Si `sent > 0` o si hay `skippedReason`

### Paso 3: Verificar Consola del Navegador

1. Abre la consola en la ventana principal
2. Busca errores relacionados con Firebase/FCM
3. Comparte cualquier error

### Paso 4: Probar con Pestaña Activa

1. Mantén la pestaña principal activa (no minimizada)
2. Crea otro referido desde incógnito
3. Verifica si llega la notificación

---

## 📝 Información Necesaria

Para diagnosticar el problema, necesito:

1. **Logs del servidor:** ¿Hay errores al enviar la notificación?
2. **notification_trigger_logs:** ¿Qué dice el campo `context`?
3. **Consola del navegador:** ¿Hay errores relacionados con Firebase/FCM?
4. **Estado del Service Worker:** ¿Está registrado correctamente?

---

## ✅ Próximos Pasos

1. Revisa los logs del servidor
2. Ejecuta la consulta SQL para ver `notification_trigger_logs`
3. Revisa la consola del navegador
4. Comparte los resultados

Con esa información podremos identificar exactamente por qué no llega la notificación.

