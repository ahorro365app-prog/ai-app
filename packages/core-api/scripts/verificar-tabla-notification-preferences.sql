-- =============================================
-- Verificar Tabla notification_preferences
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- Para diagnosticar el error "Error al obtener preferencias"
-- =============================================

-- 1. Verificar que la tabla existe
SELECT 
    tablename,
    'Tabla existe' as estado
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'notification_preferences';

-- 2. Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- 3. Verificar estado de RLS
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ Habilitado'
        ELSE '❌ Deshabilitado'
    END as rls_status,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'notification_preferences';

-- 4. Verificar políticas RLS (si hay alguna)
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'notification_preferences';

-- 5. Contar registros (para verificar acceso)
SELECT COUNT(*) as total_registros
FROM notification_preferences;

-- 6. Verificar permisos de la tabla
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND table_name = 'notification_preferences';

-- =============================================
-- RESULTADOS ESPERADOS:
-- =============================================
-- 1. Tabla debe existir
-- 2. Debe tener columnas: id, user_id, push_enabled, etc.
-- 3. RLS debe estar deshabilitado (según diseño)
-- 4. No debe haber políticas permisivas
-- 5. Debe poder contar registros (acceso funciona)
-- =============================================

