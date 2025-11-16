import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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
      return NextResponse.json(
        { success: false, message: 'Token FCM requerido' },
        { status: 400 }
      );
    }

    if (!body.userId || typeof body.userId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'userId requerido' },
        { status: 400 }
      );
    }

    if (body.deviceType && !ALLOWED_DEVICE_TYPES.includes(body.deviceType)) {
      return NextResponse.json(
        { success: false, message: 'deviceType inválido' },
        { status: 400 }
      );
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
        console.error('Error actualizando token FCM:', updateError);
        return NextResponse.json(
          { success: false, message: 'No se pudo actualizar el token' },
          { status: 500 }
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
      console.error('Error insertando token FCM:', insertError);
      const errorMessage = insertError.message || 'No se pudo registrar el token';

      const responseBody: Record<string, any> = {
        success: false,
        message: errorMessage,
      };

      if (process.env.NODE_ENV !== 'production') {
        responseBody.details = insertError;
      }

      return NextResponse.json(responseBody, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Token registrado' });
  } catch (error: any) {
    console.error('Error en register-token:', error);

    const responseBody: Record<string, any> = {
      success: false,
      message: error?.message || 'Error interno del servidor',
    };

    if (process.env.NODE_ENV !== 'production') {
      responseBody.details = {
        name: error?.name,
        code: error?.code,
        stack: error?.stack,
      };
    }

    return NextResponse.json(responseBody, { status: 500 });
  }
}

