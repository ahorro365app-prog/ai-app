# Testing - Verificación WhatsApp (FASE 4)

**Fecha:** 2025-01-23  
**Objetivo:** Verificar que todas las fases de la mejora de verificación WhatsApp funcionan correctamente

## 📋 Resumen de Cambios Implementados

### FASE 1: Verificación en Servidor ✅
- **Archivo:** `src/app/api/whatsapp/send-verification-code/route.ts`
- **Cambio:** Verifica si hay código activo antes de generar uno nuevo
- **Retorna:** `hasActiveCode`, `expiresIn`, `expiresAt` si hay código activo

### FASE 2: Persistencia en localStorage ✅
- **Archivo:** `src/components/WhatsAppVerificationModal.tsx`
- **Cambio:** Guarda y restaura temporizador desde localStorage
- **Funciones:** `saveCodeToStorage()`, `loadCodeFromStorage()`, `clearCodeFromStorage()`

### FASE 3: Botón Dinámico ✅
- **Archivo:** `src/app/profile/page.tsx`
- **Cambio:** Botón cambia según estado del código pendiente
- **Estados:** "Verificar por WhatsApp" / "Ingresar el código (X:XX)"

---

## 🧪 Casos de Prueba

### Test 1: Flujo Normal - Primera Solicitud
**Objetivo:** Verificar que se genera y envía código correctamente

**Pasos:**
1. Ir a Perfil
2. Hacer clic en "Verificar por WhatsApp"
3. Hacer clic en "Enviar código"
4. Verificar que:
   - ✅ Se envía código por WhatsApp
   - ✅ Modal muestra paso de ingreso de código
   - ✅ Timer inicia en 10:00
   - ✅ Código se guarda en localStorage

**Resultado Esperado:** ✅ Código enviado, timer activo, localStorage guardado

---

### Test 2: Cerrar Modal y Reabrir
**Objetivo:** Verificar que el timer persiste al cerrar/abrir modal

**Pasos:**
1. Solicitar código (Test 1)
2. Cerrar modal (X)
3. Verificar que botón cambia a "Ingresar el código (X:XX)"
4. Hacer clic en "Ingresar el código"
5. Verificar que:
   - ✅ Modal se abre directamente en paso de código
   - ✅ Timer muestra tiempo restante correcto
   - ✅ Timer continúa desde donde quedó

**Resultado Esperado:** ✅ Timer persiste, modal abre en paso correcto

---

### Test 3: Solicitar Código Múltiples Veces (Rate Limit)
**Objetivo:** Verificar que no se generan múltiples códigos simultáneos

**Pasos:**
1. Solicitar código
2. Cerrar modal
3. Volver a hacer clic en "Verificar por WhatsApp"
4. Hacer clic en "Enviar código" nuevamente
5. Verificar que:
   - ✅ Servidor retorna código existente (no genera nuevo)
   - ✅ No se envía mensaje duplicado por WhatsApp
   - ✅ Timer se actualiza con tiempo restante del código original

**Resultado Esperado:** ✅ No se generan códigos duplicados, se reutiliza el existente

---

### Test 4: Expiración del Código
**Objetivo:** Verificar limpieza automática cuando expira

**Pasos:**
1. Solicitar código
2. Esperar a que expire (o modificar localStorage para simular expiración)
3. Verificar que:
   - ✅ Botón vuelve a "Verificar por WhatsApp"
   - ✅ localStorage se limpia automáticamente
   - ✅ Al abrir modal, muestra paso inicial (no paso de código)

**Resultado Esperado:** ✅ Limpieza automática al expirar

---

### Test 5: Verificación Exitosa
**Objetivo:** Verificar que se limpia todo al verificar correctamente

**Pasos:**
1. Solicitar código
2. Ingresar código correcto
3. Verificar que:
   - ✅ Código se verifica exitosamente
   - ✅ localStorage se limpia
   - ✅ Botón desaparece (usuario verificado)
   - ✅ Badge "WhatsApp verificado" aparece

**Resultado Esperado:** ✅ Verificación exitosa, limpieza completa

---

### Test 6: Recarga de Página
**Objetivo:** Verificar persistencia después de recargar

**Pasos:**
1. Solicitar código
2. Cerrar modal
3. Recargar página (F5)
4. Verificar que:
   - ✅ Botón muestra "Ingresar el código (X:XX)"
   - ✅ Timer continúa correctamente
   - ✅ Al abrir modal, restaura estado correcto

**Resultado Esperado:** ✅ Persistencia después de recargar

---

### Test 7: Código Inválido
**Objetivo:** Verificar manejo de código incorrecto

**Pasos:**
1. Solicitar código
2. Ingresar código incorrecto
3. Verificar que:
   - ✅ Muestra error "Código inválido"
   - ✅ Timer continúa activo
   - ✅ Puede intentar de nuevo
   - ✅ Puede reenviar código si expira

**Resultado Esperado:** ✅ Manejo correcto de errores, timer no se resetea

---

### Test 8: Reenviar Código
**Objetivo:** Verificar reenvío cuando timer expira

**Pasos:**
1. Solicitar código
2. Esperar a que timer llegue a 0:00
3. Hacer clic en "Reenviar código"
4. Verificar que:
   - ✅ Se genera nuevo código
   - ✅ Se envía por WhatsApp
   - ✅ Timer reinicia en 10:00
   - ✅ localStorage se actualiza

**Resultado Esperado:** ✅ Reenvío funciona correctamente

---

## 🔍 Edge Cases a Verificar

### Edge Case 1: Múltiples Pestañas
- **Escenario:** Usuario tiene múltiples pestañas abiertas
- **Verificar:** Que el estado se sincroniza correctamente entre pestañas
- **Nota:** localStorage es compartido, debería funcionar

### Edge Case 2: Cambio de Teléfono
- **Escenario:** Usuario cambia su teléfono mientras tiene código pendiente
- **Verificar:** Que se limpia código del teléfono anterior
- **Nota:** La clave de localStorage incluye el teléfono

### Edge Case 3: Usuario Verificado Mientras Tiene Código Pendiente
- **Escenario:** Usuario verifica en otra sesión/dispositivo
- **Verificar:** Que el botón desaparece al refrescar
- **Nota:** `fetchUserData()` actualiza el estado

### Edge Case 4: localStorage Lleno o Bloqueado
- **Escenario:** localStorage no disponible (modo incógnito, bloqueado)
- **Verificar:** Que el sistema funciona sin localStorage (solo sin persistencia)
- **Nota:** Debería funcionar, solo sin persistencia entre sesiones

---

## ✅ Checklist de Verificación

### Backend (FASE 1)
- [ ] Endpoint verifica código activo antes de generar nuevo
- [ ] Retorna `hasActiveCode: true` si hay código activo
- [ ] Retorna `expiresIn` y `expiresAt` correctamente
- [ ] No genera código duplicado si hay uno activo
- [ ] Logs muestran información correcta

### Frontend - Modal (FASE 2)
- [ ] Guarda código en localStorage al enviar
- [ ] Restaura código desde localStorage al abrir
- [ ] Calcula tiempo restante correctamente
- [ ] Limpia localStorage al verificar
- [ ] Limpia localStorage al expirar
- [ ] Timer continúa correctamente después de cerrar/abrir

### Frontend - Botón (FASE 3)
- [ ] Muestra "Verificar por WhatsApp" sin código pendiente
- [ ] Muestra "Ingresar el código (X:XX)" con código pendiente
- [ ] Tiempo se actualiza cada segundo
- [ ] Botón desaparece cuando usuario está verificado
- [ ] Verifica código pendiente al cargar página
- [ ] Verifica código pendiente después de cerrar modal

### Integración
- [ ] Todas las fases funcionan juntas
- [ ] No hay errores en consola
- [ ] No hay warnings de React
- [ ] Performance es aceptable (no hay re-renders excesivos)

---

## 📊 Métricas de Éxito

- ✅ **100%** de los tests pasan
- ✅ **0** errores en consola
- ✅ **0** warnings de React
- ✅ Timer persiste correctamente en **100%** de los casos
- ✅ Botón cambia correctamente en **100%** de los casos

---

## 🐛 Problemas Conocidos

Ninguno hasta el momento.

---

## 📝 Notas de Implementación

### Clave de localStorage
Formato: `whatsapp_verification_{telefono_sin_caracteres_especiales}`

Ejemplo: `whatsapp_verification_59175993438`

### Estructura de Datos en localStorage
```json
{
  "expiresAt": "2025-01-23T15:30:00.000Z",
  "phone": "+59175993438",
  "savedAt": "2025-01-23T15:20:00.000Z"
}
```

### Flujo Completo
1. Usuario solicita código → Servidor verifica si hay código activo
2. Si hay código activo → Retorna información sin generar nuevo
3. Si no hay código activo → Genera y envía nuevo código
4. Frontend guarda `expiresAt` en localStorage
5. Botón detecta código pendiente y cambia texto
6. Al abrir modal, restaura timer desde localStorage
7. Al verificar, limpia localStorage

---

## 🔄 Próximos Pasos (si es necesario)

- [ ] Agregar tests unitarios automatizados
- [ ] Agregar tests E2E con Playwright/Cypress
- [ ] Monitorear errores en producción
- [ ] Optimizar performance si es necesario

---

**Última actualización:** 2025-01-23  
**Estado:** ✅ Implementación completa, listo para testing

