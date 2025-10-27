import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
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
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo stats' },
      { status: 500 }
    );
  }
}

