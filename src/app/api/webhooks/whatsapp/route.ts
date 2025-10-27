import { NextRequest, NextResponse } from 'next/server';
import { groqWhisperService } from '@/services/groqWhisperService';
import { groqService } from '@/services/groqService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    console.log('📱 Webhook recibido:', JSON.stringify(body, null, 2));

    // Validar que es webhook de Meta
    if (body.object !== 'whatsapp_business_account') {
      console.log('❌ Not a WhatsApp webhook');
      return NextResponse.json({ status: 'ignored' });
    }

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (!message) {
      console.log('❌ No message in webhook');
      return NextResponse.json({ status: 'no_message' });
    }

    // Solo procesar audios
    if (message.type !== 'audio') {
      console.log('❌ Message is not audio');
      return NextResponse.json({ status: 'not_audio' });
    }

    const { from: phoneNumber, audio } = message;

    console.log('📱 WhatsApp audio from:', phoneNumber);

    // 1. Buscar usuario por teléfono en tabla usuarios
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', phoneNumber)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', phoneNumber);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User found:', user.id);

    // 2. Descargar audio de Meta
    const audioUrl = `https://graph.facebook.com/v18.0/${audio.id}`;
    
    const audioResponse = await fetch(audioUrl, {
      headers: {
        Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
      },
    });

    if (!audioResponse.ok) {
      throw new Error('Failed to download audio from Meta');
    }

    const audioBlob = await audioResponse.blob();
    console.log('✅ Audio downloaded:', audioBlob.size, 'bytes');

    // 3. Convertir blob a File
    const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

    // 4. Transcribir con Groq Whisper
    const transcription = await groqWhisperService.transcribe(audioFile, 'es');
    console.log('✅ Transcription:', transcription);

    // 5. Extraer datos con Groq LLM con contexto por país
    const expenseData = await groqService.extractExpenseWithCountryContext(
      transcription,
      user.country_code || 'BOL'
    );
    console.log('✅ Expense extracted:', expenseData);

    // 6. Guardar predicción en predicciones_groq
    const { data: prediction } = await supabase
      .from('predicciones_groq')
      .insert({
        usuario_id: user.id,
        country_code: user.country_code || 'BOL',
        transcripcion: transcription,
        resultado: expenseData,
      })
      .select()
      .single();

    console.log('✅ Prediction saved:', prediction?.id);

    // 7. Crear transacción en tabla transacciones
    const { data: transaction } = await supabase
      .from('transacciones')
      .insert({
        usuario_id: user.id,
        tipo: 'gasto',
        monto: expenseData.monto || 0,
        categoria: expenseData.categoria || 'otros',
        descripcion: expenseData.descripcion || transcription,
        fecha: new Date().toISOString(),
      })
      .select()
      .single();

    console.log('✅ Transaction created:', transaction?.id);

    return NextResponse.json({
      success: true,
      transaction_id: transaction?.id,
      transcription,
      expense_data: expenseData,
      processing_time_ms: Date.now() - startTime,
    });

  } catch (error: any) {
    console.error('❌ Error processing WhatsApp:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET para verificación de webhook Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('🔍 Verifying webhook:', { mode, token, challenge });

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return new NextResponse(challenge);
  }

  console.log('❌ Verification failed');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

