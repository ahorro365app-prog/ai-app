# 🔍 Análisis Detallado: Problema de Fecha en Transacciones

**Fecha:** 24 de noviembre de 2025  
**Problema específico:** Hora correcta, fecha incorrecta (día siguiente)

---

## 📋 Situación Reportada

### Comportamiento Actual:
- ✅ **Hora se respeta:** Transacción a las 20:35 → Se muestra como 20:35
- ❌ **Fecha incorrecta:** Transacción del 24/11 → Se muestra como 25/11
- ⚠️ **Resultado:** Transacción a las 20:35 del 24/11 aparece como 20:35 del 25/11

### Formato de Supabase:
```
fecha_raw: '2025-11-26T00:38:22+00:00'
- Es UTC con offset +00:00
- No tiene 'Z' explícito
```

---

## 🔍 Análisis Técnico

### Flujo Actual:

1. **Supabase devuelve:**
   ```
   '2025-11-26T00:38:22+00:00' (UTC)
   ```

2. **Se crea Date:**
   ```javascript
   const movementDate = new Date('2025-11-26T00:38:22+00:00');
   ```
   - ⚠️ **Problema potencial:** Algunos navegadores pueden interpretar `+00:00` incorrectamente
   - Debería interpretarse como UTC, pero puede haber inconsistencias

3. **Se usa Intl.DateTimeFormat:**
   ```javascript
   const formatter = new Intl.DateTimeFormat('en-US', {
     timeZone: 'America/La_Paz', // UTC-4
     year: 'numeric',
     month: '2-digit',
     day: '2-digit',
   });
   const parts = formatter.formatToParts(movementDate);
   ```
   - ✅ **Hora se convierte correctamente:** 00:38 UTC → 20:38 UTC-4 (día anterior)
   - ❌ **Día se extrae incorrectamente:** Extrae día 26 en lugar de día 25

### ¿Por qué la hora es correcta pero el día no?

**Hipótesis 1: Problema en la creación del Date**
- `new Date('2025-11-26T00:38:22+00:00')` puede no interpretarse como UTC en algunos navegadores
- Si se interpreta como hora local del navegador, el día puede cambiar

**Hipótesis 2: Problema en el orden de operaciones**
- `Intl.DateTimeFormat` puede estar extrayendo el día antes de aplicar la conversión de zona horaria
- O el Date se crea con un día incorrecto desde el inicio

**Hipótesis 3: Problema de formato**
- El formato `+00:00` puede no ser reconocido correctamente por todos los navegadores
- Convertir a `Z` es más seguro y universalmente reconocido

---

## 💡 Soluciones Propuestas (Actualizadas)

### **Solución 1A: Normalizar Formato + Verificar Date** ⭐ (Más Segura)

**Descripción:**
1. Normalizar formato: `+00:00` → `Z` (asegurar UTC explícito)
2. Verificar que Date se creó correctamente
3. Usar `Intl.DateTimeFormat` con timezone del país
4. Extraer día correctamente

**Ventajas:**
- ✅ Asegura interpretación UTC correcta
- ✅ Respeta país del usuario
- ✅ Verifica que Date sea válido
- ✅ Soluciona problema de formato

**Implementación:**
```typescript
export const extractDateInUserTimezone = (
  isoString: string,
  userCountryCode?: string
): string => {
  // 1. Normalizar: +00:00 -> Z (más seguro, universalmente reconocido)
  let normalized = isoString;
  if (normalized.endsWith('+00:00')) {
    normalized = normalized.replace('+00:00', 'Z');
  }
  
  // 2. Crear Date (ahora es UTC explícito)
  const date = new Date(normalized);
  
  // 3. Verificar que Date es válido
  if (isNaN(date.getTime())) {
    logger.error('❌ Fecha inválida:', isoString);
    // Fallback: intentar parsear de otra forma
    const fallbackDate = new Date(isoString.replace(/[+-]\d{2}:\d{2}$/, 'Z'));
    if (isNaN(fallbackDate.getTime())) {
      throw new Error(`No se pudo parsear fecha: ${isoString}`);
    }
    return extractDateInUserTimezone(fallbackDate.toISOString(), userCountryCode);
  }
  
  // 4. Obtener timezone del país
  const timeZone = getTimezoneForCountry(userCountryCode);
  
  // 5. Extraer día en zona horaria del país
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

---

### **Solución 1B: Parsear Manualmente el String ISO**

**Descripción:**
- Parsear el string ISO manualmente
- Extraer componentes (año, mes, día, hora, minuto, segundo, offset)
- Convertir a zona horaria del país manualmente
- Extraer día correcto

**Ventajas:**
- ✅ Control total sobre el proceso
- ✅ No depende de interpretación de `new Date()`
- ✅ Evita problemas de formato

**Desventajas:**
- Más complejo
- Requiere manejar edge cases (horario de verano, etc.)

**Implementación:**
```typescript
export const extractDateInUserTimezone = (
  isoString: string,
  userCountryCode?: string
): string => {
  // Parsear ISO string manualmente
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}):(\d{2})$/);
  
  if (!match) {
    // Fallback a método con Date
    return extractDateInUserTimezoneWithDate(isoString, userCountryCode);
  }
  
  const [, year, month, day, hour, minute, second, offsetH, offsetM] = match;
  
  // Convertir a UTC
  const utcDate = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  ));
  
  // Obtener timezone del país
  const timeZone = getTimezoneForCountry(userCountryCode);
  
  // Convertir a zona horaria del país
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(utcDate);
  const resultYear = parts.find(p => p.type === 'year')?.value || '';
  const resultMonth = parts.find(p => p.type === 'month')?.value || '';
  const resultDay = parts.find(p => p.type === 'day')?.value || '';
  
  return `${resultYear}-${resultMonth}-${resultDay}`;
};
```

---

### **Solución 1C: Usar Temporal API (Futuro)**

**Descripción:**
- Usar Temporal API (cuando esté disponible en todos los navegadores)
- Manejo nativo de zonas horarias
- Más preciso y confiable

**Desventajas:**
- ⚠️ Aún no está disponible en todos los navegadores
- Requiere polyfill

---

## 🎯 Recomendación Final

### **Solución 1A: Normalizar Formato + Verificar Date** ⭐

**Razones:**
1. ✅ Soluciona el problema de formato (`+00:00` → `Z`)
2. ✅ Asegura interpretación UTC correcta
3. ✅ Verifica que Date sea válido antes de usar
4. ✅ Respeta país del usuario
5. ✅ Usa funciones existentes
6. ✅ Simple y mantenible

**Plan de Implementación:**

1. **Agregar función en `dateUtils.ts`:**
   ```typescript
   export const extractDateInUserTimezone = (isoString, userCountryCode) => { ... }
   ```

2. **Actualizar `history/page.tsx`:**
   - Línea 492: Reemplazar `new Date(movement.date)` por función helper
   - Línea 477-490: Reemplazar mapeo manual por `getTimezoneForCountry(userCountry)`

3. **Actualizar `contexts/SupabaseContext.tsx`:**
   - Línea 757: Reemplazar `new Date(movement.fecha)` por función helper
   - Línea 910-921: Reemplazar mapeo manual por `getTimezoneForCountry(userCountry)`

4. **Testing:**
   - Probar transacción a las 20:35 del 24/11 (debe mostrar 24/11)
   - Probar transacción a las 23:59 del 24/11 (debe mostrar 24/11)
   - Probar transacción a las 00:01 del 25/11 (debe mostrar 25/11)
   - Verificar que hora se mantiene correcta (20:35 → 20:35)

---

## ⚠️ Consideraciones Importantes

1. **Formato `+00:00` vs `Z`:**
   - Ambos son válidos ISO 8601
   - `Z` es más universalmente reconocido
   - Algunos navegadores antiguos pueden tener problemas con `+00:00`

2. **Verificación de Date:**
   - Siempre verificar que `Date` sea válido con `isNaN(date.getTime())`
   - Tener fallback si el parseo falla

3. **Zona Horaria del País:**
   - Siempre usar `getTimezoneForCountry(userCountryCode)`
   - Fallback a `'BO'` (Bolivia) si no hay país

4. **Intl.DateTimeFormat:**
   - Es confiable para conversión de zonas horarias
   - Pero necesita que el Date se cree correctamente primero

---

**Última actualización:** 24 de noviembre de 2025

