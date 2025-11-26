-- =============================================
-- FASE 2 - PASO 2: Eliminar Políticas de Pagos
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-17
-- 
-- ⚠️ IMPORTANTE: Solo ejecuta esto DESPUÉS de verificar
-- que la tabla existe (PASO 1)
-- 
-- Tabla confirmada: pagos
-- =============================================

-- =============================================
-- PASO 2: Eliminar políticas de tabla: pagos
-- =============================================

DROP POLICY IF EXISTS "Users can view their own payments" ON pagos;
DROP POLICY IF EXISTS "Users can create their own payments" ON pagos;

-- =============================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- =============================================

-- Verificar que las políticas fueron eliminadas
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
    AND tablename IN ('pagos')
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO: 0 filas
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
    AND tablename IN ('pagos')
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO: rls_enabled = false

-- =============================================
-- FIN DE PASO 2
-- =============================================


