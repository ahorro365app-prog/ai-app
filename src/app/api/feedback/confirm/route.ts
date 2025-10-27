import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prediction_id, confirmado, comentario, usuario_id, country_code } = body;

    if (!prediction_id || confirmado === undefined) {
      return NextResponse.json(
        { status: 'error', message: 'prediction_id and confirmado are required' },
        { status: 400 }
      );
    }

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
      console.warn('Error creating feedback:', feedbackError);
    }

    // 3. Si confirmado = false, analizar el error para mejorar
    if (confirmado === false) {
      console.log('📊 Analizando error de predicción para mejorar modelo');
      // Aquí podrías agregar lógica para analizar el error y mejorar
    }

    return NextResponse.json({
      status: 'success',
      message: confirmado 
        ? 'Predicción confirmada correctamente'
        : 'Feedback registrado para mejora del modelo'
    });

  } catch (error: any) {
    console.error('❌ Error confirming feedback:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

