-- =============================================
-- DESHABILITAR RLS - VALIDACIÓN BACKEND
-- =============================================
-- Este script deshabilita RLS explícitamente en las tablas principales
-- La seguridad se maneja en el backend usando authHelpers.ts
-- 
-- IMPORTANTE: Este cambio es parte de la Fase 1 del Plan de Seguridad
-- Fecha: 2025
-- =============================================

-- 1. Deshabilitar RLS en tablas principales de usuarios
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- 2. Deshabilitar RLS en tablas de transacciones
ALTER TABLE IF EXISTS transacciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;

-- 3. Deshabilitar RLS en tablas de deudas
ALTER TABLE IF EXISTS deudas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS debts DISABLE ROW LEVEL SECURITY;

-- 4. Deshabilitar RLS en tablas de metas
ALTER TABLE IF EXISTS metas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goals DISABLE ROW LEVEL SECURITY;

-- 5. Deshabilitar RLS en tablas de pagos
ALTER TABLE IF EXISTS pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;

-- 6. Deshabilitar RLS en tablas de logs
ALTER TABLE IF EXISTS logs_whatsapp DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whatsapp_logs DISABLE ROW LEVEL SECURITY;

-- 7. Deshabilitar RLS en otras tablas relacionadas
ALTER TABLE IF EXISTS categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referrals DISABLE ROW LEVEL SECURITY;

-- =============================================
-- NOTA: admin_users MANTIENE RLS
-- =============================================
-- La tabla admin_users mantiene RLS habilitado porque:
-- 1. Usa service_role key (bypass RLS de todas formas)
-- 2. Tiene políticas específicas para service_role
-- 3. Es una tabla crítica que requiere protección adicional
-- =============================================

-- Verificar estado de RLS después de deshabilitar
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'usuarios', 'users',
        'transacciones', 'transactions',
        'deudas', 'debts',
        'metas', 'goals',
        'pagos', 'payments',
        'logs_whatsapp', 'whatsapp_logs',
        'categorias', 'categories',
        'referidos', 'referrals'
    )
ORDER BY tablename;

-- =============================================
-- ELIMINAR POLÍTICAS RLS PERMISIVAS (OPCIONAL)
-- =============================================
-- Si quieres limpiar las políticas antiguas, ejecuta esto:
-- (Comentado por seguridad, descomenta si quieres limpiar)

/*
DROP POLICY IF EXISTS "Permitir todas las operaciones para usuarios" ON usuarios;
DROP POLICY IF EXISTS "Enable all operations for users" ON users;
DROP POLICY IF EXISTS "Permitir todas las operaciones para transacciones" ON transacciones;
DROP POLICY IF EXISTS "Enable all operations for transactions" ON transactions;
DROP POLICY IF EXISTS "Permitir todas las operaciones para deudas" ON deudas;
DROP POLICY IF EXISTS "Enable all operations for debts" ON debts;
DROP POLICY IF EXISTS "Permitir todas las operaciones para metas" ON metas;
DROP POLICY IF EXISTS "Enable all operations for goals" ON goals;
DROP POLICY IF EXISTS "Permitir todas las operaciones para whatsapp_logs" ON whatsapp_logs;
DROP POLICY IF EXISTS "Enable all operations for whatsapp_logs" ON whatsapp_logs;
*/

-- =============================================
-- VALIDACIÓN POST-EJECUCIÓN
-- =============================================
-- Después de ejecutar este script, verifica que:
-- 1. RLS está deshabilitado (rowsecurity = false)
-- 2. Los endpoints usan authHelpers.ts para validación
-- 3. Los endpoints que usan service_role son seguros
-- =============================================

