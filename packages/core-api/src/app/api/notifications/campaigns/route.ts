import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { SegmentFilters, NotificationCategory } from '@/lib/notificationSegments';

const ALLOWED_STATUSES = new Set(['draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed']);
const ALLOWED_TYPES: NotificationCategory[] = [
  'transaction',
  'marketing',
  'system',
  'reminder',
  'referral',
  'payment',
];

const sanitizeJson = (value: any) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let query = supabase
      .from('notification_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('Error listando campaigns:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error listando campañas',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const content = typeof body?.body === 'string' ? body.body.trim() : '';

    if (!name || name.length < 3) {
      return NextResponse.json(
        { success: false, message: 'El nombre es obligatorio y debe tener al menos 3 caracteres.' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'El título es obligatorio.' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { success: false, message: 'El cuerpo es obligatorio.' },
        { status: 400 }
      );
    }

    const campaignType: NotificationCategory = ALLOWED_TYPES.includes(body?.campaignType)
      ? body.campaignType
      : 'marketing';

    const description =
      typeof body?.description === 'string' && body.description.trim().length > 0
        ? body.description.trim()
        : null;

    const imageUrl =
      typeof body?.imageUrl === 'string' && body.imageUrl.trim().length > 0
        ? body.imageUrl.trim()
        : null;

    const data = sanitizeJson(body?.data);
    const filters = sanitizeJson(body?.filters) as SegmentFilters;

    const adminId = typeof body?.adminId === 'string' ? body.adminId : null;

    const scheduledFor =
      typeof body?.scheduledFor === 'string' && body.scheduledFor.trim().length > 0
        ? new Date(body.scheduledFor).toISOString()
        : null;

    const status =
      typeof body?.status === 'string' && ALLOWED_STATUSES.has(body.status)
        ? body.status
        : scheduledFor
        ? 'scheduled'
        : 'draft';

    const { data: insertData, error } = await supabase
      .from('notification_campaigns')
      .insert([
        {
          name,
          description,
          campaign_type: campaignType,
          title,
          body: content,
          image_url: imageUrl,
          data,
          filters,
          scheduled_for: scheduledFor,
          status,
          created_by: adminId,
        },
      ])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: insertData,
    });
  } catch (error: any) {
    console.error('Error creando campaign:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error creando campaña',
      },
      { status: 500 }
    );
  }
}

