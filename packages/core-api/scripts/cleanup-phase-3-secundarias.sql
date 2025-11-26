-- =============================================
-- FASE 3: Limpieza de Políticas - Tablas Secundarias
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-17
-- 
-- ⚠️ IMPORTANTE: Este script elimina políticas permisivas
-- de tablas secundarias que tienen RLS DESHABILITADO.
-- 
-- RIESGO: 🟢 MUY BAJO - RLS deshabilitado, políticas no se usan
-- =============================================

-- =============================================
-- PASO 1: Verificar qué tablas existen
-- =============================================

SELECT 
    tablename,
    'Tabla existe' as estado
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('deudas', 'debts', 'metas', 'goals', 'logs_whatsapp', 'whatsapp_logs')
ORDER BY tablename;

-- ✅ Revisa este resultado primero para ver qué tablas existen
-- Solo ejecutaremos DROP POLICY en tablas que existan

-- =============================================
-- PASO 2: Eliminar políticas de tabla: deudas
-- =============================================
-- Solo ejecuta si la tabla "deudas" existe

DROP POLICY IF EXISTS "Permitir todas las operaciones para deudas" ON deudas;

-- Si también existe "debts" (versión en inglés), descomenta la siguiente línea:
-- DROP POLICY IF EXISTS "Enable all operations for debts" ON debts;

-- =============================================
-- PASO 3: Eliminar políticas de tabla: metas
-- =============================================
-- Solo ejecuta si la tabla "metas" existe

DROP POLICY IF EXISTS "Permitir todas las operaciones para metas" ON metas;

-- Si también existe "goals" (versión en inglés), descomenta la siguiente línea:
-- DROP POLICY IF EXISTS "Enable all operations for goals" ON goals;

-- =============================================
-- PASO 4: Eliminar políticas de tabla: logs_whatsapp
-- =============================================
-- Solo ejecuta si la tabla "logs_whatsapp" existe

DROP POLICY IF EXISTS "Permitir todas las operaciones para logs_whatsapp" ON logs_whatsapp;

-- Si también existe "whatsapp_logs" (versión en inglés), descomenta la siguiente línea:
-- DROP POLICY IF EXISTS "Enable all operations for whatsapp_logs" ON whatsapp_logs;

-- =============================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- =============================================

-- Verificar que las políticas fueron eliminadas
-- Este query solo busca en tablas que existen
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
    AND tablename IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('deudas', 'debts', 'metas', 'goals', 'logs_whatsapp', 'whatsapp_logs')
    )
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO: 0 filas (o menos que antes)
-- Si hay filas, verificar nombres de políticas

-- =============================================
-- VERIFICAR QUE RLS SIGUE DESHABILITADO
-- =============================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ Habilitado'
        ELSE '❌ Deshabilitado'
    END as rls_status,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('deudas', 'debts', 'metas', 'goals', 'logs_whatsapp', 'whatsapp_logs')
    )
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO: rls_enabled = false en todas

-- =============================================
-- VERIFICACIÓN FINAL COMPLETA
-- =============================================

-- Verificar todas las tablas críticas
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ Habilitado'
        ELSE '❌ Deshabilitado'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' 
     AND tablename = t.tablename) as politicas_activas
FROM pg_tables t
WHERE schemaname = 'public'
    AND tablename IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'usuarios', 'users',
            'transacciones', 'transactions',
            'pagos', 'payments',
            'deudas', 'debts',
            'metas', 'goals',
            'logs_whatsapp', 'whatsapp_logs',
            'admin_users'
        )
    )
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO:
-- - admin_users: RLS habilitado, 1 política
-- - Todas las demás: RLS deshabilitado, 0 políticas permisivas

-- =============================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- =============================================

-- 1. Ejecutar PASO 1 primero para ver qué tablas existen
-- 2. Ejecutar PASOS 2, 3 y 4 (solo afectarán tablas que existen)
-- 3. Verificar que el query de verificación retorna 0 filas
-- 4. Verificar que RLS sigue deshabilitado en todas excepto admin_users
-- 5. Verificar que admin_users mantiene su política correcta
-- 6. (Opcional) Probar que la app sigue funcionando
-- 7. Documentar resultados finales en RLS_VERIFICATION_RESULTS.md
-- 8. Actualizar SEGURIDAD_ESTADO_ACTUAL.md

-- =============================================
-- FIN DE FASE 3 - LIMPIEZA COMPLETA
-- =============================================
