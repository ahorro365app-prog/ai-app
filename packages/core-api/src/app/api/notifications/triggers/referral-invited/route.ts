import { NextRequest, NextResponse } from 'next/server';
import { triggerReferralInvitedForId } from '@/lib/notificationCampaigns';
import { z } from 'zod';
import { handleError, handleValidationError, ErrorType } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

const triggerSchema = z.object({
  referralId: z.string().uuid('referralId debe ser un UUID válido'),
});

/**
 * POST /api/notifications/triggers/referral-invited
 * 
 * Invoca el trigger de notificación cuando se crea un nuevo referido.
 * Este endpoint debe ser llamado después de insertar un registro en la tabla `referidos`.
 * 
 * Body: { referralId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = triggerSchema.safeParse(body);

    if (!validation.success) {
      return handleValidationError('Datos inválidos', validation.error.errors);
    }

    const { referralId } = validation.data;

    logger.debug('🔔 Invocando trigger de referido invitado');

    const result = await triggerReferralInvitedForId(referralId);

    if (!result.success) {
      return handleError(
        new Error(result.error || 'Error ejecutando trigger'),
        result.message || 'Error ejecutando trigger',
        ErrorType.INTERNAL
      );
    }

    logger.debug('✅ Trigger ejecutado exitosamente');

    return NextResponse.json({
      success: true,
      message: result.message,
      summary: result.summary,
    });
  } catch (error: any) {
    return handleError(
      error,
      'Error interno del servidor',
      ErrorType.INTERNAL
    );
  }
}

