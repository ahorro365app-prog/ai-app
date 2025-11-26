import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { handleError } from '@/lib/errorHandler';

const BASE_SELECT =
  'id, user_id, type, title, body, status, sent_at, error_message';
const DETAILED_SELECT =
  'id, user_id, type, title, body, status, sent_at, delivered_at, opened_at, clicked_at, dismissed_at, last_event_at, error_message, filters, data';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;

    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 100);
    const status = searchParams.get('status');
    const detailed = searchParams.get('detailed') === 'true';

    let selectColumns = detailed ? DETAILED_SELECT : BASE_SELECT;

    let query = supabase
      .from('notification_logs')
      .select(selectColumns)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    let { data, error } = await query;

    if (error && detailed && /column.*does not exist/i.test(error.message || '')) {
      selectColumns = BASE_SELECT;
      query = supabase
        .from('notification_logs')
        .select(selectColumns)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      ({ data, error } = await query);
    }

    if (error) {
      return handleError(error, 'Error obteniendo historial');
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return handleError(error, 'Error obteniendo historial');
  }
}



