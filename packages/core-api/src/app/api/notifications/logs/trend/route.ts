import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type AllowedStatus = 'sent' | 'delivered' | 'opened' | 'clicked' | 'dismissed' | 'failed';
type AllowedType = 'transaction' | 'marketing' | 'system' | 'reminder' | 'referral' | 'payment' | 'unknown';

type DayBucket = {
  date: string;
  sent: number;
  statuses: Record<AllowedStatus, number>;
  events: {
    delivered: number;
    opened: number;
    clicked: number;
    dismissed: number;
  };
  types: Record<AllowedType, number>;
};

const STATUS_VALUES: AllowedStatus[] = ['sent', 'delivered', 'opened', 'clicked', 'dismissed', 'failed'];
const TYPE_VALUES: AllowedType[] = ['transaction', 'marketing', 'system', 'reminder', 'referral', 'payment', 'unknown'];

const MAX_RANGE_DAYS = 90;
const MAX_ROWS = 10000;

const toDayKey = (value: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

const ensureBucket = (map: Map<string, DayBucket>, dateKey: string): DayBucket => {
  if (!map.has(dateKey)) {
    const emptyStatuses: Record<AllowedStatus, number> = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      dismissed: 0,
      failed: 0,
    };
    const emptyTypes: Record<AllowedType, number> = {
      transaction: 0,
      marketing: 0,
      system: 0,
      reminder: 0,
      referral: 0,
      payment: 0,
      unknown: 0,
    };
    const bucket: DayBucket = {
      date: dateKey,
      sent: 0,
      statuses: { ...emptyStatuses },
      events: {
        delivered: 0,
        opened: 0,
        clicked: 0,
        dismissed: 0,
      },
      types: { ...emptyTypes },
    };
    map.set(dateKey, bucket);
  }
  return map.get(dateKey)!;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const rangeParam = request.nextUrl.searchParams.get('range');
    const daysRequested = Math.min(
      Math.max(rangeParam ? Number.parseInt(rangeParam, 10) || 7 : 7, 1),
      MAX_RANGE_DAYS
    );

    const now = new Date();
    const fromDate = new Date(now.getTime() - daysRequested * 24 * 60 * 60 * 1000);
    const fromIso = fromDate.toISOString();

    const { data, error } = await supabase
      .from('notification_logs')
      .select(
        'sent_at, status, type, delivered_at, opened_at, clicked_at, dismissed_at'
      )
      .gte('sent_at', fromIso)
      .order('sent_at', { ascending: true })
      .limit(MAX_ROWS);

    if (error) {
      console.error('Error obteniendo tendencia de notification_logs:', error);
      return NextResponse.json(
        { success: false, message: 'No se pudo obtener la tendencia' },
        { status: 500 }
      );
    }

    const buckets = new Map<string, DayBucket>();
    const eventBuckets: Record<'delivered' | 'opened' | 'clicked' | 'dismissed', Map<string, DayBucket>> = {
      delivered: new Map(),
      opened: new Map(),
      clicked: new Map(),
      dismissed: new Map(),
    };

    const rowCount = data?.length ?? 0;

    (data ?? []).forEach((row) => {
      const sentKey = toDayKey(row.sent_at);
      if (!sentKey) return;

      const statusValue: AllowedStatus = STATUS_VALUES.includes(row.status as AllowedStatus)
        ? (row.status as AllowedStatus)
        : 'sent';

      const typeValue: AllowedType = TYPE_VALUES.includes(row.type as AllowedType)
        ? (row.type as AllowedType)
        : 'unknown';

      const bucket = ensureBucket(buckets, sentKey);
      bucket.sent += 1;
      bucket.statuses[statusValue] += 1;
      bucket.types[typeValue] += 1;

      const deliveredKey = toDayKey(row.delivered_at);
      if (deliveredKey) {
        const deliveredBucket = ensureBucket(eventBuckets.delivered, deliveredKey);
        deliveredBucket.events.delivered += 1;
      }

      const openedKey = toDayKey(row.opened_at);
      if (openedKey) {
        const openedBucket = ensureBucket(eventBuckets.opened, openedKey);
        openedBucket.events.opened += 1;
      }

      const clickedKey = toDayKey(row.clicked_at);
      if (clickedKey) {
        const clickedBucket = ensureBucket(eventBuckets.clicked, clickedKey);
        clickedBucket.events.clicked += 1;
      }

      const dismissedKey = toDayKey(row.dismissed_at);
      if (dismissedKey) {
        const dismissedBucket = ensureBucket(eventBuckets.dismissed, dismissedKey);
        dismissedBucket.events.dismissed += 1;
      }
    });

    // Merge event buckets into main buckets to align with sent date buckets (keeping event date perspective)
    for (const map of Object.values(eventBuckets)) {
      for (const [dateKey, eventBucket] of map.entries()) {
        const bucket = ensureBucket(buckets, dateKey);
        bucket.events.delivered += eventBucket.events.delivered;
        bucket.events.opened += eventBucket.events.opened;
        bucket.events.clicked += eventBucket.events.clicked;
        bucket.events.dismissed += eventBucket.events.dismissed;
      }
    }

    const sortedBuckets = Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        requestedDays: daysRequested,
        from: fromIso,
        to: now.toISOString(),
        totalRowsConsidered: rowCount,
        truncated: rowCount >= MAX_ROWS,
        days: sortedBuckets,
      },
    });
  } catch (error: any) {
    console.error('Error en /api/notifications/logs/trend:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error obteniendo tendencia' },
      { status: 500 }
    );
  }
}

