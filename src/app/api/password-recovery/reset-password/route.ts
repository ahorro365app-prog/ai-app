import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const resetPasswordSchema = z.object({
  recoveryToken: z.string().uuid('Token de recuperación inválido'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación de contraseña es requerida'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

/**
 * POST /api/password-recovery/reset-password
 * 
 * Cambia la contraseña del usuario después de verificar el código de recuperación.
 * 
 * Body: { recoveryToken: string, newPassword: string, confirmPassword: string }
 * 
 * FASE 5: Permite establecer nueva contraseña solo si código válido, actualiza en BD, limpia código usado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos inválidos',
          errors: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { recoveryToken, newPassword } = validation.data;
    const supabase = getSupabaseAdmin();

    logger.info('🔐 [ENDPOINT] Cambiando contraseña con token de recuperación');

    // 1. Verificar que el recoveryToken corresponde a un código verificado (usado)
    // El recoveryToken es el ID del código de verificación que fue marcado como usado en Fase 4
    const { data: verificationCode, error: codeError } = await supabase
      .from('codigos_verificacion')
      .select('id, telefono, usado, expira_en, fecha_creacion')
      .eq('id', recoveryToken)
      .single();

    if (codeError || !verificationCode) {
      logger.error('❌ Token de recuperación no encontrado:', codeError);
      return NextResponse.json(
        {
          success: false,
          message: 'Token de recuperación inválido o expirado',
        },
        { status: 400 }
      );
    }

    // 2. Verificar que el código fue usado (verificado en Fase 4)
    if (!verificationCode.usado) {
      logger.warn('⚠️ Intento de cambiar contraseña con código no verificado');
      return NextResponse.json(
        {
          success: false,
          message: 'El código de verificación no ha sido validado. Por favor, verifica el código primero.',
        },
        { status: 400 }
      );
    }

    // 3. Verificar que el código no haya expirado (aunque ya esté usado, verificamos por seguridad)
    const now = new Date();
    const expiresAt = new Date(verificationCode.expira_en);
    if (now > expiresAt) {
      logger.warn('⚠️ Intento de cambiar contraseña con código expirado');
      return NextResponse.json(
        {
          success: false,
          message: 'El código de verificación ha expirado. Por favor, solicita un nuevo código.',
        },
        { status: 400 }
      );
    }

    // 4. Buscar el usuario por teléfono
    const phoneWithPlus = verificationCode.telefono.startsWith('+') 
      ? verificationCode.telefono 
      : `+${verificationCode.telefono}`;
    const phoneWithoutPlus = verificationCode.telefono.startsWith('+') 
      ? verificationCode.telefono.substring(1) 
      : verificationCode.telefono;

    let { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, nombre, telefono')
      .eq('telefono', phoneWithPlus)
      .single();

    if (userError || !user) {
      const result = await supabase
        .from('usuarios')
        .select('id, nombre, telefono')
        .eq('telefono', phoneWithoutPlus)
        .single();
      
      user = result.data;
      userError = result.error;
    }

    if (userError || !user) {
      logger.error('❌ Usuario no encontrado para cambio de contraseña');
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    logger.debug(`✅ Usuario encontrado para cambio de contraseña: ${user.id}`);

    // 5. Actualizar contraseña en la tabla usuarios
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ contrasena: newPassword })
      .eq('id', user.id);

    if (updateError) {
      logger.error('❌ Error actualizando contraseña:', updateError);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al actualizar la contraseña',
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    logger.debug(`✅ Contraseña actualizada exitosamente para usuario: ${user.id}`);

    // 6. Limpiar código usado (marcar como usado nuevamente por seguridad, aunque ya debería estarlo)
    // También podríamos eliminar el código, pero por auditoría lo dejamos marcado como usado
    await supabase
      .from('codigos_verificacion')
      .update({ usado: true })
      .eq('id', recoveryToken);

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
      passwordChanged: true,
    });
  } catch (error: any) {
    logger.error('❌ Error en reset-password:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: error?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

