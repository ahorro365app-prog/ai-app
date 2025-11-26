/**
 * Utilidades de Honeypot para detección de bots
 * Los honeypots son campos ocultos que los bots suelen llenar pero los humanos no
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';

/**
 * Nombres comunes para campos honeypot
 * Los bots suelen llenar estos campos automáticamente
 */
const HONEYPOT_FIELD_NAMES = [
  'email_confirm', // Campo común que los bots llenan
  'website', // Campo que los bots suelen llenar
  'url', // Similar a website
  'phone', // Campo que algunos bots llenan
  'company', // Campo común en formularios
  'name_confirm', // Confirmación que los bots llenan
  'honeypot', // Nombre directo (menos efectivo pero útil)
  'bot_check', // Nombre directo
  'hp', // Abreviación común
];

/**
 * Verifica si un request contiene datos en campos honeypot
 * @param req Request de Next.js
 * @param formData FormData del request (opcional, se obtiene del body si no se provee)
 * @returns true si se detectó un bot (campo honeypot llenado)
 */
export async function detectBotViaHoneypot(
  req: NextRequest,
  formData?: FormData
): Promise<{ isBot: boolean; field?: string }> {
  try {
    // Obtener formData si no se provee
    if (!formData) {
      formData = await req.formData();
    }

    // Verificar cada campo honeypot
    for (const fieldName of HONEYPOT_FIELD_NAMES) {
      const value = formData.get(fieldName);
      
      // Si el campo existe y tiene valor, es probablemente un bot
      if (value && typeof value === 'string' && value.trim() !== '') {
        logger.warn('🤖 Bot detectado vía honeypot:', {
          field: fieldName,
          value: value.substring(0, 50), // Solo primeros 50 caracteres para logging
          path: req.nextUrl.pathname,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        });
        
        return {
          isBot: true,
          field: fieldName,
        };
      }
    }

    return { isBot: false };
  } catch (error: any) {
    // Si hay error al procesar, no marcar como bot (evitar falsos positivos)
    logger.warn('Error verificando honeypot:', error);
    return { isBot: false };
  }
}

/**
 * Verifica honeypot desde JSON body
 * @param req Request de Next.js
 * @param body Body JSON del request
 * @returns true si se detectó un bot
 */
export function detectBotViaHoneypotJSON(
  req: NextRequest,
  body: Record<string, any>
): { isBot: boolean; field?: string } {
  try {
    // Verificar cada campo honeypot
    for (const fieldName of HONEYPOT_FIELD_NAMES) {
      const value = body[fieldName];
      
      // Si el campo existe y tiene valor, es probablemente un bot
      if (value && typeof value === 'string' && value.trim() !== '') {
        logger.warn('🤖 Bot detectado vía honeypot (JSON):', {
          field: fieldName,
          value: value.substring(0, 50),
          path: req.nextUrl.pathname,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        });
        
        return {
          isBot: true,
          field: fieldName,
        };
      }
    }

    return { isBot: false };
  } catch (error: any) {
    logger.warn('Error verificando honeypot JSON:', error);
    return { isBot: false };
  }
}

/**
 * Genera HTML para un campo honeypot
 * Úsalo en formularios para agregar campos ocultos
 * 
 * @param fieldName Nombre del campo (opcional, se genera uno aleatorio si no se provee)
 * @returns HTML string para el campo honeypot
 */
export function generateHoneypotField(fieldName?: string): string {
  const name = fieldName || HONEYPOT_FIELD_NAMES[Math.floor(Math.random() * HONEYPOT_FIELD_NAMES.length)];
  
  // Estilos para ocultar el campo (CSS que los bots no suelen respetar)
  return `
    <div style="position: absolute; left: -9999px; opacity: 0; pointer-events: none; visibility: hidden;" aria-hidden="true">
      <label for="${name}">No llenar este campo</label>
      <input 
        type="text" 
        id="${name}" 
        name="${name}" 
        autocomplete="off" 
        tabindex="-1"
        aria-hidden="true"
      />
    </div>
  `.trim();
}

/**
 * Helper para React: Componente Honeypot
 * 
 * @example
 * ```tsx
 * <form>
 *   <HoneypotField />
 *   {/* otros campos del formulario *\/}
 * </form>
 * ```
 */
export function HoneypotField({ fieldName }: { fieldName?: string }) {
  const name = fieldName || HONEYPOT_FIELD_NAMES[Math.floor(Math.random() * HONEYPOT_FIELD_NAMES.length)];
  
  return (
    <div 
      style={{ 
        position: 'absolute', 
        left: '-9999px', 
        opacity: 0, 
        pointerEvents: 'none', 
        visibility: 'hidden' 
      }} 
      aria-hidden="true"
    >
      <label htmlFor={name}>No llenar este campo</label>
      <input 
        type="text" 
        id={name} 
        name={name} 
        autoComplete="off" 
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Detección básica de bots basada en headers
 * Verifica patrones comunes de bots
 */
export function detectBotViaHeaders(req: NextRequest): { isBot: boolean; reason?: string } {
  const userAgent = req.headers.get('user-agent') || '';
  const referer = req.headers.get('referer') || '';
  
  // Patrones comunes de bots
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i,
  ];
  
  // Verificar user-agent
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      // Algunos bots legítimos (Googlebot, etc.) pueden ser permitidos
      // Aquí solo detectamos, no bloqueamos automáticamente
      if (!userAgent.includes('Googlebot') && !userAgent.includes('Bingbot')) {
        return {
          isBot: true,
          reason: `User-Agent matches bot pattern: ${pattern}`,
        };
      }
    }
  }
  
  // Verificar si falta user-agent (común en bots simples)
  if (!userAgent || userAgent.trim() === '') {
    return {
      isBot: true,
      reason: 'Missing User-Agent header',
    };
  }
  
  return { isBot: false };
}


