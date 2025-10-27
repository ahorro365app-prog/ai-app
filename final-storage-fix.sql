-- =============================================
-- SOLUCIÓN DEFINITIVA PARA STORAGE
-- =============================================

-- 1. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for receipts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for testing" ON storage.objects;
DROP POLICY IF EXISTS "Allow all receipts operations" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for receipts bucket" ON storage.objects;

-- 2. Deshabilitar RLS temporalmente en storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que RLS está deshabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 4. Verificar políticas existentes (debería estar vacío)
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
