import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { handleError, ErrorType } from '@/lib/errorHandler';

/**
 * Health check endpoint
 * Verifica el estado de los servicios críticos
 * 
 * @route GET /api/health
 */
export async function GET(req: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string; latency?: number }> = {};
  let overallStatus = 'ok';

  // Check 1: Supabase Database
  try {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('usuarios').select('id').limit(1);
    const latency = Date.now() - startTime;
    
    if (error) {
      checks.database = {
        status: 'error',
        message: error.message,
        latency,
      };
      overallStatus = 'error';
    } else {
      checks.database = {
        status: 'ok',
        latency,
      };
    }
  } catch (error: any) {
    checks.database = {
      status: 'error',
      message: error.message || 'Error desconocido',
    };
    overallStatus = 'error';
  }

  // Check 2: Redis (Upstash) - verificar conectividad básica
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!redisUrl || !redisToken) {
      checks.redis = {
        status: 'error',
        message: 'Variables de entorno no configuradas',
      };
      // No marcar como error general si Redis no está configurado (opcional)
    } else {
      // Intentar ping a Redis
      const startTime = Date.now();
      const response = await fetch(`${redisUrl}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${redisToken}`,
        },
      });
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        checks.redis = {
          status: 'ok',
          latency,
        };
      } else {
        checks.redis = {
          status: 'error',
          message: `HTTP ${response.status}`,
          latency,
        };
        overallStatus = 'error';
      }
    }
  } catch (error: any) {
    checks.redis = {
      status: 'error',
      message: error.message || 'Error de conexión',
    };
    // Redis es opcional, no marcar como error general
  }

  // Check 3: Environment variables críticas
  const criticalEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missingEnvVars: string[] = [];
  criticalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingEnvVars.push(varName);
    }
  });

  if (missingEnvVars.length > 0) {
    checks.environment = {
      status: 'error',
      message: `Variables faltantes: ${missingEnvVars.join(', ')}`,
    };
    overallStatus = 'error';
  } else {
    checks.environment = {
      status: 'ok',
    };
  }

  const statusCode = overallStatus === 'ok' ? 200 : 503;
  
  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );
}


