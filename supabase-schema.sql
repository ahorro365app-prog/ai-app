-- =============================================
-- TABLAS PARA AHORRO365
-- =============================================

-- Tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country TEXT DEFAULT 'Bolivia',
  currency TEXT DEFAULT 'BOB',
  daily_budget DECIMAL(10,2),
  subscription TEXT DEFAULT 'free',
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de deudas
CREATE TABLE debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  is_monthly BOOLEAN DEFAULT false,
  monthly_day INTEGER,
  payment_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de metas
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  target_date TIMESTAMP WITH TIME ZONE,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta')),
  description TEXT,
  savings_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs de WhatsApp (para integración futura)
CREATE TABLE whatsapp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
  message_content TEXT NOT NULL,
  command TEXT,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =============================================

-- Índices para transacciones
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_date ON transactions(date);

-- Índices para deudas
CREATE INDEX idx_debts_user_status ON debts(user_id, paid_amount);
CREATE INDEX idx_debts_due_date ON debts(due_date);

-- Índices para metas
CREATE INDEX idx_goals_user_progress ON goals(user_id, current_amount);
CREATE INDEX idx_goals_target_date ON goals(target_date);

-- Índices para logs de WhatsApp
CREATE INDEX idx_whatsapp_logs_user ON whatsapp_logs(user_id);
CREATE INDEX idx_whatsapp_logs_created ON whatsapp_logs(created_at);

-- =============================================
-- FUNCIONES DE UTILIDAD
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (por ahora permitimos todo, luego agregaremos auth)
CREATE POLICY "Enable all operations for users" ON users
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for transactions" ON transactions
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for debts" ON debts
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for goals" ON goals
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for whatsapp_logs" ON whatsapp_logs
    FOR ALL USING (true);

-- =============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =============================================

-- Insertar usuario de prueba
INSERT INTO users (name, email, phone, country, currency, daily_budget) 
VALUES ('Usuario Demo', 'demo@ahorro365.com', '+59112345678', 'Bolivia', 'BOB', 100.00);

-- Obtener el ID del usuario demo
-- SELECT id FROM users WHERE email = 'demo@ahorro365.com';
