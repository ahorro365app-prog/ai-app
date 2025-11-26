import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeadersMiddleware } from '@/lib/securityHeaders';

/**
 * Middleware de seguridad para App Principal
 * 
 * Aplica security headers a todas las respuestas para prevenir:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME sniffing
 * - Y otros ataques comunes
 * 
 * También configura CORS explícitamente para seguridad adicional.
 * 
 * ⚠️ POLÍTICA DE LOGGING:
 * - NO agregar logs que expongan información sensible
 * - El middleware debe ser silencioso en producción
 */

/**
 * Obtiene los orígenes permitidos para CORS
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  
  // En producción, usar variable de entorno
  if (process.env.NODE_ENV === 'production') {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    if (allowedOriginsEnv) {
      origins.push(...allowedOriginsEnv.split(',').map(o => o.trim()));
    }
    // Si no hay configuración, solo permitir el mismo origen
    if (origins.length === 0) {
      // En producción sin configuración, no permitir CORS (solo mismo origen)
      return [];
    }
  } else {
    // En desarrollo, permitir localhost
    origins.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000');
  }
  
  return origins;
}

/**
 * Verifica si un origen está permitido
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Configurar CORS explícitamente
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // Solo agregar headers CORS si hay origen y está permitido
  // O si es una request de API y necesitamos CORS
  if (origin && allowedOrigins.length > 0 && isOriginAllowed(origin, allowedOrigins)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-csrf-token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas
  }
  
  // Manejar preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }
  
  // Aplicar security headers a todas las respuestas
  return securityHeadersMiddleware(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


