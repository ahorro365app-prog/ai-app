# Guía de Verificación: Triggers de Referidos en Supabase

## 🔍 Pasos para Verificar en Supabase Dashboard

### 1. Verificar Triggers en la Tabla `referidos`

**Ubicación en Supabase:**
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a: **Database** → **Triggers**
3. Busca triggers relacionados con la tabla `referidos`

**Qué buscar:**
- ✅ Triggers que se ejecutan `AFTER INSERT` en `referidos`
- ✅ Triggers que se ejecutan `AFTER UPDATE` en `referidos` (cuando `verifico_whatsapp` cambia)
- ✅ Funciones PostgreSQL asociadas a estos triggers

**Si encuentras triggers:**
- Anota el nombre de la función PostgreSQL
- Revisa qué hace la función (puede crear referidos automáticamente)

### 2. Verificar Funciones PostgreSQL

**Ubicación en Supabase:**
1. Ve a: **Database** → **Functions**
2. Busca funciones relacionadas con:
   - `referidos`
   - `referral`
   - `codigo_referido`
   - `whatsapp_verificado`

**Funciones comunes a buscar:**
- `create_referral()` o similar
- `handle_referral_code()` o similar
- `verify_whatsapp()` o similar

### 3. Verificar Estructura de la Tabla `referidos`

**Ubicación en Supabase:**
1. Ve a: **Database** → **Tables** → `referidos`
2. Revisa las columnas:
   - `id` (UUID)
   - `referidor_id` (UUID, FK a usuarios)
   - `referido_id` (UUID, FK a usuarios)
   - `codigo_usado` (TEXT)
   - `fecha_registro` (TIMESTAMP)
   - `verifico_whatsapp` (BOOLEAN)
   - `fecha_verificacion` (TIMESTAMP)

**Preguntas clave:**
- ¿Hay algún `DEFAULT` en las columnas?
- ¿Hay algún `CHECK CONSTRAINT`?
- ¿Hay algún `UNIQUE CONSTRAINT`?

### 4. Verificar Políticas RLS (Row Level Security)

**Ubicación en Supabase:**
1. Ve a: **Database** → **Tables** → `referidos` → **Policies**
2. Revisa si hay políticas que:
   - Permiten INSERT automático
   - Permiten UPDATE automático

### 5. Verificar Webhooks o Edge Functions

**Ubicación en Supabase:**
1. Ve a: **Database** → **Webhooks** (si existe)
2. O: **Edge Functions** → Busca funciones relacionadas con referidos

## 📋 Checklist de Verificación

Usa este checklist cuando revises Supabase:

- [ ] **Triggers en `referidos`:**
  - [ ] ¿Hay trigger `AFTER INSERT`?
  - [ ] ¿Hay trigger `AFTER UPDATE`?
  - [ ] ¿Qué funciones ejecutan?

- [ ] **Funciones PostgreSQL:**
  - [ ] ¿Hay función que crea referidos?
  - [ ] ¿Hay función que actualiza `verifico_whatsapp`?
  - [ ] ¿Qué hacen estas funciones?

- [ ] **Estructura de tabla:**
  - [ ] ¿Cómo se insertan los referidos?
  - [ ] ¿Hay valores por defecto?
  - [ ] ¿Hay constraints especiales?

- [ ] **Flujo de creación:**
  - [ ] ¿Se crea automáticamente cuando un usuario se registra con código?
  - [ ] ¿Se crea manualmente desde algún endpoint?
  - [ ] ¿Se crea mediante trigger de DB?

## 🔍 Información a Recopilar

Cuando revises Supabase, anota:

1. **Nombre de triggers encontrados:**
   ```
   Ejemplo:
   - trigger_referral_created (AFTER INSERT)
   - trigger_referral_verified (AFTER UPDATE)
   ```

2. **Nombre de funciones encontradas:**
   ```
   Ejemplo:
   - create_referral_record()
   - update_referral_verification()
   ```

3. **Código SQL de las funciones (si es posible):**
   - Copia el código SQL para entender qué hacen

4. **Flujo identificado:**
   ```
   Ejemplo:
   1. Usuario se registra con código de referido
   2. Trigger automático crea registro en `referidos`
   3. Cuando verifica WhatsApp, otro trigger actualiza `verifico_whatsapp`
   ```

## 📝 Siguiente Paso

Una vez que tengas esta información, podremos:
1. ✅ Entender cómo se crean los referidos actualmente
2. ✅ Decidir dónde integrar los triggers de notificaciones
3. ✅ Implementar la integración correctamente

## 🚨 Si NO Encuentras Triggers

Si no hay triggers en Supabase, entonces:
- Los referidos se crean desde el código de la app
- Necesitamos buscar en el código dónde se hace esto
- O puede que se cree manualmente desde el admin panel

**En este caso, necesitaremos:**
- Buscar endpoints de API que creen referidos
- Buscar funciones en `SupabaseContext.tsx`
- Revisar el proceso de registro (`createUser`)

