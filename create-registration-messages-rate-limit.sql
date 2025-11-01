-- Tabla para rastrear mensajes de invitación a usuarios no registrados
-- Evita spam enviando el mensaje de invitación solo una vez cada X tiempo

CREATE TABLE IF NOT EXISTS invitaciones_no_registrados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono TEXT NOT NULL,
  ultimo_mensaje_enviado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mensajes_recibidos INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(telefono)
);

-- Índice para búsquedas rápidas por teléfono
CREATE INDEX IF NOT EXISTS idx_invitaciones_telefono ON invitaciones_no_registrados(telefono);

-- Índice para limpiar registros antiguos
CREATE INDEX IF NOT EXISTS idx_invitaciones_ultimo_mensaje ON invitaciones_no_registrados(ultimo_mensaje_enviado_at);

-- Función para verificar si debe enviarse el mensaje (rate limit: 1 mensaje cada 24 horas)
CREATE OR REPLACE FUNCTION debe_enviar_mensaje_invitacion(telefono_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  ultimo_envio TIMESTAMP WITH TIME ZONE;
  horas_desde_ultimo INTEGER;
BEGIN
  -- Buscar último mensaje enviado
  SELECT ultimo_mensaje_enviado_at INTO ultimo_envio
  FROM invitaciones_no_registrados
  WHERE telefono = telefono_param;
  
  -- Si no existe registro, debe enviarse
  IF ultimo_envio IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Calcular horas desde último envío
  horas_desde_ultimo := EXTRACT(EPOCH FROM (NOW() - ultimo_envio)) / 3600;
  
  -- Si han pasado más de 24 horas, puede enviarse de nuevo
  IF horas_desde_ultimo >= 24 THEN
    RETURN TRUE;
  END IF;
  
  -- Si han pasado menos de 24 horas, no enviar
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar que se envió un mensaje
CREATE OR REPLACE FUNCTION registrar_mensaje_invitacion(telefono_param TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO invitaciones_no_registrados (telefono, ultimo_mensaje_enviado_at, mensajes_recibidos)
  VALUES (telefono_param, NOW(), 1)
  ON CONFLICT (telefono) 
  DO UPDATE SET 
    ultimo_mensaje_enviado_at = NOW(),
    mensajes_recibidos = invitaciones_no_registrados.mensajes_recibidos + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;


