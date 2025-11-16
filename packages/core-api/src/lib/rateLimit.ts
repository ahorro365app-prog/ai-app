import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Cliente Redis de Upstash
 * Requiere variables de entorno:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Rate limiter para login (5 intentos por 15 minutos)
 */
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/login',
});

/**
 * Rate limiter para webhooks (100 requests por 15 minutos)
 */
export const webhookRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/webhook',
});

/**
 * Rate limiter para API general (100 requests por 15 minutos)
 */
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/api',
});

/**
 * Rate limiter para procesamiento de audio (20 requests por hora)
 */
export const audioRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: '@upstash/ratelimit/audio',
});

/**
 * Rate limiter para pagos (10 requests por hora)
 */
export const paymentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: '@upstash/ratelimit/payment',
});

/**
 * Obtiene el identificador del cliente desde la request
 * Prioridad: IP address > User ID > 'anonymous'
 */
export function getClientIdentifier(req: Request): string {
  // Intentar obtener IP del header (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : null);
  
  if (ip) {
    return ip;
  }
  
  // Intentar obtener userId del header (si está autenticado)
  const userId = req.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback: usar 'anonymous'
  return 'anonymous';
}

/**
 * Verifica rate limit y retorna respuesta si excede el límite
 */
export async function checkRateLimit(
  rateLimiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number } | null> {
  try {
    const { success, limit, remaining, reset } = await rateLimiter.limit(identifier);
    
    return {
      success,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // En caso de error, permitir la request (fail open)
    // En producción podrías querer fail closed
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
}

