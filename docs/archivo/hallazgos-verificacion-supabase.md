# Hallazgos de Verificación en Supabase

**Fecha:** 2025-01-XX  
**Objetivo:** Identificar dónde se crean referidos para integrar el trigger `referral-invited`

---

## ✅ Verificaciones Completadas

### 1. Trigger `trigger_actualizar_contador_referidos`
- **Tipo:** `BEFORE UPDATE` en tabla `referidos`
- **Función:** `actualizar_contador_referidos`
- **Propósito:** Actualiza contador `referidos_verificados` en `usuarios` cuando un referido verifica WhatsApp
- **Código:**
```sql
BEGIN
  -- Si un referido verifica WhatsApp, actualizar contador del referidor
  IF NEW.verifico_whatsapp = true AND (OLD.verifico_whatsapp IS NULL OR OLD.verifico_whatsapp = false) THEN
    UPDATE usuarios 
    SET referidos_verificados = referidos_verificados + 1
    WHERE id = NEW.referidor_id;
    
    -- Actualizar fecha_verificacion
    NEW.fecha_verificacion = NOW();
  END IF;
  
  RETURN NEW;
END;
```
- **Conclusión:** ✅ Este trigger NO crea referidos, solo actualiza contadores cuando se verifica WhatsApp.

### 2. Tabla `usuarios` - Columnas Relacionadas con Referidos ✅
**Columnas encontradas:**
- `codigo_referido` (text) - ✅ **ENCONTRADO** - Código de referido del usuario
- `referidos_verificados` (integer) - Contador de referidos que han verificado WhatsApp
- `referido_de` (uuid) - ✅ **CLAVE** - ID del usuario que lo refirió (referidor_id)

**Otras columnas relevantes:**
- `whatsapp_verificado` (bool) - Si el usuario verificó WhatsApp
- `telefono_verificado` (text) - Teléfono verificado
- `fecha_ultimo_cambio_telefono` (timestamptz)
- `telefono_pendiente` (text) - Para cambio de teléfono
- `codigo_verificacion_pendiente` (text)
- `fecha_inicio_cambio_telefono` (timestamp)
- `intentos_verificacion_cambio` (integer)

**Conclusión:** 
- ✅ `codigo_referido` existe y almacena el código único del usuario
- ✅ `referido_de` almacena el ID del referidor cuando un usuario se registra con un código
- ⚠️ **PREGUNTA:** ¿Cuándo se asigna `referido_de`? ¿Durante `createUser()` o después?

### 3. Análisis del Código

#### Funciones Encontradas:
- ✅ `generateReferralCode()` en `src/lib/referralUtils.ts` - Genera códigos de 8 caracteres
- ❌ NO se usa en `createUser()` - El código de referido NO se genera al crear usuario
- ❌ NO hay campo en formulario de registro para ingresar código de referido

#### Uso de `codigo_referido`:
- `src/app/profile/page.tsx` - Muestra el código de referido del usuario
- `src/components/ReferralsDashboard.tsx` - Usa `user?.codigo_referido || "0d42db19"` (fallback hardcodeado)

#### Interfaz `User` en `SupabaseContext.tsx`:
```typescript
interface User {
  id: string;
  nombre: string;
  correo?: string;
  telefono?: string;
  contrasena?: string;
  pais: string;
  moneda: string;
  presupuesto_diario?: number;
  suscripcion: string;
  deudas_habilitado: boolean;
  metas_habilitado: boolean;
}
```
**⚠️ NO incluye `codigo_referido`** - Esto sugiere que el campo puede no existir o no estar tipado.

---

## ❓ Preguntas Pendientes

### 1. ¿Existe `codigo_referido` en la tabla `usuarios`?
- **Acción:** Desplazarse hacia abajo en la lista de columnas de `usuarios` para verificar si existe más abajo
- **Alternativa:** Verificar si se genera automáticamente por un trigger o función en Supabase

### 2. ¿Cómo se crean los registros en la tabla `referidos`?
- **Acción:** Revisar la estructura de la tabla `referidos`:
  - Columnas: `id`, `referidor_id`, `referido_id`, `fecha_registro`, `verifico_whatsapp`, `fecha_verificacion`
  - Triggers: ¿Hay algún `AFTER INSERT` trigger?
  - Functions: ¿Hay alguna función que cree referidos?

### 3. ¿Dónde se procesa el código de referido cuando un usuario se registra?
- **Opciones posibles:**
  - A) Manualmente desde el admin panel
  - B) Vía webhook de WhatsApp (procesar mensajes con códigos)
  - C) Durante el registro (flujo no implementado aún)
  - D) Trigger en Supabase que crea referidos automáticamente

### 4. ¿Hay triggers en la tabla `usuarios`?
- **Acción:** Revisar pestaña "Triggers" de la tabla `usuarios`
- **Buscar:** Triggers de tipo `AFTER INSERT` que puedan crear referidos

### 5. ¿Hay Functions relacionadas con referidos?
- **Acción:** Revisar sección "Functions" en Supabase
- **Buscar:** Funciones con nombres como:
  - `crear_referido`
  - `procesar_codigo_referido`
  - `registrar_referido`
  - `generar_codigo_referido`

---

## 📋 Próximos Pasos

### Paso 1: Verificar Columnas Completas de `usuarios` ✅ COMPLETADO
1. ✅ `codigo_referido` (text) - Existe
2. ✅ `referido_de` (uuid) - Existe - Almacena el ID del referidor
3. ✅ `referidos_verificados` (integer) - Existe - Contador

### Paso 2: Revisar Tabla `referidos` ✅ COMPLETADO
**Estructura de la tabla `referidos`:**
- `id` (uuid, not null) - Primary key
- `referidor_id` (uuid, not null) - ID del usuario que refirió
- `referido_id` (uuid, not null) - ID del usuario referido
- `codigo_usado` (text, not null) - Código de referido usado
- `verifico_whatsapp` (boolean, nullable) - Si el referido verificó WhatsApp
- `fecha_registro` (timestamptz, nullable) - Fecha de creación del registro
- `fecha_verificacion` (timestamptz, nullable) - Fecha de verificación de WhatsApp

**Triggers encontrados:**
- ✅ Solo UN trigger: `trigger_actualizar_contador_referidos` (BEFORE UPDATE)
- ❌ **NO hay trigger `AFTER INSERT`** - Los referidos NO se crean automáticamente por trigger

**Conclusión:** Los referidos se crean desde el código de la aplicación o manualmente.

### Paso 3: Revisar Triggers en `usuarios` ✅ COMPLETADO
**Triggers encontrados en `usuarios`:**
- `actualizar_usuarios_fecha_...` (BEFORE UPDATE) - Actualiza fecha de modificación
- ❌ **NO hay trigger `AFTER INSERT`** que cree referidos automáticamente

**Conclusión:** Los referidos NO se crean automáticamente cuando se crea un usuario.

### Paso 4: Revisar Functions
1. Ir a: Database → Functions
2. Buscar funciones relacionadas con referidos
3. Revisar código de cada función encontrada

### Paso 5: Decidir Estrategia de Integración
Una vez identificado dónde se crean referidos:
- **Si se crean manualmente:** Integrar trigger en el admin panel
- **Si se crean por trigger/function:** Integrar trigger en ese punto
- **Si no existe flujo:** Implementar flujo completo (registro + creación de referido + trigger)

---

## 🔍 Evidencia del Código

### Código que usa `codigo_referido`:
```typescript
// src/app/profile/page.tsx:883
{user?.whatsapp_verificado && user?.codigo_referido && (
  // Muestra código de referido
)}

// src/components/ReferralsDashboard.tsx:91
const referralCode = user?.codigo_referido || "0d42db19";
```

### Función que genera códigos (pero no se usa):
```typescript
// src/lib/referralUtils.ts:43
export const generateReferralCode = (): string => {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * REFERRAL_ALPHABET.length);
    code += REFERRAL_ALPHABET[index];
  }
  return code;
};
```

### `createUser` NO genera código de referido:
```typescript
// src/contexts/SupabaseContext.tsx:320-369
const createUser = async (userData: {...}) => {
  // Solo crea usuario básico
  // NO genera codigo_referido
  // NO procesa código de referido usado
  // NO crea registro en tabla referidos
}
```

---

## 📝 Notas

- El sistema de referidos parece estar **parcialmente implementado**
- ✅ `codigo_referido` existe en la tabla `usuarios` (text)
- ✅ `referido_de` existe en la tabla `usuarios` (uuid) - Almacena el ID del referidor
- ✅ La tabla `referidos` tiene la estructura correcta
- ❌ **NO hay código que inserte registros en `referidos`** - Solo hay SELECT
- ❌ **NO hay trigger que cree referidos automáticamente**
- ❌ La función `generateReferralCode()` existe pero no se usa en `createUser()`
- ❌ No hay flujo para procesar códigos de referido durante el registro
- ⚠️ **Los referidos probablemente se crean manualmente desde Supabase o desde el admin panel**
- El trigger `referral-verified` ya está integrado ✅
- El trigger `referral-invited` está pendiente de integración ⏳

## 🎯 Conclusión Final

**Estado actual:**
1. ✅ La estructura de base de datos está lista (`usuarios.codigo_referido`, `usuarios.referido_de`, tabla `referidos`)
2. ✅ El trigger `referral-verified` está integrado en `verify-code`
3. ❌ **NO existe código que cree registros en `referidos` automáticamente**
4. ❌ **NO existe flujo para procesar códigos de referido durante el registro**

**Opciones para integrar `referral-invited`:**

### Opción A: Implementar flujo completo de referidos (RECOMENDADO)
1. Modificar `createUser()` para:
   - Generar `codigo_referido` si no existe
   - Procesar código de referido si se proporciona (buscar usuario por código, asignar `referido_de`)
   - Crear registro en `referidos` si hay `referido_de`
   - Invocar trigger `referral-invited` después de crear el registro

### Opción B: Integrar solo en puntos existentes
1. Si los referidos se crean desde el admin panel, integrar el trigger ahí
2. Si se crean manualmente desde Supabase, no se puede integrar automáticamente

**Recomendación:** Implementar Opción A para tener un sistema completo y automatizado.

