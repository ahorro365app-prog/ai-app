# Plan de Integración: Trigger `referral-invited`

**Fecha:** 2025-01-XX  
**Objetivo:** Integrar el trigger `referral-invited` cuando se crea un registro en la tabla `referidos`

---

## 📊 Estado Actual

### ✅ Lo que ya existe:
1. **Estructura de BD:**
   - Tabla `usuarios` con `codigo_referido` (text) y `referido_de` (uuid)
   - Tabla `referidos` con estructura completa
   - Trigger `trigger_actualizar_contador_referidos` (BEFORE UPDATE)

2. **Código existente:**
   - `generateReferralCode()` en `src/lib/referralUtils.ts`
   - `getReferidos()` en `SupabaseContext.tsx` (solo SELECT)
   - Endpoint `/api/notifications/triggers/referral-invited` (ya creado)
   - Trigger `referral-verified` ya integrado en `verify-code`

### ❌ Lo que falta:
1. **Flujo de creación de referidos:**
   - No hay código que inserte registros en `referidos`
   - No hay procesamiento de códigos de referido durante el registro
   - No hay generación automática de `codigo_referido` en `createUser()`

2. **Integración del trigger:**
   - No hay punto de integración para `referral-invited`

---

## 🎯 Estrategia de Implementación

### Fase 1: Completar flujo de referidos en `createUser()`

**Archivo:** `src/contexts/SupabaseContext.tsx`

**Modificaciones necesarias:**

1. **Generar `codigo_referido` automáticamente:**
   ```typescript
   // En createUser(), después de crear el usuario:
   const codigoReferido = generateReferralCode();
   await supabase
     .from('usuarios')
     .update({ codigo_referido: codigoReferido })
     .eq('id', data.id);
   ```

2. **Procesar código de referido si se proporciona:**
   ```typescript
   // Si el usuario se registra con un código de referido:
   if (codigoReferidoUsado) {
     // 1. Buscar usuario con ese código
     const { data: referidor } = await supabase
       .from('usuarios')
       .select('id')
       .eq('codigo_referido', codigoReferidoUsado)
       .single();
     
     if (referidor) {
       // 2. Asignar referido_de
       await supabase
         .from('usuarios')
         .update({ referido_de: referidor.id })
         .eq('id', data.id);
       
       // 3. Crear registro en referidos
       const { data: nuevoReferido } = await supabase
         .from('referidos')
         .insert({
           referidor_id: referidor.id,
           referido_id: data.id,
           codigo_usado: codigoReferidoUsado,
           fecha_registro: new Date().toISOString(),
           verifico_whatsapp: false
         })
         .select()
         .single();
       
       // 4. Invocar trigger referral-invited
       if (nuevoReferido) {
         await fetch('/api/notifications/triggers/referral-invited', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ referralId: nuevoReferido.id })
         });
       }
     }
   }
   ```

3. **Actualizar interfaz `User`:**
   ```typescript
   interface User {
     // ... campos existentes
     codigo_referido?: string;
     referido_de?: string;
   }
   ```

### Fase 2: Agregar campo de código de referido en formulario de registro

**Archivo:** `src/app/sign-up/page.tsx`

**Modificaciones necesarias:**

1. Agregar estado para código de referido:
   ```typescript
   const [referralCode, setReferralCode] = useState('');
   ```

2. Agregar campo opcional en el formulario:
   ```typescript
   <div>
     <label>Código de referido (opcional)</label>
     <input
       type="text"
       value={referralCode}
       onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
       placeholder="ABC12345"
       maxLength={8}
     />
   </div>
   ```

3. Pasar código a `createUser()`:
   ```typescript
   const result = await createUser({
     nombre: name,
     telefono: fullPhone,
     contrasena: password,
     moneda: selectedCountry === 'BO' ? 'BOB' : 'USD',
     codigoReferidoUsado: referralCode || undefined
   });
   ```

### Fase 3: Actualizar `createUser()` para aceptar código de referido

**Archivo:** `src/contexts/SupabaseContext.tsx`

**Modificaciones:**

1. Actualizar firma de función:
   ```typescript
   const createUser = async (userData: {
     nombre: string;
     telefono: string;
     contrasena: string;
     moneda: string;
     codigoReferidoUsado?: string; // Nuevo parámetro opcional
   }) => {
     // ... código existente
   }
   ```

2. Implementar lógica de referidos (ver Fase 1)

---

## 🧪 Plan de Pruebas

### Test 1: Registro sin código de referido
1. Crear usuario sin código
2. Verificar que se genera `codigo_referido`
3. Verificar que NO se crea registro en `referidos`
4. Verificar que NO se invoca trigger

### Test 2: Registro con código de referido válido
1. Crear usuario con código válido
2. Verificar que se asigna `referido_de`
3. Verificar que se crea registro en `referidos`
4. Verificar que se invoca trigger `referral-invited`
5. Verificar que el referidor recibe notificación

### Test 3: Registro con código de referido inválido
1. Crear usuario con código inexistente
2. Verificar que NO se asigna `referido_de`
3. Verificar que NO se crea registro en `referidos`
4. Verificar que el registro continúa normalmente (no falla)

### Test 4: Registro con código de referido propio
1. Intentar registrarse con su propio código (si es posible)
2. Verificar que se rechaza o ignora

---

## 📋 Checklist de Implementación

- [ ] Fase 1: Completar flujo de referidos en `createUser()`
  - [ ] Generar `codigo_referido` automáticamente
  - [ ] Procesar código de referido si se proporciona
  - [ ] Crear registro en `referidos`
  - [ ] Invocar trigger `referral-invited`
  - [ ] Actualizar interfaz `User`

- [ ] Fase 2: Agregar campo en formulario de registro
  - [ ] Agregar estado para código
  - [ ] Agregar campo en formulario
  - [ ] Pasar código a `createUser()`

- [ ] Fase 3: Pruebas
  - [ ] Test 1: Registro sin código
  - [ ] Test 2: Registro con código válido
  - [ ] Test 3: Registro con código inválido
  - [ ] Test 4: Registro con código propio

- [ ] Documentación
  - [ ] Actualizar `docs/notificaciones-roadmap.md`
  - [ ] Documentar flujo completo de referidos

---

## ⚠️ Consideraciones

1. **Validación de código:**
   - Verificar que el código existe antes de crear referido
   - Verificar que no es el código del mismo usuario
   - Manejar errores gracefully

2. **Transacciones:**
   - Considerar usar transacciones si Supabase lo permite
   - O manejar rollback manual si algo falla

3. **Performance:**
   - El trigger se invoca de forma asíncrona (no bloquea el registro)
   - Si el trigger falla, no debe afectar el registro del usuario

4. **Seguridad:**
   - Validar formato del código de referido (8 caracteres alfanuméricos)
   - No exponer información sensible en logs

---

## 🚀 Siguiente Paso

**Implementar Fase 1** - Completar flujo de referidos en `createUser()`

¿Procedemos con la implementación?

