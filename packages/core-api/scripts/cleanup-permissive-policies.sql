-- =============================================
-- Script de Limpieza de Políticas Permisivas
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-17
-- 
-- ⚠️ IMPORTANTE: Este script elimina políticas permisivas
-- de tablas que tienen RLS DESHABILITADO.
-- 
-- Estas políticas no afectan la seguridad (RLS está deshabilitado),
-- pero es mejor limpiarlas para mantener consistencia.
-- =============================================

-- =============================================
-- FASE 1: Eliminar políticas permisivas de tablas principales
-- =============================================

-- Tabla: usuarios
DROP POLICY IF EXISTS "Permitir todas las operaciones para usuarios" ON usuarios;
DROP POLICY IF EXISTS "Enable all operations for users" ON users;

-- Tabla: transacciones
DROP POLICY IF EXISTS "Permitir todas las operaciones para transacciones" ON transacciones;
DROP POLICY IF EXISTS "Enable all operations for transactions" ON transactions;

-- Tabla: pagos
DROP POLICY IF EXISTS "Users can view their own payments" ON pagos;
DROP POLICY IF EXISTS "Users can create their own payments" ON pagos;
DROP POLICY IF EXISTS "Enable all operations for payments" ON payments;

-- =============================================
-- FASE 2: Eliminar políticas permisivas de tablas secundarias
-- =============================================

-- Tabla: deudas
DROP POLICY IF EXISTS "Permitir todas las operaciones para deudas" ON deudas;
DROP POLICY IF EXISTS "Enable all operations for debts" ON debts;

-- Tabla: metas
DROP POLICY IF EXISTS "Permitir todas las operaciones para metas" ON metas;
DROP POLICY IF EXISTS "Enable all operations for goals" ON goals;

-- Tabla: logs_whatsapp
DROP POLICY IF EXISTS "Permitir todas las operaciones para logs_whatsapp" ON logs_whatsapp;
DROP POLICY IF EXISTS "Enable all operations for whatsapp_logs" ON whatsapp_logs;

-- =============================================
-- VERIFICACIÓN POST-LIMPIEZA
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
    AND tablename IN (
        'usuarios', 'users',
        'transacciones', 'transactions',
        'pagos', 'payments',
        'deudas', 'debts',
        'metas', 'goals',
        'logs_whatsapp', 'whatsapp_logs'
    )
ORDER BY tablename;

-- Si este query retorna 0 filas, la limpieza fue exitosa
-- Si retorna filas, hay políticas que no se pudieron eliminar (verificar nombres)

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================

-- ✅ admin_users MANTIENE su política (es correcta):
--    "Service role can access admin_users" con condicion (auth.role() = 'service_role')

-- ✅ Las tablas con RLS deshabilitado NO necesitan políticas
--    La seguridad se maneja en el backend con service_role

-- ✅ Si alguna tabla tiene RLS habilitado en el futuro,
--    se deben crear políticas específicas (no permisivas)

-- =============================================
-- FIN DEL SCRIPT
-- =============================================

