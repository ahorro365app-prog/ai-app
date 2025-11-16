import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type CountResult = {
  name: string;
  count: number;
  available: boolean;
};

type TimeWindowKey = 'last24h' | 'last7d' | 'last30d';

type WindowSummary = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  dismissed: number;
  failed: number;
};

const WINDOW_KEYS: TimeWindowKey[] = ['last24h', 'last7d', 'last30d'];

type NotificationLogRow = {
  id: string;
  trigger_key: string | null;
  campaign_id: string | null;
  status: string | null;
  sent_at: string | null;
  created_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  dismissed_at: string | null;
};

type TriggerLogRow = {
  trigger_key: string | null;
  sent_at: string | null;
  context: Record<string, any> | null;
};

type AggregateSummary = {
  total: WindowSummary;
  windows: Record<TimeWindowKey, WindowSummary>;
  lastSentAt: string | null;
  lastDeliveredAt: string | null;
  lastOpenedAt: string | null;
  lastClickedAt: string | null;
  lastTriggerRunAt?: string | null;
  lastTriggerRunContext?: Record<string, any> | null;
};

function createEmptyWindowSummary(): WindowSummary {
  return {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    dismissed: 0,
    failed: 0,
  };
}

function createEmptyAggregate(): AggregateSummary {
  return {
    total: createEmptyWindowSummary(),
    windows: {
      last24h: createEmptyWindowSummary(),
      last7d: createEmptyWindowSummary(),
      last30d: createEmptyWindowSummary(),
    },
    lastSentAt: null,
    lastDeliveredAt: null,
    lastOpenedAt: null,
    lastClickedAt: null,
  };
}

function isTruthyDate(value?: string | null): value is string {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

function selectLatestDate(current: string | null, candidate?: string | null): string | null {
  if (!candidate || !isTruthyDate(candidate)) {
    return current;
  }
  if (!current || !isTruthyDate(current)) {
    return candidate;
  }
  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

function mergeCounts(target: WindowSummary, log: NotificationLogRow) {
  target.sent += 1;

  const status = (log.status || '').toLowerCase();
  const delivered =
    !!log.delivered_at ||
    status === 'delivered' ||
    status === 'opened' ||
    status === 'clicked' ||
    status === 'dismissed';
  const opened = !!log.opened_at || status === 'opened' || status === 'clicked';
  const clicked = !!log.clicked_at || status === 'clicked';
  const dismissed = !!log.dismissed_at || status === 'dismissed';
  const failed = status === 'failed' || status === 'error';

  if (delivered) target.delivered += 1;
  if (opened) target.opened += 1;
  if (clicked) target.clicked += 1;
  if (dismissed) target.dismissed += 1;
  if (failed) target.failed += 1;
}

function getLogTimestamp(log: NotificationLogRow): number | null {
  if (isTruthyDate(log.sent_at)) {
    return Date.parse(log.sent_at as string);
  }
  if (isTruthyDate(log.created_at)) {
    return Date.parse(log.created_at as string);
  }
  return null;
}

function mergeLogIntoAggregate(
  aggregate: AggregateSummary,
  log: NotificationLogRow,
  rangeTimestamps: Record<TimeWindowKey, number>
) {
  mergeCounts(aggregate.total, log);

  const logTimestamp = getLogTimestamp(log);

  if (logTimestamp !== null) {
    for (const key of WINDOW_KEYS) {
      if (logTimestamp >= rangeTimestamps[key]) {
        mergeCounts(aggregate.windows[key], log);
      }
    }
  }

  aggregate.lastSentAt = selectLatestDate(aggregate.lastSentAt, log.sent_at || log.created_at);
  aggregate.lastDeliveredAt = selectLatestDate(aggregate.lastDeliveredAt, log.delivered_at);
  aggregate.lastOpenedAt = selectLatestDate(aggregate.lastOpenedAt, log.opened_at);
  aggregate.lastClickedAt = selectLatestDate(aggregate.lastClickedAt, log.clicked_at);
}

async function countByStatus(status: string) {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('notification_logs')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);

  if (error) {
    console.error(`Error contando status ${status}:`, error);
    throw error;
  }

  return count ?? 0;
}

async function countColumnNotNull(column: string): Promise<CountResult> {
  const supabase = getSupabaseAdmin();
  const response = await supabase
    .from('notification_logs')
    .select('id', { count: 'exact', head: true })
    // @ts-expect-error columna dinámica evaluada en runtime
    .not(column, 'is', null);

  if (response.error) {
    if (/column.*does not exist/i.test(response.error.message || '')) {
      return { name: column, count: 0, available: false };
    }
    console.error(`Error contando columna ${column}:`, response.error);
    throw response.error;
  }

  return {
    name: column,
    count: response.count ?? 0,
    available: true,
  };
}

async function countStatusWithinRange(status: string, fromIso: string) {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('notification_logs')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)
    .gte('sent_at', fromIso);

  if (error) {
    console.error(`Error contando status ${status} en rango`, error);
    throw error;
  }

  return count ?? 0;
}

async function countColumnNotNullWithinRange(column: string, fromIso: string) {
  const supabase = getSupabaseAdmin();
  const response = await supabase
    .from('notification_logs')
    .select('id', { count: 'exact', head: true })
    // @ts-expect-error columna dinámica evaluada en runtime
    .not(column, 'is', null)
    .gte('sent_at', fromIso);

  if (response.error) {
    if (/column.*does not exist/i.test(response.error.message || '')) {
      return { count: 0, available: false };
    }
    console.error(`Error contando columna ${column} en rango:`, response.error);
    throw response.error;
  }

  return {
    count: response.count ?? 0,
    available: true,
  };
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const [{ count: totalCount, error: totalError }] = await Promise.all([
      supabase.from('notification_logs').select('id', { count: 'exact', head: true }),
    ]);

    if (totalError) {
      console.error('Error obteniendo total de logs:', totalError);
      return NextResponse.json(
        { success: false, message: 'No se pudo obtener el resumen' },
        { status: 500 }
      );
    }

    const statuses = ['sent', 'delivered', 'opened', 'clicked', 'dismissed', 'failed'];
    const statusCounts: Record<string, { count: number; error?: string }> = {};

    for (const status of statuses) {
      try {
        statusCounts[status] = { count: await countByStatus(status) };
      } catch (error: any) {
        statusCounts[status] = {
          count: 0,
          error: error?.message || 'sin-detalle',
        };
      }
    }

    const metricColumns: Array<CountResult & { error?: string }> = [];
    for (const column of ['delivered_at', 'opened_at', 'clicked_at', 'dismissed_at']) {
      try {
        metricColumns.push(await countColumnNotNull(column));
      } catch (error: any) {
        metricColumns.push({
          name: column,
          count: 0,
          available: false,
          error: error?.message || 'sin-detalle',
        });
      }
    }

    const now = Date.now();
    const rangeMap: Record<TimeWindowKey, string> = {
      last24h: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      last7d: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
      last30d: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const windowSummaries: Record<TimeWindowKey, WindowSummary> = {
      last24h: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        dismissed: 0,
        failed: 0,
      },
      last7d: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        dismissed: 0,
        failed: 0,
      },
      last30d: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        dismissed: 0,
        failed: 0,
      },
    };

    for (const [key, fromIso] of Object.entries(rangeMap) as Array<[TimeWindowKey, string]>) {
      try {
        const [sent, delivered, opened, clicked, dismissed, failed] = await Promise.all([
          countStatusWithinRange('sent', fromIso),
          countStatusWithinRange('delivered', fromIso),
          countStatusWithinRange('opened', fromIso),
          countStatusWithinRange('clicked', fromIso),
          countStatusWithinRange('dismissed', fromIso),
          countStatusWithinRange('failed', fromIso),
        ]);

        let deliveredEvents = delivered;
        let openedEvents = opened;
        let clickedEvents = clicked;
        let dismissedEvents = dismissed;

        try {
          deliveredEvents = Math.max(
            delivered,
            (await countColumnNotNullWithinRange('delivered_at', fromIso)).count
          );
        } catch {
          // ignore
        }

        try {
          openedEvents = Math.max(
            opened,
            (await countColumnNotNullWithinRange('opened_at', fromIso)).count
          );
        } catch {
          // ignore
        }

        try {
          clickedEvents = Math.max(
            clicked,
            (await countColumnNotNullWithinRange('clicked_at', fromIso)).count
          );
        } catch {
          // ignore
        }

        try {
          dismissedEvents = Math.max(
            dismissed,
            (await countColumnNotNullWithinRange('dismissed_at', fromIso)).count
          );
        } catch {
          // ignore
        }

        windowSummaries[key] = {
          sent,
          delivered: deliveredEvents,
          opened: openedEvents,
          clicked: clickedEvents,
          dismissed: dismissedEvents,
          failed,
        };
      } catch (error) {
        console.error(`Error calculando métricas para ${key}:`, error);
        // mantener valores en cero para esa ventana
      }
    }

    const rangeTimestamps: Record<TimeWindowKey, number> = {
      last24h: Date.parse(rangeMap.last24h),
      last7d: Date.parse(rangeMap.last7d),
      last30d: Date.parse(rangeMap.last30d),
    };

    const triggerAggregates = new Map<string, AggregateSummary>();
    const campaignAggregates = new Map<string, AggregateSummary>();

    const { data: recentLogs, error: recentLogsError } = await supabase
      .from('notification_logs')
      .select(
        'id, trigger_key, campaign_id, status, sent_at, created_at, delivered_at, opened_at, clicked_at, dismissed_at'
      )
      .gte('created_at', rangeMap.last30d);

    if (recentLogsError) {
      console.error('Error obteniendo logs recientes para agregaciones:', recentLogsError);
    } else if (recentLogs) {
      for (const log of recentLogs as NotificationLogRow[]) {
        if (log.trigger_key) {
          const key = log.trigger_key;
          if (!triggerAggregates.has(key)) {
            triggerAggregates.set(key, createEmptyAggregate());
          }
          mergeLogIntoAggregate(triggerAggregates.get(key)!, log, rangeTimestamps);
        }

        if (log.campaign_id) {
          const campaignId = log.campaign_id;
          if (!campaignAggregates.has(campaignId)) {
            campaignAggregates.set(campaignId, createEmptyAggregate());
          }
          mergeLogIntoAggregate(campaignAggregates.get(campaignId)!, log, rangeTimestamps);
        }
      }
    }

    const triggerLatestRuns = new Map<string, { sent_at: string | null; context: Record<string, any> | null }>();
    try {
      const { data: triggerLogs, error: triggerLogsError } = await supabase
        .from('notification_trigger_logs')
        .select('trigger_key, sent_at, context')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (triggerLogsError) {
        console.error('Error obteniendo últimos trigger logs:', triggerLogsError);
      } else if (triggerLogs) {
        for (const log of triggerLogs as TriggerLogRow[]) {
          if (!log.trigger_key || triggerLatestRuns.has(log.trigger_key)) continue;
          triggerLatestRuns.set(log.trigger_key, {
            sent_at: log.sent_at || null,
            context: log.context || null,
          });
        }
      }
    } catch (triggerError) {
      console.error('Error consultando notification_trigger_logs:', triggerError);
    }

    const triggerSummary = Array.from(triggerAggregates.entries())
      .map(([key, aggregate]) => ({
        key,
        total: aggregate.total,
        windows: aggregate.windows,
        lastSentAt: aggregate.lastSentAt,
        lastDeliveredAt: aggregate.lastDeliveredAt,
        lastOpenedAt: aggregate.lastOpenedAt,
        lastClickedAt: aggregate.lastClickedAt,
        lastTriggerRunAt: triggerLatestRuns.get(key)?.sent_at || null,
        lastTriggerRunContext: triggerLatestRuns.get(key)?.context || null,
      }))
      .sort((a, b) => b.total.sent - a.total.sent);

    const campaignSummary = Array.from(campaignAggregates.entries())
      .map(([id, aggregate]) => ({
        id,
        total: aggregate.total,
        windows: aggregate.windows,
        lastSentAt: aggregate.lastSentAt,
        lastDeliveredAt: aggregate.lastDeliveredAt,
        lastOpenedAt: aggregate.lastOpenedAt,
        lastClickedAt: aggregate.lastClickedAt,
      }))
      .sort((a, b) => b.total.sent - a.total.sent);

    // Obtener último health check del cron
    let cronHealth = null;
    try {
      const { data: healthData, error: healthError } = await supabase
        .from('notification_trigger_logs')
        .select('trigger_key, context, sent_at')
        .eq('trigger_key', 'trigger.cron.health')
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!healthError && healthData) {
        cronHealth = {
          lastRunAt: healthData.sent_at,
          context: healthData.context,
        };
      }
    } catch (healthErr: any) {
      console.error('Error obteniendo health check del cron:', healthErr);
      // No fallar el endpoint si el health check no se puede obtener
    }

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount ?? 0,
        byStatus: statusCounts,
        metrics: metricColumns,
        windows: windowSummaries,
        aggregations: {
          triggers: triggerSummary,
          campaigns: campaignSummary,
          meta: {
            rangeStart: rangeMap.last30d,
            computedAt: new Date().toISOString(),
          },
        },
        cronHealth, // Información del último health check del cron
      },
    });
  } catch (error: any) {
    console.error('Error en /api/notifications/logs/summary:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error interno',
        details: {
          error: error?.message,
        },
      },
      { status: 500 }
    );
  }
}


