-- =============================================
-- Script de Verificación de RLS Policies
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-17
-- =============================================

-- =============================================
-- 1. VERIFICAR ESTADO DE RLS POR TABLA
-- =============================================

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ Habilitado'
        ELSE '❌ Deshabilitado'
    END as rls_status,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        -- Tablas principales
        'usuarios', 'users',
        'transacciones', 'transactions',
        'pagos', 'payments',
        'referidos', 'referrals',
        'deudas', 'debts',
        'metas', 'goals',
        
        -- Tablas de notificaciones
        'notification_logs',
        'notification_preferences',
        'notification_campaigns',
        'notification_templates',
        'notification_trigger_logs',
        'fcm_tokens',
        
        -- Tablas de admin
        'admin_users',
        
        -- Otras tablas críticas
        'codigos_verificacion',
        'app_versions',
        'version_check_logs',
        'estadisticas_feedback'
    )
ORDER BY tablename;

-- =============================================
-- 2. VERIFICAR POLÍTICAS RLS ACTIVAS
-- =============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Lectura'
        WHEN cmd = 'INSERT' THEN 'Inserción'
        WHEN cmd = 'UPDATE' THEN 'Actualización'
        WHEN cmd = 'DELETE' THEN 'Eliminación'
        WHEN cmd = 'ALL' THEN 'Todas las operaciones'
        ELSE cmd
    END as operacion,
    qual as condicion,
    with_check as validacion
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'usuarios', 'users',
        'transacciones', 'transactions',
        'pagos', 'payments',
        'referidos', 'referrals',
        'notification_logs',
        'notification_preferences',
        'fcm_tokens',
        'admin_users'
    )
ORDER BY tablename, policyname;

-- =============================================
-- 3. RESUMEN DE ESTADO DE RLS
-- =============================================

SELECT 
    CASE 
        WHEN rowsecurity THEN 'RLS Habilitado'
        ELSE 'RLS Deshabilitado'
    END as estado,
    COUNT(*) as cantidad_tablas,
    STRING_AGG(tablename, ', ' ORDER BY tablename) as tablas
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'usuarios', 'users',
        'transacciones', 'transactions',
        'pagos', 'payments',
        'referidos', 'referrals',
        'notification_logs',
        'notification_preferences',
        'fcm_tokens',
        'admin_users'
    )
GROUP BY rowsecurity
ORDER BY estado;

-- =============================================
-- 4. VERIFICAR TABLAS CON POLÍTICAS PERMISIVAS
-- =============================================
-- Buscar políticas que permiten todo (USING (true))

SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    '⚠️ POLÍTICA PERMISIVA' as advertencia
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        qual = 'true' 
        OR qual LIKE '%true%'
        OR with_check = 'true'
        OR with_check LIKE '%true%'
    )
ORDER BY tablename;

-- =============================================
-- 5. VERIFICAR TABLAS CRÍTICAS SIN RLS
-- =============================================
-- Estas tablas DEBEN tener validación en backend

SELECT 
    tablename,
    '❌ RLS Deshabilitado - Requiere validación en backend' as estado,
    'Verificar que los endpoints validan userId correctamente' as accion_requerida
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename IN (
        'usuarios', 'users',
        'transacciones', 'transactions',
        'pagos', 'payments',
        'referidos', 'referrals',
        'notification_logs',
        'notification_preferences',
        'fcm_tokens'
    )
ORDER BY tablename;

-- =============================================
-- 6. VERIFICAR TABLA ADMIN_USERS (DEBE TENER RLS)
-- =============================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado (Correcto)'
        ELSE '❌ RLS Deshabilitado (REVISAR)'
    END as estado,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_users') as politicas_activas
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- =============================================
-- 7. INSTRUCCIONES POST-VERIFICACIÓN
-- =============================================
-- Después de ejecutar estos queries, verificar:

-- ✅ Si RLS está deshabilitado en tablas principales:
--    1. Verificar que los endpoints usan authHelpers.ts
--    2. Verificar que validan userId antes de acceder a datos
--    3. Ejecutar tests de aislamiento de datos

-- ✅ Si RLS está habilitado:
--    1. Verificar que las políticas son correctas
--    2. Verificar que no hay políticas permisivas (USING (true))
--    3. Ejecutar tests de aislamiento de datos

-- ✅ Para admin_users:
--    1. Debe tener RLS habilitado
--    2. Debe tener políticas específicas
--    3. El backend usa service_role (bypass RLS de todas formas)

-- =============================================
-- FIN DEL SCRIPT
-- =============================================

