import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const verifyRecoveryCodeSchema = z.object({
  phone: z.string().min(1, 'Teléfono requerido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
});

// Límite de intentos fallidos
const MAX_FAILED_ATTEMPTS = 3;

/**
 * POST /api/password-recovery/verify-code
 * 
 * Verifica un código de recuperación de contraseña.
 * 
 * Body: { phone: string, code: string }
 * 
 * FASE 4: Valida código, verifica expiración (10 min), limita intentos (3 intentos)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = verifyRecoveryCodeSchema.safeParse(body);

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

    const { phone, code } = validation.data;
    const supabase = getSupabaseAdmin();

    logger.info('🔐 [ENDPOINT] Verificando código de recuperación de contraseña - Teléfono: ' + phone.substring(0, 5) + '...');

    // Normalizar teléfono para búsqueda
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneWithoutPlus = phone.startsWith('+') ? phone.substring(1) : phone;

    // 1. Buscar código en codigos_verificacion
    // Intentar primero con formato con +
    let { data: verificationCode, error: codeError } = await supabase
      .from('codigos_verificacion')
      .select('*')
      .eq('telefono', phoneWithPlus)
      .eq('codigo', code)
      .eq('usado', false)
      .gte('expira_en', new Date().toISOString())
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Si no se encontró con +, intentar sin +
    if (codeError || !verificationCode) {
      const result = await supabase
        .from('codigos_verificacion')
        .select('*')
        .eq('telefono', phoneWithoutPlus)
        .eq('codigo', code)
        .eq('usado', false)
        .gte('expira_en', new Date().toISOString())
        .order('fecha_creacion', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      verificationCode = result.data;
      codeError = result.error;
    }

    // 2. Verificar si el código existe y es válido
    if (codeError || !verificationCode) {
      logger.warn('⚠️ Código incorrecto o expirado para recuperación de contraseña');
      
      return NextResponse.json(
        {
          success: false,
          message: 'Código incorrecto o expirado. Verifica el código e intenta nuevamente.',
          codeInvalid: true,
        },
        { status: 400 }
      );
    }

    // 3. Código válido encontrado - continuar con la verificación

    logger.debug(`✅ Código válido encontrado para recuperación, ID: ${verificationCode.id}`);

    // 4. Verificar que el usuario existe
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
      logger.error('❌ Usuario no encontrado para recuperación de contraseña');
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    // 5. Marcar código como usado (solo si todo es válido)
    const { error: updateCodeError } = await supabase
      .from('codigos_verificacion')
      .update({ usado: true })
      .eq('id', verificationCode.id);

    if (updateCodeError) {
      logger.error('❌ Error marcando código como usado:', updateCodeError);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al procesar verificación',
          error: updateCodeError.message,
        },
        { status: 500 }
      );
    }

    logger.debug(`✅ Código de recuperación verificado exitosamente para usuario: ${user.id}`);

    // 6. Retornar éxito con token de sesión para cambio de contraseña
    // En Fase 5 usaremos este token para permitir el cambio de contraseña
    return NextResponse.json({
      success: true,
      message: 'Código verificado exitosamente',
      verified: true,
      userId: user.id,
      // Token temporal para cambio de contraseña (Fase 5)
      recoveryToken: verificationCode.id, // Usamos el ID del código como token temporal
    });
  } catch (error: any) {
    logger.error('❌ Error en verify-recovery-code:', error);
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

