import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { handleError, ErrorType } from '@/lib/errorHandler';

// Esta ruta solo se usa en desarrollo local
// En producción (APK), las APIs están en packages/core-api/

const updatePreferencesSchema = z.object({
  push_enabled: z.boolean().optional(),
  transaction_enabled: z.boolean().optional(),
  reminder_enabled: z.boolean().optional(),
  marketing_enabled: z.boolean().optional(),
  timezone: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId es requerido' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return handleError(error, 'Error al obtener preferencias');
    }

    // Si no existe, devolver valores por defecto
    if (!data) {
      return NextResponse.json({
        success: true,
        preferences: {
          push_enabled: true,
          transaction_enabled: true,
          reminder_enabled: true,
          marketing_enabled: true,
          timezone: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    });
  } catch (error: any) {
    return handleError(error, 'Error obteniendo preferencias');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId es requerido' },
        { status: 400 }
      );
    }

    const validated = updatePreferencesSchema.parse(body);
    const supabase = getSupabaseAdmin();

    // Intentar actualizar primero
    const { data: existingData } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingData) {
      // Actualizar registro existente
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...validated,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return handleError(error, 'Error al actualizar preferencias');
      }

      return NextResponse.json({
        success: true,
        preferences: data,
      });
    } else {
      // Crear nuevo registro
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          push_enabled: validated.push_enabled ?? true,
          transaction_enabled: validated.transaction_enabled ?? true,
          reminder_enabled: validated.reminder_enabled ?? true,
          marketing_enabled: validated.marketing_enabled ?? true,
          quiet_hours_start: null, // Ya no se configura, se respeta automáticamente el horario del país
          quiet_hours_end: null, // Ya no se configura, se respeta automáticamente el horario del país
          timezone: validated.timezone ?? null,
        })
        .select()
        .single();

      if (error) {
        return handleError(error, 'Error al crear preferencias');
      }

      return NextResponse.json({
        success: true,
        preferences: data,
      });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Datos inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    return handleError(error, 'Error actualizando preferencias');
  }
}

