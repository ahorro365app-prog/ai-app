# 📱 Estrategia: Números de WhatsApp por País

> **Fecha:** 2025-01-22  
> **Objetivo:** Implementar números exclusivos por país para mejor escalabilidad

---

## 📊 Análisis: ¿Cuándo Necesitas Números por País?

### Umbral Recomendado: **10,000 Usuarios Activos por País**

**Razones:**
1. ✅ **Rate Limits de WhatsApp:** Cada número tiene límites independientes
2. ✅ **Escalabilidad:** Distribuir carga entre múltiples números
3. ✅ **Experiencia de Usuario:** Número local es más confiable
4. ✅ **Compliance:** Algunos países requieren números locales
5. ✅ **Organización:** Mejor gestión y monitoreo por país

---

## 🎯 Beneficios de Números por País

### 1. **Distribución de Carga** ✅

**Problema Actual:**
- 1 número de WhatsApp = 1 rate limit
- **Tier 4:** 1,000,000 conversaciones/24h
- **Rate limit:** ~8,000 mensajes/minuto

**Con Números por País:**
- 3 países × 1 número = 3 rate limits independientes
- **Capacidad total:** 3 × 8,000 = 24,000 mensajes/minuto
- **Escalabilidad:** Puedes agregar más números por país

---

### 2. **Mejor Experiencia de Usuario** ✅

**Beneficios:**
- ✅ Número local es más confiable
- ✅ Usuarios reconocen el número
- ✅ Mejor tasa de respuesta
- ✅ Cumple con regulaciones locales

---

### 3. **Escalabilidad Gradual** ✅

**Estrategia:**
- **10K usuarios/pais:** 1 número por país
- **50K usuarios/pais:** 2 números por país
- **100K usuarios/pais:** 3 números por país
- **250K usuarios/pais:** 5 números por país

---

## 🏗️ Arquitectura Propuesta

### Configuración Multi-Número

```typescript
// Configuración de números por país
const WHATSAPP_NUMBERS = {
  'BOL': {
    phone_number_id: '840593392476984',
    access_token: process.env.WHATSAPP_ACCESS_TOKEN_BOL,
    display_number: '+59160360908',
    rate_limit: 8000, // mensajes/minuto
    active: true
  },
  'PER': {
    phone_number_id: 'PER_PHONE_NUMBER_ID',
    access_token: process.env.WHATSAPP_ACCESS_TOKEN_PER,
    display_number: '+51XXXXXXXXX',
    rate_limit: 8000,
    active: true
  },
  'COL': {
    phone_number_id: 'COL_PHONE_NUMBER_ID',
    access_token: process.env.WHATSAPP_ACCESS_TOKEN_COL,
    display_number: '+57XXXXXXXXX',
    rate_limit: 8000,
    active: true
  }
};
```

---

## 🔧 Implementación

### 1. **Selección de Número por País**

```typescript
// packages/core-api/src/lib/whatsappNumbers.ts

interface WhatsAppNumberConfig {
  phone_number_id: string;
  access_token: string;
  display_number: string;
  country_code: string;
  rate_limit: number;
  active: boolean;
}

const WHATSAPP_NUMBERS: Record<string, WhatsAppNumberConfig[]> = {
  'BOL': [
    {
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID_BOL_1!,
      access_token: process.env.WHATSAPP_ACCESS_TOKEN_BOL_1!,
      display_number: '+59160360908',
      country_code: 'BOL',
      rate_limit: 8000,
      active: true
    },
    // Puedes agregar más números para el mismo país
    {
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID_BOL_2!,
      access_token: process.env.WHATSAPP_ACCESS_TOKEN_BOL_2!,
      display_number: '+59160360909',
      country_code: 'BOL',
      rate_limit: 8000,
      active: true
    }
  ],
  'PER': [
    {
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID_PER_1!,
      access_token: process.env.WHATSAPP_ACCESS_TOKEN_PER_1!,
      display_number: '+51XXXXXXXXX',
      country_code: 'PER',
      rate_limit: 8000,
      active: true
    }
  ],
  'COL': [
    {
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID_COL_1!,
      access_token: process.env.WHATSAPP_ACCESS_TOKEN_COL_1!,
      display_number: '+57XXXXXXXXX',
      country_code: 'COL',
      rate_limit: 8000,
      active: true
    }
  ]
};

/**
 * Obtiene el número de WhatsApp para un país
 * Si hay múltiples números, usa round-robin o least-used
 */
export function getWhatsAppNumberForCountry(
  countryCode: string,
  strategy: 'round-robin' | 'least-used' = 'round-robin'
): WhatsAppNumberConfig | null {
  const numbers = WHATSAPP_NUMBERS[countryCode]?.filter(n => n.active);
  
  if (!numbers || numbers.length === 0) {
    // Fallback al número por defecto
    return getDefaultWhatsAppNumber();
  }
  
  if (numbers.length === 1) {
    return numbers[0];
  }
  
  // Múltiples números: usar estrategia de distribución
  if (strategy === 'round-robin') {
    // Round-robin simple (puedes usar Redis para estado global)
    const index = Math.floor(Math.random() * numbers.length);
    return numbers[index];
  } else if (strategy === 'least-used') {
    // Usar el número con menos carga (requiere tracking)
    // Por ahora, round-robin
    const index = Math.floor(Math.random() * numbers.length);
    return numbers[index];
  }
  
  return numbers[0];
}

/**
 * Obtiene el número por defecto (fallback)
 */
function getDefaultWhatsAppNumber(): WhatsAppNumberConfig {
  return {
    phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    access_token: process.env.WHATSAPP_ACCESS_TOKEN!,
    display_number: process.env.WHATSAPP_DISPLAY_NUMBER || '+59160360908',
    country_code: 'BOL',
    rate_limit: 8000,
    active: true
  };
}
```

---

### 2. **Modificar WhatsApp Cloud API**

```typescript
// packages/core-api/src/lib/whatsappCloudApi.ts

import { getWhatsAppNumberForCountry } from './whatsappNumbers';

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  countryCode?: string
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  // Obtener número de WhatsApp según país del usuario
  const whatsappConfig = getWhatsAppNumberForCountry(
    countryCode || 'BOL',
    'round-robin'
  );
  
  if (!whatsappConfig) {
    logger.error('❌ No hay número de WhatsApp configurado para país:', countryCode);
    return { success: false, error: 'WhatsApp number not configured' };
  }
  
  const url = `https://graph.facebook.com/v24.0/${whatsappConfig.phone_number_id}/messages`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappConfig.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      })
    });
    
    // ... resto del código
  } catch (error) {
    // ... manejo de errores
  }
}
```

---

### 3. **Modificar Webhook para Detectar País**

```typescript
// packages/core-api/src/app/api/webhooks/whatsapp/route.ts

export async function POST(req: NextRequest) {
  // ... código existente ...
  
  // Obtener usuario
  const { data: user } = await supabase
    .from('usuarios')
    .select('*')
    .eq('telefono', phoneWithPlus)
    .single();
  
  if (!user) {
    // ... manejo de usuario no registrado ...
  }
  
  // Obtener país del usuario
  const userCountryCode = user.country_code || 'BOL';
  
  // Validar que el webhook viene del número correcto para este país
  const webhookPhoneNumberId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  const expectedNumbers = WHATSAPP_NUMBERS[userCountryCode]?.map(n => n.phone_number_id) || [];
  
  if (!expectedNumbers.includes(webhookPhoneNumberId)) {
    logger.warn('⚠️ Webhook de número incorrecto para país:', {
      userCountryCode,
      webhookPhoneNumberId,
      expectedNumbers
    });
    // Puedes rechazar o permitir (depende de tu estrategia)
  }
  
  // ... resto del procesamiento usando userCountryCode ...
}
```

---

## 📊 Estrategia de Distribución

### Opción 1: Round-Robin (Simple)

**Ventajas:**
- ✅ Fácil de implementar
- ✅ Distribución uniforme
- ✅ No requiere estado

**Desventajas:**
- ⚠️ No considera carga real
- ⚠️ Puede sobrecargar un número

**Implementación:**
```typescript
const index = Math.floor(Math.random() * numbers.length);
return numbers[index];
```

---

### Opción 2: Least-Used (Recomendado)

**Ventajas:**
- ✅ Distribuye según carga real
- ✅ Mejor uso de recursos
- ✅ Evita sobrecargas

**Desventajas:**
- ⚠️ Requiere tracking de uso
- ⚠️ Más complejo

**Implementación:**
```typescript
// Usar Redis para trackear uso
const usage = await redis.mget(
  ...numbers.map(n => `whatsapp:usage:${n.phone_number_id}`)
);

const leastUsedIndex = usage
  .map((count, index) => ({ count: parseInt(count || '0'), index }))
  .sort((a, b) => a.count - b.count)[0].index;

// Incrementar contador
await redis.incr(`whatsapp:usage:${numbers[leastUsedIndex].phone_number_id}`);

return numbers[leastUsedIndex];
```

---

### Opción 3: Por Hash de Usuario (Determinístico)

**Ventajas:**
- ✅ Mismo usuario siempre usa mismo número
- ✅ Fácil de debuggear
- ✅ No requiere estado

**Desventajas:**
- ⚠️ Puede crear desbalance si usuarios no están distribuidos uniformemente

**Implementación:**
```typescript
const hash = hashUserId(userId);
const index = hash % numbers.length;
return numbers[index];
```

---

## 💰 Costos Adicionales

### WhatsApp Business API

**Por Número:**
- **Setup:** $0 (gratis)
- **Mensajes:** Mismo costo por mensaje
- **Rate Limits:** Independientes por número

**Costo Total:**
- **3 países × 1 número:** Mismo costo de mensajes
- **3 países × 2 números:** Mismo costo de mensajes (solo más rate limits)

**Conclusión:** ✅ **No hay costo adicional** (solo más rate limits)

---

## 📈 Capacidad con Números por País

### Escenario: 3 Países, 1 Número por País

| País | Usuarios | Mensajes/Min | Rate Limit | Estado |
|------|----------|--------------|------------|--------|
| **Bolivia** | 10,000 | ~1,000 | 8,000 | ✅ OK |
| **Perú** | 10,000 | ~1,000 | 8,000 | ✅ OK |
| **Colombia** | 10,000 | ~1,000 | 8,000 | ✅ OK |
| **Total** | 30,000 | ~3,000 | 24,000 | ✅ OK |

### Escenario: 3 Países, 2 Números por País

| País | Usuarios | Mensajes/Min | Rate Limit | Estado |
|------|----------|--------------|------------|--------|
| **Bolivia** | 50,000 | ~5,000 | 16,000 (2×8K) | ✅ OK |
| **Perú** | 50,000 | ~5,000 | 16,000 (2×8K) | ✅ OK |
| **Colombia** | 50,000 | ~5,000 | 16,000 (2×8K) | ✅ OK |
| **Total** | 150,000 | ~15,000 | 48,000 | ✅ OK |

---

## 🎯 Plan de Implementación

### Fase 1: Preparación (Antes de 10K usuarios/pais)

**Tareas:**
1. ✅ Crear estructura de configuración multi-número
2. ✅ Modificar `whatsappCloudApi.ts` para usar números por país
3. ✅ Agregar validación en webhook
4. ✅ Testing con números de prueba

**Tiempo:** 1 semana

---

### Fase 2: Implementación (10K usuarios/pais)

**Tareas:**
1. ✅ Obtener números de WhatsApp para cada país
2. ✅ Configurar variables de entorno
3. ✅ Implementar distribución (round-robin inicial)
4. ✅ Monitoreo de uso por número

**Tiempo:** 1-2 semanas

---

### Fase 3: Optimización (50K usuarios/pais)

**Tareas:**
1. ✅ Agregar segundo número por país (si necesario)
2. ✅ Implementar least-used strategy
3. ✅ Monitoreo avanzado
4. ✅ Alertas de rate limits

**Tiempo:** 1 semana

---

## ✅ Checklist de Implementación

### Antes de Implementar
- [ ] Verificar que `country_code` está en tabla `usuarios`
- [ ] Obtener números de WhatsApp para cada país
- [ ] Configurar webhooks en Meta Developer Console
- [ ] Preparar variables de entorno

### Durante Implementación
- [ ] Crear `whatsappNumbers.ts` con configuración
- [ ] Modificar `whatsappCloudApi.ts`
- [ ] Modificar webhook para validar número
- [ ] Testing con números de prueba

### Después de Implementar
- [ ] Monitorear uso por número
- [ ] Verificar distribución de carga
- [ ] Configurar alertas de rate limits
- [ ] Documentar configuración

---

## 🚨 Consideraciones Importantes

### 1. **Webhooks por Número**

**Problema:**
- Cada número de WhatsApp necesita su propio webhook
- O usar un webhook único que valide el número

**Solución:**
- ✅ **Opción A:** Webhook único que valida `phone_number_id`
- ✅ **Opción B:** Webhooks separados por país (más complejo)

**Recomendación:** Opción A (más simple)

---

### 2. **Migración de Usuarios Existentes**

**Problema:**
- Usuarios existentes pueden no tener `country_code`

**Solución:**
```sql
-- Detectar país por número de teléfono
UPDATE usuarios
SET country_code = CASE
  WHEN telefono LIKE '+591%' THEN 'BOL'
  WHEN telefono LIKE '+51%' THEN 'PER'
  WHEN telefono LIKE '+57%' THEN 'COL'
  ELSE 'BOL' -- Default
END
WHERE country_code IS NULL;
```

---

### 3. **Fallback a Número por Defecto**

**Importante:**
- Si no hay número configurado para un país, usar número por defecto
- Evitar errores si falta configuración

---

## 📊 Métricas a Monitorear

### Por Número de WhatsApp

1. **Mensajes enviados/minuto**
2. **Rate limit hits**
3. **Errores por número**
4. **Latencia promedio**
5. **Uso de cada número**

### Por País

1. **Usuarios activos**
2. **Mensajes/día**
3. **Distribución entre números**
4. **Tasa de éxito**

---

## 🎯 Conclusión

### Recomendación: **SÍ, Implementar a los 10K usuarios/pais**

**Razones:**
1. ✅ **Escalabilidad:** Distribuye carga
2. ✅ **Rate Limits:** Cada número tiene límites independientes
3. ✅ **Experiencia:** Número local es mejor
4. ✅ **Costo:** No hay costo adicional
5. ✅ **Preparación:** Mejor estar preparado antes del crecimiento

**Implementación:**
- **Fase 1:** Preparar código (1 semana)
- **Fase 2:** Obtener números e implementar (1-2 semanas)
- **Fase 3:** Optimizar con múltiples números (1 semana)

**Total:** 3-4 semanas de implementación

---

**Documento creado:** 2025-01-22  
**Última actualización:** 2025-01-22

