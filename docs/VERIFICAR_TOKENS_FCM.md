# 🔍 Cómo Verificar Tokens FCM

## Verificar si un usuario tiene tokens activos

### Query SQL en Supabase:

```sql
-- Ver todos los tokens de un usuario específico
SELECT 
  id,
  user_id,
  token,
  device_type,
  device_model,
  is_active,
  created_at,
  last_used_at
FROM fcm_tokens
WHERE user_id = 'UUID-DEL-USUARIO'
ORDER BY created_at DESC;

-- Ver solo tokens activos
SELECT 
  id,
  user_id,
  token,
  device_type,
  is_active,
  last_used_at
FROM fcm_tokens
WHERE user_id = 'UUID-DEL-USUARIO'
  AND is_active = true;

-- Ver todos los usuarios con tokens activos
SELECT 
  u.id,
  u.email,
  u.telefono,
  COUNT(ft.id) as tokens_count
FROM usuarios u
LEFT JOIN fcm_tokens ft ON u.id = ft.user_id AND ft.is_active = true
GROUP BY u.id, u.email, u.telefono
HAVING COUNT(ft.id) > 0
ORDER BY tokens_count DESC;

-- Ver usuarios SIN tokens activos
SELECT 
  u.id,
  u.email,
  u.telefono,
  u.suscripcion,
  u.pais
FROM usuarios u
LEFT JOIN fcm_tokens ft ON u.id = ft.user_id AND ft.is_active = true
WHERE ft.id IS NULL;
```

## Pasos para que un usuario registre su token

1. **El usuario debe iniciar sesión** en la app (web o móvil)
2. **El usuario debe dar permisos** de notificaciones cuando se le solicite
3. **El sistema automáticamente registra el token** en `fcm_tokens`

### En Web:
- El navegador pedirá permisos de notificaciones
- Si acepta, se registra el token automáticamente

### En Móvil (Android/iOS):
- La app pedirá permisos de notificaciones
- Si acepta, se registra el token automáticamente

## Verificar estado de registro en la app

El estado se guarda en `localStorage` con la clave `ahorro365:fcmStatus`:

```javascript
// En la consola del navegador:
JSON.parse(localStorage.getItem('ahorro365:fcmStatus'))
```

Estados posibles:
- `registered`: Token registrado correctamente
- `pending`: Intentando registrar
- `denied`: Permisos denegados
- `error`: Error al registrar
- `signed_out`: Usuario no ha iniciado sesión

