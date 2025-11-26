-- Agrega soft delete a la tabla transacciones

ALTER TABLE transacciones
ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP WITH TIME ZONE;

-- Índice para filtrar rápidamente las transacciones activas por usuario
CREATE INDEX IF NOT EXISTS idx_transacciones_usuario_fecha_eliminacion
  ON transacciones (usuario_id, fecha_eliminacion);

-- Asegurar que las filas existentes queden activas por defecto
UPDATE transacciones
SET fecha_eliminacion = NULL
WHERE fecha_eliminacion IS NULL;

