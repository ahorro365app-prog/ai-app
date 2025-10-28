-- Tablas para el Panel de WhatsApp Status
-- Ejecutar en Supabase SQL Editor

-- Tabla de sesión de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR UNIQUE NOT NULL,
  jid VARCHAR,
  status VARCHAR DEFAULT 'disconnected',
  last_sync TIMESTAMP DEFAULT now(),
  uptime_percentage FLOAT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabla de métricas diarias
CREATE TABLE IF NOT EXISTS whatsapp_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,
  audios_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  transactions_count INT DEFAULT 0,
  total_amount DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS whatsapp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP DEFAULT now(),
  type VARCHAR NOT NULL,
  user_id UUID,
  phone VARCHAR,
  status VARCHAR,
  message VARCHAR,
  details JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_whatsapp_session_number ON whatsapp_session(number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_metrics_date ON whatsapp_metrics(date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_timestamp ON whatsapp_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_type ON whatsapp_events(type);

-- Datos iniciales (sesión de prueba)
INSERT INTO whatsapp_session (number, jid, status, last_sync, uptime_percentage)
VALUES ('+59170000000', '59170000000@s.whatsapp.net', 'connected', now(), 99.8)
ON CONFLICT (number) DO NOTHING;

