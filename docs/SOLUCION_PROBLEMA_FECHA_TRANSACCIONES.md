# Solución: Problema de Fecha en Transacciones Después de las 9 PM

**Fecha de creación:** 19 de noviembre de 2025  
**Estado:** Implementado - Pendiente de pruebas en producción  
**Prioridad:** Alta

---

## 📋 Descripción del Problema

### Síntoma
Las transacciones creadas después de las 9 PM (hora de Bolivia, UTC-4) se guardaban y mostraban como si fueran del día siguiente en lugar del día actual.

### Ejemplo del Problema
- **Usuario crea transacción:** Martes 18 de noviembre, 23:37 (hora Bolivia)
- **Se guarda como:** Miércoles 19 de noviembre
- **Se muestra como:** Miércoles 19 de noviembre

### Impacto
- Los usuarios no podían registrar transacciones correctamente después de las 9 PM
- Los reportes diarios mostraban transacciones en días incorrectos
- Pérdida de confianza en la precisión de los datos

---

## 🔍 Causa Raíz Identificada

El problema tenía múltiples causas relacionadas con el manejo de zonas horarias:

### 1. **Conversión a UTC sin offset explícito**
- Cuando se creaba una fecha con `toISOString()`, JavaScript la convertía a UTC
- Ejemplo: `2025-11-18T23:37:00` (hora local) → `2025-11-19T03:37:00Z` (UTC)
- Supabase guardaba la fecha en UTC, perdiendo el contexto de la zona horaria original

### 2. **Extracción de fecha incorrecta al leer**
- En `history/page.tsx`, se usaba `getDate()`, `getMonth()`, `getFullYear()`
- Estos métodos usan la zona horaria del navegador, no la del país del usuario
- Una fecha guardada como `2025-11-19T03:37:00Z` (UTC) se interpretaba como día 19 en lugar de día 18

### 3. **Cálculo de offset dinámico poco confiable**
- El cálculo dinámico del offset de zona horaria podía fallar en ciertos casos
- No había una tabla fija de offsets conocidos

---

## ✅ Soluciones Implementadas

### 1. **Función `buildISODateForCountry()` con offset explícito**

**Archivo:** `src/lib/dateUtils.ts`

**Cambio:**
- Ahora devuelve fechas con offset explícito: `2025-11-18T23:37:00-04:00`
- Usa una tabla fija de offsets conocidos para mayor confiabilidad
- Ejemplo para Bolivia: siempre usa `-04:00`

**Código clave:**
```typescript
export const buildISODateForCountry = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  countryCode?: string
): string => {
  const timeZone = getTimezoneForCountry(countryCode);
  const offsetStr = getTimezoneOffset(timeZone); // Tabla fija de offsets
  
  // Construir fecha ISO con offset explícito
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}${offsetStr}`;
};
```

### 2. **Tabla de offsets conocidos**

**Archivo:** `src/lib/dateUtils.ts`

**Cambio:**
- Tabla fija de offsets para cada zona horaria
- Evita errores de cálculo dinámico
- Incluye offsets para todos los países soportados

**Código clave:**
```typescript
const timezoneOffsets: Record<string, string> = {
  'America/La_Paz': '-04:00',           // Bolivia: UTC-4
  'America/Argentina/Buenos_Aires': '-03:00',
  'America/Sao_Paulo': '-03:00',
  'America/Santiago': '-03:00',
  'America/Bogota': '-05:00',
  'America/Guayaquil': '-05:00',
  'America/Lima': '-05:00',
  // ... más países
};
```

### 3. **Detección de offset en `addTransaction()`**

**Archivo:** `src/contexts/SupabaseContext.tsx`

**Cambio:**
- Verifica si la fecha ya tiene offset explícito
- Si tiene offset, la usa directamente sin reformatear
- Si no tiene offset, lo agrega usando el mismo método

**Código clave:**
```typescript
// Si la fecha ya tiene offset explícito (contiene + o - antes de los últimos 6 caracteres)
const hasOffset = /[+-]\d{2}:\d{2}$/.test(transaction.fecha);

if (!hasOffset) {
  // Agregar offset explícito
  // ...
} else {
  // La fecha ya tiene offset, usarla directamente
  logger.debug('✅ Fecha ya tiene offset explícito, usando directamente:', fechaFormateada);
}
```

### 4. **Extracción de fecha con zona horaria del país**

**Archivo:** `src/app/history/page.tsx`

**Cambio:**
- Reemplazó `getDate()`, `getMonth()`, `getFullYear()` (que usan zona horaria del navegador)
- Ahora usa `Intl.DateTimeFormat` con la zona horaria del país del usuario
- Extrae el día correcto en la zona horaria de Bolivia

**Código clave:**
```typescript
const groupedByDate = filteredTransactions.reduce((acc, movement) => {
  const userCountry = user?.pais || 'BO';
  const timeZone = userCountry === 'BO' ? 'America/La_Paz' : /* ... */;
  
  const movementDate = new Date(movement.date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(movementDate);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const dateStr = `${year}-${month}-${day}`;
  // ...
}, {});
```

### 5. **Modo Debug (Eliminado)**

**Nota:** Se implementó inicialmente un modo debug para simular horas específicas, pero fue eliminado para mantener el código más limpio. Las pruebas se realizarán con la hora real del sistema.

---

## 📁 Archivos Modificados

1. **`src/lib/dateUtils.ts`**
   - Función `getTimezoneOffset()`: Tabla fija de offsets
   - Función `buildISODateForCountry()`: Devuelve fecha con offset explícito

2. **`src/contexts/SupabaseContext.tsx`**
   - Función `addTransaction()`: Detecta y preserva offset explícito

3. **`src/app/history/page.tsx`**
   - Función `groupedByDate`: Extrae fecha usando zona horaria del país

4. **`src/components/TransactionModal.tsx`**
   - Función `handleSave()`: Usa `buildISODateForCountry()` con offset
   - Modo debug para pruebas

5. **`src/components/VoiceTransactionModal.tsx`**
   - Función `handleSave()`: Usa `buildISODateForCountry()` con offset

6. **`src/app/dashboard/page.tsx`**
   - Corrección de hooks de React (problema secundario encontrado)

---

## 🧪 Plan de Pruebas

### Prueba Principal (Pendiente)
**Cuándo:** Mañana después de las 9 PM (hora real de Bolivia)  
**Qué probar:**
1. Crear una transacción después de las 9 PM
2. Verificar en logs del navegador:
   - Debe aparecer: `fechaISO: 2025-11-XXT23:XX:XX-04:00`
   - Debe aparecer: `✅ Fecha ya tiene offset explícito`
3. Verificar en la interfaz:
   - La transacción debe mostrarse con el día correcto (no al día siguiente)
4. Verificar en Supabase:
   - La fecha debe guardarse correctamente
   - Al leerla con zona horaria de Bolivia, debe mostrar el día correcto

### Casos de Prueba Adicionales
- [ ] Transacción a las 20:00 (debe guardarse en día correcto)
- [ ] Transacción a las 21:00 (debe guardarse en día correcto)
- [ ] Transacción a las 22:00 (debe guardarse en día correcto)
- [ ] Transacción a las 23:59 (debe guardarse en día correcto)
- [ ] Transacción a las 00:01 (debe guardarse en día siguiente correcto)
- [ ] Verificar en historial que las transacciones se agrupen por día correcto
- [ ] Verificar en dashboard que "hoy" muestre transacciones correctas

---

## 📊 Flujo Correcto Esperado

```
1. Usuario crea transacción:
   - Fecha seleccionada: 18 de noviembre
   - Hora actual en Bolivia: 23:37

2. buildISODateForCountry() construye:
   - Input: year=2025, month=11, day=18, hour=23, minute=37
   - Output: 2025-11-18T23:37:00-04:00

3. addTransaction() detecta offset:
   - ✅ Fecha ya tiene offset explícito
   - Usa directamente sin reformatear

4. Supabase guarda:
   - Convierte a UTC: 2025-11-19T03:37:00Z
   - Pero preserva el offset original en el string

5. Al leer y mostrar:
   - Usa Intl.DateTimeFormat con timeZone='America/La_Paz'
   - Extrae día: 18 ✅
   - Muestra: "Martes, 18 De Noviembre" ✅
```

---

## ⚠️ Notas Importantes

### Zona Horaria de Bolivia
- Bolivia usa `America/La_Paz` (UTC-4)
- No tiene horario de verano
- El offset es siempre `-04:00`

### Supabase y Timestamps
- Supabase almacena fechas como `TIMESTAMP WITH TIME ZONE`
- Cuando enviamos `2025-11-18T23:37:00-04:00`, Supabase lo convierte a UTC internamente
- Al leer, debemos interpretarlo en la zona horaria del país del usuario

### Compatibilidad
- Los cambios son compatibles con versiones anteriores
- Si una fecha no tiene offset, se agrega automáticamente
- No afecta transacciones ya guardadas (solo nuevas)

---

## 🔄 Reversión (Si es Necesario)

Si por alguna razón necesitas revertir los cambios:

1. **Revertir `src/lib/dateUtils.ts`:**
   - Restaurar función `buildISODateForCountry()` a versión anterior
   - Restaurar función `getTimezoneOffset()` a cálculo dinámico

2. **Revertir `src/contexts/SupabaseContext.tsx`:**
   - Restaurar lógica de `addTransaction()` a versión anterior

3. **Revertir `src/app/history/page.tsx`:**
   - Restaurar `groupedByDate` a usar `getDate()`, `getMonth()`, `getFullYear()`

4. **Revertir componentes:**
   - Restaurar `TransactionModal.tsx` y `VoiceTransactionModal.tsx`

**Nota:** Se recomienda hacer backup antes de revertir.

---

## 📝 Historial de Cambios

### 19 de noviembre de 2025
- ✅ Implementada tabla fija de offsets conocidos
- ✅ Modificada `buildISODateForCountry()` para devolver fecha con offset explícito
- ✅ Modificada `addTransaction()` para detectar y preservar offset
- ✅ Modificada extracción de fecha en `history/page.tsx` para usar zona horaria del país
- ✅ Agregado modo debug para pruebas
- ✅ Corregido problema de hooks de React en `dashboard/page.tsx`

### Pendiente
- ⏳ Pruebas en producción después de las 9 PM
- ⏳ Verificación de casos edge (23:59, 00:01, etc.)

---

## 🎯 Resultado Esperado

Después de implementar estas soluciones:

✅ Las transacciones creadas después de las 9 PM se guardan con el día correcto  
✅ Las transacciones se muestran correctamente agrupadas por día  
✅ Los reportes diarios muestran datos precisos  
✅ No hay más problemas de cambio de día para transacciones tardías  

---

## 📞 Contacto y Soporte

Si encuentras algún problema después de implementar estas soluciones:

1. Revisa los logs del navegador (F12 → Console)
2. Verifica que la fecha tenga offset explícito (`-04:00` para Bolivia)
3. Verifica que se esté usando la zona horaria correcta del país
4. Documenta el problema con capturas de pantalla y logs

---

**Última actualización:** 19 de noviembre de 2025  
**Versión del documento:** 1.0

