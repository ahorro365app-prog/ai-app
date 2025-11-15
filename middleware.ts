import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware DESHABILITADO completamente para evitar errores MIDDLEWARE_INVOCATION_FAILED
 * 
 * La app móvil está apuntando a Vercel (https://ahorro365-core.vercel.app)
 * y el middleware estaba causando errores 500 en producción.
 * 
 * SOLUCIÓN: El matcher está configurado para NO ejecutarse en rutas API
 * Esto previene completamente cualquier error de middleware en las APIs.
 * 
 * La autenticación se maneja en cada endpoint API usando Supabase.
 * Los security headers se aplican en next.config.js
 */
export default function middleware(request: NextRequest) {
  // Este código nunca debería ejecutarse porque el matcher excluye todas las rutas API
  // Pero por si acaso, retornamos next() sin hacer nada
  return NextResponse.next();
}

export const config = {
  matcher: [
    // SOLO aplicar a páginas (no a APIs ni archivos estáticos)
    // Excluir explícitamente:
    // - /api/* (todas las rutas API)
    // - /_next/* (archivos internos de Next.js)
    // - Archivos estáticos (imágenes, CSS, JS, etc.)
    '/((?!api/|_next/|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
