/**
 * Utilidad para hacer fetch con timeout
 * Previene que requests externos cuelguen indefinidamente
 * 
 * @param url - URL a la que hacer fetch
 * @param options - Opciones de fetch (mismo formato que fetch nativo)
 * @param timeout - Timeout en milisegundos (default: 8000ms = 8 segundos)
 * @returns Promise<Response>
 * @throws Error si el timeout se excede
 */

import { logger } from './logger';

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    logger.warn(`⏱️ Request timeout después de ${timeout}ms: ${url.substring(0, 50)}...`);
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      logger.error(`❌ Request timeout (${timeout}ms): ${url.substring(0, 50)}...`);
      throw new Error(`Request timeout después de ${timeout}ms`);
    }
    
    // Re-lanzar otros errores
    throw error;
  }
}

