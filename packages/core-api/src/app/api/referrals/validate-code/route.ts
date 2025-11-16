import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const validateCodeSchema = z.object({
  code: z.string().length(8, 'El código debe tener 8 caracteres'),
});

/**
 * POST /api/referrals/validate-code
 * 
 * Valida si un código de referido existe y retorna el primer nombre del referidor.
 * 
 * Body: { code: string }
 * Response: { valid: boolean, referidorNombre?: string, message?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          valid: false,
          message: 'El código debe tener 8 caracteres',
        },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const supabase = getSupabaseAdmin();

    console.log(`🔍 Validando código de referido: ${code}`);

    // Buscar usuario con ese código de referido
    const { data: referidor, error: referidorError } = await supabase
      .from('usuarios')
      .select('id, nombre, codigo_referido')
      .eq('codigo_referido', code.toUpperCase())
      .single();

    if (referidorError || !referidor) {
      console.log(`❌ Código no encontrado: ${code}`);
      return NextResponse.json({
        valid: false,
        message: 'Código no encontrado',
      });
    }

    // Extraer primer nombre (split por espacio, tomar primer elemento)
    const primerNombre = referidor.nombre?.split(' ')[0] || 'Usuario';

    console.log(`✅ Código válido - Referidor: ${primerNombre}`);

    return NextResponse.json({
      valid: true,
      referidorNombre: primerNombre,
    });
  } catch (error: any) {
    console.error('❌ Error validando código:', error);
    return NextResponse.json(
      {
        valid: false,
        message: 'Error al validar código',
        error: error?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

