/**
 * Sentry Server Configuration
 * 
 * Configuración de Sentry para el servidor (API routes, Server Components)
 * Captura errores en el backend de forma automática
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Ambiente
  environment: process.env.NODE_ENV || "development",
  
  // Sample rate para performance monitoring (10% en producción)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Integraciones automáticas
  integrations: [
    Sentry.nodeProfilingIntegration(),
  ],
  
  // Filtrado de datos sensibles antes de enviar a Sentry
  beforeSend(event, hint) {
    // No enviar errores en desarrollo (opcional)
    if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return null; // No enviar en desarrollo
    }
    
    // Remover datos sensibles del request
    if (event.request) {
      // Remover cookies
      if (event.request.cookies) {
        delete event.request.cookies;
      }
      
      // Remover headers sensibles
      if (event.request.headers) {
        const sensitiveHeaders = [
          "authorization",
          "x-user-id",
          "x-csrf-token",
          "cookie",
          "set-cookie",
          "x-api-key",
          "x-auth-token",
        ];
        
        sensitiveHeaders.forEach((header) => {
          delete event.request.headers[header];
          delete event.request.headers[header.toLowerCase()];
        });
      }
      
      // Remover datos del body si contiene información sensible
      if (event.request.data) {
        const sensitiveFields = [
          "password",
          "token",
          "csrfToken",
          "apiKey",
          "secret",
          "authorization",
          "creditCard",
          "cardNumber",
          "cvv",
          "pin",
          "telefono",
          "phone",
        ];
        
        if (typeof event.request.data === "object") {
          sensitiveFields.forEach((field) => {
            if (event.request.data[field]) {
              event.request.data[field] = "[REDACTED]";
            }
          });
        }
      }
    }
    
    // Remover datos sensibles del contexto del usuario
    if (event.user) {
      // Mantener solo ID (sin email, teléfono, etc.)
      const userId = event.user.id;
      event.user = userId ? { id: userId } : {};
    }
    
    // Remover datos sensibles de tags
    if (event.tags) {
      const sensitiveTags = ["email", "phone", "telefono", "userId"];
      sensitiveTags.forEach((tag) => {
        delete event.tags[tag];
      });
    }
    
    // Remover stack traces completos en producción (opcional)
    if (process.env.NODE_ENV === "production" && event.exception) {
      event.exception.values?.forEach((exception) => {
        if (exception.stacktrace) {
          // Mantener solo las primeras 10 líneas del stack trace
          if (exception.stacktrace.frames && exception.stacktrace.frames.length > 10) {
            exception.stacktrace.frames = exception.stacktrace.frames.slice(-10);
          }
        }
      });
    }
    
    return event;
  },
  
  // Ignorar ciertos errores (opcionales)
  ignoreErrors: [
    // Errores de validación esperados (no son bugs)
    "ValidationError",
    "ZodError",
    // Errores de rate limiting (esperados)
    /Rate limit exceeded/,
    // Errores de CSRF (esperados)
    /CSRF token/,
  ],
  
  // Configuración de release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
});







