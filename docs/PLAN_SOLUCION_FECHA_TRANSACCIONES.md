# 📋 Plan de Solución: Problema de Fecha en Transacciones

**Fecha:** 24 de noviembre de 2025  
**Problema identificado:** Transacciones aparecen con fecha incorrecta (1 día adelantado)

---

## 🔍 Análisis del Problema

### Formato que devuelve Supabase:
```
fecha_raw: '2025-11-26T00:38:22+00:00'
fecha_type: 'string'
fecha_has_Z: false
fecha_has_offset: true (+00:00 = UTC)
```

### Situación Real:
- **Usuario crea:** 24/11/2025 20:38 (Bolivia, UTC-4)
- **Debería guardarse como:** 25/11/2025 00:38 UTC
- **Supabase devuelve:** 26/11/2025 00:38 UTC ⚠️ (1 día extra)
- **Se muestra como:** 25/11/2025 20:38 ⚠️ (día incorrecto)

### Problema Identificado:
1. **Guardado:** Puede haber un problema al guardar (hay 1 día extra de diferencia)
2. **Lectura:** `new Date('2025-11-26T00:38:22+00:00')` debería interpretar correctamente como UTC
3. **Agrupamiento:** `Intl.DateTimeFormat` con `timeZone: 'America/La_Paz'` debería convertir correctamente, pero puede haber un problema en cómo se extrae el día

---

## 💡 Opciones de Solución

### **Opción 1: Normalizar formato y asegurar interpretación UTC** ⭐ (Recomendada)

**Descripción:**
- Convertir `+00:00` a `Z` para asegurar interpretación UTC explícita
- Crear Date desde string normalizado
- Usar `Intl.DateTimeFormat` con timeZone del país para extraer día

**Ventajas:**
- Simple y directo
- Asegura interpretación UTC correcta
- Mantiene compatibilidad con código existente

**Desventajas:**
- No resuelve el problema del día extra al guardar (si existe)

**Implementación:**
```typescript
// En history/page.tsx, línea 492
const fechaNormalizada = movement.date.replace('+00:00', 'Z');
const movementDate = new Date(fechaNormalizada);
// Resto del código igual...
```

**Archivos a modificar:**
- `src/app/history/page.tsx` (línea 492)
- `src/contexts/SupabaseContext.tsx` (línea 757 en getTodayMovements)

---

### **Opción 2: Función helper para extraer fecha correcta**

**Descripción:**
- Crear función `extractDateInTimezone(isoString, timeZone)` que:
  1. Normalice el formato ISO (convierte +00:00 a Z)
  2. Cree Date desde string normalizado
  3. Use Intl.DateTimeFormat con timeZone para extraer año/mes/día
  4. Retorne string YYYY-MM-DD

**Ventajas:**
- Reutilizable en múltiples lugares
- Centraliza la lógica de conversión
- Más fácil de mantener y testear

**Desventajas:**
- Requiere crear nueva función
- Más cambios en el código

**Implementación:**
```typescript
// En src/lib/dateUtils.ts
export const extractDateInTimezone = (
  isoString: string,
  timeZone: string
): string => {
  // Normalizar formato: +00:00 -> Z
  const normalized = isoString.replace('+00:00', 'Z').replace(/([+-]\d{2}):(\d{2})$/, (_, h, m) => {
    // Si es +00:00, convertir a Z
    if (h === '00' && m === '00') return 'Z';
    return `${h}:${m}`;
  });
  
  const date = new Date(normalized);
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
- `src/lib/dateUtils.ts` (nueva función)
- `src/app/history/page.tsx` (usar nueva función)
- `src/contexts/SupabaseContext.tsx` (usar nueva función en getTodayMovements)

---

### **Opción 3: Parsear directamente sin crear Date intermedio**

**Descripción:**
- Parsear el string ISO directamente
- Extraer componentes usando regex o split
- Convertir a zona horaria del país usando cálculo manual
- Extraer día correcto

**Ventajas:**
- Evita problemas de interpretación de Date
- Control total sobre la conversión

**Desventajas:**
- Más complejo
- Requiere manejar edge cases (horario de verano, etc.)
- Menos mantenible

**Implementación:**
```typescript
// Parsear ISO string directamente
const parseISODateInTimezone = (isoString: string, timeZone: string): string => {
  // Extraer componentes del ISO string
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}):(\d{2})$/);
  if (!match) {
    // Fallback a método anterior
    return extractDateInTimezone(isoString, timeZone);
  }
  
  const [, year, month, day, hour, minute, second, offsetH, offsetM] = match;
  // ... cálculo manual de conversión de zona horaria
  // (complejo, requiere tabla de offsets)
};
```

**Archivos a modificar:**
- `src/lib/dateUtils.ts` (nueva función compleja)
- `src/app/history/page.tsx`
- `src/contexts/SupabaseContext.tsx`

---

### **Opción 4: Verificar y corregir problema de guardado primero**

**Descripción:**
- Investigar por qué hay 1 día extra al guardar
- Verificar logs de `addTransaction` para ver qué fecha se está enviando
- Corregir el problema de guardado primero
- Luego verificar si el problema de lectura persiste

**Ventajas:**
- Resuelve el problema desde la raíz
- Puede que el problema de lectura sea solo consecuencia del guardado incorrecto

**Desventajas:**
- Requiere más investigación
- Puede haber múltiples problemas (guardado + lectura)

**Implementación:**
1. Agregar logs detallados en `addTransaction` para ver fecha enviada
2. Verificar qué se guarda realmente en Supabase
3. Comparar fecha enviada vs fecha guardada
4. Corregir problema de guardado
5. Verificar si problema de lectura se resuelve automáticamente

---

## 🎯 Recomendación

**Opción 1 + Opción 4 (Combinada):**

1. **Primero:** Verificar y corregir problema de guardado (Opción 4)
   - Agregar logs detallados
   - Verificar qué fecha se envía vs qué se guarda
   - Corregir si hay problema

2. **Segundo:** Normalizar formato al leer (Opción 1)
   - Convertir `+00:00` a `Z` para asegurar interpretación UTC
   - Esto asegura que `new Date()` interprete correctamente

3. **Opcional:** Si el problema persiste, implementar Opción 2 (función helper)
   - Centralizar lógica de conversión
   - Hacer código más mantenible

---

## 📝 Plan de Implementación

### Fase 1: Diagnóstico (Ahora)
- ✅ Verificar formato que devuelve Supabase (COMPLETADO)
- ⏳ Verificar qué fecha se envía al guardar
- ⏳ Comparar fecha enviada vs fecha guardada

### Fase 2: Corrección de Guardado (Si es necesario)
- Verificar logs de `addTransaction`
- Corregir problema de guardado si existe

### Fase 3: Corrección de Lectura
- Implementar normalización de formato (`+00:00` → `Z`)
- Verificar que `Intl.DateTimeFormat` funcione correctamente
- Probar con transacciones reales

### Fase 4: Testing
- Probar transacción a las 20:00 (debe mostrar día correcto)
- Probar transacción a las 23:59 (debe mostrar día correcto)
- Probar transacción a las 00:01 (debe mostrar día siguiente correcto)
- Verificar en historial que se agrupen correctamente

---

## ⚠️ Notas Importantes

1. **El formato `+00:00` es válido ISO 8601** y debería interpretarse como UTC, pero algunos navegadores pueden tener problemas
2. **Convertir a `Z` es más seguro** y garantiza interpretación UTC en todos los navegadores
3. **El problema del día extra** (26 en lugar de 25) sugiere que puede haber un problema en el guardado también
4. **Intl.DateTimeFormat es confiable** para conversión de zonas horarias, pero necesita que el Date se cree correctamente primero

---

**Última actualización:** 24 de noviembre de 2025

