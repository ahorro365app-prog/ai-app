# 🔄 Guía Completa: Reactivación de Tokens FCM

## 📋 Situación Real: ¿Cómo Reactivar Tokens?

### ✅ **NO es necesario desinstalar/reinstalar la app**

El sistema está diseñado para **reactivar tokens automáticamente** cuando el usuario vuelve a usar la app.

---

## 🔄 Flujo de Reactivación Automática

### **En Web (Navegador):**

1. **Usuario inicia sesión** en la app
2. **El hook `useRegisterFcmToken` se activa automáticamente**
3. **Si el token ya existe en la BD:**
   - Se actualiza automáticamente
   - Se marca como `is_active = true`
   - Se actualiza `last_used_at`
4. **Si el token es nuevo:**
   - Se registra como nuevo token activo

**Código relevante** (`packages/core-api/src/app/api/notifications/register-token/route.ts`):
```typescript
if (existingToken) {
  // Si el token ya existe, se actualiza y reactiva automáticamente
  await supabase
    .from('fcm_tokens')
    .update({
      user_id: body.userId,
      is_active: true,  // ← Se reactiva automáticamente
      last_used_at: new Date().toISOString(),
    })
    .eq('id', existingToken.id);
}
```

### **En Móvil (Android/iOS):**

1. **Usuario abre la app** (no necesita reinstalar)
2. **Usuario inicia sesión**
3. **El sistema solicita permisos de notificaciones** (si no los tiene)
4. **Se registra/reactiva el token automáticamente**

---

## 🎯 Métodos de Reactivación (de más simple a más complejo)

### **Método 1: Solo Iniciar Sesión** ⭐ (Más Simple)

**Pasos:**
1. Usuario abre la app
2. Usuario inicia sesión
3. ✅ **Listo** - El token se reactiva automáticamente

**¿Por qué funciona?**
- El hook `useRegisterFcmToken` se ejecuta cuando detecta un usuario autenticado
- Si el token existe, se actualiza y reactiva
- Si es nuevo, se registra

**No requiere:**
- ❌ Desinstalar la app
- ❌ Reinstalar la app
- ❌ Ir a configuraciones manualmente
- ❌ Limpiar datos

---

### **Método 2: Reactivar Permisos en Configuraciones** (Si el Método 1 no funciona)

**En Web (Navegador):**

1. Ir a **Configuraciones del Navegador**
   - Chrome: `chrome://settings/content/notifications`
   - Firefox: `about:preferences#privacy` → Notificaciones
   - Edge: `edge://settings/content/notifications`
2. Buscar el sitio de la app
3. **Permitir notificaciones** (si está bloqueado)
4. **Volver a la app e iniciar sesión**
5. ✅ El token se registra/reactiva automáticamente

**En Móvil (Android/iOS):**

1. Ir a **Configuraciones del Dispositivo**
   - Android: Configuración → Apps → Ahorro365 → Notificaciones
   - iOS: Configuración → Notificaciones → Ahorro365
2. **Activar notificaciones** (si están desactivadas)
3. **Abrir la app e iniciar sesión**
4. ✅ El token se registra/reactiva automáticamente

---

### **Método 3: Limpiar Datos del Navegador** (Solo si los métodos anteriores fallan)

**En Web:**

1. Abrir **Herramientas de Desarrollador** (F12)
2. Ir a **Application** → **Storage**
3. **Limpiar**:
   - Local Storage
   - Session Storage
   - Service Workers
4. **Cerrar y reabrir el navegador**
5. **Abrir la app e iniciar sesión**
6. ✅ Se registra un nuevo token

**En Móvil:**

1. Ir a **Configuraciones del Dispositivo**
2. **Apps** → **Ahorro365** → **Almacenamiento**
3. **Limpiar datos** (o **Forzar detención** + **Limpiar caché**)
4. **Abrir la app e iniciar sesión**
5. ✅ Se registra un nuevo token

---

## 🚫 Motivos por los que se Desactivan los Tokens

El sistema desactiva tokens automáticamente cuando Firebase devuelve estos errores:

### **Errores que Desactivan Tokens:**

1. **`messaging/registration-token-not-registered`**
   - El token no está registrado en Firebase
   - Causa: Usuario desinstaló la app o limpió datos

2. **`messaging/invalid-registration-token`**
   - El token es inválido o corrupto
   - Causa: Token expirado o malformado

3. **`messaging/invalid-argument`**
   - Argumento inválido en la petición
   - Causa: Token mal formateado

4. **`requested entity was not found`**
   - Firebase no encuentra el token
   - Causa: Token eliminado de Firebase

5. **Mensajes que contienen:**
   - `"registration token"`
   - `"invalid registration"`

**Código que detecta estos errores** (`packages/core-api/src/lib/notificationService.ts`):
```typescript
const invalidTokenErrors = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
];

const errorMessage = error?.message?.toLowerCase() || '';
const isInvalidToken = 
  invalidTokenErrors.includes(error?.code) ||
  errorMessage.includes('requested entity was not found') ||
  errorMessage.includes('registration token') ||
  errorMessage.includes('invalid registration');

if (isInvalidToken) {
  // Desactivar token automáticamente
  await this.deactivateToken(payload.token);
}
```

---

## 📊 Escenarios Comunes y Soluciones

### **Escenario 1: Usuario Limpió Datos del Navegador**

**Qué pasó:**
- Usuario limpió cookies/datos del navegador
- El token FCM se perdió
- Firebase marca el token como inválido

**Solución:**
1. Usuario abre la app
2. Usuario inicia sesión
3. ✅ Se registra un nuevo token automáticamente

---

### **Escenario 2: Usuario Desinstaló y Reinstaló la App**

**Qué pasó:**
- El token anterior ya no es válido
- Firebase no reconoce el token

**Solución:**
1. Usuario reinstala la app
2. Usuario inicia sesión
3. Usuario acepta permisos de notificaciones
4. ✅ Se registra un nuevo token automáticamente

---

### **Escenario 3: Usuario Bloqueó Notificaciones en el Navegador**

**Qué pasó:**
- Usuario bloqueó notificaciones en configuraciones
- El token existe pero no puede recibir notificaciones

**Solución:**
1. Usuario va a configuraciones del navegador
2. Permite notificaciones para el sitio
3. Usuario vuelve a la app
4. ✅ El token se reactiva automáticamente al iniciar sesión

---

### **Escenario 4: Token Expirado (Raro)**

**Qué pasó:**
- Firebase expiró el token (muy raro, solo pasa después de mucho tiempo sin usar)

**Solución:**
1. Usuario inicia sesión
2. El sistema detecta que el token es inválido
3. Se registra un nuevo token automáticamente

---

## 🔍 Verificación del Estado del Token

### **Desde la App (Usuario):**

El estado se guarda en `localStorage` con la clave `ahorro365:fcmStatus`:

```javascript
// En la consola del navegador:
JSON.parse(localStorage.getItem('ahorro365:fcmStatus'))
```

**Estados posibles:**
- `registered`: ✅ Token registrado correctamente
- `pending`: ⏳ Intentando registrar
- `denied`: ❌ Permisos denegados
- `error`: ❌ Error al registrar
- `signed_out`: 👤 Usuario no ha iniciado sesión

### **Desde Supabase (Admin):**

```sql
-- Ver tokens de un usuario
SELECT 
  id,
  token,
  device_type,
  is_active,
  created_at,
  last_used_at
FROM fcm_tokens
WHERE user_id = 'UUID-DEL-USUARIO'
ORDER BY created_at DESC;
```

---

## ✅ Resumen: ¿Qué Debe Hacer el Usuario?

### **Situación Normal (99% de los casos):**

1. ✅ **Solo iniciar sesión** - El token se reactiva automáticamente
2. ✅ **No necesita desinstalar/reinstalar**
3. ✅ **No necesita ir a configuraciones manualmente**

### **Si No Funciona:**

1. ✅ **Verificar permisos de notificaciones** en configuraciones
2. ✅ **Permitir notificaciones** si están bloqueadas
3. ✅ **Volver a la app e iniciar sesión**

### **Último Recurso:**

1. ✅ **Limpiar datos del navegador/app**
2. ✅ **Abrir la app e iniciar sesión**
3. ✅ **Aceptar permisos de notificaciones**

---

## 🎯 Conclusión

**El sistema está diseñado para ser automático:**
- ✅ Los tokens se reactivan automáticamente al iniciar sesión
- ✅ No requiere intervención manual del usuario
- ✅ Solo necesita que el usuario use la app normalmente

**Los tokens se desactivan cuando:**
- Firebase los marca como inválidos (usuario limpió datos, desinstaló app, etc.)
- El sistema detecta el error y desactiva el token automáticamente
- Al volver a usar la app, se reactiva/registra un nuevo token automáticamente

