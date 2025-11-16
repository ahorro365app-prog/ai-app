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

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notification_campaigns')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error obteniendo campaign:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error obteniendo campaña' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body?.name === 'string' && body.name.trim().length >= 3) {
      updates.name = body.name.trim();
    }

    if (typeof body?.description === 'string') {
      updates.description = body.description.trim() || null;
    }

    if (typeof body?.title === 'string' && body.title.trim().length > 0) {
      updates.title = body.title.trim();
    }

    if (typeof body?.body === 'string' && body.body.trim().length > 0) {
      updates.body = body.body.trim();
    }

    if (typeof body?.imageUrl === 'string') {
      updates.image_url = body.imageUrl.trim() || null;
    }

    if (body?.data !== undefined) {
      updates.data = sanitizeJson(body.data);
    }

    if (body?.filters !== undefined) {
      updates.filters = sanitizeJson(body.filters) as SegmentFilters;
    }

    if (typeof body?.campaignType === 'string' && ALLOWED_TYPES.includes(body.campaignType)) {
      updates.campaign_type = body.campaignType as NotificationCategory;
    }

    if (typeof body?.scheduledFor === 'string' && body.scheduledFor.trim().length > 0) {
      updates.scheduled_for = new Date(body.scheduledFor).toISOString();
    } else if (body?.scheduledFor === null) {
      updates.scheduled_for = null;
    }

    if (typeof body?.targetUsersCount === 'number') {
      updates.target_users_count = Math.max(0, Math.floor(body.targetUsersCount));
    }

    if (typeof body?.status === 'string') {
      if (!ALLOWED_STATUSES.has(body.status)) {
        return NextResponse.json(
          { success: false, message: 'Estado inválido para la campaña.' },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionaron cambios válidos.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notification_campaigns')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error actualizando campaign:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error actualizando campaña' },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();

    const { data: existing, error: fetchError } = await supabase
      .from('notification_campaigns')
      .select('status')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    if (existing.status === 'sent' || existing.status === 'sending') {
      return NextResponse.json(
        { success: false, message: 'No se puede cancelar una campaña enviada o en curso.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('notification_campaigns')
      .update({
        status: 'cancelled',
        scheduled_for: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error cancelando campaign:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error cancelando campaña' },
      { status: 500 }
    );
  }
}

