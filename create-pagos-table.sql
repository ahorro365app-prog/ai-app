-- =============================================
-- TABLA DE PAGOS - FASE 3
-- =============================================

-- Crear tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro')),
  monto_usdt NUMERIC(10, 2) NOT NULL,
  direccion_wallet TEXT,
  hash_transaccion TEXT,
  comprobante_url TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'verificado', 'rechazado', 'expirado')),
  verificador_id UUID REFERENCES usuarios(id),
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_verificacion TIMESTAMP WITH TIME ZONE NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago ON pagos(fecha_pago);

-- Comentarios para documentación
COMMENT ON TABLE pagos IS 'Tabla para registrar pagos de suscripciones Pro';
COMMENT ON COLUMN pagos.plan IS 'Tipo de plan pagado (actualmente solo pro)';
COMMENT ON COLUMN pagos.monto_usdt IS 'Monto pagado en USDT';
COMMENT ON COLUMN pagos.direccion_wallet IS 'Dirección de wallet donde se recibió el pago';
COMMENT ON COLUMN pagos.hash_transaccion IS 'Hash de la transacción blockchain (opcional)';
COMMENT ON COLUMN pagos.comprobante_url IS 'URL del comprobante subido por el usuario';
COMMENT ON COLUMN pagos.estado IS 'Estado del pago: pendiente, verificado, rechazado, expirado';
COMMENT ON COLUMN pagos.verificador_id IS 'ID del admin que verificó el pago';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_pagos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_update_pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION update_pagos_updated_at();

-- Función para marcar pagos como expirados después de 7 días
CREATE OR REPLACE FUNCTION expire_old_payments()
RETURNS void AS $$
BEGIN
  UPDATE pagos
  SET estado = 'expirado'
  WHERE estado = 'pendiente'
    AND fecha_pago < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS (Row Level Security)
-- Nota: Si usas autenticación personalizada (no Supabase Auth), puedes deshabilitar RLS
-- o ajustar las políticas según tu sistema de autenticación
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios pagos
-- Si usas Supabase Auth, descomenta esta versión:
-- CREATE POLICY "Users can view their own payments"
--   ON pagos FOR SELECT
--   USING (auth.uid() = usuario_id OR EXISTS (
--     SELECT 1 FROM usuarios WHERE id = auth.uid() AND suscripcion = 'admin'
--   ));

-- Si NO usas Supabase Auth (autenticación personalizada), usa esta política:
-- Permite que todos vean los pagos (se validará desde la aplicación)
CREATE POLICY "Users can view their own payments"
  ON pagos FOR SELECT
  USING (true);

-- Política: Los usuarios pueden crear sus propios pagos
-- Si usas Supabase Auth, descomenta esta versión:
-- CREATE POLICY "Users can create their own payments"
--   ON pagos FOR INSERT
--   WITH CHECK (auth.uid() = usuario_id);

-- Si NO usas Supabase Auth, permite insertar (se validará desde la aplicación)
CREATE POLICY "Users can create their own payments"
  ON pagos FOR INSERT
  WITH CHECK (true);

-- Nota: Las políticas de UPDATE y DELETE deben manejarse desde el admin dashboard
-- con service role key, no desde el cliente

