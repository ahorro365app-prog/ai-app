import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getRecentCronHealths, getLastCronHealth } from '@/lib/notificationAlerts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/monitoring
 * 
 * Obtiene información de monitoreo del cron de notificaciones
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);

    // Obtener último health check
    const lastHealth = await getLastCronHealth(supabase);

    // Obtener health checks recientes
    const recentHealths = await getRecentCronHealths(supabase, limit);

    // Calcular estadísticas
    const stats = {
      totalExecutions: recentHealths.length,
      successfulExecutions: recentHealths.filter(h => h.success).length,
      failedExecutions: recentHealths.filter(h => !h.success).length,
      averageTriggersProcessed: recentHealths.length > 0
        ? Math.round(
            recentHealths.reduce((sum, h) => sum + h.triggersProcessed, 0) / recentHealths.length
          )
        : 0,
      averageCampaignsProcessed: recentHealths.length > 0
        ? Math.round(
            recentHealths.reduce((sum, h) => sum + h.campaignsProcessed, 0) / recentHealths.length
          )
        : 0,
    };

    // Verificar si hay problemas
    const issues = [];
    if (lastHealth) {
      const lastRunTime = new Date(lastHealth.timestamp).getTime();
      const now = Date.now();
      const minutesSinceLastRun = (now - lastRunTime) / (1000 * 60);

      if (minutesSinceLastRun > 30) {
        issues.push({
          type: 'delayed',
          severity: 'warning',
          message: `El cron no se ha ejecutado en ${Math.round(minutesSinceLastRun)} minutos`,
          minutesSinceLastRun: Math.round(minutesSinceLastRun),
        });
      }

      if (!lastHealth.success) {
        issues.push({
          type: 'failure',
          severity: 'error',
          message: 'La última ejecución del cron falló',
        });
      }

      if (lastHealth.triggersProcessed === 0 && lastHealth.triggersTotal > 0) {
        issues.push({
          type: 'no-triggers',
          severity: 'warning',
          message: 'Ningún trigger fue procesado en la última ejecución',
        });
      }
    } else {
      issues.push({
        type: 'no-data',
        severity: 'info',
        message: 'No hay datos de ejecución del cron aún',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        lastHealth,
        recentHealths,
        stats,
        issues,
        alertWebhookConfigured: !!process.env.NOTIFICATIONS_ALERT_WEBHOOK_URL,
      },
    });
  } catch (error: any) {
    console.error('Error obteniendo información de monitoreo:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error obteniendo información de monitoreo',
        error: error?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

