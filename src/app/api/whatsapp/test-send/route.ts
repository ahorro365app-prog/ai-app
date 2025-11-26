import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsappCloudApi';
import { logger } from '@/lib/logger';
import { handleError, ErrorType } from '@/lib/errorHandler';

/**
 * POST /api/whatsapp/test-send
 * 
 * Endpoint de prueba para enviar un mensaje de WhatsApp
 * Útil para diagnosticar problemas de configuración
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number required' },
        { status: 400 }
      );
    }

    const testMessage = message || '🧪 Mensaje de prueba de Ahorro365';

    logger.info('🧪 Test: Intentando enviar mensaje de prueba...', {
      phone: phone.substring(0, 5) + '...',
      hasToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
      hasPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      tokenLength: process.env.WHATSAPP_ACCESS_TOKEN?.length || 0,
      phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID
    });

    // Normalizar número
    const phoneNumberNormalized = phone.startsWith('+') ? phone.substring(1) : phone;

    const result = await sendWhatsAppMessage(phoneNumberNormalized, testMessage);

    if (result.success) {
      logger.info('✅ Test: Mensaje enviado exitosamente', {
        message_id: result.message_id
      });
      
      return NextResponse.json({
        success: true,
        message: 'Mensaje de prueba enviado exitosamente',
        message_id: result.message_id
      });
    } else {
      logger.error('❌ Test: Error enviando mensaje', {
        error: result.error
      });
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Error desconocido',
        details: {
          hasToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
          hasPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
          tokenLength: process.env.WHATSAPP_ACCESS_TOKEN?.length || 0,
          phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    return handleError(error, 'Error enviando mensaje de prueba de WhatsApp', ErrorType.EXTERNAL_API_ERROR);
  }
}

