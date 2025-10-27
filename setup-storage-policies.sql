-- =============================================
-- POLÍTICAS DE SEGURIDAD PARA STORAGE
-- =============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for receipts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for testing" ON storage.objects;

-- Crear políticas seguras para el bucket 'receipts'
-- Estas políticas permiten que solo usuarios autenticados suban archivos a su propia carpeta

-- Política para subir archivos (INSERT)
CREATE POLICY "Users can upload receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para leer archivos (SELECT)
CREATE POLICY "Users can view own receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para eliminar archivos (DELETE)
CREATE POLICY "Users can delete own receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para actualizar archivos (UPDATE)
CREATE POLICY "Users can update own receipts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- VERIFICACIÓN
-- =============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%receipts%'
ORDER BY policyname;

-- Verificar buckets existentes
SELECT * FROM storage.buckets WHERE name = 'receipts';
