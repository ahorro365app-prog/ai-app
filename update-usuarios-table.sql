-- Agregar campos para controlar menús de Deudas y Metas
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deudas_habilitado BOOLEAN DEFAULT false;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS metas_habilitado BOOLEAN DEFAULT false;

-- Actualizar usuarios existentes para que tengan los menús desactivados por defecto
UPDATE usuarios SET deudas_habilitado = false WHERE deudas_habilitado IS NULL;
UPDATE usuarios SET metas_habilitado = false WHERE metas_habilitado IS NULL;
