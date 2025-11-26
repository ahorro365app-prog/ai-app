-- Tabla para controlar versiones de la app
CREATE TABLE IF NOT EXISTS app_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Versiones (formato semver: major.minor.patch)
  current_version VARCHAR(20) NOT NULL,        -- Última versión disponible: "1.4.0"
  minimum_required_version VARCHAR(20) NOT NULL, -- Versión mínima: "1.2.0"
  recommended_version VARCHAR(20),              -- Versión recomendada: "1.3.0"
  
  -- Control de actualización forzada
  force_update BOOLEAN DEFAULT false,           -- ON/OFF desde admin
  
  -- Plataformas
  platform VARCHAR(20) NOT NULL,                -- 'android', 'ios', 'web'
  
  -- Mensajes personalizados
  update_title VARCHAR(200) DEFAULT 'Actualización disponible',
  update_message TEXT DEFAULT 'Hay una nueva versión de Ahorro365 disponible.',
  force_update_title VARCHAR(200) DEFAULT 'Actualización requerida',
  force_update_message TEXT DEFAULT 'Necesitas actualizar la app para continuar.',
  
  -- Links a tiendas
  store_url TEXT,  -- Play Store, App Store, o URL de la app web
  
  -- Características de la nueva versión
  release_notes TEXT,
  
  -- Metadata
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES usuarios(id),
  
  -- Para mantener historial
  is_active BOOLEAN DEFAULT true
);

-- Solo una configuración activa por plataforma
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_versions_active 
ON app_versions(platform) 
WHERE is_active = true;

-- Tabla para logs de verificaciones de versión (opcional, para analytics)
CREATE TABLE IF NOT EXISTS version_check_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id),
  device_id VARCHAR(100),
  platform VARCHAR(20),
  app_version VARCHAR(20),
  
  -- Resultado del check
  status VARCHAR(50), -- 'up_to_date', 'update_recommended', 'update_required', 'blocked'
  
  -- Metadata
  checked_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

-- Índices para version_check_logs
CREATE INDEX IF NOT EXISTS idx_version_logs_user ON version_check_logs(user_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_version_logs_version ON version_check_logs(app_version, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_version_logs_platform ON version_check_logs(platform, checked_at DESC);

-- Datos iniciales para cada plataforma
INSERT INTO app_versions (
  platform, 
  current_version, 
  minimum_required_version,
  recommended_version,
  force_update,
  store_url,
  update_title,
  update_message,
  force_update_title,
  force_update_message,
  release_notes
) VALUES 
(
  'web',
  '0.1.0',
  '0.1.0',
  '0.1.0',
  false,
  NULL, -- URL de la app web (se configurará después)
  'Actualización disponible',
  'Hay una nueva versión de Ahorro365 disponible. Recarga la página para obtener las últimas mejoras.',
  'Actualización requerida',
  'Necesitas actualizar la app para continuar. Por favor, recarga la página.',
  'Versión inicial'
),
(
  'android',
  '0.0.23',
  '0.0.23',
  '0.0.23',
  false,
  'https://play.google.com/store/apps/details?id=com.ahorro365.app',
  'Actualización disponible',
  'Hay una nueva versión de Ahorro365 disponible en Play Store.',
  'Actualización requerida',
  'Necesitas actualizar la app para continuar. Por favor, actualiza desde Play Store.',
  'Versión inicial'
),
(
  'ios',
  '0.1.0',
  '0.1.0',
  '0.1.0',
  false,
  'https://apps.apple.com/app/ahorro365/id123456789',
  'Actualización disponible',
  'Hay una nueva versión de Ahorro365 disponible en App Store.',
  'Actualización requerida',
  'Necesitas actualizar la app para continuar. Por favor, actualiza desde App Store.',
  'Versión inicial'
)
ON CONFLICT DO NOTHING;

