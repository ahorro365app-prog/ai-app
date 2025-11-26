import { NextRequest, NextResponse } from 'next/server';
import { activateSmartPlan } from '@/lib/smartPlanActivation';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { handleError, handleValidationError, handleNotFoundError, ErrorType } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

const activateSmartSchema = z.object({
  userId: z.string().uuid('userId debe ser un UUID válido'),
});

/**
 * POST /api/referrals/activate-smart
 * 
 * Activa el plan Smart por 14 días para el usuario especificado.
 * Solo funciona si el usuario tiene 5 referidos verificados y aún no ha ganado Smart.
 * 
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = activateSmartSchema.safeParse(body);

    if (!validation.success) {
      return handleValidationError('Datos inválidos', validation.error.errors);
    }

    const { userId } = validation.data;

    // Verificar que el usuario existe
    const supabase = getSupabaseAdmin();
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !usuario) {
      return handleNotFoundError('Usuario');
    }

    // No exponer user ID en logs por seguridad
    logger.debug('🎁 Activando Smart plan');

    // Activar Smart
    const result = await activateSmartPlan(userId);

    if (!result.success || !result.activated) {
      return handleError(
        new Error(result.error || result.message),
        result.message || 'No se pudo activar el plan Smart',
        ErrorType.VALIDATION
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      details: result.details,
    });
  } catch (error: any) {
    return handleError(
      error,
      'Error interno del servidor',
      ErrorType.INTERNAL
    );
  }
}

