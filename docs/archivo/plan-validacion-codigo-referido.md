# Plan: Validación Automática de Código de Referido

**Fecha:** 2025-01-XX  
**Estado:** 📋 Planificado

---

## 🎯 Objetivos

1. Validar código de referido automáticamente (sin botón)
2. Mostrar primer nombre del referidor si el código es válido
3. Mostrar advertencia si el código es inválido (pero permitir continuar)
4. No bloquear el registro si el código es inválido

---

## 📋 Especificaciones

### 1. Validación Automática
- **Trigger:** Cuando el usuario sale del campo (onBlur) O después de 1.5 segundos sin escribir (debounce)
- **Condición:** Solo validar si el código tiene exactamente 8 caracteres
- **Límite:** No validar si el campo está vacío

### 2. Estados Visuales

#### Estado: Vacío
- Sin feedback visual
- Campo normal (borde gris)

#### Estado: Validando
- **Mensaje:** "⏳ Validando código..."
- **Color:** Gris/azul
- **Borde:** Campo con borde azul
- **Icono:** Spinner o reloj

#### Estado: Válido
- **Mensaje:** "✅ Código válido - Referido por: [Primer nombre]"
- **Color:** Verde
- **Borde:** Campo con borde verde
- **Icono:** Check verde

#### Estado: Inválido
- **Mensaje:** "⚠️ Código no encontrado. Puedes intentar de nuevo o continuar sin código"
- **Color:** Amarillo/naranja
- **Borde:** Campo con borde amarillo/naranja
- **Icono:** Advertencia

#### Estado: Error
- **Mensaje:** "❌ Error al validar. Puedes continuar sin código"
- **Color:** Rojo claro
- **Borde:** Campo con borde rojo claro
- **Icono:** Error

### 3. API Endpoint

**Ruta:** `POST /api/referrals/validate-code`

**Request:**
```json
{
  "code": "ABC12345"
}
```

**Response (válido):**
```json
{
  "valid": true,
  "referidorNombre": "Carlos"
}
```

**Response (inválido):**
```json
{
  "valid": false,
  "message": "Código no encontrado"
}
```

**Response (error):**
```json
{
  "valid": false,
  "error": "Error al validar código"
}
```

### 4. Lógica de Validación

1. **Limpiar validación anterior** cuando el usuario empieza a escribir
2. **Esperar 1.5 segundos** después de que el usuario deje de escribir (debounce)
3. **Validar solo si:**
   - El código tiene exactamente 8 caracteres
   - El campo no está vacío
4. **Buscar usuario** con ese `codigo_referido`
5. **Extraer primer nombre** del campo `nombre` (split por espacio, tomar primer elemento)
6. **Mostrar feedback** según resultado

### 5. UX/UI

#### Campo de Código
- Mantener diseño actual (icono de regalo, placeholder, etc.)
- Agregar estados de borde según validación:
  - Normal: `border-gray-200`
  - Validando: `border-blue-400`
  - Válido: `border-green-500`
  - Inválido: `border-yellow-400` o `border-orange-400`
  - Error: `border-red-300`

#### Mensaje de Feedback
- Aparecer debajo del campo de código
- Tamaño de texto: `text-sm`
- Padding: `mt-1` o `mt-2`
- Icono al inicio del mensaje
- Animación suave al aparecer/desaparecer

#### Comportamiento
- **No bloquear registro:** El botón "Crear Cuenta" siempre está habilitado
- **Limpiar validación:** Si el usuario borra el código, limpiar feedback
- **No validar propio código:** Si el usuario intenta usar su propio código (si ya está logueado), mostrar advertencia

---

## 🔧 Implementación Técnica

### Archivos a Modificar

1. **`src/app/api/referrals/validate-code/route.ts`** (NUEVO)
   - Endpoint para validar código
   - Buscar usuario por `codigo_referido`
   - Retornar primer nombre si existe

2. **`src/app/sign-up/page.tsx`**
   - Agregar estado para validación (`validationState`)
   - Implementar debounce con `useEffect`
   - Agregar función `validateReferralCode`
   - Agregar UI de feedback debajo del campo
   - Agregar clases de borde según estado

### Estados en React

```typescript
type ValidationState = 
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'valid'; referidorNombre: string }
  | { status: 'invalid'; message: string }
  | { status: 'error'; message: string };

const [validationState, setValidationState] = useState<ValidationState>({ status: 'idle' });
```

### Debounce Hook

```typescript
useEffect(() => {
  if (!referralCode || referralCode.length !== 8) {
    setValidationState({ status: 'idle' });
    return;
  }

  const timeoutId = setTimeout(() => {
    validateReferralCode(referralCode);
  }, 1500); // 1.5 segundos

  return () => clearTimeout(timeoutId);
}, [referralCode]);
```

---

## ✅ Checklist de Implementación

- [ ] Crear endpoint `/api/referrals/validate-code`
- [ ] Agregar estados de validación en `sign-up/page.tsx`
- [ ] Implementar debounce para validación automática
- [ ] Agregar función `validateReferralCode`
- [ ] Agregar UI de feedback (mensajes y colores)
- [ ] Agregar clases de borde según estado
- [ ] Probar validación con código válido
- [ ] Probar validación con código inválido
- [ ] Probar validación con código vacío
- [ ] Probar debounce (no validar mientras escribe)
- [ ] Verificar que no bloquea el registro

---

## 🧪 Casos de Prueba

### Test 1: Código Válido
1. Ingresar código válido de 8 caracteres
2. Esperar 1.5 segundos
3. Verificar que aparece: "✅ Código válido - Referido por: [Nombre]"
4. Verificar que el borde del campo es verde
5. Verificar que el registro funciona normalmente

### Test 2: Código Inválido
1. Ingresar código inválido de 8 caracteres
2. Esperar 1.5 segundos
3. Verificar que aparece: "⚠️ Código no encontrado. Puedes intentar de nuevo o continuar sin código"
4. Verificar que el borde del campo es amarillo/naranja
5. Verificar que el registro funciona normalmente (no bloquea)

### Test 3: Código Incompleto
1. Ingresar código de menos de 8 caracteres
2. Verificar que NO se valida (no aparece mensaje)
3. Verificar que el campo mantiene borde normal

### Test 4: Borrar Código
1. Ingresar código válido (verificar que aparece feedback)
2. Borrar el código completamente
3. Verificar que el feedback desaparece
4. Verificar que el borde vuelve a normal

### Test 5: Escribir Rápido
1. Escribir código rápidamente (sin pausar)
2. Verificar que NO valida mientras escribe
3. Verificar que valida solo después de 1.5 segundos sin escribir

---

## 📝 Notas

- El código sigue siendo **opcional**: el registro funciona con o sin código
- La validación es **informativa**: no bloquea el registro
- El debounce evita validar en cada tecla
- Solo se valida si el código tiene exactamente 8 caracteres
- El primer nombre se extrae del campo `nombre` (split por espacio)

---

## 🚀 Siguiente Paso

Una vez aprobado este plan, proceder con la implementación.

