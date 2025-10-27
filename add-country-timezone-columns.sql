-- Agregar columnas country_code y timezone a tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS country_code VARCHAR(3);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);

-- Actualizar valores existentes basados en moneda actual
UPDATE usuarios SET 
  country_code = CASE 
    WHEN moneda = 'BOB' THEN 'BOL'
    WHEN moneda = 'ARS' THEN 'ARG'
    WHEN moneda = 'MXN' THEN 'MEX'
    WHEN moneda = 'PEN' THEN 'PER'
    WHEN moneda = 'COP' THEN 'COL'
    WHEN moneda = 'CLP' THEN 'CHL'
    ELSE 'BOL' -- Default para usuarios existentes
  END,
  timezone = CASE 
    WHEN country_code = 'BOL' THEN 'America/La_Paz'
    WHEN country_code = 'ARG' THEN 'America/Argentina/Buenos_Aires'
    WHEN country_code = 'MEX' THEN 'America/Mexico_City'
    WHEN country_code = 'PER' THEN 'America/Lima'
    WHEN country_code = 'COL' THEN 'America/Bogota'
    WHEN country_code = 'CHL' THEN 'America/Santiago'
    ELSE 'America/La_Paz' -- Default
  END
WHERE country_code IS NULL;

