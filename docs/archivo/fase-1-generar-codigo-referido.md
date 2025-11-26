# Fase 1: Generar código de referido automáticamente

**Fecha:** 2025-01-XX  
**Estado:** ✅ Implementado (CORREGIDO)

---

## 📋 Cambios Realizados

### 1. Importar función de generación de códigos
**Archivo:** `src/app/api/whatsapp/verify-code/route.ts`
- Agregado import de `generateReferralCode` desde `@/lib/referralUtils`

### 2. Generar código cuando se verifica WhatsApp por primera vez
**Archivo:** `src/app/api/whatsapp/verify-code/route.ts`
- **IMPORTANTE:** El código se genera solo cuando el usuario verifica WhatsApp por primera vez
- Se verifica si `whatsapp_verificado` es `false` (primera verificación)
- Se verifica si `codigo_referido` es `null` o `undefined`
- Si ambas condiciones se cumplen, se genera el código automáticamente
- Si falla la generación, no afecta la verificación de WhatsApp (no crítico)

### 3. Actualizar interfaz `User`
**Archivo:** `src/contexts/SupabaseContext.tsx`
- Agregado `codigo_referido?: string` a la interfaz
- Agregado `referido_de?: string` para futuras fases

---

## 🧪 Pruebas a Realizar

### Test 1: Verificar WhatsApp por primera vez (debe generar código)
1. Crear un usuario nuevo en `/sign-up` (sin verificar WhatsApp)
2. Verificar en Supabase que el usuario NO tiene `codigo_referido` (debe ser `null`)
3. Ir a la verificación de WhatsApp (donde se ingresa el código)
4. Ingresar el código de verificación recibido
5. Verificar en consola que aparece: `🎁 Generando código de referido para primera verificación: [CÓDIGO]`
6. Verificar en consola que aparece: `✅ Código de referido generado exitosamente`
7. Verificar en Supabase que el usuario ahora tiene `codigo_referido` asignado
8. Verificar que el código tiene 8 caracteres alfanuméricos

### Test 2: Verificar WhatsApp segunda vez (NO debe generar código nuevo)
1. Usar un usuario que ya tiene `codigo_referido` y `whatsapp_verificado = true`
2. Cambiar teléfono (si es necesario) o usar otro flujo de verificación
3. Verificar que NO aparece el mensaje de generación de código
4. Verificar que el código de referido existente NO cambia

### Test 3: Verificar que la verificación no falla si la generación falla
1. (Simular error en generación - difícil de probar manualmente)
2. Verificar que WhatsApp se verifica exitosamente aunque falle la generación del código

---

## ✅ Checklist

- [x] Importar `generateReferralCode` en `verify-code`
- [x] Generar código cuando se verifica WhatsApp por primera vez
- [x] Actualizar interfaz `User`
- [x] Verificar que no hay errores de linter
- [x] **✅ PROBADO: Test 1 completado exitosamente**
  - Usuario nuevo sin código → Verificar WhatsApp → Código generado correctamente

---

## 📝 Notas

- La generación del código es **no crítica**: si falla, el usuario se crea igual
- El código se genera solo si `codigo_referido` es `null` o `undefined`
- El código generado tiene 8 caracteres alfanuméricos (sin 0, O, I, 1 para evitar confusión)

---

## 🚀 Siguiente Fase

**Fase 2:** Procesar código de referido usado durante el registro
- Agregar parámetro opcional `codigoReferidoUsado` a `createUser()`
- Buscar usuario con ese código
- Asignar `referido_de` si se encuentra
- Crear registro en tabla `referidos`

