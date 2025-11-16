import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Obtener logs de verificaciones de versión de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs, error: logsError } = await supabase
      .from('version_check_logs')
      .select('app_version, platform, status, checked_at')
      .gte('checked_at', thirtyDaysAgo.toISOString())
      .order('checked_at', { ascending: false });

    if (logsError) {
      console.error('Error obteniendo logs de versiones:', logsError);
      return NextResponse.json(
        { success: false, message: 'Error obteniendo estadísticas' },
        { status: 500 }
      );
    }

    // Calcular estadísticas
    const total = logs?.length || 0;
    const upToDate = logs?.filter(l => l.status === 'up_to_date').length || 0;
    const updateRecommended = logs?.filter(l => l.status === 'update_recommended').length || 0;
    const updateRequired = logs?.filter(l => l.status === 'update_required').length || 0;
    const blocked = logs?.filter(l => l.status === 'blocked').length || 0;

    // Distribución de versiones
    const versionCounts: Record<string, number> = {};
    logs?.forEach(log => {
      if (log.app_version) {
        versionCounts[log.app_version] = (versionCounts[log.app_version] || 0) + 1;
      }
    });

    const versionDistribution = Object.entries(versionCounts)
      .map(([version, count]) => ({
        version,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 versiones

    // Distribución por plataforma
    const platformCounts: Record<string, number> = {};
    logs?.forEach(log => {
      if (log.platform) {
        platformCounts[log.platform] = (platformCounts[log.platform] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        total,
        upToDate,
        updateRecommended,
        updateRequired,
        blocked,
        upToDatePercent: total > 0 ? Math.round((upToDate / total) * 100) : 0,
        versionDistribution,
        platformDistribution: platformCounts,
      },
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/app-versions/stats:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


