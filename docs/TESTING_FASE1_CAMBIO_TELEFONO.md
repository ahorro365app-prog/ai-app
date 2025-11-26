# Testing - FASE 1: Verificación en Servidor (Cambio de Teléfono)

**Fecha:** 2025-01-23  
**Fase:** FASE 1 - Verificación en Servidor

---

## ✅ Cambios Implementados

### Archivo: `src/contexts/SupabaseContext.tsx`

1. **Actualizado tipo de retorno de `initiatePhoneChange`:**
   - Ahora retorna: `hasActiveCode`, `expiresIn`, `expiresAt`, `whatsappSent`, `whatsappError`

2. **Actualizado lógica de captura de respuesta:**
   - Captura todos los campos de la respuesta del endpoint
   - Los retorna en el objeto de respuesta

---

## 🧪 Test 1: Verificar que el endpoint retorna datos correctos

### Pasos:
1. Abrir consola del navegador (F12)
2. Ir a Perfil
3. Hacer clic en "Cambiar" teléfono
4. Ingresar nuevo teléfono (ej: 70123456)
5. Confirmar cambio
6. En consola, verificar logs:
   - Debe mostrar: `✅ initiatePhoneChange: Código enviado exitosamente`
   - Debe incluir: `hasActiveCode`, `expiresIn`, `whatsappSent`

### Resultado Esperado:
✅ Logs muestran que se capturaron los datos correctamente

---

## 🧪 Test 2: Verificar que retorna código activo si existe

### Pasos:
1. Solicitar cambio de teléfono (Test 1)
2. **Cerrar modal sin verificar**
3. Volver a hacer clic en "Cambiar"
4. Ingresar el **mismo** teléfono
5. Confirmar cambio
6. En consola, verificar:
   - Debe mostrar: `hasActiveCode: true`
   - Debe mostrar: `expiresIn` con tiempo restante

### Resultado Esperado:
✅ No se envía nuevo código, se reutiliza el existente

---

## 🧪 Test 3: Verificar que funciona con teléfono diferente

### Pasos:
1. Solicitar cambio a teléfono A (ej: 70123456)
2. Cerrar modal
3. Solicitar cambio a teléfono B (ej: 70123457)
4. Verificar que se envía nuevo código

### Resultado Esperado:
✅ Se envía nuevo código para el nuevo teléfono

---

## ✅ Checklist de Verificación

- [ ] `initiatePhoneChange` retorna `hasActiveCode`
- [ ] `initiatePhoneChange` retorna `expiresIn`
- [ ] `initiatePhoneChange` retorna `expiresAt`
- [ ] `initiatePhoneChange` retorna `whatsappSent`
- [ ] `initiatePhoneChange` retorna `whatsappError`
- [ ] Logs muestran información correcta
- [ ] No hay errores de TypeScript
- [ ] No hay errores en consola

---

## 📊 Resultado del Test

**Estado:** ⏳ Pendiente de ejecución

**Notas:**
- El endpoint ya estaba implementado correctamente
- Solo se actualizó `initiatePhoneChange` para capturar y retornar los datos

---

**Ejecuta los tests y confirma que todo funciona antes de continuar con FASE 2.**

