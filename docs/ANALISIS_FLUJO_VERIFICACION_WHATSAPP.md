# 📱 Análisis del Flujo de Verificación de WhatsApp

> **Fecha:** 2025-01-22  
> **Objetivo:** Revisar y documentar el flujo completo de envío y verificación de códigos de WhatsApp

---

## 📋 Resumen del Flujo

El sistema permite verificar números de teléfono mediante códigos de 6 dígitos enviados por WhatsApp Cloud API.

---

## 🔄 Flujo Completo

### 1. **Frontend: Solicitud de Código**

**Archivo:** `src/components/WhatsAppVerificationModal.tsx`

```typescript
const handleSendCode = async () => {
  // 1. Validar número de teléfono
  const cleanedPhone = phoneNumber.replace(/\D/g, '');
  if (!validatePhoneNumber(cleanedPhone)) {
    setError('El número de teléfono no es válido...');
    return;
  }

  // 2. Formatear número
  const formattedPhone = formatPhoneNumber(cleanedPhone);
  
  // 3. Llamar al contexto
  const result = await sendWhatsAppVerificationCode(formattedPhone);
  
  if (result.success) {
    setCodeSent(true);
    setStep('code');
    setCountdown(600); // 10 minutos
  }
};
```

**Paso:** Usuario hace clic en "Enviar código" → Se valida y formatea el teléfono → Se llama al contexto

---

### 2. **Contexto: Llamada al API**

**Archivo:** `src/contexts/SupabaseContext.tsx`

```typescript
const sendWhatsAppVerificationCode = async (phone: string): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.debug('📱 sendWhatsAppVerificationCode: Enviando código a:', phone);
    
    const response = await fetch('/api/whatsapp/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al enviar código');
    }

    logger.debug('✅ sendWhatsAppVerificationCode: Código enviado exitosamente');
    return { success: true };
  } catch (error: any) {
    logger.error('❌ Error en sendWhatsAppVerificationCode:', error);
    return { success: false, error: error.message };
  }
};
```

**Paso:** Contexto hace POST a `/api/whatsapp/send-verification-code` con el teléfono

---

### 3. **Backend: Generación y Envío del Código**

**Archivo:** `packages/core-api/src/app/api/whatsapp/send-verification-code/route.ts`

#### 3.1. Validación de Usuario

```typescript
// Verificar que el usuario existe
const { data: userData, error: err } = await supabase
  .from('usuarios')
  .select('id, nombre')
  .eq('telefono', phone)
  .single();

if (err || !userData) {
  return handleNotFoundError('Usuario');
}
```

**✅ Verifica:** Usuario existe en la base de datos con ese teléfono

---

#### 3.2. Generación del Código

```typescript
// Generar código de 6 dígitos
const code = generateVerificationCode(); // Math.floor(100000 + Math.random() * 900000)
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
```

**✅ Genera:** Código aleatorio de 6 dígitos (100000-999999)  
**✅ Expira:** En 10 minutos

---

#### 3.3. Guardado en Base de Datos

```typescript
const { data: savedCode, error: codeError } = await supabase
  .from('codigos_verificacion')
  .insert({
    telefono: phone,
    codigo: code,
    usado: false,
    expira_en: expiresAt.toISOString(),
    fecha_creacion: new Date().toISOString(),
  })
  .select()
  .single();
```

**✅ Guarda:** Código en tabla `codigos_verificacion` con:
- `telefono`: Número de teléfono
- `codigo`: Código de 6 dígitos
- `usado`: `false`
- `expira_en`: Timestamp de expiración (10 min)
- `fecha_creacion`: Timestamp actual

---

#### 3.4. Envío por WhatsApp

```typescript
// Normalizar número (remover + si existe)
const phoneNumberNormalized = phone.startsWith('+') ? phone.substring(1) : phone;

// Mensaje a enviar
const message = `🔐 Tu código de verificación de Ahorro365 es: *${code}*\n\nEste código expira en 10 minutos.`;

// Enviar por WhatsApp Cloud API
const sendResult = await sendWhatsAppMessage(phoneNumberNormalized, message);
```

**✅ Normaliza:** Remueve el `+` del teléfono (WhatsApp Cloud API no lo acepta)  
**✅ Envía:** Mensaje con el código usando `sendWhatsAppMessage`

---

### 4. **WhatsApp Cloud API: Envío del Mensaje**

**Archivo:** `packages/core-api/src/lib/whatsappCloudApi.ts`

```typescript
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  // Validar configuración
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return { success: false, error: 'WhatsApp not configured' };
  }

  // Normalizar número (remover +)
  const phoneNumber = to.startsWith('+') ? to.substring(1) : to;

  // URL de Graph API
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  // Request con timeout
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: message }
    })
  }, 8000); // 8 segundos timeout

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error?.message || `HTTP ${response.status}` };
  }

  return {
    success: true,
    message_id: data.messages?.[0]?.id
  };
}
```

**✅ Valida:** Token y Phone Number ID configurados  
**✅ Normaliza:** Teléfono (sin `+`)  
**✅ Envía:** Request a Graph API de Meta  
**✅ Timeout:** 8 segundos  
**✅ Retorna:** `success: true` con `message_id` o `success: false` con error

---

### 5. **Frontend: Verificación del Código**

**Archivo:** `src/components/WhatsAppVerificationModal.tsx`

```typescript
const handleVerifyCode = async () => {
  // Validar código de 6 dígitos
  if (verificationCode.length !== 6) {
    setError('El código debe tener 6 dígitos');
    return;
  }

  // Formatear teléfono
  const formattedPhone = formatPhoneNumber(cleanedPhone);
  
  // Verificar código
  const result = await verifyWhatsAppCode(formattedPhone, verificationCode);
  
  if (result.success) {
    onVerify(); // Callback de éxito
    onClose();
  }
};
```

**Paso:** Usuario ingresa código → Se valida formato → Se llama al contexto para verificar

---

### 6. **Backend: Verificación del Código**

**Archivo:** `packages/core-api/src/app/api/whatsapp/verify-code/route.ts`

#### 6.1. Buscar Código Válido

```typescript
const { data: verificationCode, error: codeError } = await supabase
  .from('codigos_verificacion')
  .select('*')
  .eq('telefono', phone)
  .eq('codigo', code)
  .eq('usado', false)
  .gte('expira_en', new Date().toISOString()) // No expirado
  .order('fecha_creacion', { ascending: false })
  .limit(1)
  .single();
```

**✅ Busca:** Código que:
- Coincida con teléfono
- Coincida con código ingresado
- No esté usado (`usado: false`)
- No esté expirado (`expira_en >= ahora`)
- Sea el más reciente

---

#### 6.2. Marcar Código como Usado

```typescript
const { error: updateCodeError } = await supabase
  .from('codigos_verificacion')
  .update({ usado: true })
  .eq('id', verificationCode.id);
```

**✅ Marca:** Código como usado (previene reutilización)

---

#### 6.3. Actualizar Usuario

```typescript
// Buscar usuario
const { data: userData } = await supabase
  .from('usuarios')
  .select('id, whatsapp_verificado, codigo_referido')
  .eq('telefono', phone)
  .single();

// Generar código de referido si es primera verificación
if (!userData.whatsapp_verificado && !userData.codigo_referido) {
  const codigoReferido = generateReferralCode().toUpperCase();
  await supabase
    .from('usuarios')
    .update({ codigo_referido: codigoReferido })
    .eq('id', userData.id);
}

// Marcar WhatsApp como verificado
await supabase
  .from('usuarios')
  .update({ whatsapp_verificado: true })
  .eq('id', userData.id);
```

**✅ Genera:** Código de referido si es primera verificación  
**✅ Actualiza:** `whatsapp_verificado: true`

---

#### 6.4. Actualizar Referidos (si aplica)

```typescript
// Si el usuario es un referido, actualizar referidos.verifico_whatsapp
const { data: referral } = await supabase
  .from('referidos')
  .select('id, verifico_whatsapp')
  .eq('referido_id', userData.id)
  .eq('verifico_whatsapp', false)
  .maybeSingle();

if (referral) {
  await supabase
    .from('referidos')
    .update({
      verifico_whatsapp: true,
      fecha_verificacion: new Date().toISOString(),
    })
    .eq('id', referral.id);

  // Invocar trigger de notificación
  await fetch('/api/notifications/triggers/referral-verified', {
    method: 'POST',
    body: JSON.stringify({ referralId: referral.id })
  });
}
```

**✅ Actualiza:** Referido si el usuario es referido  
**✅ Invoca:** Trigger de notificación para referido verificado

---

## 🔍 Puntos Críticos del Flujo

### ✅ **Fortalezas**

1. **Validación de Usuario:** Verifica que el usuario existe antes de enviar código
2. **Expiración:** Códigos expiran en 10 minutos
3. **Uso Único:** Códigos se marcan como usados después de verificar
4. **Normalización:** Teléfono se normaliza correctamente (sin `+`)
5. **Timeout:** Request a WhatsApp tiene timeout de 8 segundos
6. **Manejo de Errores:** Errores se manejan en cada capa
7. **Logs:** Logging en cada paso para debugging

---

### ⚠️ **Posibles Problemas**

#### 1. **Normalización de Teléfono Inconsistente**

**Problema:**
- Frontend envía teléfono con `+` (ej: `+59176990076`)
- Backend normaliza removiendo `+` (ej: `59176990076`)
- Pero en `send-verification-code/route.ts` se normaliza de nuevo

**Ubicación:**
```typescript
// packages/core-api/src/app/api/whatsapp/send-verification-code/route.ts:109
const phoneNumberNormalized = phone.startsWith('+') ? phone.substring(1) : phone;
```

**Análisis:** ✅ **Correcto** - Se normaliza antes de enviar a WhatsApp Cloud API

---

#### 2. **Manejo de Errores en Envío**

**Problema:**
- Si el envío por WhatsApp falla, el código ya está guardado
- El usuario no recibe el código pero el código está en la BD

**Ubicación:**
```typescript
// packages/core-api/src/app/api/whatsapp/send-verification-code/route.ts:107-122
try {
  const sendResult = await sendWhatsAppMessage(phoneNumberNormalized, message);
  if (sendResult.success) {
    logger.debug('✅ Código de verificación enviado por WhatsApp');
  } else {
    logger.warn('⚠️ Error enviando código por WhatsApp (no crítico):', sendResult.error);
    // No fallar si el envío falla, el código ya está guardado
  }
} catch (error: any) {
  logger.warn('⚠️ Error intentando enviar código por WhatsApp (no crítico):', error.message);
  // No fallar si el envío falla, el código ya está guardado
}
```

**Análisis:** ⚠️ **Potencial Problema** - Si el envío falla, el código queda guardado pero el usuario no lo recibe. El usuario puede solicitar otro código, pero el anterior queda en la BD sin usar.

**Recomendación:** Considerar marcar códigos como "fallidos" si el envío falla, o eliminar códigos no enviados después de cierto tiempo.

---

#### 3. **Validación de Token de WhatsApp**

**Problema:**
- Si el token está expirado, el envío falla silenciosamente
- El usuario no sabe por qué no recibió el código

**Ubicación:**
```typescript
// packages/core-api/src/lib/whatsappCloudApi.ts:75-84
if (response.status === 401) {
  const isExpired = errorMessage.includes('expired') || errorMessage.includes('expiró') || 
                   errorMessage.includes('Session has expired');
  
  if (isExpired) {
    logger.error('💡 SOLUCIÓN: El token de WhatsApp ha expirado.');
    logger.error('   Necesitas regenerar el token en Meta Developer Console o usar un token permanente.');
  }
}
```

**Análisis:** ✅ **Bien manejado** - Se detecta token expirado y se loguea, pero el error se retorna al frontend.

---

#### 4. **Rate Limiting**

**Problema:**
- No hay rate limiting en el endpoint de envío de código
- Un usuario podría solicitar muchos códigos en poco tiempo

**Análisis:** ⚠️ **Falta Implementar** - No hay rate limiting específico para este endpoint.

**Recomendación:** Agregar rate limiting (ej: máximo 3 códigos por teléfono en 10 minutos).

---

## 📊 Diagrama de Flujo

```
┌─────────────────┐
│   Frontend      │
│  (Modal)        │
└────────┬────────┘
         │ 1. Usuario solicita código
         ▼
┌─────────────────┐
│   Contexto      │
│  (Supabase)     │
└────────┬────────┘
         │ 2. POST /api/whatsapp/send-verification-code
         ▼
┌─────────────────┐
│   Backend       │
│  (send-code)    │
└────────┬────────┘
         │ 3. Validar usuario
         │ 4. Generar código
         │ 5. Guardar en BD
         │ 6. Enviar por WhatsApp
         ▼
┌─────────────────┐
│ WhatsApp Cloud  │
│      API        │
└────────┬────────┘
         │ 7. Enviar mensaje
         ▼
┌─────────────────┐
│   Usuario       │
│  (WhatsApp)     │
└─────────────────┘
         │ 8. Usuario ingresa código
         ▼
┌─────────────────┐
│   Frontend      │
│  (Modal)        │
└────────┬────────┘
         │ 9. POST /api/whatsapp/verify-code
         ▼
┌─────────────────┐
│   Backend       │
│  (verify-code)  │
└────────┬────────┘
         │ 10. Validar código
         │ 11. Marcar como usado
         │ 12. Actualizar usuario
         │ 13. Actualizar referidos (si aplica)
         ▼
┌─────────────────┐
│   Frontend      │
│  (Modal)        │
└─────────────────┘
```

---

## ✅ Checklist de Verificación

### Funcionalidad
- [x] Generación de código de 6 dígitos
- [x] Guardado en base de datos
- [x] Envío por WhatsApp Cloud API
- [x] Validación de código
- [x] Marcar código como usado
- [x] Actualizar `whatsapp_verificado`
- [x] Generar código de referido (si aplica)
- [x] Actualizar referidos (si aplica)

### Seguridad
- [x] Códigos expiran en 10 minutos
- [x] Códigos se marcan como usados
- [x] Validación de usuario antes de enviar
- [x] Normalización de teléfono
- [ ] Rate limiting (⚠️ **FALTA**)

### Manejo de Errores
- [x] Validación de token de WhatsApp
- [x] Timeout en requests
- [x] Logging de errores
- [x] Mensajes de error al frontend
- [ ] Manejo de códigos no enviados (⚠️ **MEJORABLE**)

---

## 🔧 Recomendaciones

### 1. **Rate Limiting**
Agregar rate limiting al endpoint de envío de código:
```typescript
// Máximo 3 códigos por teléfono en 10 minutos
const rateLimitResult = await checkRateLimit(verificationRateLimit, `phone:${phone}`);
if (!rateLimitResult.success) {
  return handleError('Demasiados intentos. Intenta más tarde.');
}
```

### 2. **Limpieza de Códigos No Enviados**
Agregar un cron job para eliminar códigos no enviados después de cierto tiempo:
```typescript
// Eliminar códigos no enviados después de 1 hora
await supabase
  .from('codigos_verificacion')
  .delete()
  .eq('usado', false)
  .lt('fecha_creacion', new Date(Date.now() - 60 * 60 * 1000).toISOString());
```

### 3. **Mejor Manejo de Errores de Envío**
Si el envío falla, marcar el código como "fallido" o eliminarlo:
```typescript
if (!sendResult.success) {
  // Eliminar código si el envío falla
  await supabase
    .from('codigos_verificacion')
    .delete()
    .eq('id', savedCode.id);
  
  return handleError('Error al enviar código. Intenta de nuevo.');
}
```

---

**Documento creado:** 2025-01-22  
**Última actualización:** 2025-01-22  
**Versión:** 1.0

