import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Endpoint para probar el token de WhatsApp
 * GET /api/whatsapp/test-token
 */
export async function GET(req: NextRequest) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v24.0';
  
  if (!token) {
    return NextResponse.json({ 
      success: false,
      error: 'Token no configurado',
      message: 'WHATSAPP_ACCESS_TOKEN no está configurado en las variables de entorno'
    }, { status: 500 });
  }

  if (!phoneNumberId) {
    return NextResponse.json({ 
      success: false,
      error: 'Phone Number ID no configurado',
      message: 'WHATSAPP_PHONE_NUMBER_ID no está configurado'
    }, { status: 500 });
  }

  // Información del token (sin exponerlo completamente)
  const tokenInfo = {
    exists: !!token,
    length: token?.length || 0,
    prefix: token ? token.substring(0, 20) + '...' : 'N/A',
    suffix: token && token.length > 20 ? '...' + token.substring(token.length - 20) : 'N/A',
    startsWithEA: token?.startsWith('EA') || false,
    hasSpaces: token?.includes(' ') || false,
    hasNewlines: token?.includes('\n') || false,
  };

  logger.debug('🔍 Información del token:', tokenInfo);

  try {
    // Probar el token haciendo una llamada simple a la API de Meta
    const testUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=verified_name`;
    
    logger.debug('🔍 Probando token de WhatsApp:', {
      tokenInfo,
      phoneNumberId,
      apiVersion,
      testUrl
    });

    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logger.info('✅ Token válido:', {
        phoneNumberId,
        verifiedName: data.verified_name
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Token válido',
        data: {
          phoneNumberId,
          verifiedName: data.verified_name,
          tokenInfo
        }
      });
    } else {
      logger.error('❌ Token inválido o expirado:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });

      const errorMessage = data.error?.message || 'Unknown error';
      const isExpired = errorMessage.includes('expired') || 
                       errorMessage.includes('expiró') || 
                       errorMessage.includes('Session has expired');

      return NextResponse.json({ 
        success: false, 
        error: 'Token inválido o expirado',
        tokenInfo,
        details: {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          isExpired,
          errorCode: data.error?.code,
          errorType: data.error?.type,
          fbtraceId: data.error?.fbtrace_id,
          expiredAt: data.error?.message?.match(/expired on (.+?) PST/)?.[1] || null,
          currentTime: data.error?.message?.match(/current time is (.+?) PST/)?.[1] || null
        },
        solution: isExpired 
          ? 'El token ha expirado. Necesitas regenerar el token en Meta Developer Console o usar un token permanente.'
          : 'El token es inválido. Verifica que el token sea correcto y tenga los permisos necesarios.',
        troubleshooting: {
          checkTokenLength: tokenInfo.length < 200 ? '⚠️ El token parece muy corto. Los tokens suelen tener 200-300 caracteres.' : '✅ Longitud del token OK',
          checkTokenFormat: !tokenInfo.startsWithEA ? '⚠️ El token no comienza con "EA". Verifica que copiaste el token completo.' : '✅ Formato del token OK',
          checkSpaces: tokenInfo.hasSpaces ? '⚠️ El token contiene espacios. Elimina todos los espacios del token en .env.local' : '✅ Sin espacios',
          checkNewlines: tokenInfo.hasNewlines ? '⚠️ El token contiene saltos de línea. El token debe estar en una sola línea.' : '✅ Sin saltos de línea',
          serverRestart: '⚠️ ¿Reiniciaste el servidor después de actualizar .env.local? Next.js carga las variables al iniciar.'
        }
      }, { status: 401 });
    }
  } catch (error: any) {
    logger.error('❌ Error verificando token:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error verificando token',
      message: error.message 
    }, { status: 500 });
  }
}

