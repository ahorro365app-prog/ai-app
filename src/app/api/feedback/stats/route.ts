import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { handleError } from '@/lib/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Obtener estadísticas de feedback
    const { data, error } = await supabase
      .from('estadisticas_feedback')
      .select('*');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      stats: data
    });
  } catch (error: any) {
    return handleError(error, 'Error obteniendo estadísticas de feedback');
  }
}

