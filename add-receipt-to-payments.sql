-- Agregar campo de comprobante a la tabla de deudas para los pagos
-- Este campo almacenará la URL de la imagen del comprobante en Supabase Storage

-- Agregar columna de comprobante a la tabla de deudas
ALTER TABLE debts ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN debts.receipt_url IS 'URL del comprobante de pago almacenado en Supabase Storage';

-- Crear índice para optimizar búsquedas por comprobante
CREATE INDEX IF NOT EXISTS idx_debts_receipt_url ON debts(receipt_url) WHERE receipt_url IS NOT NULL;

-- =============================================
-- POLÍTICAS DE STORAGE PARA COMPROBANTES
-- =============================================

-- Crear bucket para comprobantes (ejecutar en Storage de Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Política para subir archivos (ejecutar en SQL Editor de Supabase)
-- CREATE POLICY "Users can upload receipts" ON storage.objects
-- FOR INSERT WITH CHECK (
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Política para leer archivos (ejecutar en SQL Editor de Supabase)
-- CREATE POLICY "Users can view own receipts" ON storage.objects
-- FOR SELECT USING (
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Política para eliminar archivos (ejecutar en SQL Editor de Supabase)
-- CREATE POLICY "Users can delete own receipts" ON storage.objects
-- FOR DELETE USING (
--   auth.uid()::text = (storage.foldername(name))[1]
-- );
