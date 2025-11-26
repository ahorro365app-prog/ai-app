# Migración: Campo `smart_fecha_inicio_programada`

## Descripción

Este campo se usa para programar la activación automática del plan Smart cuando un usuario tiene FREE o PRO activo y gana Smart por referidos.

## SQL para agregar el campo

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Agregar columna smart_fecha_inicio_programada a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS smart_fecha_inicio_programada TIMESTAMP WITH TIME ZONE NULL;

-- Agregar comentario descriptivo
COMMENT ON COLUMN usuarios.smart_fecha_inicio_programada IS 'Fecha programada para activar Smart automáticamente. Se activa cuando el usuario tiene FREE/PRO activo y gana Smart por referidos. NULL si no está programado.';
```

## Ejecutar automáticamente (opcional)

También puedes usar el endpoint de migración:

```bash
curl -X POST http://localhost:3000/api/migrations/add-smart-fecha-inicio-programada \
  -H "Content-Type: application/json"
```

Este endpoint retornará el SQL para ejecutar manualmente en Supabase.

## Verificación

Después de ejecutar el SQL, verifica que el campo existe:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
AND column_name = 'smart_fecha_inicio_programada';
```

Deberías ver:
- `column_name`: `smart_fecha_inicio_programada`
- `data_type`: `timestamp with time zone`
- `is_nullable`: `YES`

## Uso

- **NULL**: Smart no está programado
- **Fecha futura**: Smart se activará automáticamente en esa fecha (via cron job)
- **Fecha pasada o hoy**: El cron job activará Smart inmediatamente

## Cron Job

El cron job (`/api/notifications/campaigns/run`) ejecuta `activateScheduledSmart()` diariamente para activar Smart programado.

## Pruebas

Usa el endpoint de prueba para verificar los 3 escenarios:

```bash
# Probar escenario FREE
curl -X POST http://localhost:3000/api/test/smart-activation \
  -H "Content-Type: application/json" \
  -d '{"userId": "TU_USER_ID", "scenario": "free"}'

# Probar escenario PRO
curl -X POST http://localhost:3000/api/test/smart-activation \
  -H "Content-Type: application/json" \
  -d '{"userId": "TU_USER_ID", "scenario": "pro"}'

# Probar escenario CADUCADO
curl -X POST http://localhost:3000/api/test/smart-activation \
  -H "Content-Type: application/json" \
  -d '{"userId": "TU_USER_ID", "scenario": "caducado"}'
```
