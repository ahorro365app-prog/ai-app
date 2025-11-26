# 🚀 EJECUTAR MIGRACIÓN: has_seen_onboarding

## ⚠️ IMPORTANTE
Esta migración agrega el campo `has_seen_onboarding` a la tabla `usuarios` para controlar si el usuario ya vio el tutorial de onboarding.

---

## 📋 PASOS PARA EJECUTAR

### Opción 1: Via Dashboard de Supabase (RECOMENDADO)

1. **Ir a Supabase Dashboard:**
   - Abrir: https://supabase.com/dashboard
   - Seleccionar proyecto: `ahorro365` o similar

2. **Ir a SQL Editor:**
   - Menú lateral: `SQL Editor`
   - Clic en `New query`

3. **Copiar y pegar el contenido de `sql/add-has-seen-onboarding.sql`:**
   ```sql
   -- Agregar campo has_seen_onboarding a la tabla usuarios
   -- Este campo indica si el usuario ya ha visto el tutorial de onboarding
   -- false = no se ha mostrado el tutorial (mostrar en próxima sesión)
   -- true = ya se mostró el tutorial (no volver a mostrar)

   ALTER TABLE usuarios
   ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT false;

   -- Comentario para documentación
   COMMENT ON COLUMN usuarios.has_seen_onboarding 
   IS 'Indica si el usuario ya ha visto el tutorial de onboarding. false = mostrar tutorial, true = no mostrar';
   ```

4. **Ejecutar:**
   - Clic en `Run` o presionar `Ctrl+Enter`

5. **Verificar:**
   - Debería mostrar: `Success. No rows returned`
   - Si hay error, verificar que la tabla `usuarios` exista

---

### Opción 2: Via CLI (Si tienes supabase CLI instalado)

```bash
cd sql
supabase db execute -f add-has-seen-onboarding.sql
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

### Verificar que la columna se agregó:

```sql
-- Verificar que la columna existe
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios' 
  AND column_name = 'has_seen_onboarding';
```

**Resultado esperado:**
- `column_name`: `has_seen_onboarding`
- `data_type`: `boolean`
- `column_default`: `false`
- `is_nullable`: `YES` (o `NO` dependiendo de la configuración)

### Verificar usuarios existentes:

```sql
-- Ver cuántos usuarios tienen el campo en false (verán el tutorial)
SELECT COUNT(*) as usuarios_que_veran_tutorial
FROM usuarios
WHERE has_seen_onboarding = false OR has_seen_onboarding IS NULL;

-- Ver cuántos usuarios tienen el campo en true (no verán el tutorial)
SELECT COUNT(*) as usuarios_que_no_veran_tutorial
FROM usuarios
WHERE has_seen_onboarding = true;
```

---

## 📝 COMPORTAMIENTO ESPERADO

### Usuarios nuevos:
- Se crean con `has_seen_onboarding = false`
- Verán el tutorial en su primera sesión
- Al completar u omitir el tutorial, se actualiza a `true`

### Usuarios existentes:
- Si el campo es `NULL` o `false`, verán el tutorial
- Si el campo es `true`, NO verán el tutorial

---

## 🔄 DESPUÉS DE LA MIGRACIÓN

1. **Esperar deploy de Vercel:**
   - El código ya está actualizado
   - Vercel auto-deploy activo
   - Esperar 2-3 minutos después del push

2. **Probar:**
   - Crear un usuario nuevo → Debe ver el tutorial
   - Completar u omitir tutorial → No debe volver a aparecer
   - Verificar en Supabase que `has_seen_onboarding = true`

---

## 📂 ARCHIVOS RELACIONADOS

- `sql/add-has-seen-onboarding.sql`: Migración SQL
- `src/components/OnboardingTutorial.tsx`: Componente del tutorial
- `src/app/dashboard/page.tsx`: Lógica de mostrar/ocultar tutorial
- `src/contexts/SupabaseContext.tsx`: Tipo User y funciones de actualización

