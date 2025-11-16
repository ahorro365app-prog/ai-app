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

  if (!payload.name || typeof payload.name !== 'string' || payload.name.trim().length < 3) {
    errors.push('El nombre es obligatorio y debe tener al menos 3 caracteres.');
  }

  if (payload.description && payload.description.length > 400) {
    errors.push('La descripción no puede superar 400 caracteres.');
  }

  if (!payload.type || !TEMPLATE_TYPES.includes(payload.type)) {
    errors.push('Tipo inválido.');
  }

  if (!payload.title || payload.title.trim().length === 0) {
    errors.push('El título es obligatorio.');
  }

  if (!payload.body || payload.body.trim().length === 0) {
    errors.push('El cuerpo es obligatorio.');
  }

  return errors;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const templateType = searchParams.get('type');

    let query = supabase
      .from('notification_templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (templateType && TEMPLATE_TYPES.includes(templateType as TemplateType)) {
      query = query.eq('type', templateType);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error obteniendo templates:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error obteniendo templates',
        ...(process.env.NODE_ENV !== 'production'
          ? {
              details: {
                code: error?.code,
                hint: error?.hint,
                details: error?.details,
                message: error?.message,
                stack: error?.stack,
              },
            }
          : {}),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as TemplatePayload;

    const payload: TemplatePayload = {
      name: body.name?.trim(),
      description: body.description?.trim() || null,
      type: (body.type || 'system') as TemplateType,
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

    const { data, error } = await supabase
      .from('notification_templates')
      .insert([
        {
          name: payload.name,
          description: payload.description,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          tags: payload.tags,
        },
      ])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creando template:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error creando template',
        ...(process.env.NODE_ENV !== 'production'
          ? {
              details: {
                code: error?.code,
                hint: error?.hint,
                details: error?.details,
                message: error?.message,
                stack: error?.stack,
              },
            }
          : {}),
      },
      { status: 500 }
    );
  }
}


