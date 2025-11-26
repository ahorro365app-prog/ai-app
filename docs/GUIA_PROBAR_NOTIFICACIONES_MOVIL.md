# 📱 Guía: Probar Notificaciones Push en Móvil Android

**Fecha**: 2025-11-24  
**Versión**: 1.0

## 📋 Prerequisitos

- ✅ APK instalado en dispositivo Android real
- ✅ Usuario iniciado sesión en la app móvil
- ✅ Permisos de notificación otorgados

---

## 🔍 Paso 1: Verificar que el Token se Registró

### Opción A: Desde Supabase (Recomendado)

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Ve a **Table Editor** → **fcm_tokens**
3. Busca tu usuario (filtra por `user_id` o busca el más reciente)
4. Verifica que:
   - ✅ `is_active = true`
   - ✅ `device_type = 'android'`
   - ✅ `token` tiene un valor (string largo)
   - ✅ `created_at` es reciente

### Opción B: Desde la App Móvil

1. Abre la app en tu dispositivo
2. Inicia sesión
3. Revisa los logs de la consola (si tienes acceso)
4. Deberías ver: `FCM token obtenido en móvil: [token]`

---

## 📤 Paso 2: Enviar Notificación de Prueba

### Desde el Panel de Administrador

1. **Abre el Panel de Administrador**: http://localhost:3001
2. **Ve a la sección de Notificaciones**: `/notifications`
3. **Configura el envío**:
   - **Modo**: Selecciona "Directo"
   - **Tipo de destino**: Selecciona **"Token FCM"**
   - **Token FCM**: Copia el token de Supabase (de la tabla `fcm_tokens`)
   - **Título**: `Notificación de Prueba - Ahorro365`
   - **Mensaje**: `Esta es una prueba de notificación push en móvil`
   - **Tipo**: `system`
4. **Haz clic en "Enviar Notificación"**

---

## 🧪 Paso 3: Probar Diferentes Escenarios

### Escenario 1: App en Primer Plano

1. **Mantén la app abierta y visible** en tu dispositivo
2. **Envía la notificación** desde el panel
3. **Resultado esperado**: 
   - ✅ Deberías ver la notificación en la parte superior de la pantalla
   - ✅ La notificación debería mostrarse visualmente

### Escenario 2: App en Segundo Plano

1. **Minimiza la app** (presiona el botón Home)
2. **Envía la notificación** desde el panel
3. **Resultado esperado**:
   - ✅ Deberías recibir una notificación nativa del sistema
   - ✅ Aparecerá en la barra de notificaciones
   - ✅ Podrás verla deslizando desde la parte superior

### Escenario 3: Dispositivo Bloqueado

1. **Bloquea tu dispositivo** (presiona el botón de bloqueo)
2. **Envía la notificación** desde el panel
3. **Resultado esperado**:
   - ✅ La notificación debería aparecer en la pantalla de bloqueo
   - ✅ Deberías poder ver el título y el mensaje
   - ✅ Al desbloquear, la notificación estará en la barra de notificaciones

---

## ✅ Verificación de Éxito

### Indicadores de que Funciona Correctamente:

1. **Token registrado**:
   - ✅ Token visible en Supabase `fcm_tokens`
   - ✅ `is_active = true`
   - ✅ `device_type = 'android'`

2. **Notificación enviada**:
   - ✅ Aparece en `notification_logs` en Supabase
   - ✅ `status = 'delivered'` o `status = 'sent'`
   - ✅ No hay `error_message`

3. **Notificación recibida**:
   - ✅ Aparece en el dispositivo (primer plano, segundo plano, o bloqueado)
   - ✅ Puedes ver el título y el mensaje
   - ✅ Puedes tocar la notificación para abrir la app

---

## 🔧 Solución de Problemas

### Problema: No se registra el token

**Solución**:
1. Verifica que `google-services.json` esté en `android/app/`
2. Verifica que los permisos de notificación estén otorgados
3. Revisa los logs de la app móvil para ver errores
4. Intenta cerrar y reabrir la app

### Problema: Token registrado pero no llegan notificaciones

**Verifica**:
1. ✅ El token en Supabase tiene `is_active = true`
2. ✅ El token no está marcado como `usado = true` (si aplica)
3. ✅ El dispositivo tiene conexión a internet
4. ✅ Los permisos de notificación están habilitados en el dispositivo

**Solución**:
- Intenta desinstalar y reinstalar la app
- Verifica que el `google-services.json` sea el correcto
- Revisa los logs en `notification_logs` para ver errores específicos

### Problema: Notificación llega pero no se muestra

**Solución**:
1. Verifica la configuración de notificaciones del dispositivo:
   - Settings → Apps → Ahorro365 → Notifications
   - Asegúrate de que estén habilitadas
2. Verifica que no estés en modo "No molestar"
3. Verifica que la app no esté en la lista de apps bloqueadas

### Problema: Error "Requested entity was not found"

**Solución**:
- El token es inválido o expiró
- El sistema lo desactivará automáticamente
- Cierra y reabre la app para obtener un nuevo token
- O desinstala y reinstala la app

---

## 📊 Verificar Logs en Supabase

### Tabla: `notification_logs`

Revisa los logs más recientes:
```sql
SELECT 
  id,
  user_id,
  title,
  body,
  status,
  sent_at,
  error_message
FROM notification_logs
ORDER BY sent_at DESC
LIMIT 10;
```

### Tabla: `fcm_tokens`

Verifica los tokens activos:
```sql
SELECT 
  id,
  user_id,
  device_type,
  is_active,
  created_at,
  last_used_at
FROM fcm_tokens
WHERE is_active = true
ORDER BY created_at DESC;
```

---

## 🎯 Checklist de Prueba

- [ ] Token FCM registrado en Supabase
- [ ] Token tiene `is_active = true` y `device_type = 'android'`
- [ ] Notificación enviada desde panel de administrador
- [ ] Notificación recibida con app en primer plano
- [ ] Notificación recibida con app en segundo plano
- [ ] Notificación recibida con dispositivo bloqueado
- [ ] Logs en Supabase muestran `status = 'delivered'`
- [ ] No hay errores en `notification_logs`

---

## 📝 Notas Importantes

- ⚠️ **Las notificaciones push NO funcionan en emuladores**, solo en dispositivos reales
- ⚠️ **El dispositivo debe tener conexión a internet** para recibir notificaciones
- ⚠️ **Los permisos de notificación deben estar otorgados** en el dispositivo
- ✅ **El token se registra automáticamente** al iniciar sesión
- ✅ **El sistema desactiva tokens inválidos automáticamente**

---

## 🚀 Próximos Pasos

Una vez que confirmes que las notificaciones funcionan:

1. **Probar diferentes tipos de notificaciones**:
   - Transacciones
   - Recordatorios
   - Referidos
   - Marketing

2. **Configurar notificaciones automáticas**:
   - Recordatorios de deudas
   - Notificaciones de metas
   - Alertas de pagos

3. **Monitorear el rendimiento**:
   - Revisar tasas de entrega
   - Revisar tasas de apertura
   - Optimizar mensajes

---

**💡 Tip**: Guarda el token FCM de tu dispositivo para pruebas rápidas desde el panel de administrador.

