import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { handleError, ErrorType } from '@/lib/errorHandler';

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

    logger.debug(`🔍 Validando código de referido`);

    // Buscar usuario con ese código de referido
    const { data: referidor, error: referidorError } = await supabase
      .from('usuarios')
      .select('id, nombre, codigo_referido')
      .eq('codigo_referido', code.toUpperCase())
      .single();

    if (referidorError || !referidor) {
      logger.debug(`❌ Código no encontrado`);
      return NextResponse.json({
        valid: false,
        message: 'Código no encontrado',
      });
    }

    // Extraer primer nombre (split por espacio, tomar primer elemento)
    const primerNombre = referidor.nombre?.split(' ')[0] || 'Usuario';

    logger.debug(`✅ Código válido - Referidor encontrado`);

    return NextResponse.json({
      valid: true,
      referidorNombre: primerNombre,
    });
  } catch (error: any) {
    return handleError(error, 'Error al validar código');
  }
}

