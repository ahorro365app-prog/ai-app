import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/migrations/add-smart-fecha-inicio-programada
 * 
 * Migración: Agrega el campo smart_fecha_inicio_programada a la tabla usuarios.
 * 
 * ⚠️ IMPORTANTE: Este endpoint solo debe ejecutarse una vez.
 * Requiere autenticación con secret o ejecutarse manualmente desde Supabase SQL Editor.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar secret (opcional, para seguridad)
    const secret = process.env.MIGRATION_SECRET;
    if (secret) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json(
          {
            success: false,
            message: 'No autorizado',
            error: 'Se requiere secret para ejecutar migraciones',
          },
          { status: 401 }
        );
      }
    }

    const supabase = getSupabaseAdmin();

    // Verificar si el campo ya existe
    try {
      const { data: columnCheck, error: checkError } = await supabase
        .from('usuarios')
        .select('smart_fecha_inicio_programada')
        .limit(1);

      // Si no hay error al hacer select, el campo existe
      if (!checkError) {
        return NextResponse.json({
          success: true,
          message: 'Campo smart_fecha_inicio_programada ya existe',
          alreadyExists: true,
        });
      }

      // Si el error es que la columna no existe, continuamos
      if (checkError && checkError.message && checkError.message.includes('column') && checkError.message.includes('does not exist')) {
        // Campo no existe, continuar
      } else {
        // Otro error, retornarlo
        throw checkError;
      }
    } catch (error: any) {
      // Si hay error al verificar, asumimos que no existe
      console.log('⚠️ No se pudo verificar campo, asumiendo que no existe:', error?.message);
    }

    // SQL para agregar el campo
    // Nota: Supabase no permite ejecutar DDL desde el cliente, debe ejecutarse manualmente
    const sql = `
-- Agregar columna smart_fecha_inicio_programada a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS smart_fecha_inicio_programada TIMESTAMP WITH TIME ZONE NULL;

-- Agregar comentario descriptivo
COMMENT ON COLUMN usuarios.smart_fecha_inicio_programada IS 'Fecha programada para activar Smart automáticamente. Se activa cuando el usuario tiene FREE/PRO activo y gana Smart por referidos. NULL si no está programado.';
    `.trim();

    return NextResponse.json({
      success: true,
      message: 'SQL generado. Ejecuta manualmente en Supabase SQL Editor.',
      sql,
      instructions: [
        '1. Ve a Supabase Dashboard → SQL Editor',
        '2. Pega el SQL mostrado arriba',
        '3. Ejecuta el SQL',
        '4. Verifica que el campo se agregó correctamente',
      ],
      verificationSQL: `
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
AND column_name = 'smart_fecha_inicio_programada';
      `.trim(),
    });
  } catch (error: any) {
    console.error('❌ Error en migración:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error ejecutando migración',
        error: error?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
