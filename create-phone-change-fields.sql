-- =====================================================
-- Migración: Campos para cambio de teléfono verificado
-- =====================================================
-- Descripción: Agrega campos necesarios para gestionar
-- el cambio de teléfono cuando está verificado, con
-- cooldown de 30 días y verificación previa del nuevo número
-- =====================================================

-- Agregar campos para cambio de teléfono
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS telefono_pendiente TEXT NULL,
ADD COLUMN IF NOT EXISTS codigo_verificacion_pendiente TEXT NULL,
ADD COLUMN IF NOT EXISTS fecha_inicio_cambio_telefono TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS intentos_verificacion_cambio INTEGER DEFAULT 0;

-- Índice para búsquedas rápidas de teléfonos pendientes
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono_pendiente 
ON usuarios(telefono_pendiente) 
WHERE telefono_pendiente IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN usuarios.telefono_pendiente IS 'Nuevo número de teléfono ingresado, pendiente de verificar';
COMMENT ON COLUMN usuarios.codigo_verificacion_pendiente IS 'Código de verificación enviado al nuevo número';
COMMENT ON COLUMN usuarios.fecha_inicio_cambio_telefono IS 'Fecha y hora en que se inició el proceso de cambio';
COMMENT ON COLUMN usuarios.intentos_verificacion_cambio IS 'Número de intentos fallidos para verificar el código del nuevo teléfono';

-- Verificar que los campos se crearon correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
  AND column_name IN (
    'telefono_pendiente',
    'codigo_verificacion_pendiente',
    'fecha_inicio_cambio_telefono',
    'intentos_verificacion_cambio'
  )
ORDER BY column_name;

