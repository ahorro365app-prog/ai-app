-- =============================================
-- FASE 2: Limpieza de Políticas - Tabla de Pagos
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-17
-- 
-- ⚠️ IMPORTANTE: Este script elimina políticas permisivas
-- de la tabla pagos que tiene RLS DESHABILITADO.
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
    AND tablename IN ('pagos', 'payments')
ORDER BY tablename;

-- ✅ Revisa este resultado primero para ver qué tablas existen
-- Solo ejecutaremos DROP POLICY en tablas que existan

-- =============================================
-- PASO 2: Eliminar políticas de tabla: pagos
-- =============================================
-- Solo ejecuta si la tabla "pagos" existe

DROP POLICY IF EXISTS "Users can view their own payments" ON pagos;
DROP POLICY IF EXISTS "Users can create their own payments" ON pagos;

-- Si también existe "payments" (versión en inglés), descomenta las siguientes líneas:
-- DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
-- DROP POLICY IF EXISTS "Users can create their own payments" ON payments;
-- DROP POLICY IF EXISTS "Enable all operations for payments" ON payments;

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
        AND tablename IN ('pagos', 'payments')
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
        AND tablename IN ('pagos', 'payments')
    )
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO: rls_enabled = false

-- =============================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- =============================================

-- 1. Ejecutar PASO 1 primero para ver qué tablas existen
-- 2. Ejecutar PASO 2 (solo afectará tablas que existen)
-- 3. Verificar que el query de verificación retorna 0 filas (o menos)
-- 4. Verificar que RLS sigue deshabilitado
-- 5. (Opcional) Probar que la app sigue funcionando
-- 6. Documentar resultados en RLS_VERIFICATION_RESULTS.md
-- 7. Esperar 5 minutos antes de ejecutar Fase 3

-- =============================================
-- FIN DE FASE 2
-- =============================================
