-- Tabla de reglas por país
CREATE TABLE IF NOT EXISTS reglas_pais (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  palabras_clave JSONB DEFAULT '{}',
  slang JSONB DEFAULT '{}',
  ejemplos JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(country_code, categoria)
);

-- Tabla de predicciones de Groq
CREATE TABLE IF NOT EXISTS predicciones_groq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  country_code VARCHAR(3) NOT NULL,
  transcripcion TEXT NOT NULL,
  resultado JSONB NOT NULL,
  confirmado BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predicciones_usuario ON predicciones_groq(usuario_id);
CREATE INDEX IF NOT EXISTS idx_predicciones_confirmado ON predicciones_groq(confirmado);

-- Tabla de feedback (correcciones)
CREATE TABLE IF NOT EXISTS feedback_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predicciones_groq(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  country_code VARCHAR(3) NOT NULL,
  era_correcto BOOLEAN NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_country ON feedback_usuarios(country_code, era_correcto);

-- Datos iniciales para reglas_pais
INSERT INTO reglas_pais (country_code, categoria, palabras_clave, slang) VALUES
-- Bolivia
('BOL', 'transporte', '{"taxi": true, "trufi": true, "micro": true, "bus": true, "billete": true}', '{"trufi": "taxi compartido", "micro": "bus"}'),
('BOL', 'comida', '{"almuerzo": true, "cena": true, "salteña": true, "api": true, "empanada": true}', '{"salteña": "empanada", "api": "bebida de maíz"}'),
('BOL', 'salud', '{"farmacia": true, "doctor": true, "medicina": true, "consulta": true}', '{}'),

-- Argentina
('ARG', 'transporte', '{"colectivo": true, "bondi": true, "remis": true, "taxi": true, "subte": true}', '{"bondi": "bus", "colectivo": "bus", "remis": "taxi"}'),
('ARG', 'comida', '{"almuerzo": true, "cena": true, "asado": true, "morfi": true}', '{"morfi": "comida", "asado": "parrilla"}'),
('ARG', 'salud', '{"farmacia": true, "doctor": true, "remedios": true}', '{}'),

-- México
('MEX', 'transporte', '{"camion": true, "combi": true, "uber": true, "metro": true, "taxi": true}', '{"camion": "bus", "combi": "van"}'),
('MEX', 'comida', '{"tacos": true, "torta": true, "quesadilla": true, "cena": true}', '{}'),
('MEX', 'salud', '{"farmacia": true, "doctor": true, "consulta": true}', '{}'),

-- Perú
('PER', 'transporte', '{"taxi": true, "combis": true, "bus": true, "metro": true}', '{"combis": "microbús"}'),
('PER', 'comida', '{"almuerzo": true, "cena": true, "ceviche": true, "pollo": true}', '{}'),
('PER', 'salud', '{"farmacia": true, "doctor": true, "medicina": true}', '{}'),

-- Colombia
('COL', 'transporte', '{"bus": true, "taxi": true, "metro": true, "transmilenio": true}', '{"transmilenio": "sistema de transporte"}'),
('COL', 'comida', '{"almuerzo": true, "cena": true, "ajiaco": true, "bandeja": true}', '{}'),
('COL', 'salud', '{"farmacia": true, "doctor": true, "medicina": true}', '{}'),

-- Chile
('CHL', 'transporte', '{"metro": true, "micro": true, "taxi": true, "bip": true}', '{"micro": "bus", "bip": "tarjeta de transporte"}'),
('CHL', 'comida', '{"almuerzo": true, "cena": true, "completo": true, "empanada": true}', '{"completo": "hot dog"}'),
('CHL', 'salud', '{"farmacia": true, "doctor": true, "medicina": true}', '{}')
ON CONFLICT (country_code, categoria) DO NOTHING;

