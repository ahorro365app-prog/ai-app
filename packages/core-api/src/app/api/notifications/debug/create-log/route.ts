import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, message: 'Endpoint no disponible en producción' },
      { status: 403 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const body = await request.json().catch(() => ({}));

    const payload = {
      user_id: body?.userId || null,
      type: body?.type || 'system',
      title: body?.title || 'Notificación de prueba',
      body: body?.body || 'Mensaje de prueba generado desde debug endpoint',
      status: body?.status || 'sent',
      sent_by: body?.sentBy ?? null,
      sent_at: body?.sentAt || now,
      last_event_at: body?.lastEventAt || now,
      updated_at: body?.updatedAt || now,
      filters: body?.filters || { debug: true },
      data: body?.data || {},
    };

    const { data, error } = await supabase
      .from('notification_logs')
      .insert(payload as any)
      .select('id, title, status, sent_at, user_id, data, last_event_at, updated_at')
      .single();

    if (error) {
      console.error('Error creando log de notificación (debug):', error);

      if (error.code === 'PGRST204' && /last_event_at/i.test(error.message || '')) {
        const fallbackPayload = {
          user_id: payload.user_id,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          status: payload.status,
          sent_by: payload.sent_by,
          sent_at: payload.sent_at,
          filters: payload.filters,
          data: payload.data,
        };

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('notification_logs')
          .insert(fallbackPayload as any)
          .select('id, title, status, sent_at, user_id, data')
          .single();

        if (fallbackError) {
          console.error('Error fallback creando log (debug):', fallbackError);
          return NextResponse.json(
            {
              success: false,
              message: 'No se pudo crear el log de prueba',
              details: {
                message: fallbackError.message,
                code: fallbackError.code,
              },
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: fallbackData,
          warning:
            'Log creado sin columnas de métricas. Ejecuta la migración 2025-11-10-004 para habilitar eventos.',
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: 'No se pudo crear el log de prueba',
          details: {
            message: error.message,
            code: error.code,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error en debug/create-log:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno' },
      { status: 500 }
    );
  }
}


