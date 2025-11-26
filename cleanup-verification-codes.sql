-- =====================================================
-- Limpieza Automática de Códigos de Verificación
-- =====================================================
-- Descripción: Elimina automáticamente códigos de verificación
-- expirados y no usados para mantener la base de datos limpia
-- =====================================================

-- Función para limpiar códigos de verificación expirados
CREATE OR REPLACE FUNCTION limpiar_codigos_verificacion_expirados()
RETURNS TABLE(
  codigos_eliminados BIGINT,
  codigos_usados_eliminados BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_codigos_expirados BIGINT;
  v_codigos_usados BIGINT;
BEGIN
  -- Eliminar códigos expirados (sin importar si están usados o no)
  -- Los códigos expirados ya no sirven, así que los eliminamos todos
  DELETE FROM codigos_verificacion
  WHERE expira_en < NOW();
  
  GET DIAGNOSTICS v_codigos_expirados = ROW_COUNT;
  
  -- También eliminar códigos usados hace más de 1 hora (aunque no estén expirados)
  -- Esto es para limpieza adicional de códigos que ya cumplieron su función
  DELETE FROM codigos_verificacion
  WHERE usado = true 
    AND fecha_creacion < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_codigos_usados = ROW_COUNT;
  
  RETURN QUERY SELECT v_codigos_expirados, v_codigos_usados;
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION limpiar_codigos_verificacion_expirados() IS 
'Limpia códigos de verificación expirados (más de 10 minutos) y códigos usados hace más de 1 hora';

-- =====================================================
-- OPCIÓN 1: Ejecución Manual (Recomendado para empezar)
-- =====================================================
-- Ejecutar periódicamente manualmente:
-- SELECT * FROM limpiar_codigos_verificacion_expirados();

-- =====================================================
-- OPCIÓN 2: Programar con pg_cron (Si está habilitado)
-- =====================================================
-- Ejecutar cada hora automáticamente:
/*
SELECT cron.schedule(
  'limpiar-codigos-verificacion',
  '0 * * * *', -- Cada hora
  $$SELECT limpiar_codigos_verificacion_expirados()$$
);
*/

-- =====================================================
-- OPCIÓN 3: Trigger después de insertar (Alternativa)
-- =====================================================
-- NOTA: Esta opción es más costosa pero más automática
-- Solo limpiar si hay más de 1000 códigos en la tabla

CREATE OR REPLACE FUNCTION trigger_limpiar_codigos_si_necesario()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_codigos BIGINT;
BEGIN
  -- Contar códigos totales
  SELECT COUNT(*) INTO v_total_codigos
  FROM codigos_verificacion;
  
  -- Si hay más de 1000 códigos, ejecutar limpieza
  IF v_total_codigos > 1000 THEN
    PERFORM limpiar_codigos_verificacion_expirados();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecute después de insertar un código
CREATE TRIGGER trigger_limpieza_codigos
AFTER INSERT ON codigos_verificacion
FOR EACH ROW
EXECUTE FUNCTION trigger_limpiar_codigos_si_necesario();

-- Comentario para documentación
COMMENT ON FUNCTION trigger_limpiar_codigos_si_necesario() IS 
'Trigger que limpia códigos expirados automáticamente cuando hay más de 1000 códigos en la tabla';

-- =====================================================
-- Verificación
-- =====================================================

-- Verificar que la función se creó correctamente
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'limpiar_codigos_verificacion_expirados';

-- Verificar que el trigger se creó correctamente
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_limpieza_codigos';

-- =====================================================
-- TEST: Probar la función manualmente
-- =====================================================
-- Descomenta para probar:
-- SELECT * FROM limpiar_codigos_verificacion_expirados();

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. La función elimina códigos expirados (expira_en < NOW())
-- 2. También elimina códigos usados hace más de 1 hora
-- 3. El trigger se ejecuta automáticamente después de cada inserción
--    pero solo limpia si hay más de 1000 códigos (para evitar sobrecarga)
-- 4. Para limpieza más frecuente, usar pg_cron (Opción 2)
-- 5. Para ejecución manual, usar la función directamente (Opción 1)

