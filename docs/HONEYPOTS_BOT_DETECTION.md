# 🤖 Honeypots y Bot Detection

Esta guía explica cómo usar honeypots y detección de bots en formularios.

## 📋 ¿Qué son los Honeypots?

Los honeypots son campos ocultos en formularios que los humanos no pueden ver pero los bots suelen llenar automáticamente. Si un campo honeypot tiene valor, es muy probable que sea un bot.

## ✅ Implementación

### Utilidades Disponibles

El archivo `src/lib/honeypot.ts` proporciona:

1. **`detectBotViaHoneypot()`** - Detecta bots en FormData
2. **`detectBotViaHoneypotJSON()`** - Detecta bots en JSON body
3. **`generateHoneypotField()`** - Genera HTML para campo honeypot
4. **`HoneypotField`** - Componente React para honeypots
5. **`detectBotViaHeaders()`** - Detección básica vía headers

## 🚀 Uso en Endpoints API

### Ejemplo: Endpoint con FormData

```typescript
import { detectBotViaHoneypot } from '@/lib/honeypot';
import { handleError, ErrorType } from '@/lib/errorHandler';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  
  // Verificar honeypot
  const botCheck = await detectBotViaHoneypot(req, formData);
  if (botCheck.isBot) {
    // No revelar que detectamos un bot, solo rechazar silenciosamente
    return handleError(
      new Error('Invalid request'),
      'Invalid request',
      ErrorType.VALIDATION
    );
  }
  
  // Continuar con lógica normal...
}
```

### Ejemplo: Endpoint con JSON

```typescript
import { detectBotViaHoneypotJSON } from '@/lib/honeypot';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Verificar honeypot
  const botCheck = detectBotViaHoneypotJSON(req, body);
  if (botCheck.isBot) {
    return handleError(
      new Error('Invalid request'),
      'Invalid request',
      ErrorType.VALIDATION
    );
  }
  
  // Continuar con lógica normal...
}
```

## 🎨 Uso en Formularios Frontend

### React Component

```tsx
import { HoneypotField } from '@/lib/honeypot';

export function ContactForm() {
  return (
    <form action="/api/contact" method="POST">
      <HoneypotField />
      
      <input type="text" name="name" required />
      <input type="email" name="email" required />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

### HTML Puro

```html
<form action="/api/contact" method="POST">
  <!-- Campo honeypot -->
  <div style="position: absolute; left: -9999px; opacity: 0;">
    <label for="email_confirm">No llenar</label>
    <input type="text" id="email_confirm" name="email_confirm" autocomplete="off" tabindex="-1" />
  </div>
  
  <!-- Campos reales del formulario -->
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <button type="submit">Enviar</button>
</form>
```

## 📊 Detección de Bots vía Headers

```typescript
import { detectBotViaHeaders } from '@/lib/honeypot';

export async function POST(req: NextRequest) {
  // Verificar headers (detección básica)
  const headerCheck = detectBotViaHeaders(req);
  if (headerCheck.isBot) {
    logger.warn('Bot detectado vía headers:', headerCheck.reason);
    // Decidir si bloquear o solo loguear
  }
  
  // Continuar...
}
```

## ⚠️ Mejores Prácticas

1. **No revelar que detectaste un bot**:
   - No devolver mensajes como "Bot detectado"
   - Usar mensajes genéricos como "Invalid request"
   - Esto previene que los atacantes adapten sus bots

2. **Combinar múltiples métodos**:
   - Honeypots + Rate Limiting + Validación de inputs
   - Múltiples capas de protección

3. **Loguear intentos de bots**:
   - Registrar IP, user-agent, y campo honeypot llenado
   - Útil para análisis y mejoras futuras

4. **No bloquear bots legítimos**:
   - Googlebot, Bingbot, etc. son necesarios para SEO
   - Usar `detectBotViaHeaders()` con cuidado

## 🔮 Mejoras Futuras

### CAPTCHA (Opcional, cuando crezcan)

Si los honeypots no son suficientes, considerar:

1. **reCAPTCHA v3** (invisible, mejor UX):
   - No requiere interacción del usuario
   - Analiza comportamiento para detectar bots
   - Gratis hasta cierto volumen

2. **hCaptcha** (alternativa a reCAPTCHA):
   - Similar a reCAPTCHA
   - Más privacidad-friendly

3. **Turnstile (Cloudflare)**:
   - Alternativa moderna
   - Gratis y sin tracking

### Rate Limiting por IP

Ya implementado, pero puede mejorarse:

- Agregar blacklist de IPs conocidas de bots
- Whitelist para IPs confiables
- Rate limiting adaptativo (más estricto para IPs sospechosas)

## 📝 Endpoints Recomendados para Honeypots

### Prioridad Alta

1. **Formularios de contacto**
2. **Registro de usuarios**
3. **Login** (ya tiene rate limiting, honeypot adicional)
4. **Feedback/Comentarios**

### Prioridad Media

5. **Newsletter signup**
6. **File uploads** (ya tiene validación, honeypot adicional)
7. **Cualquier formulario público**

## 📚 Recursos

- [OWASP: Bot Detection](https://owasp.org/www-community/attacks/Bot)
- [Honeypot Technique](https://en.wikipedia.org/wiki/Honeypot_(computing))

---

**Última actualización**: 2025-01-18


