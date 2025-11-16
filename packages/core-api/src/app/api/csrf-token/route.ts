import { NextRequest } from 'next/server';
import { getCSRFTokenEndpoint } from '@/lib/csrf';

/**
 * GET /api/csrf-token
 * 
 * Obtiene o genera un token CSRF y lo establece en una cookie HttpOnly.
 * El token también se retorna en el body para que el frontend pueda incluirlo en requests.
 * 
 * Uso en frontend:
 * ```typescript
 * const response = await fetch('/api/csrf-token');
 * const { csrfToken } = await response.json();
 * // Incluir csrfToken en headers o body de requests POST/PUT/DELETE
 * ```
 */
export async function GET(req: NextRequest) {
  return getCSRFTokenEndpoint(req);
}

