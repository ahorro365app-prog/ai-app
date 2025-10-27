-- ⚠️ SOLUCIÓN TEMPORAL PARA DIAGNOSTICAR
-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for receipts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for testing" ON storage.objects;

-- Crear política temporal muy permisiva para el bucket receipts
-- Política simple que permite todo en el bucket receipts
CREATE POLICY "Allow all receipts operations" ON storage.objects
FOR ALL USING (true);

-- Verificar que se creó
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%receipts%';
