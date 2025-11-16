import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TEMPLATE_TYPES = [
  'system',
  'transaction',
  'marketing',
  'reminder',
  'referral',
  'payment',
] as const;

type TemplateType = (typeof TEMPLATE_TYPES)[number];

interface TemplatePayload {
  name?: string;
  description?: string | null;
  type?: TemplateType;
  title?: string;
  body?: string;
  data?: Record<string, any> | null;
  tags?: string[] | null;
}

const validatePayload = (payload: TemplatePayload) => {
  const errors: string[] = [];

  if (payload.name && payload.name.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres.');
  }

  if (payload.description && payload.description.length > 400) {
    errors.push('La descripción no puede superar 400 caracteres.');
  }

  if (payload.type && !TEMPLATE_TYPES.includes(payload.type)) {
    errors.push('Tipo inválido.');
  }

  if (payload.title !== undefined && payload.title.trim().length === 0) {
    errors.push('El título es obligatorio.');
  }

  if (payload.body !== undefined && payload.body.trim().length === 0) {
    errors.push('El cuerpo es obligatorio.');
  }

  return errors;
};

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = params;
    const { data, error } = await supabaseAdmin
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ success: false, message: 'Template no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error obteniendo template:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error obteniendo template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json()) as TemplatePayload;
    const { id } = params;

    const payload: TemplatePayload = {
      name: body.name?.trim(),
      description: body.description?.trim() ?? null,
      type: body.type,
      title: body.title?.trim(),
      body: body.body?.trim(),
      data: body.data ?? null,
      tags: Array.isArray(body.tags)
        ? body.tags
            .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
            .filter(Boolean)
        : null,
    };

    const errors = validatePayload(payload);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: errors.join(' ') }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.type !== undefined) updates.type = payload.type;
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.body !== undefined) updates.body = payload.body;
    if (payload.data !== undefined) updates.data = payload.data;
    if (payload.tags !== undefined) updates.tags = payload.tags;

    const { data, error } = await supabaseAdmin
      .from('notification_templates')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error actualizando template:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error actualizando template' },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = params;

    const { error } = await supabaseAdmin.from('notification_templates').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error eliminando template:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error eliminando template' },
      { status: 500 }
    );
  }
}




