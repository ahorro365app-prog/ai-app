# Corrección: Barra del Plan Smart para Usuarios en Pro

**Fecha:** 2025-01-XX  
**Usuario afectado:** +591 76990076  
**Problema:** No aparecía la barra del plan Smart pese a estar en 'pro' y nunca haber ganado Smart

---

## ✅ Cambios Realizados

### 1. Agregar campos a la interfaz `User`
**Archivo:** `src/contexts/SupabaseContext.tsx`
- Agregado `referidos_verificados?: number` - Contador de referidos verificados
- Agregado `ha_ganado_smart?: boolean` - Si ya ganó el plan Smart (solo una vez)

### 2. Modificar condición para mostrar barra
**Archivo:** `src/app/profile/page.tsx` (Línea 852)

**Antes:**
```typescript
{((['free', 'smart', 'caducado'] as const).includes(userSubscription) && user?.referidos_verificados !== undefined) && (
```

**Después:**
```typescript
{(
  (
    (['free', 'smart', 'caducado'] as const).includes(userSubscription) ||
    (userSubscription === 'pro' && (user as any)?.ha_ganado_smart === false)
  ) &&
  user?.referidos_verificados !== undefined
) && (
```

**Lógica:**
- Muestra la barra si está en `['free', 'smart', 'caducado']` **O**
- Muestra la barra si está en `'pro'` **Y** `ha_ganado_smart === false` (nunca ganó Smart)

### 3. Verificación de carga de datos
- ✅ `fetchUserData` usa `.select('*')` - Carga todos los campos incluyendo `referidos_verificados` y `ha_ganado_smart`
- ✅ `signInWithPhone` carga usuario completo desde Supabase

---

## 🧪 Pruebas a Realizar

### Test 1: Usuario en Pro que nunca ganó Smart
1. Iniciar sesión con usuario en 'pro' y `ha_ganado_smart = false`
2. Verificar que aparece la barra del plan Smart
3. Verificar que muestra "0/5" referidos verificados
4. Verificar que muestra "5 más para ganar 14 días Smart"

### Test 2: Usuario en Pro que ya ganó Smart
1. Iniciar sesión con usuario en 'pro' y `ha_ganado_smart = true`
2. Verificar que **NO** aparece la barra del plan Smart

### Test 3: Usuario en Free/Smart/Caducado
1. Iniciar sesión con usuario en 'free', 'smart' o 'caducado'
2. Verificar que aparece la barra del plan Smart (comportamiento anterior mantenido)

---

## 📝 Notas

- El plan Smart solo se puede ganar **una sola vez** por usuario
- Un usuario en 'pro' puede ganar Smart si nunca lo ganó antes (`ha_ganado_smart === false`)
- La barra se muestra mientras `ha_ganado_smart === false` y `referidos_verificados < 5`
- Cuando `referidos_verificados >= 5` y `ha_ganado_smart === false`, se debe activar Smart (pendiente implementar)

---

## 🚀 Próximos Pasos

1. **Probar que la barra aparece** para el usuario en 'pro' con `ha_ganado_smart = false`
2. **Implementar activación automática** del Smart cuando se llegan a 5 referidos (FUTURO)

