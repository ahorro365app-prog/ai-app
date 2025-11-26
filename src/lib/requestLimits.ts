import { NextRequest } from 'next/server';
import { handleError, ErrorType } from './errorHandler';
import { logger } from './logger';

/**
 * Límites de tamaño de request para protección contra DoS
 */
export const REQUEST_LIMITS = {
  JSON_BODY: 1 * 1024 * 1024, // 1MB para JSON
  FILE_UPLOAD: 5 * 1024 * 1024, // 5MB para file uploads
  FORM_DATA: 10 * 1024 * 1024, // 10MB para form data (incluye archivos)
  URL_QUERY: 2048, // 2KB para query strings
} as const;

/**
 * Valida el tamaño del body de un request
 * @param req Request de Next.js
 * @param maxSize Tamaño máximo en bytes
 * @returns true si el tamaño es válido, false si excede el límite
 */
export async function validateRequestSize(
  req: NextRequest,
  maxSize: number = REQUEST_LIMITS.JSON_BODY
): Promise<{ valid: boolean; error?: string }> {
  const contentLength = req.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSize) {
      logger.warn('⚠️ Request excede límite de tamaño:', {
        size,
        maxSize,
        path: req.nextUrl.pathname,
      });
      return {
        valid: false,
        error: `Request demasiado grande. Máximo permitido: ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }
  }

  // Validar query string
  const queryString = req.nextUrl.search;
  if (queryString.length > REQUEST_LIMITS.URL_QUERY) {
    logger.warn('⚠️ Query string excede límite:', {
      length: queryString.length,
      maxLength: REQUEST_LIMITS.URL_QUERY,
      path: req.nextUrl.pathname,
    });
    return {
      valid: false,
      error: `Query string demasiado larga. Máximo permitido: ${REQUEST_LIMITS.URL_QUERY} caracteres`,
    };
  }

  return { valid: true };
}

/**
 * Middleware helper para validar tamaño de request
 * Úsalo al inicio de tus endpoints API
 * 
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const sizeCheck = await validateRequestSize(req, REQUEST_LIMITS.JSON_BODY);
 *   if (!sizeCheck.valid) {
 *     return handleError(new Error(sizeCheck.error), sizeCheck.error, ErrorType.VALIDATION);
 *   }
 *   // Continuar con lógica del endpoint...
 * }
 * ```
 */
export async function enforceRequestSizeLimit(
  req: NextRequest,
  maxSize: number = REQUEST_LIMITS.JSON_BODY
): Promise<Response | null> {
  const validation = await validateRequestSize(req, maxSize);
  
  if (!validation.valid) {
    return handleError(
      new Error(validation.error || 'Request demasiado grande'),
      validation.error || 'Request demasiado grande',
      ErrorType.VALIDATION
    );
  }

  return null; // Request válido, continuar
}


