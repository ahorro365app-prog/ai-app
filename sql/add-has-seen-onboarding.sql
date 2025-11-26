-- Agregar campo has_seen_onboarding a la tabla usuarios
-- Este campo indica si el usuario ya ha visto el tutorial de onboarding
-- false = no se ha mostrado el tutorial (mostrar en próxima sesión)
-- true = ya se mostró el tutorial (no volver a mostrar)

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT false;

-- Comentario para documentación
COMMENT ON COLUMN usuarios.has_seen_onboarding 
IS 'Indica si el usuario ya ha visto el tutorial de onboarding. false = mostrar tutorial, true = no mostrar';

-- Actualizar usuarios existentes para que vean el tutorial (opcional)
-- Si quieres que usuarios existentes también vean el tutorial, descomenta esta línea:
-- UPDATE usuarios SET has_seen_onboarding = false WHERE has_seen_onboarding IS NULL;

