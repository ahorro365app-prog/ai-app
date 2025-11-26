# 💡 Soluciones para Problema de Fecha Considerando País del Usuario

**Fecha:** 24 de noviembre de 2025  
**Contexto:** Cada usuario tiene configurado su país, y las fechas deben interpretarse según la zona horaria de ese país.

---

## 🔍 Situación Actual

### Configuración del País:
- **Campo en usuario:** `user.pais` (código de 2 letras: 'BO', 'AR', 'MX', etc.)
- **Función existente:** `getTimezoneForCountry(countryCode)` en `dateUtils.ts`
- **Zona horaria por defecto:** `America/La_Paz` (Bolivia) si no hay país

### Formato que devuelve Supabase:
```
fecha_raw: '2025-11-26T00:38:22+00:00'
- Es UTC con offset +00:00
- No tiene 'Z' explícito
- Necesita convertirse a zona horaria del país del usuario
```

### Problema Identificado:
- **Hora se respeta correctamente:** 20:35 → 20:35 ✅
- **Fecha está incorrecta:** Aparece día siguiente ❌
- **Causa:** `new Date('2025-11-26T00:38:22+00:00')` puede interpretarse incorrectamente
- **Resultado:** Al agrupar por fecha, se extrae el día incorrecto aunque la hora se muestra bien
- **Ejemplo:** Transacción a las 20:35 del 24/11 aparece como 20:35 del 25/11

---

## 💡 Soluciones Propuestas

### **Solución 1: Función Helper Centralizada con País del Usuario** ⭐ (Recomendada)

**Descripción:**
Crear función `extractDateInUserTimezone(isoString, userCountryCode)` que:
1. Normalice formato ISO (convierte `+00:00` → `Z` para asegurar UTC)
2. Cree Date desde string normalizado
3. Use `getTimezoneForCountry()` para obtener timezone del país
4. Use `Intl.DateTimeFormat` con timezone del país para extraer día
5. Retorne string `YYYY-MM-DD` en zona horaria del país

**Ventajas:**
- ✅ Respeta configuración del país del usuario
- ✅ Reutilizable en múltiples lugares
- ✅ Centraliza lógica de conversión
- ✅ Usa funciones existentes (`getTimezoneForCountry`)
- ✅ Fácil de mantener y testear
- ✅ Normaliza formato de Supabase automáticamente

**Desventajas:**
- Requiere crear nueva función
- Requiere actualizar lugares donde se usa

**Implementación:**
```typescript
// En src/lib/dateUtils.ts
export const extractDateInUserTimezone = (
  isoString: string,
  userCountryCode?: string
): string => {
  // 1. Normalizar formato: +00:00 -> Z (asegurar interpretación UTC)
  // También manejar otros formatos de offset
  let normalized = isoString;
  if (normalized.includes('+00:00')) {
    normalized = normalized.replace('+00:00', 'Z');
  } else if (normalized.match(/[+-]\d{2}:\d{2}$/)) {
    // Si tiene otro offset, mantenerlo (ya está explícito)
    // Pero asegurar que se interprete como UTC si es +00:00
  }
  
  // 2. Crear Date desde string normalizado (ahora es UTC explícito)
  // Esto asegura que JavaScript interprete correctamente como UTC
  const date = new Date(normalized);
  
  // 3. Verificar que la fecha se creó correctamente
  if (isNaN(date.getTime())) {
    logger.error('❌ Error al parsear fecha:', isoString);
    // Fallback: intentar sin normalizar
    return new Date(isoString).toISOString().split('T')[0];
  }
  
  // 4. Obtener timezone del país usando función existente
  const timeZone = getTimezoneForCountry(userCountryCode);
  
  // 5. Extraer día en zona horaria del país usando Intl.DateTimeFormat
  // Esto es crítico: Intl.DateTimeFormat convierte correctamente la hora
  // y extrae el día en la zona horaria especificada
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  
  return `${year}-${month}-${day}`;
};
```

**Archivos a modificar:**
- `src/lib/dateUtils.ts` (agregar función)
- `src/app/history/page.tsx` (usar en `groupedByDate`)
- `src/contexts/SupabaseContext.tsx` (usar en `getTodayMovements`)

**Lugares donde se usa:**
- `history/page.tsx` línea 492: `new Date(movement.date)` → usar función
- `history/page.tsx` línea 477-490: mapeo de país a timezone → usar `getTimezoneForCountry()`
- `contexts/SupabaseContext.tsx` línea 757: `new Date(movement.fecha)` → usar función
- `contexts/SupabaseContext.tsx` línea 910-921: mapeo de país a timezone → usar `getTimezoneForCountry()`

---

### **Solución 2: Normalizar Formato y Usar Función Existente**

**Descripción:**
- Normalizar formato al leer (`+00:00` → `Z`)
- Usar `getTimezoneForCountry()` existente en lugar de mapeo manual
- Mantener lógica de `Intl.DateTimeFormat` pero asegurar Date correcto

**Ventajas:**
- ✅ Menos cambios (solo normalización + usar función existente)
- ✅ Respeta país del usuario
- ✅ Elimina código duplicado (mapeo de país a timezone)

**Desventajas:**
- No centraliza completamente la lógica
- Sigue teniendo lógica de extracción de fecha en múltiples lugares

**Implementación:**
```typescript
// En history/page.tsx, línea 492
const fechaNormalizada = movement.date.replace('+00:00', 'Z');
const movementDate = new Date(fechaNormalizada);

// Usar función existente en lugar de mapeo manual
const timeZone = getTimezoneForCountry(userCountry);
// Resto igual...
```

**Archivos a modificar:**
- `src/app/history/page.tsx` (normalizar + usar `getTimezoneForCountry`)
- `src/contexts/SupabaseContext.tsx` (normalizar + usar `getTimezoneForCountry`)

---

### **Solución 3: Helper para Obtener Timezone del País (Eliminar Duplicación)**

**Descripción:**
- Crear función helper `getUserTimezone(userCountry)` que use `getTimezoneForCountry()`
- Normalizar formato al leer
- Mantener lógica de extracción de fecha pero centralizar obtención de timezone

**Ventajas:**
- ✅ Elimina código duplicado (mapeo país→timezone en múltiples lugares)
- ✅ Respeta país del usuario
- ✅ Cambios mínimos

**Desventajas:**
- No centraliza completamente la lógica de extracción de fecha
- Sigue teniendo lógica repetida

**Implementación:**
```typescript
// En src/lib/dateUtils.ts
export const getUserTimezone = (userCountry?: string): string => {
  return getTimezoneForCountry(userCountry);
};

// En history/page.tsx
import { getUserTimezone } from '@/lib/dateUtils';

const fechaNormalizada = movement.date.replace('+00:00', 'Z');
const movementDate = new Date(fechaNormalizada);
const timeZone = getUserTimezone(userCountry);
// Resto igual...
```

**Archivos a modificar:**
- `src/lib/dateUtils.ts` (agregar función wrapper)
- `src/app/history/page.tsx` (usar función + normalizar)
- `src/contexts/SupabaseContext.tsx` (usar función + normalizar)
- `src/app/dashboard/page.tsx` (usar función en lugar de mapeo manual)

---

### **Solución 4: Función Completa de Conversión con Cache**

**Descripción:**
- Crear función completa que:
  1. Normalice formato
  2. Convierta a zona horaria del país
  3. Extraiga componentes (año, mes, día, hora, minuto)
  4. Cache resultados para mejor performance

**Ventajas:**
- ✅ Muy completa y reutilizable
- ✅ Performance optimizada con cache
- ✅ Respeta país del usuario
- ✅ Centraliza toda la lógica

**Desventajas:**
- Más compleja
- Requiere manejar cache
- Puede ser overkill para este caso

**Implementación:**
```typescript
// En src/lib/dateUtils.ts
const dateCache = new Map<string, string>();

export const convertDateToUserTimezone = (
  isoString: string,
  userCountryCode?: string,
  format: 'date' | 'datetime' = 'date'
): string => {
  const cacheKey = `${isoString}-${userCountryCode}-${format}`;
  if (dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey)!;
  }
  
  const normalized = isoString.replace('+00:00', 'Z');
  const date = new Date(normalized);
  const timeZone = getTimezoneForCountry(userCountryCode);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(format === 'datetime' && {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  });
  
  const parts = formatter.formatToParts(date);
  // ... construir resultado
  
  dateCache.set(cacheKey, result);
  return result;
};
```

---

## 🎯 Recomendación Final

### **Solución 1: Función Helper Centralizada** ⭐

**Razones:**
1. ✅ Respeta completamente la configuración del país del usuario
2. ✅ Centraliza toda la lógica de conversión
3. ✅ Reutilizable en múltiples lugares
4. ✅ Usa funciones existentes (`getTimezoneForCountry`)
5. ✅ Elimina código duplicado (mapeo país→timezone)
6. ✅ Normaliza formato de Supabase automáticamente
7. ✅ Fácil de mantener y testear
8. ✅ Soluciona el problema de raíz

**Plan de Implementación:**

1. **Agregar función en `dateUtils.ts`:**
   ```typescript
   export const extractDateInUserTimezone = (isoString, userCountryCode) => { ... }
   ```

2. **Actualizar `history/page.tsx`:**
   - Línea 477-490: Reemplazar mapeo manual por `getTimezoneForCountry(userCountry)`
   - Línea 492: Reemplazar `new Date(movement.date)` por usar función helper
   - Línea 504-520: Usar función helper en `formatDate`

3. **Actualizar `contexts/SupabaseContext.tsx`:**
   - Línea 910-921: Reemplazar mapeo manual por `getTimezoneForCountry(userCountry)`
   - Línea 757: Reemplazar `new Date(movement.fecha)` por usar función helper

4. **Actualizar `dashboard/page.tsx`:**
   - Línea 211-222: Reemplazar mapeo manual por `getTimezoneForCountry(userCountry)`

5. **Testing:**
   - Probar con usuario de Bolivia (UTC-4)
   - Probar con usuario de Argentina (UTC-3)
   - Probar con usuario de México (UTC-6)
   - Verificar transacciones después de las 20:00 en cada país

---

## 📋 Comparación de Soluciones

| Solución | Respeta País | Centraliza | Reutilizable | Complejidad | Cambios |
|----------|--------------|------------|--------------|-------------|---------|
| **1. Helper Centralizada** | ✅ | ✅ | ✅ | Media | Medios |
| **2. Normalizar + Existente** | ✅ | ⚠️ Parcial | ⚠️ Parcial | Baja | Mínimos |
| **3. Helper Timezone** | ✅ | ⚠️ Parcial | ⚠️ Parcial | Baja | Mínimos |
| **4. Función Completa + Cache** | ✅ | ✅ | ✅ | Alta | Grandes |

---

## ⚠️ Consideraciones Importantes

1. **Formato de Supabase:** `+00:00` es válido ISO 8601, pero convertir a `Z` es más seguro
2. **País del Usuario:** Siempre usar `user?.pais || 'BO'` como fallback
3. **Zona Horaria:** Usar `getTimezoneForCountry()` en lugar de mapeo manual
4. **Intl.DateTimeFormat:** Es confiable, pero necesita Date creado correctamente primero
5. **Performance:** Para muchas transacciones, considerar cache (Solución 4)

---

**Última actualización:** 24 de noviembre de 2025

