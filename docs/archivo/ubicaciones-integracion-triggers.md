# Ubicaciones para Integrar Triggers de Referidos

## 🔍 Análisis del Código Actual

### ❌ Funciones Faltantes

Las siguientes funciones se usan en `WhatsAppVerificationModal.tsx` pero **NO están implementadas** en `SupabaseContext.tsx`:

1. `sendWhatsAppVerificationCode(phone: string)` - Envía código de verificación
2. `verifyWhatsAppCode(phone: string, code: string)` - Verifica código y actualiza `whatsapp_verificado`
3. `getReferidos()` - Obtiene lista de referidos del usuario

**Ubicación:** `src/components/WhatsAppVerificationModal.tsx:20`

### ❓ Dónde se Crean Referidos

**No se encontró código explícito** que inserte en la tabla `referidos`. Posibles ubicaciones:

1. **Triggers de base de datos en Supabase** (más probable)
   - Cuando un usuario se registra con un código de referido
   - Trigger automático que crea el registro en `referidos`

2. **Endpoint de API no encontrado**
   - Podría existir un endpoint `/api/referrals` o similar
   - O en el proceso de registro (`createUser`)

3. **Función en SupabaseContext no implementada**
   - Podría estar en una versión anterior del código

## 📍 Ubicaciones Identificadas para Integración

### 1. Verificación de WhatsApp ✅ IDENTIFICADO

**Archivo:** `src/components/WhatsAppVerificationModal.tsx`
**Función:** `handleVerifyCode` (línea 86-113)
**Línea específica:** 99 - `await verifyWhatsAppCode(formattedPhone, verificationCode)`

**Acción requerida:**
- Implementar `verifyWhatsAppCode` en `SupabaseContext.tsx` o crear endpoint de API
- Después de actualizar `whatsapp_verificado = true` en tabla `usuarios`
- Buscar si hay registro en `referidos` para este usuario
- Si existe, invocar trigger: `/api/notifications/triggers/referral-verified`

### 2. Creación de Referidos ❓ NO ENCONTRADO

**Posibles ubicaciones:**
- Trigger de base de datos en Supabase (más probable)
- Endpoint de API no encontrado
- Función en `createUser` que no está implementada

**Acción requerida:**
- Verificar en Supabase Dashboard si hay triggers en tabla `referidos`
- Si se crea mediante código, buscar endpoint o función que lo haga
- Después de insertar en `referidos`, invocar: `/api/notifications/triggers/referral-invited`

## 🔧 Plan de Implementación

### Paso 1: Implementar Funciones Faltantes

**Archivo:** `src/contexts/SupabaseContext.tsx`

```typescript
// Agregar a la interfaz SupabaseContextType
sendWhatsAppVerificationCode: (phone: string) => Promise<{ success: boolean; error?: string }>;
verifyWhatsAppCode: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
getReferidos: () => Promise<any[]>;
```

**Implementación sugerida:**
- Crear endpoints de API: `/api/whatsapp/send-code` y `/api/whatsapp/verify-code`
- O implementar directamente en el contexto llamando a Supabase

### Paso 2: Integrar Trigger de Verificación WhatsApp

**En `verifyWhatsAppCode` después de actualizar `whatsapp_verificado`:**

```typescript
// 1. Actualizar whatsapp_verificado en usuarios
await supabase
  .from('usuarios')
  .update({ whatsapp_verificado: true })
  .eq('id', user.id);

// 2. Buscar referidos donde este usuario es el referido
const { data: referrals } = await supabase
  .from('referidos')
  .select('id')
  .eq('referido_id', user.id)
  .eq('verifico_whatsapp', false);

// 3. Actualizar verifico_whatsapp en referidos
if (referrals && referrals.length > 0) {
  for (const referral of referrals) {
    await supabase
      .from('referidos')
      .update({
        verifico_whatsapp: true,
        fecha_verificacion: new Date().toISOString(),
      })
      .eq('id', referral.id);

    // 4. Invocar trigger de notificación
    try {
      await fetch('/api/notifications/triggers/referral-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId: referral.id }),
      });
    } catch (error) {
      console.error('Error invocando trigger:', error);
      // No fallar la verificación si el trigger falla
    }
  }
}
```

### Paso 3: Integrar Trigger de Creación de Referido

**Necesitamos encontrar dónde se crea el referido primero.**

**Opciones:**
1. Si es trigger de DB: Crear función PostgreSQL que invoque el endpoint
2. Si es código: Agregar invocación después de insertar en `referidos`
3. Si es en `createUser`: Agregar lógica para crear referido y luego invocar trigger

## ✅ Próximos Pasos

1. ⏳ Verificar en Supabase Dashboard si hay triggers en tabla `referidos`
2. ⏳ Implementar funciones faltantes (`sendWhatsAppVerificationCode`, `verifyWhatsAppCode`, `getReferidos`)
3. ⏳ Integrar trigger de verificación WhatsApp en `verifyWhatsAppCode`
4. ⏳ Encontrar dónde se crean referidos e integrar trigger de invitación
5. ⏳ Probar flujo completo

