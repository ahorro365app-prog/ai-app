import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { handleError, ErrorType } from '@/lib/errorHandler';

/**
 * Readiness probe endpoint
 * Verifica que la aplicación está lista para recibir tráfico
 * Más ligero que /api/health, solo verifica servicios críticos
 * 
 * @route GET /api/ready
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar solo el servicio más crítico: Base de datos
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('usuarios').select('id').limit(1);
    
    if (error) {
      return NextResponse.json(
        {
          ready: false,
          error: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ready: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleError(error, 'Error verificando readiness', ErrorType.INTERNAL_ERROR);
  }
}


