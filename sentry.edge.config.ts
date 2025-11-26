/**
 * Sentry Edge Configuration
 * 
 * Configuración de Sentry para Edge Runtime (middleware, edge functions)
 * Captura errores en el edge de forma automática
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Ambiente
  environment: process.env.NODE_ENV || "development",
  
  // Sample rate para performance monitoring (5% en producción)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  
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
        ];
        
        sensitiveHeaders.forEach((header) => {
          delete event.request.headers[header];
          delete event.request.headers[header.toLowerCase()];
        });
      }
    }
    
    // Remover datos sensibles del contexto del usuario
    if (event.user) {
      const userId = event.user.id;
      event.user = userId ? { id: userId } : {};
    }
    
    return event;
  },
  
  // Ignorar ciertos errores
  ignoreErrors: [
    /Rate limit exceeded/,
    /CSRF token/,
  ],
  
  // Configuración de release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
});







