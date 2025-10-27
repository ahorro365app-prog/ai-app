-- =============================================
-- SOLUCIÓN QUE FUNCIONA EN SUPABASE
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

-- 2. Crear política permisiva que SIEMPRE permita acceso
CREATE POLICY "Allow all storage operations" ON storage.objects
FOR ALL USING (true);

-- 3. Verificar que se creó correctamente
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'Allow all storage operations';
