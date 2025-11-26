/**
 * Configuración centralizada de URLs de API
 * 
 * Para testing local, cambia TEMP_LOCAL_API_URL a tu IP local
 * Ejemplo: 'http://192.168.1.100:3002'
 * 
 * ⚠️ IMPORTANTE: Después de probar, revierte este cambio o déjalo como null
 */

// ⚠️ TEMPORAL PARA TESTING LOCAL - Cambiar a tu IP local o dejar null para usar producción
const TEMP_LOCAL_API_URL: string | null = null; // Volver a producción

/**
 * Obtiene la URL base del API según el entorno
 */
export function getApiBaseUrl(): string {
  // Si hay una URL temporal configurada, usarla (para testing local)
  if (TEMP_LOCAL_API_URL) {
    return TEMP_LOCAL_API_URL;
  }

  // Usar variable de entorno o fallback a producción
  return process.env.NEXT_PUBLIC_API_URL || 'https://ahorro365-core-api.vercel.app';
}

