-- =============================================
-- Verificar Preferencias Directamente en Supabase
-- =============================================
-- Ejecuta esto en Supabase SQL Editor
-- Para ver el valor REAL en la base de datos
-- =============================================

SELECT 
  id,
  user_id,
  push_enabled,  -- Este es el valor REAL
  transaction_enabled,
  reminder_enabled,
  marketing_enabled,
  timezone,
  created_at,
  updated_at,
  -- Verificar el tipo de dato
  pg_typeof(push_enabled) as tipo_dato_push_enabled
FROM notification_preferences
WHERE user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043';

-- =============================================
-- RESULTADO ESPERADO:
-- =============================================
-- push_enabled debería ser: false
-- updated_at debería ser: 2025-11-25T22:09:02.738+00:00 (o más reciente)
-- =============================================

