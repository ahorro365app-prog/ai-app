import { NextRequest, NextResponse } from 'next/server';
import { groqService } from '@/services/groqService';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WHISPER_ENDPOINT = process.env.WHISPER_ENDPOINT || 'https://flectionless-initially-petra.ngrok-free.dev/transcribe';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const userId = formData.get('user_id') as string;
    const transcription = formData.get('transcription') as string;

    // 1. Si no hay transcripción, obtenerla de Whisper
    let finalTranscription = transcription;
    
    if (!finalTranscription && audioFile) {
      console.log('🎵 Sending audio to Whisper...');
      
      const whisperFormData = new FormData();
      whisperFormData.append('audio', audioFile);
      
      const whisperResponse = await fetch(`${WHISPER_ENDPOINT}/transcribe`, {
        method: 'POST',
        body: whisperFormData
      });

      if (!whisperResponse.ok) {
        throw new Error('Whisper transcription failed');
      }

      const whisperData = await whisperResponse.json();
      finalTranscription = whisperData.transcription;
      console.log('✅ Transcription:', finalTranscription);
    }

    // 2. Obtener country_code del usuario
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('country_code')
      .eq('id', userId)
      .single();

    if (userError || !usuario) {
      throw new Error('User not found');
    }

    // Convertir country_code (BOL, ARG, etc) a código de 2 letras (BO, AR, etc)
    const countryCode2 = usuario.country_code || 'BOL';
    const countryCodeMap: Record<string, string> = {
      'BOL': 'BO',
      'ARG': 'AR',
      'MEX': 'MX',
      'PER': 'PE',
      'COL': 'CO',
      'CHL': 'CL'
    };
    const userCountryCode = countryCodeMap[countryCode2] || 'BO';

    // 3. Procesar con Groq usando contexto por país
    const resultado = await groqService.extractExpenseWithCountryContext(
      finalTranscription,
      countryCode2
    );

    // 4. Guardar predicción en predicciones_groq
    if (resultado) {
      await supabase
        .from('predicciones_groq')
        .insert({
          usuario_id: userId,
          country_code: countryCode2,
          transcripcion: finalTranscription,
          resultado: resultado,
          confirmado: null
        });
    }

    return NextResponse.json({
      status: 'success',
      transcripcion: finalTranscription,
      resultado,
      country_code: countryCode2
    });

  } catch (error: any) {
    console.error('❌ Error processing audio:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

