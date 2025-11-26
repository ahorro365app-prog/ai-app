# 🛠️ IMPLEMENTAR FUNCIONALIDADES DE SENTRY EN TU APP

**Guía práctica con código específico para Ahorro365**

---

## 1. USER CONTEXT (Identificar Usuarios)

### Dónde implementar

#### A. En el Login/Autenticación

```typescript
// src/app/api/auth/simple-login/route.ts
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    // ... tu código de autenticación ...
    
    // Después de autenticar exitosamente
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email, // Opcional - solo si es necesario
        username: user.name || user.email,
      });
    }
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
```

#### B. En el Middleware (para todas las requests)

```typescript
// src/middleware.ts
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Obtener usuario de la sesión/cookie
  const userId = request.cookies.get('user_id')?.value;
  const userEmail = request.cookies.get('user_email')?.value;
  
  if (userId) {
    Sentry.setUser({
      id: userId,
      email: userEmail || undefined,
    });
  }
  
  return NextResponse.next();
}
```

---

## 2. CUSTOM TAGS (Categorizar Errores)

### Ejemplo: Tag por Feature

```typescript
// src/hooks/useVoiceRecording.ts
import * as Sentry from "@sentry/nextjs";

// Cuando ocurre un error en la grabación
try {
  // ... código de grabación ...
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: "voice-recording",
      step: "recording", // o "transcription", "processing"
      platform: "web",
    },
  });
  throw error;
}
```

### Ejemplo: Tag por Plan de Usuario

```typescript
// src/app/api/payments/create/route.ts
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    Sentry.setContext("payment", {
      user_plan: user.subscription_plan, // "free", "smart", "premium"
      amount: paymentData.amount,
    });
    
    // ... procesar pago ...
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        feature: "payment",
        payment_method: paymentData.method,
        user_plan: user.subscription_plan,
      },
    });
    throw error;
  }
}
```

---

## 3. CUSTOM CONTEXT (Información Adicional)

### Ejemplo: Context para Procesamiento de Audio

```typescript
// src/hooks/useVoiceRecording.ts
import * as Sentry from "@sentry/nextjs";

const processAudio = async (audioBlob: Blob) => {
  try {
    // Agregar contexto antes de procesar
    Sentry.setContext("audio_processing", {
      audio_size: audioBlob.size,
      audio_type: audioBlob.type,
      duration: duration,
      user_id: userId,
    });
    
    // Enviar a Whisper
    const transcription = await sendToWhisper(audioBlob);
    
    Sentry.setContext("whisper_result", {
      transcription_length: transcription.text.length,
      transcription_preview: transcription.text.substring(0, 50),
    });
    
    // Procesar con Groq
    const result = await processWithGroq(transcription.text);
    
    return result;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        feature: "audio-processing",
        step: error.step || "unknown",
      },
    });
    throw error;
  }
};
```

### Ejemplo: Context para Webhooks de WhatsApp

```typescript
// src/app/api/webhooks/whatsapp/route.ts
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    Sentry.setContext("whatsapp_webhook", {
      message_type: data.type,
      from: data.from ? "***" + data.from.slice(-4) : "unknown", // Sanitizado
      timestamp: new Date().toISOString(),
    });
    
    // ... procesar webhook ...
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        feature: "whatsapp-webhook",
        webhook_type: data?.type || "unknown",
      },
    });
    throw error;
  }
}
```

---

## 4. RELEASE TRACKING (Versiones)

### Configurar en `.env.local`

```bash
# Versión actual de la app
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Actualizar en cada deploy

Cuando hagas un deploy, actualiza la versión:

```bash
# Versión 1.0.1 después de un fix
NEXT_PUBLIC_APP_VERSION=1.0.1

# Versión 1.1.0 para nuevas features
NEXT_PUBLIC_APP_VERSION=1.1.0
```

**Ya está configurado** en `sentry.client.config.ts`:
```typescript
release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
```

---

## 5. BREADCRUMBS PERSONALIZADOS

### Agregar breadcrumbs manualmente

```typescript
import * as Sentry from "@sentry/nextjs";

// Antes de una operación importante
Sentry.addBreadcrumb({
  category: "user-action",
  message: "Usuario inició grabación de voz",
  level: "info",
  data: {
    timestamp: new Date().toISOString(),
  },
});

// Después de completar
Sentry.addBreadcrumb({
  category: "user-action",
  message: "Grabación completada",
  level: "info",
  data: {
    duration: duration,
    audio_size: audioBlob.size,
  },
});
```

---

## 6. CAPTURAR ERRORES ESPECÍFICOS

### Ejemplo: Error en Whisper

```typescript
// src/services/whisperService.ts
import * as Sentry from "@sentry/nextjs";

export async function transcribeAudio(audioBlob: Blob) {
  try {
    // ... código de transcripción ...
  } catch (error: any) {
    // Capturar con contexto específico
    Sentry.captureException(error, {
      tags: {
        service: "whisper",
        error_type: error.response?.status || "unknown",
      },
      contexts: {
        whisper_request: {
          audio_size: audioBlob.size,
          audio_type: audioBlob.type,
        },
        whisper_response: {
          status: error.response?.status,
          message: error.message,
        },
      },
    });
    throw error;
  }
}
```

### Ejemplo: Error en Groq

```typescript
// src/services/groqService.ts
import * as Sentry from "@sentry/nextjs";

export async function processWithGroq(text: string) {
  try {
    // ... código de procesamiento ...
  } catch (error: any) {
    Sentry.captureException(error, {
      tags: {
        service: "groq",
        error_type: error.response?.status || "unknown",
      },
      contexts: {
        groq_request: {
          text_length: text.length,
          text_preview: text.substring(0, 100),
        },
        groq_response: {
          status: error.response?.status,
          message: error.message,
        },
      },
    });
    throw error;
  }
}
```

---

## 7. FILTRAR ERRORES NO IMPORTANTES

### Ya configurado en `sentry.client.config.ts`

```typescript
ignoreErrors: [
  "ResizeObserver loop limit exceeded",
  "Non-Error promise rejection captured",
  /Extension context invalidated/,
  /Chrome extension/,
],
```

### Agregar más errores a ignorar

```typescript
// sentry.client.config.ts
ignoreErrors: [
  // ... errores existentes ...
  "NetworkError when attempting to fetch resource", // Errores de red comunes
  "Failed to fetch", // Errores de fetch comunes
  /^Error:.*whisper.*timeout/i, // Timeouts de Whisper (si son comunes)
],
```

---

## 8. MÉTRICAS PERSONALIZADAS

### Capturar métricas de uso

```typescript
import * as Sentry from "@sentry/nextjs";

// Cuando un usuario completa una transacción
Sentry.metrics.increment("transactions.completed", 1, {
  tags: {
    plan: user.subscription_plan,
    amount_range: getAmountRange(amount),
  },
});

// Cuando se procesa audio
Sentry.metrics.distribution("audio.processing_time", processingTime, {
  tags: {
    audio_size_range: getSizeRange(audioBlob.size),
  },
});
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Prioridad Alta (Hacer primero)
- [ ] User Context en login/autenticación
- [ ] Custom Tags para features principales:
  - [ ] voice-recording
  - [ ] payment
  - [ ] whatsapp-webhook
  - [ ] whisper
  - [ ] groq
- [ ] Release tracking (ya configurado, solo actualizar versión)

### Prioridad Media
- [ ] Custom Context para operaciones críticas
- [ ] Breadcrumbs personalizados
- [ ] Filtrar errores no importantes adicionales

### Prioridad Baja
- [ ] Métricas personalizadas
- [ ] Más contextos según necesidad

---

## 🚀 PASOS PARA IMPLEMENTAR

### Paso 1: User Context (15 minutos)

1. Abre `src/app/api/auth/simple-login/route.ts`
2. Agrega `Sentry.setUser()` después de autenticar
3. Prueba haciendo login y verifica en Sentry

### Paso 2: Custom Tags (30 minutos)

1. Identifica los 5 features principales
2. Agrega tags en los catch blocks
3. Prueba generando errores y verifica tags en Sentry

### Paso 3: Custom Context (30 minutos)

1. Agrega context para operaciones críticas
2. Prueba y verifica en Sentry

---

## 💡 EJEMPLOS ESPECÍFICOS PARA TU APP

### 1. Error en Grabación de Voz

```typescript
// src/hooks/useVoiceRecording.ts
catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: "voice-recording",
      step: "recording", // o "transcription", "processing"
    },
    contexts: {
      recording: {
        duration: duration,
        is_cancelled: wasCancelled,
      },
    },
  });
}
```

### 2. Error en Procesamiento de Pago

```typescript
// src/app/api/payments/create/route.ts
catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: "payment",
      payment_method: paymentData.method,
      user_plan: user.subscription_plan,
    },
    contexts: {
      payment: {
        amount: paymentData.amount,
        currency: paymentData.currency,
      },
    },
  });
}
```

### 3. Error en WhatsApp Webhook

```typescript
// src/app/api/webhooks/whatsapp/route.ts
catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: "whatsapp-webhook",
      webhook_type: data?.type || "unknown",
    },
    contexts: {
      webhook: {
        message_type: data?.type,
        timestamp: new Date().toISOString(),
      },
    },
  });
}
```

---

**¿Quieres que implemente alguna de estas funcionalidades ahora?** Puedo ayudarte a agregar el código específico en tus archivos.





