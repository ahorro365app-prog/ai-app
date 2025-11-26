-- =============================================
-- FASE 1: Limpieza de Políticas - Tablas Principales
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-17
-- 
-- ⚠️ IMPORTANTE: Este script elimina políticas permisivas
-- de tablas que tienen RLS DESHABILITADO.
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
    AND tablename IN ('usuarios', 'users', 'transacciones', 'transactions')
ORDER BY tablename;

-- ✅ Revisa este resultado primero para ver qué tablas existen
-- Solo ejecutaremos DROP POLICY en tablas que existan

-- =============================================
-- PASO 2: Eliminar políticas de tabla: usuarios
-- =============================================
-- Solo ejecuta si la tabla "usuarios" existe

DROP POLICY IF EXISTS "Permitir todas las operaciones para usuarios" ON usuarios;

-- Si también existe "users" (versión en inglés), descomenta la siguiente línea:
-- DROP POLICY IF EXISTS "Enable all operations for users" ON users;

-- =============================================
-- PASO 3: Eliminar políticas de tabla: transacciones
-- =============================================
-- Solo ejecuta si la tabla "transacciones" existe

DROP POLICY IF EXISTS "Permitir todas las operaciones para transacciones" ON transacciones;

-- Si también existe "transactions" (versión en inglés), descomenta la siguiente línea:
-- DROP POLICY IF EXISTS "Enable all operations for transactions" ON transactions;

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
        AND tablename IN ('usuarios', 'users', 'transacciones', 'transactions')
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
        AND tablename IN ('usuarios', 'users', 'transacciones', 'transactions')
    )
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO: rls_enabled = false en todas

-- =============================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- =============================================

-- 1. Ejecutar PASO 1 primero para ver qué tablas existen
-- 2. Ejecutar PASOS 2 y 3 (solo afectarán tablas que existen)
-- 3. Verificar que el query de verificación retorna 0 filas (o menos)
-- 4. Verificar que RLS sigue deshabilitado
-- 5. (Opcional) Probar que la app sigue funcionando
-- 6. Documentar resultados en RLS_VERIFICATION_RESULTS.md
-- 7. Esperar 5 minutos antes de ejecutar Fase 2

-- =============================================
-- FIN DE FASE 1
-- =============================================
