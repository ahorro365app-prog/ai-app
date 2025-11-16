import { getSupabaseAdmin } from './supabaseAdmin';

/**
 * Activa Smart para usuarios que tienen smart_fecha_inicio_programada <= hoy
 * Esta función debe ser ejecutada por un cron job diario.
 * 
 * @returns Resumen de activaciones realizadas
 */
export async function activateScheduledSmart(): Promise<{
  success: boolean;
  activated: number;
  errors: number;
  details: Array<{
    userId: string;
    success: boolean;
    error?: string;
  }>;
}> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayISO = now.toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    console.log(`🔄 Activando Smart programado para fecha: ${todayISO}`);

    // 1. Buscar usuarios con Smart programado para hoy o antes
    const { data: usuariosProgramados, error: queryError } = await supabase
      .from('usuarios')
      .select('id, suscripcion, smart_fecha_inicio_programada, fecha_expiracion_suscripcion')
      .not('smart_fecha_inicio_programada', 'is', null)
      .lte('smart_fecha_inicio_programada', now.toISOString());

    if (queryError) {
      console.error('❌ Error buscando usuarios con Smart programado:', queryError);
      return {
        success: false,
        activated: 0,
        errors: 0,
        details: [],
      };
    }

    if (!usuariosProgramados || usuariosProgramados.length === 0) {
      console.log('ℹ️ No hay usuarios con Smart programado para activar hoy');
      return {
        success: true,
        activated: 0,
        errors: 0,
        details: [],
      };
    }

    console.log(`📋 Encontrados ${usuariosProgramados.length} usuarios con Smart programado para activar`);

    const details: Array<{ userId: string; success: boolean; error?: string }> = [];
    let activated = 0;
    let errors = 0;

    // 2. Activar Smart para cada usuario
    for (const usuario of usuariosProgramados) {
      try {
        const fechaInicioSmart = usuario.smart_fecha_inicio_programada
          ? new Date(usuario.smart_fecha_inicio_programada)
          : null;

        if (!fechaInicioSmart) {
          console.warn(`⚠️ Usuario ${usuario.id} tiene smart_fecha_inicio_programada pero no es válida`);
          details.push({
            userId: usuario.id,
            success: false,
            error: 'Fecha de inicio no válida',
          });
          errors++;
          continue;
        }

        // Calcular fecha de fin (14 días después de inicio)
        const fechaFinSmart = new Date(fechaInicioSmart);
        fechaFinSmart.setDate(fechaFinSmart.getDate() + 14);

        // Actualizar usuario: activar Smart y limpiar fecha programada
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({
            suscripcion: 'smart',
            fecha_expiracion_suscripcion: fechaFinSmart.toISOString(),
            smart_fecha_inicio_programada: null, // Limpiar fecha programada
          })
          .eq('id', usuario.id);

        if (updateError) {
          console.error(`❌ Error activando Smart para usuario ${usuario.id}:`, updateError);
          details.push({
            userId: usuario.id,
            success: false,
            error: updateError.message,
          });
          errors++;
        } else {
          console.log(`✅ Smart activado para usuario ${usuario.id}. Expira: ${fechaFinSmart.toISOString()}`);
          details.push({
            userId: usuario.id,
            success: true,
          });
          activated++;
        }
      } catch (error: any) {
        console.error(`❌ Error procesando usuario ${usuario.id}:`, error);
        details.push({
          userId: usuario.id,
          success: false,
          error: error?.message || 'Error desconocido',
        });
        errors++;
      }
    }

    console.log(`🎉 Proceso completado: ${activated} activados, ${errors} errores`);

    return {
      success: errors === 0,
      activated,
      errors,
      details,
    };
  } catch (error: any) {
    console.error('❌ Error en activateScheduledSmart:', error);
    return {
      success: false,
      activated: 0,
      errors: 0,
      details: [],
    };
  }
}

