# Fase 2: Procesar código de referido y crear registro en referidos

**Fecha:** 2025-01-XX  
**Estado:** ✅ Implementado

---

## 📋 Cambios Realizados

### 1. Agregar campo de código de referido en formulario de registro
**Archivo:** `src/app/sign-up/page.tsx`
- Agregado estado `referralCode` para almacenar el código ingresado
- Agregado campo opcional en el formulario con:
  - Icono de regalo (Gift)
  - Validación: solo mayúsculas y números, máximo 8 caracteres
  - Placeholder: "ABC12345"
  - Texto de ayuda: "Si tienes un código de referido, ingrésalo aquí para obtener beneficios"
- El código se pasa a `createUser()` como `codigoReferidoUsado`

### 2. Modificar `createUser()` para procesar código de referido
**Archivo:** `src/contexts/SupabaseContext.tsx`
- Agregado parámetro opcional `codigoReferidoUsado?: string`
- Lógica implementada:
  1. **Validar código:** Si se proporciona un código, buscar usuario con ese `codigo_referido`
  2. **Validar referidor:** Verificar que el código existe y no es el propio usuario
  3. **Asignar referido_de:** Actualizar `usuarios.referido_de` con el ID del referidor
  4. **Crear registro en referidos:** Insertar registro en tabla `referidos` con:
     - `referidor_id`: ID del usuario que refirió
     - `referido_id`: ID del nuevo usuario
     - `codigo_usado`: Código de referido usado
     - `fecha_registro`: Fecha actual
     - `verifico_whatsapp`: false (se actualizará cuando verifique WhatsApp)

### 3. Características de seguridad
- **No crítico:** Si el código es inválido o falla algo, el registro del usuario continúa normalmente
- **Validación:** No permite usar el propio código de referido
- **Logs:** Mensajes claros en consola para debugging
- **Manejo de errores:** Todos los errores son capturados y no afectan el registro principal

---

## 🧪 Pruebas a Realizar

### Test 1: Registro sin código de referido (debe funcionar normalmente)
1. Ir a `/sign-up`
2. Crear cuenta sin ingresar código de referido
3. Verificar que el usuario se crea exitosamente
4. Verificar en Supabase que:
   - El usuario existe
   - `referido_de` es `null`
   - No hay registro en tabla `referidos`

### Test 2: Registro con código de referido válido
1. Crear un usuario de prueba y verificar WhatsApp (para que tenga `codigo_referido`)
2. Anotar el `codigo_referido` de ese usuario
3. Ir a `/sign-up`
4. Crear cuenta nueva ingresando el código de referido
5. Verificar en consola que aparecen:
   - `🎁 Procesando código de referido: [CÓDIGO]`
   - `✅ Referidor encontrado: [ID]`
   - `✅ referido_de asignado correctamente`
   - `✅ Registro en referidos creado exitosamente: [ID]`
6. Verificar en Supabase que:
   - El nuevo usuario tiene `referido_de` = ID del referidor
   - Existe un registro en tabla `referidos` con:
     - `referidor_id` = ID del referidor
     - `referido_id` = ID del nuevo usuario
     - `codigo_usado` = código ingresado
     - `verifico_whatsapp` = false

### Test 3: Registro con código de referido inválido
1. Ir a `/sign-up`
2. Crear cuenta ingresando un código que no existe (ej: "INVALIDO")
3. Verificar en consola que aparece: `⚠️ Código de referido no encontrado o inválido: INVALIDO`
4. Verificar que el usuario se crea exitosamente (no debe fallar)
5. Verificar en Supabase que:
   - El usuario existe
   - `referido_de` es `null`
   - No hay registro en tabla `referidos`

### Test 4: Registro intentando usar propio código (si es posible)
1. (Este test es difícil de hacer manualmente, pero la lógica está implementada)
2. Si se intenta usar el propio código, debe loguear: `⚠️ No se puede usar el propio código de referido`
3. El registro debe continuar normalmente

---

## ✅ Checklist

- [x] Agregar campo de código en formulario de registro
- [x] Agregar estado para código de referido
- [x] Pasar código a `createUser()`
- [x] Modificar `createUser()` para aceptar código opcional
- [x] Buscar usuario con código de referido
- [x] Validar que el código existe y no es propio
- [x] Asignar `referido_de` al nuevo usuario
- [x] Crear registro en tabla `referidos`
- [x] Verificar que no hay errores de linter
- [ ] **PENDIENTE: Probar en localhost**

---

## 📝 Notas

- El código de referido es **opcional**: el registro funciona con o sin código
- Si el código es inválido, el registro **no falla**, solo se loguea una advertencia
- El registro en `referidos` se crea **inmediatamente** al registrarse, no espera a verificar WhatsApp
- `verifico_whatsapp` se actualizará cuando el referido verifique WhatsApp (ya implementado en Fase 1)
- **Fase 3 pendiente:** Invocar trigger `referral-invited` después de crear el registro

---

## 🚀 Siguiente Fase

**Fase 3:** Integrar trigger `referral-invited`
- Invocar endpoint `/api/notifications/triggers/referral-invited` después de crear registro en `referidos`
- Pasar `referralId` del registro creado
- Manejar errores de forma no crítica

