# Análisis de Funciones PostgreSQL en Supabase

## 🔍 Funciones Relevantes Encontradas

### 1. `actualizar_contador_referidos` ⭐ **CRÍTICA**

**Tipo:** `trigger`  
**Retorno:** `trigger`  
**Seguridad:** `Invoker`

**Análisis:**
- Esta es la función que se ejecuta en el trigger `BEFORE UPDATE` de la tabla `referidos`
- Probablemente actualiza contadores en la tabla `usuarios` (como `referidos_verificados`)
- **Necesitamos ver su código SQL** para entender qué hace exactamente

**Pregunta clave:** ¿Podríamos modificar esta función para que también invoque el trigger de notificación?

**⚠️ Consideración:** Es `BEFORE UPDATE`, no `AFTER UPDATE`. Esto podría ser un problema si queremos invocar notificaciones después de que se actualice el registro.

### 2. `debe_enviar_mensaje_invitacion`

**Argumentos:** `telefono_param text`  
**Retorno:** `boolean`  
**Seguridad:** `Invoker`

**Análisis:**
- Verifica si debe enviar mensaje de invitación (rate limiting)
- Probablemente implementa la lógica de "1 mensaje cada 24 horas"
- **Ya está siendo usada** en el código (vimos referencias en `webhooks/baileys/route.ts`)

### 3. `registrar_mensaje_invitacion`

**Argumentos:** `telefono_param text`  
**Retorno:** `void`  
**Seguridad:** `Invoker`

**Análisis:**
- Registra que se envió un mensaje de invitación
- Actualiza la tabla `invitaciones_no_registrados`
- **Ya está siendo usada** en el código

### 4. `limpiar_codigos_verificacion_expirados...`

**Retorno:** `TABLE(codigos_eliminados bigint, c...`  
**Seguridad:** `Definer`

**Análisis:**
- Limpia códigos de verificación expirados
- Probablemente se ejecuta periódicamente
- Relacionado con el sistema de verificación de WhatsApp

### 5. `trigger_limpiar_codigos_si_necesario`

**Tipo:** `trigger`  
**Retorno:** `trigger`  
**Seguridad:** `Invoker`

**Análisis:**
- Trigger que limpia códigos cuando es necesario
- Se ejecuta en la tabla `codigos_verificacion` (según el trigger que vimos antes)

## 🎯 Acción Requerida: Ver Código de `actualizar_contador_referidos`

**Necesitamos ver el código SQL completo de esta función para:**

1. ✅ Entender qué hace exactamente
2. ✅ Ver si actualiza `verifico_whatsapp` o solo contadores
3. ✅ Decidir si podemos modificarla o necesitamos crear una nueva función
4. ✅ Determinar si es el lugar correcto para invocar el trigger de notificación

**Cómo ver el código:**
1. En Supabase Dashboard, ve a: **Database → Functions**
2. Haz clic en `actualizar_contador_referidos`
3. Copia el código SQL completo

## 📋 Funciones Relacionadas con WhatsApp/Referidos

### Funciones que ya están implementadas:
- ✅ `debe_enviar_mensaje_invitacion` - Rate limiting
- ✅ `registrar_mensaje_invitacion` - Registro de mensajes
- ✅ `limpiar_codigos_verificacion_expirados...` - Limpieza de códigos

### Funciones que necesitamos entender:
- ❓ `actualizar_contador_referidos` - **Necesitamos ver su código**

## 🔄 Flujo Actual (Inferido)

Basado en las funciones encontradas:

1. **Usuario se registra con código de referido**
   - Se crea registro en `referidos` (desde código, no trigger)
   - ❓ ¿Dónde se crea? (necesitamos buscar en código)

2. **Usuario verifica WhatsApp**
   - Se actualiza `verifico_whatsapp = true` en `referidos`
   - Trigger `BEFORE UPDATE` ejecuta `actualizar_contador_referidos`
   - Esta función actualiza contadores en `usuarios`
   - ❓ ¿También actualiza `verifico_whatsapp`? (necesitamos ver código)

3. **Sistema de invitaciones**
   - `debe_enviar_mensaje_invitacion` verifica rate limit
   - `registrar_mensaje_invitacion` registra el envío

## ✅ Próximo Paso

**Necesitamos ver el código SQL de `actualizar_contador_referidos`:**

1. Ve a Supabase Dashboard → Database → Functions
2. Haz clic en `actualizar_contador_referidos`
3. Copia y comparte el código SQL completo

Con ese código podremos:
- Entender el flujo completo
- Decidir dónde integrar los triggers de notificaciones
- Implementar la solución correcta

