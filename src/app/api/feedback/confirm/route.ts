import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { registrarAprendizaje } from '../../../../lib/configMatriz';
import { uuidSchema, confirmFeedbackSchema, validateWithZod } from '../../../../lib/validations';
import { requireCSRF } from '../../../../lib/csrf';
import { handleError, handleValidationError } from '../../../../lib/errorHandler';
import { logger } from '../../../../lib/logger';

// Esta ruta solo se usa en desarrollo local
// En producción (APK), las APIs están en packages/core-api/

// GET para obtener estadísticas de feedback
export async function GET(request: NextRequest) {
  // Llamar getSupabaseAdmin dentro de la función, no en el nivel superior
  const supabase = getSupabaseAdmin(); // Valida y crea cliente aquí

  try {
    const { searchParams } = new URL(request.url);
    const usuario_id = searchParams.get('usuario_id');

    if (!usuario_id) {
      return handleValidationError('usuario_id es requerido');
    }
    
    // Validar que es UUID válido
    const uuidValidation = validateWithZod(uuidSchema, usuario_id);
    if (!uuidValidation.success) {
      return handleValidationError(uuidValidation.error);
    }
    
    const validUsuarioId = uuidValidation.data;

    // Obtener estadísticas de predicciones
    const { data, error } = await supabase
      .from('predicciones_groq')
      .select('confirmado, resultado, created_at')
      .eq('usuario_id', validUsuarioId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    // Calcular métricas
    const total = data?.length || 0;
    const confirmadas = data?.filter(p => p.confirmado === true).length || 0;
    const rechazadas = data?.filter(p => p.confirmado === false).length || 0;
    const pendientes = data?.filter(p => p.confirmado === null).length || 0;

    const accuracy = total > 0 ? (confirmadas / (confirmadas + rechazadas)) * 100 : 0;

    return NextResponse.json({
      success: true,
      stats: {
        total,
        confirmadas,
        rechazadas,
        pendientes,
        accuracy: accuracy.toFixed(2) + '%',
      },
      recent_predictions: data?.slice(0, 10) || [],
    });

  } catch (error: any) {
    return handleError(error, 'Error al obtener estadísticas de feedback');
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin(); // Valida y crea cliente aquí

  try {
    const body = await request.json();
    
    // Validar CSRF token (después de leer el body para extraer el token)
    const csrfError = await requireCSRF(request, body.csrfToken);
    if (csrfError) {
      return csrfError;
    }
    
    // Validar con Zod
    const validation = validateWithZod(confirmFeedbackSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }
    
    const { prediction_id, confirmado, comentario, usuario_id, country_code } = validation.data;

    // 1. Actualizar predicciones_groq.confirmado
    const { error: updateError } = await supabase
      .from('predicciones_groq')
      .update({ 
        confirmado,
        updated_at: new Date().toISOString()
      })
      .eq('id', prediction_id);

    if (updateError) {
      throw updateError;
    }

    // 2. Crear registro en feedback_usuarios
    const { error: feedbackError } = await supabase
      .from('feedback_usuarios')
      .insert({
        prediction_id,
        usuario_id,
        country_code: country_code || 'BOL',
        era_correcto: confirmado,
        comentario: comentario || null
      });

    if (feedbackError) {
      logger.warn('Error creating feedback:', feedbackError);
    }

    // 3. Si confirmado = false, analizar el error para mejorar
    if (confirmado === false) {
      logger.debug('📊 Analizando error de predicción para mejorar modelo');
      
      // Obtener datos de la predicción para análisis
      const { data: prediccionData } = await supabase
        .from('predicciones_groq')
        .select('resultado')
        .eq('id', prediction_id)
        .single();

      if (prediccionData?.resultado) {
        const categoriaPredicha = (prediccionData.resultado as any)?.categoria;
        
        // Registrar para aprendizaje automático
        try {
          await registrarAprendizaje(
            prediction_id,
            categoriaPredicha,
            comentario || undefined // comentario puede contener palabra nueva
          );
        } catch (error) {
          logger.error('❌ Error registrando aprendizaje:', error);
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      message: confirmado 
        ? 'Predicción confirmada correctamente'
        : 'Feedback registrado para mejora del modelo'
    });

  } catch (error: any) {
    return handleError(error, 'Error al confirmar feedback');
  }
}

