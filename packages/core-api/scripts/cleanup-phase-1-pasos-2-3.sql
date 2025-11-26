-- =============================================
-- FASE 1 - PASOS 2 y 3: Eliminar Políticas
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-17
-- 
-- ⚠️ IMPORTANTE: Solo ejecuta esto DESPUÉS de verificar
-- que las tablas existen (PASO 1)
-- 
-- Tablas confirmadas: usuarios, transacciones
-- =============================================

-- =============================================
-- PASO 2: Eliminar políticas de tabla: usuarios
-- =============================================

DROP POLICY IF EXISTS "Permitir todas las operaciones para usuarios" ON usuarios;

-- =============================================
-- PASO 3: Eliminar políticas de tabla: transacciones
-- =============================================

DROP POLICY IF EXISTS "Permitir todas las operaciones para transacciones" ON transacciones;

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
    AND tablename IN ('usuarios', 'transacciones')
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
    AND tablename IN ('usuarios', 'transacciones')
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO: rls_enabled = false en ambas

-- =============================================
-- FIN DE PASOS 2 y 3
-- =============================================

