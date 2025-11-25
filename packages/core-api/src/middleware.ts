import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeadersMiddleware } from '@/lib/securityHeaders';

/**
 * Middleware de seguridad para Core API
 * 
 * Aplica security headers a todas las respuestas para prevenir:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME sniffing
 * - Y otros ataques comunes
 * 
 * También maneja CORS para permitir requests desde la app móvil (Capacitor)
 * 
 * ⚠️ POLÍTICA DE LOGGING:
 * - NO agregar logs que expongan información sensible
 * - El middleware debe ser silencioso en producción
 */
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Orígenes permitidos para CORS
  const allowedOrigins = [
    'https://localhost', // Capacitor app móvil
    'capacitor://localhost', // Capacitor iOS
    'http://localhost', // Desarrollo local
    'http://localhost:3000', // Desarrollo local Next.js
    'http://localhost:3001', // Desarrollo local Admin
    'http://localhost:3002', // Desarrollo local Core API
    'https://ahorro365.vercel.app', // Producción app
    'https://admin-dashboard-eta-liard-77.vercel.app', // Producción admin
  ];

  // Verificar si el origin está permitido
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // Manejar preflight request (OPTIONS)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    // Headers CORS
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas
    
    // Aplicar security headers
    return securityHeadersMiddleware(request, response);
  }

  // Para requests normales, crear respuesta y agregar headers CORS
  const response = NextResponse.next();
  
  // Agregar headers CORS si el origin está permitido
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  }
  
  // Aplicar security headers a todas las respuestas
  return securityHeadersMiddleware(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}


