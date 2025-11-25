import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { handleError, handleValidationError, ErrorType } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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
      return handleValidationError('userId es requerido');
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return handleError(
        error,
        'Error al obtener preferencias',
        ErrorType.DATABASE
      );
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
    return handleError(
      error,
      'Error interno del servidor',
      ErrorType.INTERNAL
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return handleValidationError('userId es requerido');
    }

    const validated = updatePreferencesSchema.parse(body);
    const supabase = getSupabaseAdmin();

    // Log para debugging
    logger.debug('Actualizando preferencias:', {
      userId,
      body,
      validated,
    });

    // Intentar actualizar primero
    // Usar .maybeSingle() con manejo de errores mejorado
    const { data: existingData, error: searchError } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    // Si hay un error de búsqueda (no es "no encontrado"), reportarlo
    if (searchError && searchError.code !== 'PGRST116') {
      logger.error('Error buscando preferencias existentes:', {
        error: searchError,
        code: searchError.code,
        message: searchError.message,
        userId,
      });
      return handleError(
        searchError,
        'Error al buscar preferencias existentes',
        ErrorType.DATABASE
      );
    }

    if (existingData) {
      // Construir objeto de actualización explícitamente para asegurar que false se incluya
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Incluir solo los campos que están presentes en validated (incluyendo false)
      if ('push_enabled' in validated) {
        updateData.push_enabled = validated.push_enabled;
      }
      if ('transaction_enabled' in validated) {
        updateData.transaction_enabled = validated.transaction_enabled;
      }
      if ('reminder_enabled' in validated) {
        updateData.reminder_enabled = validated.reminder_enabled;
      }
      if ('marketing_enabled' in validated) {
        updateData.marketing_enabled = validated.marketing_enabled;
      }
      if ('timezone' in validated) {
        updateData.timezone = validated.timezone;
      }

      logger.debug('Datos de actualización:', updateData);

      // Actualizar registro existente
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return handleError(
          error,
          'Error al actualizar preferencias',
          ErrorType.DATABASE
        );
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
        return handleError(
          error,
          'Error al crear preferencias',
          ErrorType.DATABASE
        );
      }

      return NextResponse.json({
        success: true,
        preferences: data,
      });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return handleValidationError('Datos inválidos', error.errors);
    }

    return handleError(
      error,
      'Error interno del servidor',
      ErrorType.INTERNAL
    );
  }
}

