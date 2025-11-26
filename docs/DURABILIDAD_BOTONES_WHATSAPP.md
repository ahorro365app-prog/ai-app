# ⏰ Durabilidad de Botones en WhatsApp Cloud API

> **Fecha:** 2025-01-21  
> **Propósito:** Analizar si los botones pueden expirar o deshabilitarse  
> **Estado:** 📋 Análisis Técnico

---

## 🔍 Investigación: ¿Pueden los Botones Expirar?

### Respuesta Corta: **NO directamente, PERO hay soluciones**

WhatsApp Cloud API **NO permite** que los botones se deshabiliten automáticamente después de cierto tiempo. Sin embargo, hay varias estrategias para manejar esto.

---

## 📊 Limitaciones de WhatsApp Cloud API

### 1. Ventana de 24 Horas

**Regla de WhatsApp:**
- ✅ Los mensajes interactivos (botones) funcionan dentro de la **ventana de 24 horas**
- ✅ Después de 24 horas, el usuario NO puede responder a botones
- ✅ Fuera de la ventana, se necesitan **templates** (requieren aprobación de Meta)

**Para nuestro caso:**
- ✅ Timeout de 30 minutos está dentro de la ventana de 24h
- ✅ Los botones seguirán "visibles" pero podemos validar en el backend

---

### 2. No Hay Expiración Automática

**WhatsApp NO soporta:**
- ❌ Deshabilitar botones después de X tiempo
- ❌ Hacer que botones "expiren" automáticamente
- ❌ Ocultar botones después del timeout

**Los botones permanecen visibles y "clicables"** hasta que:
- El usuario hace clic
- Pasan 24 horas (ventana de WhatsApp)
- El mensaje es eliminado

---

## 💡 Soluciones Propuestas

### Solución 1: Validación en Backend (Recomendada) ✅

**Estrategia:**
- Los botones permanecen visibles
- Validamos en el backend si la transacción ya expiró
- Si expiró, rechazamos la confirmación con mensaje claro

**Ventajas:**
- ✅ Simple de implementar
- ✅ No requiere cambios en WhatsApp
- ✅ Funciona con la API actual

**Desventajas:**
- ❌ El botón sigue visible (puede confundir)
- ❌ Usuario puede hacer clic y recibir error

**Implementación:**
```typescript
// Cuando usuario hace clic en botón
async function procesarConfirmacionPorBoton(
  phoneNumber: string,
  buttonId: string
) {
  const predictionId = buttonId.replace('confirm_', '');
  
  // 1. Obtener pending_confirmations
  const { data: pendingConf } = await supabase
    .from('pending_confirmations')
    .select('*')
    .eq('prediction_id', predictionId)
    .single();
  
  if (!pendingConf) {
    return manejarError('NO_PENDING_CONFIRMATION');
  }
  
  // 2. Verificar si ya está confirmada
  if (pendingConf.confirmed === true) {
    return manejarError('ALREADY_CONFIRMED', {
      confirmedAt: pendingConf.confirmed_at
    });
  }
  
  // 3. Verificar si expiró (30 minutos)
  const expiresAt = new Date(pendingConf.expires_at);
  const now = new Date();
  
  if (now > expiresAt) {
    // Ya expiró, fue auto-guardada por cron
    return manejarError('EXPIRED_ALREADY_SAVED', {
      expiredAt: expiresAt,
      minutesAgo: Math.floor((now.getTime() - expiresAt.getTime()) / 60000)
    });
  }
  
  // 4. Confirmar (aún está dentro del tiempo)
  return await processConfirmation(phoneNumber, 'sí', predictionId);
}
```

**Mensaje de error:**
```typescript
case 'EXPIRED_ALREADY_SAVED':
  const minutesAgo = errorData.minutesAgo;
  await sendWhatsAppMessage(
    phoneNumber,
    `⏰ Esta transacción ya fue guardada automáticamente.\n\n` +
    `Fue guardada hace ${minutesAgo} minutos (después del tiempo de espera).\n\n` +
    `📱 Puedes editarla en la app si es necesario.`
  );
  break;
```

---

### Solución 2: Enviar Mensaje de Actualización (Alternativa)

**Estrategia:**
- Después del timeout, enviar un mensaje nuevo que "reemplaza" el anterior
- El mensaje nuevo indica que ya fue guardada
- Los botones del mensaje anterior siguen visibles, pero el nuevo mensaje aclara

**Ventajas:**
- ✅ Informa al usuario claramente
- ✅ No requiere validación compleja

**Desventajas:**
- ❌ Envía mensaje adicional (puede ser molesto)
- ❌ Los botones anteriores siguen visibles

**Implementación:**
```typescript
// En el cron job, después de auto-guardar
await sendWhatsAppMessage(
  phoneNumber,
  `✅ Transacción guardada automáticamente\n\n` +
  `La transacción fue guardada después del tiempo de espera (30 minutos).\n\n` +
  `📱 Puedes editarla en la app si es necesario.`
);
```

**Nota:** Ya lo hacemos en el cron job actual ✅

---

### Solución 3: Usar Templates para Mensajes Post-Timeout (No Recomendado)

**Estrategia:**
- Después del timeout, enviar un template que indica que ya fue guardada
- Templates funcionan fuera de la ventana de 24h

**Desventajas:**
- ❌ Requiere aprobación de Meta (1-2 días)
- ❌ Más complejo
- ❌ No resuelve el problema de botones visibles

**No recomendado para este caso**

---

## 🎯 Recomendación Final

### **Solución Recomendada: Validación en Backend**

**Razones:**
1. ✅ Simple de implementar
2. ✅ No requiere cambios en WhatsApp
3. ✅ Funciona con la API actual
4. ✅ Mensajes de error claros
5. ✅ Ya tenemos la lógica de timeout

**Flujo:**
```
T0: Usuario envía transacción A
T1: Sistema envía preview con botón
T2: Usuario NO hace clic
T3: Pasan 30 minutos
T4: Cron auto-guarda A
T5: Usuario hace clic en botón (después del timeout)
T6: Sistema valida → Detecta que expiró
T7: Sistema responde: "Ya fue guardada automáticamente"
```

---

## 📋 Implementación Propuesta

### 1. Función de Validación

```typescript
async function validarConfirmacionPorBoton(
  predictionId: string
): Promise<{
  valid: boolean;
  error?: string;
  data?: any;
}> {
  const supabase = getSupabaseAdmin();
  
  // 1. Obtener pending_confirmations
  const { data: pendingConf } = await supabase
    .from('pending_confirmations')
    .select('*')
    .eq('prediction_id', predictionId)
    .single();
  
  if (!pendingConf) {
    return {
      valid: false,
      error: 'NO_PENDING_CONFIRMATION',
      data: { message: 'Esta transacción ya no está pendiente de confirmación.' }
    };
  }
  
  // 2. Verificar si ya está confirmada
  if (pendingConf.confirmed === true) {
    const confirmedAt = new Date(pendingConf.confirmed_at);
    const minutesAgo = Math.floor(
      (Date.now() - confirmedAt.getTime()) / 60000
    );
    
    return {
      valid: false,
      error: 'ALREADY_CONFIRMED',
      data: {
        message: `Esta transacción ya fue confirmada hace ${minutesAgo} minutos.`,
        confirmedAt: pendingConf.confirmed_at
      }
    };
  }
  
  // 3. Verificar si expiró (30 minutos)
  const expiresAt = new Date(pendingConf.expires_at);
  const now = new Date();
  
  if (now > expiresAt) {
    const minutesAgo = Math.floor(
      (now.getTime() - expiresAt.getTime()) / 60000
    );
    
    return {
      valid: false,
      error: 'EXPIRED_ALREADY_SAVED',
      data: {
        message: `Esta transacción ya fue guardada automáticamente hace ${minutesAgo} minutos (después del tiempo de espera).`,
        expiredAt: expiresAt.toISOString(),
        minutesAgo
      }
    };
  }
  
  // 4. Verificar que la predicción existe
  const { data: prediction } = await supabase
    .from('predicciones_groq')
    .select('id')
    .eq('id', predictionId)
    .single();
  
  if (!prediction) {
    return {
      valid: false,
      error: 'PREDICTION_NOT_FOUND',
      data: { message: 'Esta transacción ya no está disponible.' }
    };
  }
  
  // 5. Todo OK
  return { valid: true };
}
```

### 2. Manejo de Errores

```typescript
async function manejarErrorConfirmacion(
  error: string,
  errorData: any,
  phoneNumber: string
) {
  let message: string;
  
  switch (error) {
    case 'EXPIRED_ALREADY_SAVED':
      message = `⏰ *Transacción ya guardada*\n\n` +
                `${errorData.message}\n\n` +
                `📱 Puedes editarla en la app si es necesario.`;
      break;
      
    case 'ALREADY_CONFIRMED':
      message = `✅ *Transacción ya confirmada*\n\n` +
                `${errorData.message}\n\n` +
                `📱 Puedes verla en la app.`;
      break;
      
    case 'NO_PENDING_CONFIRMATION':
      message = `❌ *Transacción no disponible*\n\n` +
                `${errorData.message}`;
      break;
      
    case 'PREDICTION_NOT_FOUND':
      message = `❌ *Transacción no encontrada*\n\n` +
                `Esta transacción puede haber sido eliminada o cancelada.`;
      break;
      
    default:
      message = `❌ *Error al confirmar*\n\n` +
                `Por favor, intenta de nuevo o contacta soporte.`;
  }
  
  await sendWhatsAppMessage(phoneNumber, message);
}
```

### 3. Procesar Confirmación por Botón

```typescript
async function procesarConfirmacionPorBoton(
  phoneNumber: string,
  buttonId: string
) {
  // Extraer prediction_id
  if (!buttonId.startsWith('confirm_')) {
    return {
      success: false,
      error: 'INVALID_BUTTON_ID'
    };
  }
  
  const predictionId = buttonId.replace('confirm_', '');
  
  // Validar
  const validation = await validarConfirmacionPorBoton(predictionId);
  
  if (!validation.valid) {
    await manejarErrorConfirmacion(
      validation.error!,
      validation.data,
      phoneNumber
    );
    
    return {
      success: false,
      error: validation.error
    };
  }
  
  // Confirmar
  const result = await processConfirmation(
    phoneNumber,
    'sí',
    predictionId
  );
  
  return result;
}
```

---

## 📊 Comparación de Soluciones

| Solución | Complejidad | Efectividad | Recomendación |
|----------|------------|-------------|---------------|
| **Validación Backend** | ⭐⭐ | ⭐⭐⭐⭐ | ✅ Recomendada |
| **Mensaje Actualización** | ⭐ | ⭐⭐⭐ | ✅ Ya implementada |
| **Templates** | ⭐⭐⭐⭐ | ⭐⭐ | ❌ No recomendada |

---

## ✅ Conclusión

**Respuesta a tu pregunta:**
- ❌ **NO**, WhatsApp NO permite que los botones expiren automáticamente
- ✅ **PERO**, podemos validar en el backend si ya expiró
- ✅ Si expiró, rechazamos con mensaje claro: "Ya fue guardada automáticamente"

**Implementación:**
- Validar `expires_at` antes de confirmar
- Si `now > expires_at`, rechazar con mensaje
- El botón sigue visible, pero el backend lo rechaza

**Ventaja:**
- El usuario sabe qué pasó (mensaje claro)
- No hay confusión sobre el estado
- Funciona con la API actual de WhatsApp

---

**Documento creado:** 2025-01-21  
**Última actualización:** 2025-01-21

