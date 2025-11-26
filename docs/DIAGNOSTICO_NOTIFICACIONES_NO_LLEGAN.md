# 🔍 Diagnóstico: Notificaciones No Llegan al Móvil

**Fecha**: 2025-11-24  
**Problema**: Notificación llega en localhost (web) pero no en el celular

---

## 📋 Checklist de Diagnóstico

### Paso 1: Verificar qué Token se Usó

1. **Ve a Supabase** → Table Editor → `notification_logs`
2. **Busca la notificación más reciente** (ordena por `sent_at DESC`)
3. **Revisa el campo `filters` o `data`** para ver qué token se usó
4. **O revisa directamente en el panel de administrador**:
   - Ve a la sección "Logs Recientes"
   - Busca la notificación que enviaste
   - Verifica qué token o usuario se usó

### Paso 2: Verificar Token del Móvil

1. **Ve a Supabase** → Table Editor → `fcm_tokens`
2. **Filtra por tu `user_id`** o busca el más reciente
3. **Verifica que exista un token con**:
   - ✅ `device_type = 'android'`
   - ✅ `is_active = true`
   - ✅ `created_at` sea reciente (después de instalar el nuevo APK)

### Paso 3: Comparar Tokens

**Problema común**: Se envió al token de web en lugar del token de móvil

- **Token de Web**: `device_type = 'web'`
- **Token de Móvil**: `device_type = 'android'`

**Solución**: Asegúrate de usar el token con `device_type = 'android'` al enviar desde el panel.

### Paso 4: Verificar Errores en Logs

1. **Ve a Supabase** → Table Editor → `notification_logs`
2. **Busca la notificación que enviaste**
3. **Revisa**:
   - `status`: ¿Es `'sent'`, `'delivered'`, o `'failed'`?
   - `error_message`: ¿Hay algún error?
   - Si `status = 'failed'`, lee el `error_message`

### Paso 5: Verificar Permisos en el Dispositivo

1. **Ve a Configuración** → Apps → Ahorro365 → Notificaciones
2. **Verifica que las notificaciones estén habilitadas**
3. **Asegúrate de que no esté en modo "No molestar"**

---

## 🔧 Soluciones Comunes

### Problema 1: Token Incorrecto

**Síntoma**: Notificación llega en web pero no en móvil

**Causa**: Se usó el token de web en lugar del token de móvil

**Solución**:
1. Ve a Supabase → `fcm_tokens`
2. Busca el token con `device_type = 'android'` y `is_active = true`
3. Copia ese token
4. Envía la notificación usando ese token específico

### Problema 2: Token No Registrado

**Síntoma**: No hay token de Android en `fcm_tokens`

**Causa**: El token no se registró al iniciar sesión

**Solución**:
1. Cierra completamente la app móvil
2. Ábrela nuevamente
3. Inicia sesión
4. Espera unos segundos
5. Verifica en Supabase que el token se haya registrado

### Problema 3: Token Desactivado

**Síntoma**: Token existe pero `is_active = false`

**Causa**: El token fue marcado como inválido

**Solución**:
1. Desinstala y reinstala la app
2. O simplemente cierra y abre la app nuevamente
3. El token se registrará automáticamente

### Problema 4: Error en Firebase

**Síntoma**: `status = 'failed'` con error en `error_message`

**Errores comunes**:
- `Requested entity was not found`: Token inválido
- `messaging/registration-token-not-registered`: Token no existe en Firebase
- `messaging/invalid-registration-token`: Token mal formado

**Solución**:
- El sistema desactivará el token automáticamente
- Cierra y abre la app para obtener un nuevo token
- O desinstala y reinstala la app

---

## 🧪 Prueba Rápida

### Método 1: Enviar por Usuario ID (Recomendado)

1. **Obtén tu `user_id`** de Supabase → `usuarios`
2. **En el panel de administrador**:
   - Modo: "Directo"
   - Tipo: "Usuario (userId)"
   - Pega tu `user_id`
   - Envía la notificación
3. **Esto enviará a TODOS los tokens activos del usuario** (web y móvil)

### Método 2: Enviar por Token Específico

1. **Obtén el token de Android** de Supabase → `fcm_tokens`
2. **Filtra**: `device_type = 'android'` y `is_active = true`
3. **Copia el token**
4. **En el panel de administrador**:
   - Modo: "Directo"
   - Tipo: "Token FCM"
   - Pega el token de Android
   - Envía la notificación

---

## 📊 Verificación en Supabase

### Query para Ver Tokens del Usuario

```sql
SELECT 
  id,
  user_id,
  device_type,
  is_active,
  created_at,
  last_used_at,
  LEFT(token, 30) || '...' as token_preview
FROM fcm_tokens
WHERE user_id = 'TU_USER_ID_AQUI'
ORDER BY created_at DESC;
```

### Query para Ver Logs de Notificaciones

```sql
SELECT 
  id,
  user_id,
  title,
  body,
  status,
  error_message,
  sent_at
FROM notification_logs
WHERE user_id = 'TU_USER_ID_AQUI'
ORDER BY sent_at DESC
LIMIT 10;
```

---

## ✅ Checklist Final

- [ ] Token de Android existe en `fcm_tokens` con `is_active = true`
- [ ] Token de Android tiene `device_type = 'android'`
- [ ] Token fue creado después de instalar el nuevo APK
- [ ] Notificación se envió usando el token correcto (Android)
- [ ] No hay errores en `notification_logs`
- [ ] Permisos de notificación habilitados en el dispositivo
- [ ] Dispositivo tiene conexión a internet
- [ ] App no está en modo "No molestar"

---

## 🚨 Si Nada Funciona

1. **Desinstala completamente la app**
2. **Reinstala el APK más reciente**
3. **Inicia sesión**
4. **Espera 30 segundos** para que el token se registre
5. **Verifica en Supabase** que el token esté registrado
6. **Envía una nueva notificación** usando el nuevo token

---

**💡 Tip**: Siempre verifica que estés usando el token con `device_type = 'android'` y no el de `device_type = 'web'`.

