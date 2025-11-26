# Análisis: Problema con Barra del Plan Smart

**Fecha:** 2025-01-XX  
**Usuario:** +591 76990076  
**Problema:** No aparece la barra del plan Smart pese a estar en 'pro' y nunca haber ganado Smart antes

---

## 🔍 Problema Identificado

### Condición Actual (Línea 852 de `src/app/profile/page.tsx`):
```typescript
{((['free', 'smart', 'caducado'] as const).includes(userSubscription) && user?.referidos_verificados !== undefined) && (
```

**Problema:** Esta condición **excluye a usuarios en 'pro'**, pero según el usuario:
- Un usuario en 'pro' **debería poder ver la barra** si nunca ha ganado Smart antes
- El plan Smart solo se puede ganar **una sola vez** al referir 5 personas
- Si un usuario pasó directamente de 'free' a 'pro' sin ganar Smart, debería poder ganarlo

---

## 📋 Verificaciones Necesarias

### 1. Campo `ha_ganado_smart` en Base de Datos
- ✅ Existe en la tabla `usuarios` (según usuario)
- ❌ **NO está en la interfaz `User`** de `SupabaseContext.tsx`
- ❌ **NO se está usando** en la lógica de visualización

### 2. Lógica de Visualización de la Barra
- ❌ **Solo muestra para:** `['free', 'smart', 'caducado']`
- ❌ **NO muestra para:** `'pro'`
- ✅ **Debería mostrar para:** `'pro'` si `ha_ganado_smart === false`

### 3. Lógica de Activación del Smart
- ❌ **NO se encontró función** `checkAndActivateSmartPlan`
- ❌ **NO hay lógica** que active Smart cuando `referidos_verificados >= 5`
- ⚠️ **FALTA IMPLEMENTAR:** Activación automática cuando se llegan a 5 referidos

---

## 🎯 Solución Propuesta

### Cambio 1: Agregar `ha_ganado_smart` a la interfaz `User`
**Archivo:** `src/contexts/SupabaseContext.tsx`
```typescript
interface User {
  // ... campos existentes
  ha_ganado_smart?: boolean; // Si ya ganó el plan Smart una vez
  referidos_verificados?: number; // Ya existe pero verificar que se carga
}
```

### Cambio 2: Modificar condición para mostrar barra
**Archivo:** `src/app/profile/page.tsx` (Línea 852)

**Condición actual:**
```typescript
{((['free', 'smart', 'caducado'] as const).includes(userSubscription) && user?.referidos_verificados !== undefined) && (
```

**Condición propuesta:**
```typescript
{(
  (
    (['free', 'smart', 'caducado'] as const).includes(userSubscription) ||
    (userSubscription === 'pro' && user?.ha_ganado_smart === false)
  ) &&
  user?.referidos_verificados !== undefined
) && (
```

**Lógica:**
- Mostrar si está en `['free', 'smart', 'caducado']` **O**
- Mostrar si está en `'pro'` **Y** `ha_ganado_smart === false` (nunca ganó Smart)

### Cambio 3: Cargar `ha_ganado_smart` y `referidos_verificados` en `fetchUserData`
**Archivo:** `src/contexts/SupabaseContext.tsx`
- Verificar que `fetchUserData` carga estos campos desde Supabase

### Cambio 4: Implementar activación automática del Smart (FUTURO)
**Archivo:** `src/contexts/SupabaseContext.tsx` o `src/app/api/whatsapp/verify-code/route.ts`
- Cuando `referidos_verificados >= 5` **Y** `ha_ganado_smart === false`:
  - Actualizar `suscripcion = 'smart'` (si está en 'free' o 'caducado')
  - Actualizar `ha_ganado_smart = true`
  - Actualizar `fecha_expiracion_suscripcion` (14 días desde ahora)

---

## ✅ Checklist de Verificación

Antes de implementar, verificar en Supabase:

- [ ] ¿El usuario `+591 76990076` tiene `ha_ganado_smart = false` o `null`?
- [ ] ¿El usuario tiene `referidos_verificados` con algún valor?
- [ ] ¿El usuario tiene `suscripcion = 'pro'`?
- [ ] ¿Existe el campo `ha_ganado_smart` en la tabla `usuarios`?
- [ ] ¿Qué valor tiene `ha_ganado_smart` para este usuario?

---

## 🚀 Plan de Implementación

### Fase 1: Verificación (AHORA)
1. Verificar datos del usuario en Supabase
2. Confirmar que `ha_ganado_smart` existe y tiene el valor correcto

### Fase 2: Corrección de Visualización
1. Agregar `ha_ganado_smart` a interfaz `User`
2. Modificar condición para mostrar barra también a usuarios en 'pro' si `ha_ganado_smart === false`
3. Verificar que `fetchUserData` carga estos campos

### Fase 3: Implementar Activación Automática (FUTURO)
1. Crear función `checkAndActivateSmartPlan`
2. Llamarla cuando `referidos_verificados` se actualiza
3. Actualizar `suscripcion` y `ha_ganado_smart` cuando se llegan a 5 referidos

---

## 📝 Notas

- El plan Smart solo se puede ganar **una sola vez** por usuario
- Un usuario en 'pro' puede ganar Smart si nunca lo ganó antes
- La barra debe mostrarse mientras `ha_ganado_smart === false` y `referidos_verificados < 5`

