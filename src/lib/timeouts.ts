/**
 * Utilidades para configuración de timeouts
 * Previene requests que puedan colgar indefinidamente
 */

/**
 * Timeouts recomendados para diferentes tipos de operaciones
 */
export const TIMEOUTS = {
  DATABASE_QUERY: 5000, // 5 segundos para queries de BD
  EXTERNAL_API: 10000, // 10 segundos para APIs externas
  FILE_UPLOAD: 30000, // 30 segundos para file uploads
  LONG_RUNNING: 60000, // 60 segundos para operaciones largas
} as const;

/**
 * Crea un fetch con timeout
 * @param url URL a la que hacer fetch
 * @param options Opciones de fetch
 * @param timeoutMs Timeout en milisegundos
 * @returns Promise que se rechaza si excede el timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = TIMEOUTS.EXTERNAL_API
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      throw new Error(`Request timeout después de ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Ejecuta una función con timeout
 * @param fn Función a ejecutar
 * @param timeoutMs Timeout en milisegundos
 * @param errorMessage Mensaje de error si excede timeout
 * @returns Resultado de la función o error si excede timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = TIMEOUTS.DATABASE_QUERY,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage || `Operación timeout después de ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Crea un timeout promise que se rechaza después del tiempo especificado
 */
export function createTimeoutPromise(
  timeoutMs: number,
  errorMessage?: string
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage || `Timeout después de ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Helper para ejecutar operaciones de Supabase con timeout
 * @param operation Operación de Supabase a ejecutar
 * @param timeoutMs Timeout en milisegundos (default: 5 segundos)
 */
export async function supabaseWithTimeout<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  timeoutMs: number = TIMEOUTS.DATABASE_QUERY
): Promise<{ data: T | null; error: any }> {
  try {
    return await withTimeout(operation, timeoutMs, `Query de base de datos timeout después de ${timeoutMs}ms`);
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Timeout en operación de base de datos',
        code: 'TIMEOUT',
      },
    };
  }
}


