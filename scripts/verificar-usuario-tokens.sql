-- Script para verificar usuario y sus tokens FCM
-- Usuario: +591 76990076

-- 1. Buscar el usuario por teléfono
SELECT 
  id,
  email,
  telefono,
  suscripcion,
  pais,
  created_at,
  fecha_expiracion_suscripcion
FROM usuarios
WHERE telefono LIKE '%76990076%' 
   OR telefono LIKE '%59176990076%'
   OR telefono = '+591 76990076'
   OR telefono = '59176990076'
ORDER BY created_at DESC;

-- 2. Una vez que tengas el UUID del usuario, reemplaza 'UUID-AQUI' y ejecuta:

-- Ver todos los tokens del usuario (activos e inactivos)
SELECT 
  id,
  user_id,
  token,
  device_type,
  device_model,
  app_version,
  os_version,
  is_active,
  created_at,
  updated_at,
  last_used_at
FROM fcm_tokens
WHERE user_id = 'UUID-AQUI'  -- Reemplaza con el UUID del usuario
ORDER BY created_at DESC;

-- 3. Ver solo tokens activos
SELECT 
  id,
  token,
  device_type,
  device_model,
  is_active,
  created_at,
  last_used_at
FROM fcm_tokens
WHERE user_id = 'UUID-AQUI'  -- Reemplaza con el UUID del usuario
  AND is_active = true
ORDER BY last_used_at DESC;

-- 4. Ver preferencias de notificaciones del usuario
SELECT 
  id,
  user_id,
  push_enabled,
  marketing_enabled,
  reminder_enabled,
  transaction_enabled,
  quiet_hours_start,
  quiet_hours_end,
  timezone,
  created_at,
  updated_at
FROM notification_preferences
WHERE user_id = 'UUID-AQUI';  -- Reemplaza con el UUID del usuario

-- 5. Vista completa: Usuario + Tokens + Preferencias
SELECT 
  u.id as user_id,
  u.email,
  u.telefono,
  u.suscripcion,
  u.pais,
  COUNT(ft.id) as total_tokens,
  COUNT(CASE WHEN ft.is_active = true THEN 1 END) as tokens_activos,
  COUNT(CASE WHEN ft.is_active = false THEN 1 END) as tokens_inactivos,
  MAX(ft.last_used_at) as ultimo_token_usado,
  np.push_enabled,
  np.marketing_enabled,
  np.reminder_enabled,
  np.transaction_enabled
FROM usuarios u
LEFT JOIN fcm_tokens ft ON u.id = ft.user_id
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE u.telefono LIKE '%76990076%' 
   OR u.telefono LIKE '%59176990076%'
   OR u.telefono = '+591 76990076'
   OR u.telefono = '59176990076'
GROUP BY u.id, u.email, u.telefono, u.suscripcion, u.pais, 
         np.push_enabled, np.marketing_enabled, np.reminder_enabled, np.transaction_enabled;

