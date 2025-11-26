# Preguntas para Verificar en Supabase

## ❓ Preguntas Clave

Cuando revises Supabase Dashboard, necesitamos saber:

### 1. ¿Cómo se crean los referidos?

**Pregunta:** ¿Hay algún trigger o función que automáticamente crea un registro en `referidos` cuando un usuario se registra con un código de referido?

**Dónde buscar:**
- Database → Triggers → Tabla `referidos`
- Database → Functions → Buscar funciones con "referral" o "referido"

**Si SÍ existe:**
- Anota el nombre del trigger/función
- Copia el código SQL si es posible
- Entendemos que los referidos se crean automáticamente

**Si NO existe:**
- Los referidos se crean desde el código
- Necesitamos buscar dónde en el código

### 2. ¿Cómo se actualiza `verifico_whatsapp`?

**Pregunta:** ¿Hay algún trigger o función que actualiza `verifico_whatsapp = true` cuando un usuario verifica su WhatsApp?

**Dónde buscar:**
- Database → Triggers → Tabla `referidos` → `AFTER UPDATE`
- Database → Functions → Buscar funciones con "whatsapp" o "verify"

**Si SÍ existe:**
- Anota el nombre del trigger/función
- Entendemos que se actualiza automáticamente

**Si NO existe:**
- Se actualiza desde el código (probablemente en `verifyWhatsAppCode`)
- Necesitamos implementar esa función

### 3. ¿Dónde se almacena el código de referido usado?

**Pregunta:** Cuando un usuario se registra con un código de referido, ¿dónde se guarda ese código?

**Opciones:**
- En la tabla `usuarios` (columna `codigo_referido_usado` o similar)
- En la tabla `referidos` (columna `codigo_usado`)
- En algún otro lugar

**Importante:** Necesitamos saber esto para entender el flujo completo.

### 4. ¿Cuándo se crea el registro en `referidos`?

**Pregunta:** ¿En qué momento exacto se crea el registro en `referidos`?

**Opciones:**
- Al momento del registro (`createUser`)
- Cuando el usuario verifica WhatsApp
- Automáticamente mediante trigger
- Manualmente desde admin panel

## 📸 Capturas Útiles

Si puedes, toma capturas de:
1. Triggers en la tabla `referidos`
2. Funciones PostgreSQL relacionadas
3. Estructura de la tabla `referidos` (columnas)
4. Políticas RLS de la tabla `referidos`

## 🔄 Flujo Esperado

Basado en la documentación, el flujo debería ser:

1. **Usuario A** tiene código de referido (ej: `ABC12345`)
2. **Usuario B** se registra usando código `ABC12345`
3. **Sistema crea registro en `referidos`:**
   - `referidor_id` = ID de Usuario A
   - `referido_id` = ID de Usuario B
   - `codigo_usado` = `ABC12345`
   - `fecha_registro` = ahora
   - `verifico_whatsapp` = false
4. **Usuario B verifica WhatsApp**
5. **Sistema actualiza `referidos`:**
   - `verifico_whatsapp` = true
   - `fecha_verificacion` = ahora

**En cada paso, deberíamos invocar los triggers de notificaciones:**
- Paso 3 → Invocar `triggerReferralInvitedForId`
- Paso 5 → Invocar `triggerReferralVerifiedForId`

## ✅ Resultado Esperado

Después de revisar Supabase, deberíamos tener claro:
- ✅ Cómo se crean los referidos
- ✅ Cómo se actualiza `verifico_whatsapp`
- ✅ Dónde integrar los triggers de notificaciones
- ✅ Si necesitamos crear funciones faltantes

