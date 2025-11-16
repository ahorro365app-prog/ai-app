import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const VALID_EVENTS = ['delivered', 'opened', 'clicked', 'dismissed'] as const;
type NotificationEvent = (typeof VALID_EVENTS)[number];

const STATUS_PRIORITY: Record<string, number> = {
  failed: -1,
  sent: 0,
  delivered: 1,
  opened: 2,
  clicked: 3,
  dismissed: 1,
};

const EVENT_STATUS_MAP: Record<NotificationEvent, string> = {
  delivered: 'delivered',
  opened: 'opened',
  clicked: 'clicked',
  dismissed: 'dismissed',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const logId = typeof body?.logId === 'string' ? body.logId : null;
    const event: NotificationEvent | null = VALID_EVENTS.includes(body?.event)
      ? body.event
      : null;
    const metadata =
      body?.metadata && typeof body.metadata === 'object' ? body.metadata : null;

    if (!logId) {
      return NextResponse.json(
        { success: false, message: 'logId requerido' },
        { status: 400 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Evento inválido' },
        { status: 400 }
      );
    }

    const { data: log, error } = await supabase
      .from('notification_logs')
      .select(
        'id, status, delivered_at, opened_at, clicked_at, dismissed_at, last_event_at, data'
      )
      .eq('id', logId)
      .single();

    if (error && /column.*does not exist/i.test(error.message || '')) {
      return NextResponse.json(
        {
          success: false,
          message:
            'La tabla notification_logs no tiene columnas de eventos. Ejecuta la migración 2025-11-10-004.',
        },
        { status: 500 }
      );
    }

    if (error?.code === 'PGRST116' || !log) {
      return NextResponse.json(
        { success: false, message: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const updates: Record<string, any> = {};

    if (event === 'delivered' && !log.delivered_at) {
      updates.delivered_at = now;
    }

    if (event === 'opened' && !log.opened_at) {
      updates.opened_at = now;
      if (!log.delivered_at) {
        updates.delivered_at = now;
      }
    }

    if (event === 'clicked' && !log.clicked_at) {
      updates.clicked_at = now;
      if (!log.delivered_at) {
        updates.delivered_at = now;
      }
    }

    if (event === 'dismissed' && !log.dismissed_at) {
      updates.dismissed_at = now;
      if (!log.delivered_at) {
        updates.delivered_at = now;
      }
    }

    const targetStatus = EVENT_STATUS_MAP[event];
    const currentPriority = STATUS_PRIORITY[log.status] ?? 0;
    const targetPriority = STATUS_PRIORITY[targetStatus] ?? currentPriority;

    if (targetPriority >= currentPriority) {
      updates.status = targetStatus;
    }

    if (metadata) {
      const currentData =
        typeof log.data === 'object' && log.data !== null ? log.data : {};
      updates.data = {
        ...currentData,
        lastEventMeta: {
          ...(currentData.lastEventMeta || {}),
          [event]: metadata,
        },
      };
    }

    if (Object.keys(updates).length > 0) {
      updates.last_event_at = now;
      updates.updated_at = now;
    } else {
      // Aunque no haya cambios en columnas específicas, actualizamos métricas para consistencia
      updates.last_event_at = now;
      updates.updated_at = now;
    }

    const { data: updated, error: updateError } = await supabase
      .from('notification_logs')
      .update(updates)
      .eq('id', logId)
      .select(
        'status, delivered_at, opened_at, clicked_at, dismissed_at, last_event_at, updated_at'
      )
      .single();

    if (updateError) {
      console.error('Error actualizando notification_logs:', updateError);
      return NextResponse.json(
        { success: false, message: 'No se pudo registrar el evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Evento registrado',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error en /api/notifications/events:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error registrando evento',
      },
      { status: 500 }
    );
  }
}




