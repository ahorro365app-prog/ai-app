/**
 * Sentry Client Configuration
 * 
 * Configuración de Sentry para el cliente (browser)
 * Captura errores en el frontend de forma automática
 */

import * as Sentry from "@sentry/nextjs";

// Log de debug para verificar configuración
if (typeof window !== 'undefined') {
  console.log('🔍 Sentry Config:', {
    hasDSN: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    dsnLength: process.env.NEXT_PUBLIC_SENTRY_DSN?.length || 0,
    environment: process.env.NODE_ENV || "development",
    debugMode: !!process.env.NEXT_PUBLIC_SENTRY_DEBUG,
  });
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Ambiente (development, production, etc.)
  environment: process.env.NODE_ENV || "development",
  
  // Habilitar debug en desarrollo si está configurado
  debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === "true",
  
  // Sample rate para performance monitoring (10% de requests)
  // En producción, puedes reducir esto a 0.1 (10%) o 0.05 (5%)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Sample rate para profiling (solo en producción si es necesario)
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Integraciones automáticas
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Solo grabar sesiones con errores (más eficiente)
      maskAllText: true, // Enmascarar texto sensible
      blockAllMedia: true, // Bloquear media sensible
    }),
  ],
  
  // Filtrado de datos sensibles antes de enviar a Sentry
  beforeSend(event, hint) {
    // Log de debug para ver qué errores se están intentando enviar
    if (process.env.NEXT_PUBLIC_SENTRY_DEBUG === "true") {
      console.log('📤 Sentry beforeSend:', {
        eventType: event.type,
        errorMessage: event.exception?.values?.[0]?.value,
        environment: event.environment,
        willSend: !(process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SENTRY_DEBUG),
      });
    }
    
    // No enviar errores en desarrollo (opcional)
    if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      if (process.env.NEXT_PUBLIC_SENTRY_DEBUG === "true") {
        console.log('⚠️ Sentry: Error bloqueado en desarrollo (agrega NEXT_PUBLIC_SENTRY_DEBUG=true)');
      }
      return null; // No enviar en desarrollo
    }
    
    // Remover datos sensibles del request
    if (event.request) {
      // Remover cookies (pueden contener tokens)
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
      const sensitiveTags = ["email", "phone", "telefono"];
      sensitiveTags.forEach((tag) => {
        delete event.tags[tag];
      });
    }
    
    return event;
  },
  
  // Ignorar ciertos errores (opcionales)
  ignoreErrors: [
    // Errores de navegador comunes que no son relevantes
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    // Errores de extensiones del navegador
    /Extension context invalidated/,
    /Chrome extension/,
  ],
  
  // Configuración de release tracking (opcional)
  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
});



