-- ============================================
-- CONFIGURACIÓN MATRIZ + FEEDBACK AUTOMÁTICO
-- Sistema de aprendizaje por país
-- ============================================

-- PASO 1: Tabla configuracion_matriz (base global)
CREATE TABLE IF NOT EXISTS configuracion_matriz (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- 'categoria', 'moneda', 'metodo_pago'
  clave VARCHAR(100) NOT NULL,
  valor JSONB NOT NULL DEFAULT '{}',
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tipo, clave)
);

CREATE INDEX IF NOT EXISTS idx_config_tipo ON configuracion_matriz(tipo);
CREATE INDEX IF NOT EXISTS idx_config_activo ON configuracion_matriz(activo);

-- PASO 2: Seed - Categorías base (todos los países las heredan)
INSERT INTO configuracion_matriz (tipo, clave, valor, descripcion) VALUES
('categoria', 'comida', '{
  "nombre": "Comida",
  "descripcion": "Alimentos, restaurantes, supermercado",
  "palabras_clave_base": ["comida", "almuerzo", "cena", "desayuno", "restaurant", "cafe", "comedor"],
  "icono": "🍽️"
}'::jsonb, 'Categoría base global: Comida'),

('categoria', 'transporte', '{
  "nombre": "Transporte",
  "descripcion": "Taxi, bus, gasolina, uber",
  "palabras_clave_base": ["taxi", "bus", "transporte", "gasolina", "uber", "pasaje"],
  "icono": "🚗"
}'::jsonb, 'Categoría base global: Transporte'),

('categoria', 'educacion', '{
  "nombre": "Educación",
  "descripcion": "Libros, cursos, material escolar",
  "palabras_clave_base": ["educacion", "libros", "curso", "fotocopias", "escuela", "universidad"],
  "icono": "📚"
}'::jsonb, 'Categoría base global: Educación'),

('categoria', 'tecnologia', '{
  "nombre": "Tecnología",
  "descripcion": "Computadoras, celulares, software",
  "palabras_clave_base": ["tecnologia", "computadora", "celular", "software", "internet", "app"],
  "icono": "💻"
}'::jsonb, 'Categoría base global: Tecnología'),

('categoria', 'salud', '{
  "nombre": "Salud",
  "descripcion": "Medicinas, doctores, hospital",
  "palabras_clave_base": ["salud", "medicina", "doctor", "hospital", "farmacia", "consulta"],
  "icono": "🏥"
}'::jsonb, 'Categoría base global: Salud'),

('categoria', 'entretenimiento', '{
  "nombre": "Entretenimiento",
  "descripcion": "Cine, juegos, deportes",
  "palabras_clave_base": ["cine", "juegos", "deporte", "entretenimiento", "diversión", "pelicula"],
  "icono": "🎮"
}'::jsonb, 'Categoría base global: Entretenimiento'),

('categoria', 'servicios', '{
  "nombre": "Servicios",
  "descripcion": "Luz, agua, internet, teléfono",
  "palabras_clave_base": ["luz", "agua", "internet", "telefono", "servicio", "cable"],
  "icono": "💡"
}'::jsonb, 'Categoría base global: Servicios'),

('categoria', 'ropa', '{
  "nombre": "Ropa",
  "descripcion": "Vestimenta, zapatos, accesorios",
  "palabras_clave_base": ["ropa", "vestido", "zapatos", "pantalon", "camisa", "jean"],
  "icono": "👕"
}'::jsonb, 'Categoría base global: Ropa'),

('categoria', 'hogar', '{
  "nombre": "Hogar",
  "descripcion": "Muebles, electrodomésticos, limpieza",
  "palabras_clave_base": ["hogar", "muebles", "casa", "limpieza", "cocina", "decoracion"],
  "icono": "🏠"
}'::jsonb, 'Categoría base global: Hogar'),

('categoria', 'otros', '{
  "nombre": "Otros",
  "descripcion": "Gastos varios no categorizados",
  "palabras_clave_base": ["otro", "varios", "miscelaneos", "vario"],
  "icono": "📦"
}'::jsonb, 'Categoría base global: Otros')
ON CONFLICT (tipo, clave) DO NOTHING;

-- PASO 3: Seed - Monedas soportadas
INSERT INTO configuracion_matriz (tipo, clave, valor, descripcion) VALUES
('moneda', 'BOB', '{
  "nombre": "Boliviano",
  "simbolo": "Bs",
  "pais": "Bolivia",
  "variaciones": ["bolivianos", "bs", "boliviano", "Bs", "BOB", "bob"]
}'::jsonb, 'Moneda: Boliviano boliviano'),

('moneda', 'USD', '{
  "nombre": "Dólar estadounidense",
  "simbolo": "$",
  "pais": "Estados Unidos",
  "variaciones": ["dolares", "usd", "dollar", "dólares", "USD", "dolar"]
}'::jsonb, 'Moneda: Dólar'),

('moneda', 'EUR', '{
  "nombre": "Euro",
  "simbolo": "€",
  "pais": "Zona Euro",
  "variaciones": ["euros", "eur", "euro", "EUR"]
}'::jsonb, 'Moneda: Euro'),

('moneda', 'MXN', '{
  "nombre": "Peso mexicano",
  "simbolo": "$",
  "pais": "México",
  "variaciones": ["pesos mexicanos", "pesos", "mxn", "MXN", "peso"]
}'::jsonb, 'Moneda: Peso mexicano'),

('moneda', 'ARS', '{
  "nombre": "Peso argentino",
  "simbolo": "$",
  "pais": "Argentina",
  "variaciones": ["pesos argentinos", "ars", "peso argentino", "ARS", "pesos"]
}'::jsonb, 'Moneda: Peso argentino'),

('moneda', 'CLP', '{
  "nombre": "Peso chileno",
  "simbolo": "$",
  "pais": "Chile",
  "variaciones": ["pesos chilenos", "clp", "CLP"]
}'::jsonb, 'Moneda: Peso chileno'),

('moneda', 'PEN', '{
  "nombre": "Sol peruano",
  "simbolo": "S/",
  "pais": "Perú",
  "variaciones": ["soles", "pen", "sol peruano", "PEN", "sol"]
}'::jsonb, 'Moneda: Sol peruano'),

('moneda', 'COP', '{
  "nombre": "Peso colombiano",
  "simbolo": "$",
  "pais": "Colombia",
  "variaciones": ["pesos colombianos", "cop", "COP"]
}'::jsonb, 'Moneda: Peso colombiano')
ON CONFLICT (tipo, clave) DO NOTHING;

-- PASO 4: Seed - Métodos de pago
INSERT INTO configuracion_matriz (tipo, clave, valor, descripcion) VALUES
('metodo_pago', 'efectivo', '{
  "nombre": "Efectivo",
  "palabras_clave": ["efectivo", "cash", "en mano", "contado"]
}'::jsonb, 'Método de pago: Efectivo'),

('metodo_pago', 'tarjeta', '{
  "nombre": "Tarjeta",
  "palabras_clave": ["tarjeta", "visa", "mastercard", "credito", "debito", "card"]
}'::jsonb, 'Método de pago: Tarjeta'),

('metodo_pago', 'transferencia', '{
  "nombre": "Transferencia",
  "palabras_clave": ["transferencia", "transfer", "banco", "wire"]
}'::jsonb, 'Método de pago: Transferencia'),

('metodo_pago', 'cheque', '{
  "nombre": "Cheque",
  "palabras_clave": ["cheque", "check"]
}'::jsonb, 'Método de pago: Cheque'),

('metodo_pago', 'crypto', '{
  "nombre": "Criptomoneda",
  "palabras_clave": ["crypto", "bitcoin", "btc", "cripto", "criptomoneda"]
}'::jsonb, 'Método de pago: Crypto'),

('metodo_pago', 'otro', '{
  "nombre": "Otro",
  "palabras_clave": ["otro", "otros"]
}'::jsonb, 'Método de pago: Otro')
ON CONFLICT (tipo, clave) DO NOTHING;

-- PASO 5: Modificar reglas_pais para trabajar con matriz
ALTER TABLE reglas_pais
ADD COLUMN IF NOT EXISTS hereda_matriz BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS palabras_adicionales JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mejoras_feedback INT DEFAULT 0;

COMMENT ON COLUMN reglas_pais.hereda_matriz IS 'Si true, hereda categorías/monedas de matriz';
COMMENT ON COLUMN reglas_pais.palabras_adicionales IS 'Palabras ADICIONALES aprendidas por feedback';
COMMENT ON COLUMN reglas_pais.mejoras_feedback IS 'Contador de mejoras aplicadas por feedback';

-- Actualizar reglas existentes para heredar
UPDATE reglas_pais SET hereda_matriz = true WHERE hereda_matriz IS NULL;

-- PASO 6: Tabla para tracking de aprendizaje automático
CREATE TABLE IF NOT EXISTS feedback_aprendizaje (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID REFERENCES predicciones_groq(id),
  usuario_id UUID REFERENCES usuarios(id),
  country_code VARCHAR(3) NOT NULL,
  
  -- Datos originales
  transcripcion TEXT,
  categoria_predicha VARCHAR(50),
  monto_predicho DECIMAL(10,2),
  
  -- Datos corregidos
  categoria_correcta VARCHAR(50),
  monto_correcto DECIMAL(10,2),
  
  -- Análisis
  palabra_clave_detectada TEXT,
  tipo_error VARCHAR(50), -- 'categoria', 'monto', 'slang_nuevo'
  
  -- Estado
  aplicado BOOLEAN DEFAULT false,
  confianza DECIMAL(3,2) DEFAULT 1.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aprendizaje_country ON feedback_aprendizaje(country_code);
CREATE INDEX IF NOT EXISTS idx_aprendizaje_aplicado ON feedback_aprendizaje(aplicado);
CREATE INDEX IF NOT EXISTS idx_aprendizaje_tipo ON feedback_aprendizaje(tipo_error);

-- PASO 7: Función para extraer aprendizaje del feedback
CREATE OR REPLACE FUNCTION extraer_aprendizaje_de_feedback()
RETURNS void AS $$
DECLARE
  feedback RECORD;
  palabra_nueva TEXT;
BEGIN
  -- Procesar feedback de usuarios no aplicado
  FOR feedback IN 
    SELECT 
      f.id as feedback_id,
      f.usuario_id,
      f.prediction_id,
      p.country_code,
      p.transcripcion,
      p.resultado->>'categoria' as categoria_predicha,
      (p.resultado->>'monto')::decimal as monto_predicho,
      f.comentario
    FROM feedback_usuarios f
    JOIN predicciones_groq p ON p.id = f.prediction_id
    WHERE f.era_correcto = false
    AND NOT EXISTS (
      SELECT 1 FROM feedback_aprendizaje fa 
      WHERE fa.prediction_id = f.prediction_id
    )
  LOOP
    -- Aquí se puede implementar lógica para extraer palabras nuevas
    -- Por ahora solo registramos el feedback para análisis manual
    
    INSERT INTO feedback_aprendizaje (
      prediction_id,
      usuario_id,
      country_code,
      transcripcion,
      categoria_predicha,
      tipo_error,
      aplicado
    ) VALUES (
      feedback.prediction_id,
      feedback.usuario_id,
      feedback.country_code,
      feedback.transcripcion,
      feedback.categoria_predicha,
      'categoria', -- Por defecto asumimos error de categoría
      false
    );
    
    RAISE NOTICE 'Feedback registrado para análisis: %', feedback.prediction_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- PASO 8: Función para aplicar mejoras automáticas
CREATE OR REPLACE FUNCTION aplicar_mejoras_feedback(
  p_country_code VARCHAR(3),
  p_categoria VARCHAR(50),
  p_palabra_nueva TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  regla RECORD;
  palabras_actuales JSONB;
BEGIN
  -- Buscar regla del país y categoría
  SELECT * INTO regla 
  FROM reglas_pais 
  WHERE country_code = p_country_code 
  AND categoria = p_categoria;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No se encontró regla para % - %', p_country_code, p_categoria;
    RETURN false;
  END IF;
  
  -- Obtener palabras adicionales actuales
  palabras_actuales := COALESCE(regla.palabras_adicionales, '{}'::jsonb);
  
  -- Verificar que la palabra no exista ya
  IF palabras_actuales ? p_palabra_nueva THEN
    RAISE NOTICE 'Palabra ya existe: %', p_palabra_nueva;
    RETURN false;
  END IF;
  
  -- Agregar palabra nueva
  UPDATE reglas_pais
  SET 
    palabras_adicionales = palabras_actuales || jsonb_build_object(p_palabra_nueva, true),
    mejoras_feedback = mejoras_feedback + 1,
    updated_at = NOW()
  WHERE country_code = p_country_code 
  AND categoria = p_categoria;
  
  RAISE NOTICE 'Palabra agregada: % para % - %', p_palabra_nueva, p_country_code, p_categoria;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- PASO 9: Función para obtener configuración completa (matriz + país)
CREATE OR REPLACE FUNCTION obtener_config_completa(p_country_code VARCHAR(3))
RETURNS JSONB AS $$
DECLARE
  config JSONB := '{}'::jsonb;
  categorias_matriz JSONB;
  monedas JSONB;
  metodos JSONB;
  reglas_pais_data JSONB;
BEGIN
  -- Categorías base de matriz
  SELECT jsonb_object_agg(clave, valor) INTO categorias_matriz
  FROM configuracion_matriz
  WHERE tipo = 'categoria' AND activo = true;
  
  -- Monedas
  SELECT jsonb_object_agg(clave, valor) INTO monedas
  FROM configuracion_matriz
  WHERE tipo = 'moneda' AND activo = true;
  
  -- Métodos de pago
  SELECT jsonb_object_agg(clave, valor) INTO metodos
  FROM configuracion_matriz
  WHERE tipo = 'metodo_pago' AND activo = true;
  
  -- Reglas específicas del país (slang + palabras adicionales)
  SELECT jsonb_object_agg(categoria, 
    jsonb_build_object(
      'palabras_clave', palabras_clave,
      'slang', slang,
      'palabras_adicionales', COALESCE(palabras_adicionales, '{}'::jsonb),
      'mejoras_feedback', COALESCE(mejoras_feedback, 0)
    )
  ) INTO reglas_pais_data
  FROM reglas_pais
  WHERE country_code = p_country_code;
  
  -- Construir configuración completa
  config := jsonb_build_object(
    'country_code', p_country_code,
    'categorias_base', categorias_matriz,
    'monedas', monedas,
    'metodos_pago', metodos,
    'reglas_especificas', COALESCE(reglas_pais_data, '{}'::jsonb),
    'hereda_matriz', true
  );
  
  RETURN config;
END;
$$ LANGUAGE plpgsql;

-- PASO 10: Vista para estadísticas de aprendizaje
CREATE OR REPLACE VIEW estadisticas_feedback AS
SELECT 
  country_code,
  COUNT(*) as total_feedback,
  SUM(CASE WHEN aplicado THEN 1 ELSE 0 END) as aplicados,
  SUM(CASE WHEN NOT aplicado THEN 1 ELSE 0 END) as pendientes,
  COUNT(DISTINCT categoria_predicha) as categorias_afectadas,
  AVG(confianza) as confianza_promedio
FROM feedback_aprendizaje
GROUP BY country_code;

