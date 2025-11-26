import { getSupabaseAdmin } from './supabaseAdmin';
import { logger } from './logger';

/**
 * Verifica si un referidor puede activar el plan Smart por 14 días.
 * NO activa automáticamente, solo verifica las condiciones.
 * 
 * Condiciones:
 * - Tiene exactamente 5 referidos verificados (o más)
 * - Aún no ha ganado Smart (ha_ganado_smart = false)
 * 
 * @param referidorId - ID del usuario referidor
 * @returns Objeto con success, canActivate, message y detalles
 */
export async function checkCanActivateSmartPlan(
  referidorId: string
): Promise<{
  success: boolean;
  canActivate: boolean;
  message: string;
  error?: string;
  details?: {
    referidos_verificados: number;
    ha_ganado_smart: boolean;
    plan_actual: string;
  };
}> {
  const supabase = getSupabaseAdmin();

  try {
    logger.debug(`🎁 Verificando activación de Smart para referidor: ${referidorId}`);

    // 1. Obtener datos del referidor
    const { data: referidor, error: referidorError } = await supabase
      .from('usuarios')
      .select('id, suscripcion, referidos_verificados, ha_ganado_smart, fecha_expiracion_suscripcion, smart_fecha_inicio_programada')
      .eq('id', referidorId)
      .single();

    if (referidorError || !referidor) {
      logger.error('❌ Error obteniendo datos del referidor:', referidorError);
      return {
        success: false,
        canActivate: false,
        message: 'Error al obtener datos del referidor',
        error: referidorError?.message || 'Referidor no encontrado',
      };
    }

    const referidosVerificados = referidor.referidos_verificados || 0;
    const haGanadoSmart = referidor.ha_ganado_smart || false;
    const planAnterior = referidor.suscripcion || 'free';

    logger.debug(`📊 Referidor ${referidorId}:`, {
      referidos_verificados: referidosVerificados,
      ha_ganado_smart: haGanadoSmart,
      plan_actual: planAnterior,
    });

    // 2. Verificar condiciones para activar Smart
    const tiene5Referidos = referidosVerificados >= 5;
    const puedeGanarSmart = !haGanadoSmart;

    if (!tiene5Referidos) {
      logger.debug(`⏳ Referidor aún no tiene 5 referidos verificados (tiene ${referidosVerificados})`);
      return {
        success: true,
        canActivate: false,
        message: `Aún no tiene 5 referidos verificados (tiene ${referidosVerificados})`,
        details: {
          referidos_verificados: referidosVerificados,
          ha_ganado_smart: haGanadoSmart,
          plan_actual: planAnterior,
        },
      };
    }

    if (!puedeGanarSmart) {
      logger.debug(`⚠️ Referidor ya ganó Smart anteriormente`);
      return {
        success: true,
        canActivate: false,
        message: 'Ya ganó Smart anteriormente (solo se puede ganar una vez)',
        details: {
          referidos_verificados: referidosVerificados,
          ha_ganado_smart: haGanadoSmart,
          plan_actual: planAnterior,
        },
      };
    }

    // 3. Usuario puede activar Smart
    logger.debug(`✅ Referidor puede activar Smart (tiene ${referidosVerificados} referidos verificados)`);
    return {
      success: true,
      canActivate: true,
      message: 'Puede activar 14 días de Smart',
      details: {
        referidos_verificados: referidosVerificados,
        ha_ganado_smart: haGanadoSmart,
        plan_actual: planAnterior,
      },
    };
  } catch (error: any) {
    logger.error('❌ Error en checkCanActivateSmartPlan:', error);
    return {
      success: false,
      canActivate: false,
      message: 'Error interno al verificar activación de Smart',
      error: error?.message || 'Error desconocido',
    };
  }
}

/**
 * Activa el plan Smart por 14 días para un referidor.
 * Esta función debe ser llamada manualmente por el usuario (no automáticamente).
 * 
 * Condiciones (deben verificarse antes de llamar):
 * - Tiene exactamente 5 referidos verificados (o más)
 * - Aún no ha ganado Smart (ha_ganado_smart = false)
 * 
 * @param referidorId - ID del usuario referidor
 * @returns Objeto con success, message y detalles de la activación
 */
export async function activateSmartPlan(
  referidorId: string
): Promise<{
  success: boolean;
  activated: boolean;
  message: string;
  error?: string;
  details?: {
    referidos_verificados: number;
    ha_ganado_smart: boolean;
    plan_anterior: string;
    plan_nuevo: string;
    fecha_expiracion_anterior?: string;
    fecha_expiracion_nueva?: string;
  };
}> {
  const supabase = getSupabaseAdmin();

  try {
    logger.debug(`🎁 Activando plan Smart para referidor: ${referidorId}`);

    // 1. Verificar condiciones antes de activar
    const checkResult = await checkCanActivateSmartPlan(referidorId);
    
    if (!checkResult.success || !checkResult.canActivate) {
      return {
        success: false,
        activated: false,
        message: checkResult.message,
        error: checkResult.error || 'No cumple las condiciones para activar Smart',
      };
    }

    // 2. Obtener datos actualizados del referidor
    const { data: referidor, error: referidorError } = await supabase
      .from('usuarios')
      .select('id, suscripcion, referidos_verificados, ha_ganado_smart, fecha_expiracion_suscripcion')
      .eq('id', referidorId)
      .single();

    if (referidorError || !referidor) {
      logger.error('❌ Error obteniendo datos del referidor:', referidorError);
      return {
        success: false,
        activated: false,
        message: 'Error al obtener datos del referidor',
        error: referidorError?.message || 'Referidor no encontrado',
      };
    }

    const planAnterior = referidor.suscripcion || 'free';
    const fechaExpiracionAnterior = referidor.fecha_expiracion_suscripcion
      ? new Date(referidor.fecha_expiracion_suscripcion)
      : null;

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalizar a inicio del día

    // 3. Determinar lógica según el plan actual
    let updateData: {
      suscripcion?: string;
      fecha_expiracion_suscripcion?: string;
      smart_fecha_inicio_programada?: string | null;
      ha_ganado_smart: boolean;
    } = {
      ha_ganado_smart: true,
    };

    let fechaInicioSmart: Date | null = null;
    let fechaFinSmart: Date | null = null;
    let activacionInmediata = false;

    if (planAnterior === 'caducado' || !fechaExpiracionAnterior || fechaExpiracionAnterior <= now) {
      // CASO: CADUCADO o sin fecha válida → Activar Smart inmediatamente
      logger.debug('✅ Usuario CADUCADO o sin fecha válida. Activando Smart inmediatamente.');
      activacionInmediata = true;
      fechaInicioSmart = new Date(now);
      fechaFinSmart = new Date(now);
      fechaFinSmart.setDate(fechaFinSmart.getDate() + 14);
      
      updateData.suscripcion = 'smart';
      updateData.fecha_expiracion_suscripcion = fechaFinSmart.toISOString();
      updateData.smart_fecha_inicio_programada = null;
    } else if (planAnterior === 'free' || planAnterior === 'pro') {
      // CASO: FREE o PRO con fecha futura → Programar Smart para después de que termine
      logger.debug(`✅ Usuario tiene ${planAnterior.toUpperCase()} activo hasta ${fechaExpiracionAnterior.toISOString()}. Programando Smart.`);
      
      // Smart inicia el día siguiente a la expiración
      fechaInicioSmart = new Date(fechaExpiracionAnterior);
      fechaInicioSmart.setDate(fechaInicioSmart.getDate() + 1);
      fechaInicioSmart.setHours(0, 0, 0, 0);
      
      // Smart termina 14 días después de iniciar
      fechaFinSmart = new Date(fechaInicioSmart);
      fechaFinSmart.setDate(fechaFinSmart.getDate() + 14);
      
      // NO cambiar suscripción ni fecha_expiracion_suscripcion (mantener plan actual)
      // Solo programar Smart
      updateData.smart_fecha_inicio_programada = fechaInicioSmart.toISOString();
      
      logger.debug(`📅 Smart programado para iniciar: ${fechaInicioSmart.toISOString()}`);
      logger.debug(`📅 Smart terminará: ${fechaFinSmart.toISOString()}`);
    } else {
      // CASO: Otro plan (smart) → No debería llegar aquí por validación previa, pero por seguridad
      logger.warn(`⚠️ Plan inesperado: ${planAnterior}. Activando Smart inmediatamente.`);
      activacionInmediata = true;
      fechaInicioSmart = new Date(now);
      fechaFinSmart = new Date(now);
      fechaFinSmart.setDate(fechaFinSmart.getDate() + 14);
      
      updateData.suscripcion = 'smart';
      updateData.fecha_expiracion_suscripcion = fechaFinSmart.toISOString();
      updateData.smart_fecha_inicio_programada = null;
    }

    // 4. Actualizar usuario
    const { error: updateError } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', referidorId);

    if (updateError) {
      logger.error('❌ Error actualizando plan a Smart:', updateError);
      return {
        success: false,
        activated: false,
        message: 'Error al actualizar plan a Smart',
        error: updateError.message,
      };
    }

    if (activacionInmediata) {
      logger.debug(`🎉 ¡Plan Smart activado inmediatamente para referidor ${referidorId}!`);
      logger.debug(`📅 Fecha de expiración: ${fechaFinSmart?.toISOString()}`);
    } else {
      logger.debug(`🎉 ¡Plan Smart programado para referidor ${referidorId}!`);
      logger.debug(`📅 Smart iniciará: ${fechaInicioSmart?.toISOString()}`);
      logger.debug(`📅 Smart terminará: ${fechaFinSmart?.toISOString()}`);
    }

    return {
      success: true,
      activated: activacionInmediata,
      message: activacionInmediata 
        ? 'Plan Smart activado exitosamente por 14 días'
        : `Plan Smart programado. Se activará el ${fechaInicioSmart?.toLocaleDateString('es-ES')} y durará hasta el ${fechaFinSmart?.toLocaleDateString('es-ES')}`,
      details: {
        referidos_verificados: referidor.referidos_verificados || 0,
        ha_ganado_smart: true,
        plan_anterior: planAnterior,
        plan_nuevo: activacionInmediata ? 'smart' : planAnterior,
        fecha_expiracion_anterior: fechaExpiracionAnterior?.toISOString(),
        fecha_expiracion_nueva: activacionInmediata ? fechaFinSmart?.toISOString() : fechaExpiracionAnterior?.toISOString(),
        smart_fecha_inicio_programada: fechaInicioSmart?.toISOString(),
        smart_fecha_fin_programada: fechaFinSmart?.toISOString(),
      },
    };
  } catch (error: any) {
    logger.error('❌ Error en activateSmartPlan:', error);
    return {
      success: false,
      activated: false,
      message: 'Error interno al activar Smart',
      error: error?.message || 'Error desconocido',
    };
  }
}

