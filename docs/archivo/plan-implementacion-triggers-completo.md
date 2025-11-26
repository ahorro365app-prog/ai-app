# Plan de Implementación Completo: Triggers de Referidos

## 🔍 Análisis del Flujo Actual

### Función `actualizar_contador_referidos` (Ya existe)

**Qué hace:**
- ✅ Detecta cuando `verifico_whatsapp` cambia de `false/null` a `true`
- ✅ Actualiza contador `referidos_verificados` en `usuarios`
- ✅ Actualiza `fecha_verificacion = NOW()` en `referidos`

**Qué NO hace:**
- ❌ NO invoca notificaciones
- ❌ NO crea referidos (solo actualiza)

### Flujo Actual (Inferido)

1. **Usuario verifica WhatsApp:**
   - Se llama `verifyWhatsAppCode(phone, code)` desde `WhatsAppVerificationModal.tsx`
   - Esta función **NO está implementada** en `SupabaseContext.tsx`
   - Probablemente hay un endpoint de API que la maneja

2. **Actualización en base de datos:**
   - Se actualiza `verifico_whatsapp = true` en `referidos`
   - Trigger `BEFORE UPDATE` ejecuta `actualizar_contador_referidos`
   - Se actualizan contadores y fecha

3. **Lo que falta:**
   - ❌ Invocar trigger de notificación después de verificar

## 🎯 Plan de Implementación

### Paso 1: Implementar `verifyWhatsAppCode` en SupabaseContext

**Ubicación:** `src/contexts/SupabaseContext.tsx`

**Funciones a implementar:**
1. `sendWhatsAppVerificationCode(phone: string)` - Envía código
2. `verifyWhatsAppCode(phone: string, code: string)` - Verifica código
3. `getReferidos()` - Obtiene lista de referidos

**Implementación sugerida:**

```typescript
// Agregar a la interfaz SupabaseContextType
sendWhatsAppVerificationCode: (phone: string) => Promise<{ success: boolean; error?: string }>;
verifyWhatsAppCode: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
getReferidos: () => Promise<any[]>;

// Implementación de verifyWhatsAppCode
const verifyWhatsAppCode = async (phone: string, code: string) => {
  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // 1. Verificar código (llamar a endpoint de API o verificar en DB)
    const { data: verificationCode, error: codeError } = await supabase
      .from('codigos_verificacion')
      .select('*')
      .eq('telefono', phone)
      .eq('codigo', code)
      .eq('usado', false)
      .single();

    if (codeError || !verificationCode) {
      return { success: false, error: 'Código inválido o expirado' };
    }

    // 2. Marcar código como usado
    await supabase
      .from('codigos_verificacion')
      .update({ usado: true, usado_at: new Date().toISOString() })
      .eq('id', verificationCode.id);

    // 3. Actualizar whatsapp_verificado en usuarios
    await supabase
      .from('usuarios')
      .update({ whatsapp_verificado: true })
      .eq('id', user.id);

    // 4. Buscar referidos donde este usuario es el referido
    const { data: referrals } = await supabase
      .from('referidos')
      .select('id')
      .eq('referido_id', user.id)
      .eq('verifico_whatsapp', false);

    // 5. Actualizar verifico_whatsapp en referidos (esto activará el trigger)
    if (referrals && referrals.length > 0) {
      for (const referral of referrals) {
        await supabase
          .from('referidos')
          .update({
            verifico_whatsapp: true,
            fecha_verificacion: new Date().toISOString(),
          })
          .eq('id', referral.id);

        // 6. Invocar trigger de notificación (NO bloquea si falla)
        try {
          await fetch('/api/notifications/triggers/referral-verified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referralId: referral.id }),
          });
        } catch (error) {
          console.error('Error invocando trigger:', error);
          // No fallar la verificación si el trigger falla
          // El cron lo procesará más tarde
        }
      }
    }

    // 7. Recargar datos del usuario
    const { data: updatedUser } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error verificando código:', error);
    return { success: false, error: error.message || 'Error al verificar código' };
  }
};
```

### Paso 2: Implementar `sendWhatsAppVerificationCode`

```typescript
const sendWhatsAppVerificationCode = async (phone: string) => {
  try {
    // Llamar a endpoint de API que envía código por WhatsApp
    const response = await fetch('/api/whatsapp/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al enviar código' };
  }
};
```

### Paso 3: Implementar `getReferidos`

```typescript
const getReferidos = async () => {
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('referidos')
      .select(`
        id,
        referido_id,
        codigo_usado,
        fecha_referido:created_at,
        fecha_verificacion,
        verifico_whatsapp:verifico_whatsapp,
        referido:referido_id(nombre, telefono)
      `)
      .eq('referidor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error obteniendo referidos:', error);
    return [];
  }
};
```

### Paso 4: Crear Endpoint para Enviar Código (si no existe)

**Ubicación:** `src/app/api/whatsapp/send-verification-code/route.ts`

Este endpoint debería:
- Generar código de 6 dígitos
- Guardarlo en `codigos_verificacion`
- Enviarlo por WhatsApp usando el servicio de WhatsApp

## 📋 Checklist de Implementación

- [ ] Implementar `sendWhatsAppVerificationCode` en `SupabaseContext.tsx`
- [ ] Implementar `verifyWhatsAppCode` en `SupabaseContext.tsx` con integración de trigger
- [ ] Implementar `getReferidos` en `SupabaseContext.tsx`
- [ ] Crear endpoint `/api/whatsapp/send-verification-code` (si no existe)
- [ ] Probar flujo completo:
  - [ ] Enviar código
  - [ ] Verificar código
  - [ ] Verificar que se actualiza `verifico_whatsapp`
  - [ ] Verificar que se invoca trigger de notificación
  - [ ] Verificar que se envía notificación al referidor

## 🔍 Sobre la Creación de Referidos

**Pregunta pendiente:** ¿Dónde se crean los referidos cuando un usuario se registra con código?

**Opciones:**
1. Se crean en `createUser` (necesitamos verificar)
2. Se crean mediante trigger de DB (no lo vimos)
3. Se crean en un endpoint de API separado

**Si se crean en `createUser`:**
- Agregar invocación de `/api/notifications/triggers/referral-invited` después de crear el referido

## ✅ Próximo Paso

**Implementar las funciones faltantes en `SupabaseContext.tsx`** con la integración de triggers.

¿Quieres que proceda con la implementación?

