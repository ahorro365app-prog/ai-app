import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { handleError, handleValidationError, ErrorType } from '@/lib/errorHandler';

interface RegisterTokenPayload {
  token?: string;
  userId?: string;
  deviceType?: string;
  deviceModel?: string;
  appVersion?: string;
  osVersion?: string;
}

const ALLOWED_DEVICE_TYPES = ['android', 'ios', 'web'];

export async function POST(request: NextRequest) {
  try {
    const body: RegisterTokenPayload = await request.json();

    if (!body.token || typeof body.token !== 'string') {
      return handleValidationError('Token FCM requerido');
    }

    if (!body.userId || typeof body.userId !== 'string') {
      return handleValidationError('userId requerido');
    }

    if (body.deviceType && !ALLOWED_DEVICE_TYPES.includes(body.deviceType)) {
      return handleValidationError('deviceType inválido');
    }

    const supabase = getSupabaseAdmin();

    const { data: existingToken } = await supabase
      .from('fcm_tokens')
      .select('id')
      .eq('token', body.token)
      .single();

    const sanitizedDeviceType = body.deviceType ? body.deviceType.slice(0, 20) : null;
    const sanitizedDeviceModel = body.deviceModel ? body.deviceModel.slice(0, 100) : null;
    const sanitizedAppVersion = body.appVersion ? body.appVersion.slice(0, 20) : null;
    const sanitizedOsVersion = body.osVersion ? body.osVersion.slice(0, 20) : null;

    if (existingToken) {
      const { error: updateError } = await supabase
        .from('fcm_tokens')
        .update({
          user_id: body.userId,
          device_type: sanitizedDeviceType,
          device_model: sanitizedDeviceModel,
          app_version: sanitizedAppVersion,
          os_version: sanitizedOsVersion,
          last_used_at: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', existingToken.id);

      if (updateError) {
        return handleError(
          updateError,
          'No se pudo actualizar el token',
          ErrorType.DATABASE
        );
      }

      return NextResponse.json({ success: true, message: 'Token actualizado' });
    }

    const { error: insertError } = await supabase.from('fcm_tokens').insert({
      user_id: body.userId,
      token: body.token,
      device_type: sanitizedDeviceType,
      device_model: sanitizedDeviceModel,
      app_version: sanitizedAppVersion,
      os_version: sanitizedOsVersion,
      last_used_at: new Date().toISOString(),
      is_active: true,
    });

    if (insertError) {
      return handleError(
        insertError,
        'No se pudo registrar el token',
        ErrorType.DATABASE
      );
    }

    return NextResponse.json({ success: true, message: 'Token registrado' });
  } catch (error: any) {
    return handleError(
      error,
      'Error interno del servidor',
      ErrorType.INTERNAL
    );
  }
}

