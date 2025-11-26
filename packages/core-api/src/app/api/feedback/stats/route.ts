import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { handleError, ErrorType } from '@/lib/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Obtener estadísticas de feedback
    const { data, error } = await supabase
      .from('estadisticas_feedback')
      .select('*');

    if (error) {
      return handleError(
        error,
        'Error obteniendo estadísticas de feedback',
        ErrorType.DATABASE
      );
    }

    return NextResponse.json({
      success: true,
      stats: data
    });
  } catch (error: any) {
    return handleError(
      error,
      'Error obteniendo stats',
      ErrorType.INTERNAL
    );
  }
}

