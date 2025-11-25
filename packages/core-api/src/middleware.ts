import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

/**
 * Genera los security headers para todas las respuestas
 */
function getSecurityHeaders(request: NextRequest): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production';

  // Content Security Policy
  // Permite recursos necesarios: Supabase, Groq, Facebook, Sentry, etc.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.io https://api.groq.com https://graph.facebook.com https://*.sentry.io wss://*.supabase.co wss://*.supabase.io",
    "frame-src 'none'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  const headers: Record<string, string> = {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  };

  // Strict-Transport-Security: Solo en producción con HTTPS
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

/**
 * Aplica security headers a una respuesta NextResponse
 */
function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const headers = getSecurityHeaders(request);

  // Aplicar cada header
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

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
    return applySecurityHeaders(response, request);
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
  return applySecurityHeaders(response, request);
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


