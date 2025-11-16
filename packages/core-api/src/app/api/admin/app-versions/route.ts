import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

// Schema de validación para actualizar versiones
const updateVersionSchema = z.object({
  platform: z.enum(['web', 'android', 'ios']),
  current_version: z.string().min(1).max(20),
  minimum_required_version: z.string().min(1).max(20),
  recommended_version: z.string().min(1).max(20).optional(),
  force_update: z.boolean().optional(),
  update_title: z.string().max(200).optional(),
  update_message: z.string().optional(),
  force_update_title: z.string().max(200).optional(),
  force_update_message: z.string().optional(),
  store_url: z.string().url().optional().nullable(),
  release_notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Verificar si la tabla existe primero
    const { data: testQuery, error: testError } = await supabase
      .from('app_versions')
      .select('id')
      .limit(1);

    if (testError) {
      // Si el error es que la tabla no existe, dar un mensaje más claro
      if (testError.code === '42P01' || testError.message?.includes('does not exist')) {
        console.error('Tabla app_versions no existe. Ejecuta el SQL de creación primero.');
        return NextResponse.json(
          { 
            success: false, 
            message: 'La tabla app_versions no existe. Por favor, ejecuta el SQL de creación primero.',
            error: 'TABLE_NOT_FOUND',
            hint: 'Ejecuta sql/create-app-versions-table.sql en Supabase'
          },
          { status: 500 }
        );
      }
    }

    // Obtener todas las configuraciones activas
    const { data: versions, error } = await supabase
      .from('app_versions')
      .select('*')
      .eq('is_active', true)
      .order('platform');

    if (error) {
      console.error('Error obteniendo versiones:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error obteniendo configuraciones de versiones',
          error: error.message || 'Error desconocido',
          code: error.code || 'UNKNOWN'
        },
        { status: 500 }
      );
    }

    // Organizar por plataforma
    const versionsByPlatform = {
      web: versions?.find(v => v.platform === 'web') || null,
      android: versions?.find(v => v.platform === 'android') || null,
      ios: versions?.find(v => v.platform === 'ios') || null,
    };

    return NextResponse.json({
      success: true,
      data: versionsByPlatform,
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/app-versions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos
    const validation = updateVersionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Datos inválidos',
          errors: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const {
      platform,
      current_version,
      minimum_required_version,
      recommended_version,
      force_update,
      update_title,
      update_message,
      force_update_title,
      force_update_message,
      store_url,
      release_notes,
    } = validation.data;

    const supabase = getSupabaseAdmin();

    // Verificar si ya existe una configuración activa para esta plataforma
    const { data: existing, error: checkError } = await supabase
      .from('app_versions')
      .select('id')
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error verificando versión existente:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error verificando configuración existente' },
        { status: 500 }
      );
    }

    // Si existe, desactivar la anterior y crear una nueva
    if (existing) {
      // Desactivar la anterior
      const { error: deactivateError } = await supabase
        .from('app_versions')
        .update({ is_active: false })
        .eq('id', existing.id);

      if (deactivateError) {
        console.error('Error desactivando versión anterior:', deactivateError);
        return NextResponse.json(
          { success: false, message: 'Error desactivando configuración anterior' },
          { status: 500 }
        );
      }
    }

    // Crear nueva configuración
    const { data: newVersion, error: insertError } = await supabase
      .from('app_versions')
      .insert({
        platform,
        current_version,
        minimum_required_version,
        recommended_version: recommended_version || current_version,
        force_update: force_update || false,
        update_title: update_title || 'Actualización disponible',
        update_message: update_message || 'Hay una nueva versión de Ahorro365 disponible.',
        force_update_title: force_update_title || 'Actualización requerida',
        force_update_message: force_update_message || 'Necesitas actualizar la app para continuar.',
        store_url: store_url || null,
        release_notes: release_notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creando nueva versión:', insertError);
      return NextResponse.json(
        { success: false, message: 'Error creando nueva configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración de versión actualizada exitosamente',
      data: newVersion,
    });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/app-versions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

