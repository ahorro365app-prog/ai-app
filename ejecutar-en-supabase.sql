-- EJECUTAR ESTE SQL EN SUPABASE SQL EDITOR

-- 1. Agregar columnas para menús de Deudas y Metas
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deudas_habilitado BOOLEAN DEFAULT false;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS metas_habilitado BOOLEAN DEFAULT false;

-- 2. Actualizar usuarios existentes
UPDATE usuarios SET deudas_habilitado = false WHERE deudas_habilitado IS NULL;
UPDATE usuarios SET metas_habilitado = false WHERE metas_habilitado IS NULL;

-- 3. Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('deudas_habilitado', 'metas_habilitado');
