import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notificationService';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { handleError, ErrorType } from '@/lib/errorHandler';

/**
 * POST /api/notifications/test-send
 * 
 * Endpoint de prueba para enviar una notificación de prueba.
 * 
 * Body: { userId?: string, token?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token: providedToken } = body;
    const supabase = getSupabaseAdmin();

    // Obtener token FCM
    let fcmToken: string | null = null;

    if (providedToken) {
      fcmToken = providedToken;
    } else if (userId) {
      const { data: tokens, error } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error obteniendo token:', error);
        return NextResponse.json(
          {
            success: false,
            message: 'Error obteniendo token FCM del usuario',
            error: error.message,
          },
          { status: 500 }
        );
      }

      if (!tokens || !tokens.token) {
        return NextResponse.json(
          {
            success: false,
            message: 'Usuario no tiene tokens FCM activos registrados',
          },
          { status: 404 }
        );
      }

      fcmToken = tokens.token;
    } else {
      // Si no se proporciona userId ni token, obtener el primer token activo
      const { data: tokens, error } = await supabase
        .from('fcm_tokens')
        .select('token, user_id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !tokens) {
        return NextResponse.json(
          {
            success: false,
            message: 'No hay tokens FCM activos disponibles para prueba',
          },
          { status: 404 }
        );
      }

      fcmToken = tokens.token;
    }

    if (!fcmToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'No se pudo obtener un token FCM para la prueba',
        },
        { status: 400 }
      );
    }

    // Enviar notificación de prueba
    const testTitle = '🧪 Notificación de Prueba - Ahorro365';
    const testBody = `Esta es una notificación de prueba enviada el ${new Date().toLocaleString('es-ES')}`;

    logger.info('📤 Enviando notificación de prueba...', {
      token: fcmToken.substring(0, 20) + '...',
      userId,
    });

    const result = await notificationService.sendToToken({
      token: fcmToken,
      title: testTitle,
      body: testBody,
      type: 'system',
      data: {
        test: 'true',
        timestamp: new Date().toISOString(),
      },
      adminId: 'test-endpoint',
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Notificación de prueba enviada exitosamente',
        details: {
          token: fcmToken.substring(0, 20) + '...',
          title: testTitle,
          body: testBody,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Error al enviar notificación de prueba',
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return handleError(error, 'Error enviando notificación de prueba', ErrorType.EXTERNAL_API_ERROR);
  }
}

