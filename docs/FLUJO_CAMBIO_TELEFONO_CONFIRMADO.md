# Flujo de Cambio de Teléfono - CONFIRMADO

**Fecha:** 2025-01-23  
**Estado:** ✅ Confirmado por usuario, listo para implementar

---

## 📋 DECISIONES TOMADAS

### 1. Botón en Perfil
- ✅ **Opción A:** Botón "Cambiar" **desaparece** cuando hay cambio pendiente
- ✅ Solo mostrar "Completar cambio (X:XX)" cuando hay cambio pendiente
- ✅ Botón separado (no reemplaza "Verificar por WhatsApp")

### 2. Bloqueo de Múltiples Cambios
- ✅ **Opción A:** Bloquear si intenta cambiar a otro número
- ✅ Debe completar primero o esperar a que expire (10 minutos)
- ✅ No puede iniciar nuevo cambio hasta completar/cancelar el anterior

### 3. Ubicación del Botón
- ✅ **Opción B:** Botón separado (como está actualmente)
- ✅ No reemplaza el botón de verificación inicial

### 4. Texto del Botón
- ✅ **Opción B:** "Completar cambio (9:45)" (simple, sin mostrar teléfono)

### 5. Botón Cancelar
- ❌ **NO incluir botón "CANCELAR"** en el modal
- ✅ Razón: Evitar bucle de solicitar-cancelar-solicitar
- ✅ Usuario puede cerrar modal (X) pero el cambio sigue pendiente
- ✅ Solo se cancela si expira el tiempo (10 minutos)

### 6. Problema Actual
- ⚠️ El código no llega al nuevo número actualmente
- ✅ Se solucionará después de la implementación (o antes si es necesario)

---

## 🔄 FLUJO COMPLETO CONFIRMADO

### Escenario 1: Usuario Completa el Cambio (Flujo Normal)
1. Usuario hace clic en "Cambiar" teléfono
2. Modal se abre → Ingresa nuevo teléfono
3. Confirma el cambio → Se envía código al nuevo número
4. Usuario ingresa código → ✅ Teléfono cambiado exitosamente
5. localStorage se limpia
6. Botón vuelve a "Cambiar"

### Escenario 2: Usuario Cierra Modal (Flujo con Persistencia)
1. Usuario hace clic en "Cambiar" teléfono
2. Ingresa nuevo teléfono → Confirma
3. Se envía código al nuevo número
4. **Usuario cierra modal (X)** → Timer se guarda en localStorage
5. **Botón "Cambiar" desaparece**
6. **Botón "Completar cambio (9:45)" aparece** (actualiza cada segundo)
7. Usuario hace clic en "Completar cambio"
8. Modal se abre directamente en paso de código con timer restaurado
9. Usuario ingresa código → ✅ Teléfono cambiado
10. localStorage se limpia
11. Botón vuelve a "Cambiar"

### Escenario 3: Código Expira
1. Usuario solicita cambio
2. Cierra modal
3. Espera a que expire (10 minutos)
4. **localStorage se limpia automáticamente**
5. **Botón "Completar cambio" desaparece**
6. **Botón "Cambiar" vuelve a aparecer**
7. Puede iniciar nuevo cambio

### Escenario 4: Usuario Intenta Cambiar Mientras Hay Uno Pendiente
1. Usuario tiene cambio pendiente
2. Botón muestra "Completar cambio (5:30)"
3. Usuario hace clic en "Cambiar" (si aparece) → **BLOQUEADO**
4. Muestra mensaje: "Debes completar el cambio pendiente primero"
5. O simplemente no muestra el botón "Cambiar" (desaparece)

### Escenario 5: Recarga de Página
1. Usuario tiene cambio pendiente
2. Recarga página (F5)
3. **localStorage se lee al cargar**
4. **Botón muestra "Completar cambio (X:XX)"** con tiempo correcto
5. Timer continúa desde donde quedó

---

## 🎯 COMPORTAMIENTO DE BOTONES

### En Perfil (src/app/profile/page.tsx)

**Estado 1: Sin cambio pendiente**
```
[Cambiar]  ← Botón visible, habilitado
```

**Estado 2: Con cambio pendiente**
```
[Completar cambio (9:45)]  ← Botón visible, actualiza cada segundo
```

**Estado 3: Cambio completado**
```
[Cambiar]  ← Botón visible, habilitado
```

### En Modal (src/components/PhoneChangeModal.tsx)

**Paso 1: Ingreso de teléfono**
- Botón "Continuar" (habilitado si hay teléfono válido)
- Botón "X" para cerrar (pero cambio queda pendiente)

**Paso 2: Confirmación**
- Botón "Atrás" (vuelve a paso 1)
- Botón "Sí, Confirmar" (envía código)
- Botón "X" para cerrar (pero cambio queda pendiente)

**Paso 3: Verificación de código**
- **NO hay botón "Cancelar"** ❌
- Botón "X" para cerrar (pero cambio queda pendiente)
- Botón "Verificar" (verifica código)
- Botón "Reenviar código" (solo si timer expiró)

**Paso 4: Éxito**
- Cierra automáticamente después de 2 segundos

---

## 📦 IMPLEMENTACIÓN TÉCNICA

### FASE 1: Verificación en Servidor ✅ (YA IMPLEMENTADA)
- El endpoint `send-verification-code` ya verifica código activo
- Funciona con `isPhoneChange=true` y `userId`
- Retorna `hasActiveCode`, `expiresIn`, `expiresAt`

### FASE 2: Persistencia en localStorage
**Archivo:** `src/components/PhoneChangeModal.tsx`

**Clave localStorage:**
```typescript
`phone_change_verification_${nuevo_telefono_sin_caracteres_especiales}`
```

**Estructura:**
```json
{
  "expiresAt": "2025-01-23T15:30:00.000Z",
  "phone": "+59170123456",
  "savedAt": "2025-01-23T15:20:00.000Z"
}
```

**Funciones a agregar:**
- `getPhoneChangeStorageKey(phone: string)`
- `savePhoneChangeToStorage(phone: string, expiresAt: Date)`
- `loadPhoneChangeFromStorage(phone: string)`
- `clearPhoneChangeFromStorage(phone: string)`
- `calculateTimeRemaining(expiresAt: string)`

**Cuándo guardar:**
- Al recibir `success: true` de `initiatePhoneChange()`
- Si `hasActiveCode: true`, también guardar con `expiresAt` recibido

**Cuándo restaurar:**
- Al abrir modal (`useEffect` cuando `isOpen` cambia a `true`)
- Si hay código pendiente en localStorage, restaurar `step`, `countdown`, `pendingPhone`

**Cuándo limpiar:**
- Al verificar código exitosamente (`verifyPhoneChange` success)
- Al expirar el timer (cuando `countdown` llega a 0)
- Al cancelar cambio (pero NO hay botón cancelar, solo expiración)

### FASE 3: Botón Dinámico en Perfil
**Archivo:** `src/app/profile/page.tsx`

**Estado nuevo:**
```typescript
const [phoneChangePending, setPhoneChangePending] = useState<{
  phone: string;
  timeRemaining: number;
  expiresAt: string;
} | null>(null);
```

**Función para verificar cambio pendiente:**
```typescript
const checkPendingPhoneChange = useCallback(() => {
  // Leer de localStorage
  // Verificar si hay cambio pendiente para el usuario actual
  // Calcular tiempo restante
  // Actualizar estado
}, [user]);
```

**useEffect:**
- Al cargar componente
- Cuando `user?.telefono_pendiente` cambia
- Interval para actualizar tiempo cada segundo

**Renderizado condicional:**
```typescript
{phoneChangePending ? (
  <button onClick={handleOpenPhoneChangeModal}>
    Completar cambio ({formatTime(phoneChangePending.timeRemaining)})
  </button>
) : (
  <button onClick={handleOpenPhoneModal}>
    Cambiar
  </button>
)}
```

**Bloqueo:**
- Si `phoneChangePending` existe, NO mostrar botón "Cambiar"
- Solo mostrar "Completar cambio"

### FASE 4: Integración y Tests
- Verificar flujo completo
- Tests de edge cases
- Documentación

---

## 🚫 RESTRICCIONES Y VALIDACIONES

### 1. Bloqueo de Múltiples Cambios
**En `handleOpenPhoneModal`:**
```typescript
if (phoneChangePending) {
  showToastMessage('⏳ Debes completar el cambio pendiente primero');
  return;
}
```

**En `PhoneChangeModal` (paso 1):**
```typescript
// Verificar si hay cambio pendiente antes de permitir nuevo cambio
if (user?.telefono_pendiente && user.telefono_pendiente !== newPhone) {
  setError('Tienes un cambio pendiente. Debes completarlo primero.');
  return;
}
```

### 2. Sin Botón Cancelar
- ❌ Eliminar botón "Cancelar" del paso de verificación
- ✅ Solo botón "X" para cerrar modal
- ✅ El cambio queda pendiente si cierra
- ✅ Solo se cancela si expira (10 minutos)

### 3. Limpieza Automática
- Cuando `countdown` llega a 0 → Limpiar localStorage
- Cuando se verifica exitosamente → Limpiar localStorage
- Al cargar página, verificar si expiró → Limpiar si es necesario

---

## 📝 CAMBIOS EN ARCHIVOS

### 1. `src/components/PhoneChangeModal.tsx`
- ✅ Agregar funciones de localStorage
- ✅ Restaurar estado al abrir modal
- ✅ Guardar estado al enviar código
- ✅ Limpiar estado al verificar o expirar
- ❌ Eliminar botón "Cancelar" del paso de verificación
- ✅ Mantener solo botón "X" para cerrar

### 2. `src/app/profile/page.tsx`
- ✅ Agregar estado `phoneChangePending`
- ✅ Agregar función `checkPendingPhoneChange`
- ✅ Agregar useEffect para verificar y actualizar
- ✅ Renderizado condicional de botón
- ✅ Bloqueo si hay cambio pendiente

### 3. `src/contexts/SupabaseContext.tsx`
- ✅ Verificar que `initiatePhoneChange` retorne `hasActiveCode`, `expiresIn`, `expiresAt`
- ✅ Actualizar tipos si es necesario

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### FASE 2: localStorage
- [ ] Agregar funciones de localStorage en `PhoneChangeModal`
- [ ] Guardar al enviar código
- [ ] Restaurar al abrir modal
- [ ] Limpiar al verificar o expirar
- [ ] Calcular tiempo restante correctamente

### FASE 3: Botón Dinámico
- [ ] Agregar estado `phoneChangePending` en perfil
- [ ] Agregar función `checkPendingPhoneChange`
- [ ] Agregar useEffect para verificar y actualizar
- [ ] Renderizado condicional de botón
- [ ] Bloqueo si hay cambio pendiente

### FASE 4: Integración
- [ ] Eliminar botón "Cancelar" del modal
- [ ] Verificar flujo completo
- [ ] Tests de edge cases
- [ ] Documentación

---

## 🐛 PROBLEMA CONOCIDO

- ⚠️ **El código no llega al nuevo número actualmente**
- ✅ Se solucionará después de la implementación (o antes si es necesario)
- 🔍 Revisar endpoint `send-verification-code` con `isPhoneChange=true`

---

## 📊 RESUMEN FINAL

### Comportamiento del Botón en Perfil:
- **Sin cambio pendiente:** Muestra "Cambiar" (habilitado)
- **Con cambio pendiente:** Muestra "Completar cambio (X:XX)" (actualiza cada segundo)
- **Cambio completado:** Muestra "Cambiar" (habilitado)

### Comportamiento del Modal:
- **Paso 1-2:** Puede cerrar con "X" (cambio queda pendiente)
- **Paso 3:** NO hay botón "Cancelar", solo "X" (cambio queda pendiente)
- **Paso 4:** Cierra automáticamente

### Bloqueos:
- ❌ No puede iniciar nuevo cambio si hay uno pendiente
- ✅ Debe completar primero o esperar a que expire

---

**✅ FLUJO CONFIRMADO - LISTO PARA IMPLEMENTAR**

