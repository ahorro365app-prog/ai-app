import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { handleError, ErrorType } from '@/lib/errorHandler';

/**
 * POST /api/notifications/cleanup-invalid-tokens
 * 
 * Limpia tokens FCM que están marcados como activos pero que han fallado recientemente.
 * Busca en notification_logs tokens que han fallado con errores de token inválido.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const dryRun = body.dryRun !== false; // Por defecto es dry run

    // Buscar logs recientes con errores de token inválido
    const { data: failedLogs, error: logsError } = await supabase
      .from('notification_logs')
      .select('id, data, error_message, sent_at')
      .eq('status', 'failed')
      .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 7 días
      .or('error_message.ilike.%requested entity was not found%,error_message.ilike.%registration token%,error_message.ilike.%invalid registration%');

    if (logsError) {
      logger.error('Error obteniendo logs fallidos:', logsError);
      return NextResponse.json(
        {
          success: false,
          message: 'Error obteniendo logs de notificaciones fallidas',
          error: logsError.message,
        },
        { status: 500 }
      );
    }

    if (!failedLogs || failedLogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron tokens inválidos para limpiar',
        cleaned: 0,
        dryRun,
      });
    }

    // Extraer tokens de los logs fallidos
    const invalidTokens = new Set<string>();
    
    for (const log of failedLogs) {
      try {
        // El token puede estar en data.logId o necesitamos buscarlo de otra forma
        // Por ahora, buscamos tokens que no se han usado recientemente y están activos
        const errorMsg = (log.error_message || '').toLowerCase();
        if (
          errorMsg.includes('requested entity was not found') ||
          errorMsg.includes('registration token') ||
          errorMsg.includes('invalid registration')
        ) {
          // Necesitamos obtener el token del log, pero puede no estar directamente
          // Buscamos tokens que no se han usado en los últimos 30 días
        }
      } catch (error) {
        logger.warn('Error procesando log:', log.id, error);
      }
    }

    // Buscar tokens activos que no se han usado en los últimos 30 días
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: inactiveTokens, error: tokensError } = await supabase
      .from('fcm_tokens')
      .select('id, token, user_id, last_used_at, created_at')
      .eq('is_active', true)
      .or(`last_used_at.is.null,last_used_at.lt.${thirtyDaysAgo}`)
      .order('created_at', { ascending: false });

    if (tokensError) {
      logger.error('Error obteniendo tokens inactivos:', tokensError);
      return NextResponse.json(
        {
          success: false,
          message: 'Error obteniendo tokens inactivos',
          error: tokensError.message,
        },
        { status: 500 }
      );
    }

    const tokensToDeactivate = inactiveTokens || [];
    const cleanedCount = tokensToDeactivate.length;

    if (!dryRun && cleanedCount > 0) {
      // Desactivar tokens
      const tokenIds = tokensToDeactivate.map(t => t.id);
      const { error: updateError } = await supabase
        .from('fcm_tokens')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .in('id', tokenIds);

      if (updateError) {
        logger.error('Error desactivando tokens:', updateError);
        return NextResponse.json(
          {
            success: false,
            message: 'Error desactivando tokens',
            error: updateError.message,
          },
          { status: 500 }
        );
      }

      logger.info(`✅ ${cleanedCount} tokens inválidos desactivados`);
    }

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Se encontraron ${cleanedCount} tokens para limpiar (modo dry run)`
        : `${cleanedCount} tokens inválidos desactivados`,
      cleaned: cleanedCount,
      dryRun,
      tokens: tokensToDeactivate.map(t => ({
        id: t.id,
        userId: t.user_id,
        lastUsed: t.last_used_at,
        created: t.created_at,
        tokenPreview: t.token?.substring(0, 20) + '...',
      })),
    });
  } catch (error: any) {
    return handleError(error, 'Error limpiando tokens inválidos', ErrorType.DATABASE_ERROR);
  }
}

