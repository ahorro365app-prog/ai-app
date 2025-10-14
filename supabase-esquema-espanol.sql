-- =============================================
-- ESQUEMA EN ESPAÑOL PARA AHORRO365
-- =============================================

-- Eliminar tablas existentes (si las hay)
DROP TABLE IF EXISTS whatsapp_logs CASCADE;
DROP TABLE IF EXISTS metas CASCADE;
DROP TABLE IF EXISTS deudas CASCADE;
DROP TABLE IF EXISTS transacciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Tabla de usuarios
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT,
  telefono TEXT UNIQUE NOT NULL,
  contrasena TEXT NOT NULL,
  pais TEXT DEFAULT 'Bolivia',
  moneda TEXT DEFAULT 'BOB',
  presupuesto_diario DECIMAL(10,2),
  suscripcion TEXT DEFAULT 'free',
  deudas_habilitado BOOLEAN DEFAULT false,
  metas_habilitado BOOLEAN DEFAULT false,
  whatsapp_habilitado BOOLEAN DEFAULT false,
  notificaciones_whatsapp BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE transacciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  monto DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  url_comprobante TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de deudas
CREATE TABLE deudas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  monto_total DECIMAL(10,2) NOT NULL,
  monto_pagado DECIMAL(10,2) DEFAULT 0,
  fecha_vencimiento TIMESTAMP WITH TIME ZONE,
  es_mensual BOOLEAN DEFAULT false,
  dia_mensual INTEGER,
  historial_pagos JSONB DEFAULT '[]',
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de metas
CREATE TABLE metas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  monto_objetivo DECIMAL(10,2) NOT NULL,
  monto_actual DECIMAL(10,2) DEFAULT 0,
  fecha_objetivo TIMESTAMP WITH TIME ZONE,
  categoria TEXT NOT NULL,
  prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
  descripcion TEXT,
  historial_ahorros JSONB DEFAULT '[]',
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs de WhatsApp (para integración futura)
CREATE TABLE logs_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  numero_telefono TEXT NOT NULL,
  tipo_mensaje TEXT NOT NULL CHECK (tipo_mensaje IN ('entrante', 'saliente')),
  contenido_mensaje TEXT NOT NULL,
  comando TEXT,
  respuesta TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =============================================

-- Índices para transacciones
CREATE INDEX idx_transacciones_usuario_fecha ON transacciones(usuario_id, fecha);
CREATE INDEX idx_transacciones_usuario_tipo ON transacciones(usuario_id, tipo);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha);

-- Índices para deudas
CREATE INDEX idx_deudas_usuario_estado ON deudas(usuario_id, monto_pagado);
CREATE INDEX idx_deudas_fecha_vencimiento ON deudas(fecha_vencimiento);

-- Índices para metas
CREATE INDEX idx_metas_usuario_progreso ON metas(usuario_id, monto_actual);
CREATE INDEX idx_metas_fecha_objetivo ON metas(fecha_objetivo);

-- Índices para logs de WhatsApp
CREATE INDEX idx_logs_whatsapp_usuario ON logs_whatsapp(usuario_id);
CREATE INDEX idx_logs_whatsapp_fecha ON logs_whatsapp(fecha_creacion);

-- =============================================
-- FUNCIONES DE UTILIDAD
-- =============================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para fecha_actualizacion
CREATE TRIGGER actualizar_usuarios_fecha_modificacion BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER actualizar_deudas_fecha_modificacion BEFORE UPDATE ON deudas
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER actualizar_metas_fecha_modificacion BEFORE UPDATE ON metas
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

-- =============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE deudas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_whatsapp ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (por ahora permitimos todo, luego agregaremos auth)
CREATE POLICY "Permitir todas las operaciones para usuarios" ON usuarios
    FOR ALL USING (true);

CREATE POLICY "Permitir todas las operaciones para transacciones" ON transacciones
    FOR ALL USING (true);

CREATE POLICY "Permitir todas las operaciones para deudas" ON deudas
    FOR ALL USING (true);

CREATE POLICY "Permitir todas las operaciones para metas" ON metas
    FOR ALL USING (true);

CREATE POLICY "Permitir todas las operaciones para logs_whatsapp" ON logs_whatsapp
    FOR ALL USING (true);

-- =============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =============================================

-- Insertar usuario de prueba
INSERT INTO usuarios (nombre, correo, telefono, pais, moneda, presupuesto_diario) 
VALUES ('Usuario Demo', 'demo@ahorro365.com', '+59112345678', 'Bolivia', 'BOB', 100.00);
