# 📱 Sistema de Cambio de Teléfono Verificado

## 🎯 Objetivo

Implementar un sistema seguro de cambio de teléfono que:
1. **Bloquee edición directa** una vez que el teléfono está verificado
2. **Requiera verificación previa** del nuevo número antes de cambiar
3. **Aplique cooldown de 30 días** entre cambios de teléfono

---

## 📋 Requisitos Funcionales

### 1. **Estado del Teléfono**
- ✅ **No verificado**: Se puede editar libremente
- ✅ **Verificado**: Requiere proceso especial para cambiar
- ⏳ **En proceso de cambio**: Tiene un nuevo número pendiente de verificar

### 2. **Reglas de Negocio**

#### **Regla 1: Teléfono No Verificado**
- ✅ Edición libre (sin restricciones)
- ✅ Puede verificar WhatsApp en cualquier momento

#### **Regla 2: Teléfono Verificado**
- ❌ **NO** se puede editar directamente
- ✅ Debe iniciar proceso de "Cambio de Teléfono"
- ✅ El nuevo número debe ser verificado ANTES de aplicar el cambio
- ⏳ Cooldown de 30 días después del último cambio

#### **Regla 3: Cooldown de 30 Días**
- ⏳ Si cambió el teléfono hace menos de 30 días → NO puede cambiar de nuevo
- ✅ Si pasaron 30+ días desde el último cambio → Puede iniciar nuevo cambio
- 📅 El contador se reinicia cada vez que se completa un cambio exitoso

---

## 🔄 Flujo de Cambio de Teléfono

### **Escenario A: Usuario con Teléfono Verificado quiere Cambiar**

```
1. Usuario hace clic en "Editar Teléfono"
   ↓
2. Sistema verifica estado:
   - ¿Teléfono verificado? → SÍ
   - ¿Pasaron 30 días desde último cambio? → Verificar
   ↓
3. Si NO pasaron 30 días:
   - Mostrar mensaje: "Debes esperar X días más para cambiar tu teléfono"
   - Bloquear edición
   ↓
4. Si SÍ pasaron 30 días:
   - Abrir modal "Cambio de Teléfono"
   - Mostrar teléfono actual (solo lectura)
   - Campo para nuevo teléfono
   ↓
5. Usuario ingresa nuevo número
   ↓
6. Sistema valida formato del nuevo número
   ↓
7. Mostrar pantalla de CONFIRMACIÓN antes de enviar código:
   - Mostrar teléfono actual
   - Mostrar nuevo teléfono
   - Advertencia sobre el cooldown de 30 días
   - Botones: "Cancelar" o "Confirmar y Continuar"
   ↓
8. Usuario confirma el cambio
   ↓
9. Enviar código de verificación al NUEVO número
   ↓
10. Usuario ingresa código recibido
   ↓
11. Sistema verifica código:
    - ✅ Código correcto → Aplicar cambio
    - ❌ Código incorrecto → Mostrar error, permitir reintento
   ↓
12. Si código correcto:
    - Actualizar `telefono` con nuevo número
    - Actualizar `telefono_verificado` con nuevo número
    - Actualizar `fecha_ultimo_cambio_telefono` = NOW()
    - Limpiar cualquier estado de cambio pendiente
    - Mostrar éxito
```

### **Escenario B: Usuario con Teléfono NO Verificado**

```
1. Usuario hace clic en "Editar Teléfono"
   ↓
2. Sistema verifica estado:
   - ¿Teléfono verificado? → NO
   ↓
3. Abrir modal de edición simple
   - Permitir editar directamente
   - Sin restricciones de cooldown
   ↓
4. Usuario cambia número
   ↓
5. Guardar cambio (sin verificación requerida)
   - Si luego quiere verificar, debe hacerlo manualmente
```

---

## 📊 Estructura de Datos Necesaria

### **Campos en Tabla `usuarios`** (ya existen algunos):
```sql
-- Ya existen:
telefono TEXT NOT NULL
whatsapp_verificado BOOLEAN DEFAULT FALSE
telefono_verificado TEXT NULL
fecha_ultimo_cambio_telefono TIMESTAMP NULL

-- Necesarios agregar:
telefono_pendiente TEXT NULL  -- Nuevo número ingresado, pendiente de verificar
codigo_verificacion_pendiente TEXT NULL  -- Código enviado al nuevo número
fecha_inicio_cambio_telefono TIMESTAMP NULL  -- Cuándo inició el proceso de cambio
intentos_verificacion_cambio INTEGER DEFAULT 0  -- Intentos de verificar código
```

### **Estados del Teléfono**:
```typescript
type TelefonoState = 
  | 'no_verificado'  // No tiene WhatsApp verificado
  | 'verificado'     // Verificado, sin cambio pendiente
  | 'cambio_pendiente'  // Tiene nuevo número pendiente de verificar
  | 'en_cooldown'    // En período de espera de 30 días
```

---

## 🎨 Interfaz de Usuario

### **1. Campo Teléfono en Perfil**

#### **Estado: No Verificado**
```
┌─────────────────────────────────────┐
│ Teléfono                            │
│ +591 76990076          [✏️ Editar]  │
└─────────────────────────────────────┘
```
- ✅ Botón "Editar" siempre visible
- ✅ Edición directa sin restricciones

#### **Estado: Verificado**
```
┌─────────────────────────────────────────────┐
│ Teléfono                                    │
│ +591 76990076  [✓ Verificado]  [✏️ Cambiar]│
└─────────────────────────────────────────────┘
```
- ✅ Badge "Verificado" visible
- ✅ Botón cambia a "Cambiar" (no "Editar")
- ✅ Al hacer clic, verificar cooldown antes de abrir modal

#### **Estado: En Cooldown**
```
┌─────────────────────────────────────────────────────┐
│ Teléfono                                             │
│ +591 76990076  [✓ Verificado]  [⏳ Disponible en X] │
└─────────────────────────────────────────────────────┘
```
- ❌ Botón deshabilitado
- ⏳ Muestra días restantes: "Disponible en 15 días"

#### **Estado: Cambio Pendiente**
```
┌─────────────────────────────────────────────────────┐
│ Teléfono                                             │
│ +591 76990076  [✓ Verificado]  [🔄 Verificando...] │
└─────────────────────────────────────────────────────┘
```
- 🔄 Indicador de proceso activo
- ✅ Puede cancelar el proceso

---

### **2. Modal de Cambio de Teléfono**

#### **Paso 1: Ingreso de Nuevo Número**
```
┌─────────────────────────────────────────┐
│  Cambiar Teléfono                       │
│  ─────────────────────────────────────  │
│                                         │
│  Teléfono actual:                      │
│  +591 76990076 [✓ Verificado]          │
│                                         │
│  Nuevo teléfono:                       │
│  ┌─────────────────────────────────┐   │
│  │ +591 ___________               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⚠️ Debes verificar el nuevo número     │
│  antes de que se aplique el cambio.     │
│                                         │
│  [Cancelar]  [Continuar]               │
└─────────────────────────────────────────┘
```

#### **Paso 2: Confirmación Antes de Enviar Código**
```
┌─────────────────────────────────────────┐
│  Confirmar Cambio de Teléfono           │
│  ─────────────────────────────────────  │
│                                         │
│  📱 Teléfono actual:                    │
│  +591 76990076 [✓ Verificado]           │
│                                         │
│  ➡️ Nuevo teléfono:                     │
│  +591 70123456                           │
│                                         │
│  ⚠️ IMPORTANTE:                         │
│  • Se enviará un código de verificación │
│    al nuevo número                       │
│  • El cambio se aplicará solo después   │
│    de verificar el código               │
│  • No podrás cambiar de nuevo hasta     │
│    dentro de 30 días                    │
│                                         │
│  ¿Estás seguro de continuar?            │
│                                         │
│  [Cancelar]  [Sí, Confirmar]            │
└─────────────────────────────────────────┘
```

#### **Paso 3: Verificación del Nuevo Número**
```
┌─────────────────────────────────────────┐
│  Verificar Nuevo Teléfono               │
│  ─────────────────────────────────────  │
│                                         │
│  Hemos enviado un código a:             │
│  +591 70123456                          │
│                                         │
│  Ingresa el código de 6 dígitos:       │
│  ┌─────────────────────────────────┐   │
│  │ _ _ _ _ _ _                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Reenviar código]                     │
│                                         │
│  [Cancelar]  [Verificar]                │
└─────────────────────────────────────────┘
```

#### **Paso 4: Confirmación de Cambio Exitoso**
```
┌─────────────────────────────────────────┐
│  ✅ Teléfono Cambiado Exitosamente     │
│  ─────────────────────────────────────  │
│                                         │
│  Tu nuevo teléfono es:                 │
│  +591 70123456                          │
│                                         │
│  ⏳ Podrás cambiar de nuevo en 30 días   │
│                                         │
│  [Cerrar]                               │
└─────────────────────────────────────────┘
```

---

## 🔐 Validaciones y Seguridad

### **Validaciones de Entrada**
1. ✅ Formato de teléfono válido (validar con `validatePhoneNumber`)
2. ✅ Nuevo número diferente al actual
3. ✅ Nuevo número no está en uso por otro usuario
4. ✅ Cooldown de 30 días cumplido
5. ✅ Máximo 3 intentos de verificación (luego debe reiniciar proceso)

### **Validaciones de Cooldown**
```typescript
function canChangePhone(lastChangeDate: Date | null): {
  canChange: boolean;
  daysRemaining?: number;
} {
  if (!lastChangeDate) {
    return { canChange: true };
  }
  
  const daysSinceLastChange = Math.floor(
    (Date.now() - new Date(lastChangeDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastChange >= 30) {
    return { canChange: true };
  }
  
  return {
    canChange: false,
    daysRemaining: 30 - daysSinceLastChange
  };
}
```

---

## 🗄️ Cambios en Base de Datos

### **Migración SQL Necesaria**
```sql
-- Agregar campos para cambio de teléfono
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS telefono_pendiente TEXT NULL,
ADD COLUMN IF NOT EXISTS codigo_verificacion_pendiente TEXT NULL,
ADD COLUMN IF NOT EXISTS fecha_inicio_cambio_telefono TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS intentos_verificacion_cambio INTEGER DEFAULT 0;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono_pendiente 
ON usuarios(telefono_pendiente) 
WHERE telefono_pendiente IS NOT NULL;
```

---

## 📝 Funciones Necesarias

### **1. `checkCanChangePhone(userId: string)`**
- Verifica si puede cambiar teléfono
- Retorna: `{ canChange: boolean, reason?: string, daysRemaining?: number }`

### **2. `initiatePhoneChange(userId: string, newPhone: string)`**
- Inicia proceso de cambio
- Guarda `telefono_pendiente`
- Envía código de verificación
- Guarda `fecha_inicio_cambio_telefono`

### **3. `verifyPhoneChange(userId: string, code: string)`**
- Verifica código del nuevo número
- Si correcto: aplica cambio
- Actualiza `fecha_ultimo_cambio_telefono`
- Limpia campos temporales

### **4. `cancelPhoneChange(userId: string)`**
- Cancela proceso de cambio pendiente
- Limpia `telefono_pendiente` y campos relacionados

---

## 🎯 Casos Edge a Considerar

### **Caso 1: Usuario inicia cambio pero no completa**
- ⚠️ **Problema**: `telefono_pendiente` queda guardado
- ✅ **Solución**: Limpiar después de 24 horas sin actividad
- ✅ **Solución alternativa**: Permitir cancelar manualmente

### **Caso 2: Usuario intenta cambiar a número ya en uso**
- ⚠️ **Problema**: Otro usuario tiene ese número
- ✅ **Solución**: Validar antes de enviar código
- ✅ **Mensaje**: "Este número ya está registrado"

### **Caso 3: Usuario cambia número y luego quiere revertir**
- ⚠️ **Problema**: Quiere volver al número anterior
- ✅ **Solución**: Aplicar mismo cooldown de 30 días
- ✅ **Nota**: No guardar número anterior por seguridad

### **Caso 4: Código de verificación expira**
- ⚠️ **Problema**: Código tiene validez temporal
- ✅ **Solución**: Código válido por 10 minutos
- ✅ **Solución**: Permitir reenvío de código

---

## 📱 Componentes Necesarios

### **1. `PhoneChangeModal.tsx`**
- Modal para proceso completo de cambio
- Paso 1: Ingreso de nuevo número
- Paso 2: Verificación de código
- Paso 3: Confirmación

### **2. Hook `usePhoneChange.ts`**
- Maneja lógica de cambio de teléfono
- Estados: `idle`, `entering_new`, `verifying`, `success`, `error`
- Funciones: `initiateChange`, `verifyCode`, `cancelChange`

### **3. Actualizar `profile/page.tsx`**
- Botón "Cambiar" vs "Editar" según estado
- Validar cooldown antes de abrir modal
- Mostrar días restantes si está en cooldown

---

## ✅ Checklist de Implementación

### **Fase 1: Base de Datos**
- [ ] Crear migración SQL con nuevos campos
- [ ] Ejecutar migración en Supabase
- [ ] Verificar índices creados

### **Fase 2: Lógica Backend**
- [ ] Función `checkCanChangePhone` en `SupabaseContext`
- [ ] Función `initiatePhoneChange` en `SupabaseContext`
- [ ] Función `verifyPhoneChange` en `SupabaseContext`
- [ ] Función `cancelPhoneChange` en `SupabaseContext`
- [ ] Actualizar `verifyWhatsAppCode` para manejar cambio de teléfono

### **Fase 3: Componentes UI**
- [ ] Crear `PhoneChangeModal.tsx`
- [ ] Actualizar `profile/page.tsx` con nueva lógica
- [ ] Agregar estados visuales (cooldown, pendiente, etc.)

### **Fase 4: Validaciones**
- [ ] Validar formato de teléfono
- [ ] Validar número único
- [ ] Validar cooldown de 30 días
- [ ] Validar intentos de verificación (máx 3)

### **Fase 5: Testing**
- [ ] Test: Cambio exitoso
- [ ] Test: Cooldown bloquea cambio
- [ ] Test: Verificación incorrecta
- [ ] Test: Cancelar proceso
- [ ] Test: Número ya en uso

---

## 🚀 Orden de Implementación Recomendado

1. **Primero**: Migración de base de datos
2. **Segundo**: Funciones backend en `SupabaseContext`
3. **Tercero**: Componente `PhoneChangeModal`
4. **Cuarto**: Integración en `profile/page.tsx`
5. **Quinto**: Validaciones y casos edge
6. **Sexto**: Testing completo

---

## 📝 Notas Adicionales

- **Cooldown visible**: Mostrar contador de días restantes en UI
- **Historial**: Considerar guardar historial de cambios (opcional, para admin)
- **Notificaciones**: Enviar notificación cuando se cambia teléfono exitosamente
- **Seguridad**: No permitir cambiar a número que ya está verificado en otra cuenta

