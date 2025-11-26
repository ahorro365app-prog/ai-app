# 📍 UBICACIONES EXACTAS DE ERRORES EN LA APP

## 🚨 ERROR CRÍTICO #1: Función `fetchUserData()` no existe

### **Ubicación 1: Perfil del Usuario (Página visible)**
**Ruta en la app:** `/profile`  
**Archivo:** `src/app/profile/page.tsx`  
**Línea:** 38  
**Código exacto:**
```typescript
const { user, updateUser, deleteAllDebts, deleteAllGoals, debts, goals, logout, checkCanChangePhone, fetchUserData } = useSupabase();
```

**Cómo verificar:**
1. Abre la app en `localhost`
2. Ve a la página de **Perfil** (última opción en el menú inferior)
3. Abre la consola del navegador (F12)
4. Verás un error si intentas usar `fetchUserData()` desde esa página

**Impacto visible:**
- El perfil se carga, pero si hay código que intenta usar `fetchUserData()` fallará
- No hay uso directo visible en la UI, pero está importado incorrectamente

---

### **Ubicación 2: Cambio de Teléfono - Verificar Código (Modal)**
**Ruta en la app:** `/profile` → Click en "Cambiar" del teléfono  
**Archivo:** `src/contexts/SupabaseContext.tsx`  
**Línea:** 1684  
**Función:** `verifyPhoneChange()`  
**Código exacto:**
```typescript
// Recargar datos del usuario
await fetchUserData(); // ❌ ERROR: función no existe
```

**Cómo reproducir el error:**
1. Abre la app en `localhost`
2. Ve a **Perfil** → Click en el teléfono (botón "Cambiar")
3. Ingresa un nuevo número de teléfono
4. Confirma el cambio
5. Ingresa el código de verificación
6. **Al verificar el código, la función fallará** porque intenta llamar a `fetchUserData()`

**Síntoma visible:**
- El cambio de teléfono puede no reflejarse correctamente en la UI
- Error en consola del navegador
- El usuario puede quedar en un estado inconsistente

---

### **Ubicación 3: Cambio de Teléfono - Cancelar (Modal)**
**Ruta en la app:** `/profile` → Click en "Cambiar" del teléfono → Botón "Cancelar"  
**Archivo:** `src/contexts/SupabaseContext.tsx`  
**Línea:** 1715  
**Función:** `cancelPhoneChange()`  
**Código exacto:**
```typescript
// Recargar datos del usuario
await fetchUserData(); // ❌ ERROR: función no existe
```

**Cómo reproducir el error:**
1. Abre la app en `localhost`
2. Ve a **Perfil** → Click en el teléfono (botón "Cambiar")
3. Ingresa un nuevo número de teléfono
4. Confirma el cambio
5. **Click en "Cancelar"** antes de verificar
6. **Al cancelar, la función fallará** porque intenta llamar a `fetchUserData()`

**Síntoma visible:**
- Los datos del usuario pueden no refrescarse correctamente
- Error en consola del navegador

---

## ⚠️ ADVERTENCIA #1: Uso de `as any` en Perfil

### **Ubicación: Página de Perfil**
**Ruta en la app:** `/profile`  
**Archivo:** `src/app/profile/page.tsx`  

#### **Error 1: Fecha de expiración**
**Línea:** 714 y 721  
**Código:**
```typescript
{(user as any)?.fecha_expiracion_suscripcion && (
  ...
  {new Date((user as any).fecha_expiracion_suscripcion).toLocaleDateString(...)}
```

**Dónde verlo en la app:**
- En la página de Perfil
- Justo después de la tarjeta de suscripción
- Se muestra un cuadro azul con "Expira el [fecha]"

---

#### **Error 2: Referidos verificados**
**Líneas:** 733, 741, 747, 750, 752, 755  
**Código:**
```typescript
{(user as any)?.referidos_verificados !== undefined && (
  ...
  {(user as any).referidos_verificados || 0}/5
  ...
  style={{ width: `${Math.min(((user as any).referidos_verificados || 0) * 20, 100)}%` }}
  ...
  {(user as any).referidos_verificados < 5 && (
    {5 - ((user as any).referidos_verificados || 0)} más para ganar 14 días Smart
  )}
  {(user as any).referidos_verificados >= 5 && (
    ¡Ya ganaste 14 días Smart! 🎉
  )}
```

**Dónde verlo en la app:**
- En la página de Perfil
- Después de la fecha de expiración
- Se muestra un cuadro verde con "Referidos verificados X/5"
- Incluye una barra de progreso y mensajes

---

#### **Error 3: Actualización de usuario después de cambios**
**Líneas:** 1448, 1482, 1511  
**Código:**
```typescript
await updateUser(updatedUser as any);
```

**Dónde verlo en la app:**
- Cuando se completa un cambio de teléfono
- Cuando se verifica WhatsApp
- En los callbacks de éxito de los modales

---

## 📋 RESUMEN DE RUTAS PARA PROBAR

### Para ver el error crítico:
1. **App:** `http://localhost:3000/profile`
2. **Acción:** Click en "Cambiar" del teléfono
3. **Completar el flujo de cambio** o **cancelar**
4. **Ver consola del navegador (F12)** para ver el error

### Para ver las advertencias:
1. **App:** `http://localhost:3000/profile`
2. **Ver:** Los cuadros de "Expira el..." y "Referidos verificados"
3. **Abrir consola:** No hay errores visibles, pero el código usa `as any`

---

## 🔍 CÓMO VERIFICAR LOS ERRORES

### Error Crítico (fetchUserData):
1. Abre la app en `localhost`
2. Abre la **Consola del Navegador** (F12 → Console)
3. Ve a Perfil → Click en "Cambiar" teléfono
4. Completa o cancela el proceso
5. **Verás un error en consola:** `fetchUserData is not a function`

### Advertencias (as any):
1. Abre la app en `localhost`
2. Ve a Perfil
3. **No hay errores visibles** en la UI
4. **Pero el código no es type-safe**
5. Puedes verificar en el código fuente de la página

---

## 📝 NOTAS IMPORTANTES

- El error crítico **SÍ afecta la funcionalidad** del cambio de teléfono
- Las advertencias **NO rompen la app** pero reducen la seguridad de tipos
- Todos los errores están en:
  - `/profile` (página visible)
  - Modales de cambio de teléfono (funcionalidad)

