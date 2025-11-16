import { NextRequest, NextResponse } from 'next/server';
import { triggerReferralInvitedForId } from '@/lib/notificationCampaigns';
import { z } from 'zod';

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
      return NextResponse.json(
        {
          success: false,
          message: 'Datos inválidos',
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { referralId } = validation.data;

    console.log(`🔔 Invocando trigger de referido invitado para: ${referralId}`);

    const result = await triggerReferralInvitedForId(referralId);

    if (!result.success) {
      console.error('❌ Error ejecutando trigger:', result.error);
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Error ejecutando trigger',
          error: result.error,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Trigger ejecutado exitosamente:`, result.summary);

    return NextResponse.json({
      success: true,
      message: result.message,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error('❌ Error en endpoint de trigger:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: error?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

