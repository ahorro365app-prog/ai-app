import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// Verificación del webhook de WhatsApp (Meta/Twilio)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Verificación de Meta/WhatsApp
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado correctamente");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Token de verificación inválido" }, { status: 403 });
}

// Recepción de mensajes de WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("📱 Mensaje recibido de WhatsApp:", JSON.stringify(body, null, 2));

    // Validar que sea un mensaje válido
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      return NextResponse.json({ status: "ok", message: "No messages" });
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const phoneNumber = message.from; // Número de WhatsApp del remitente
    const messageId = message.id;
    const messageType = message.type; // text, audio, image, etc.

    // Procesar según el tipo de mensaje
    switch (messageType) {
      case "text":
        await processTextMessage(phoneNumber, messageId, message.text.body);
        break;
      
      case "audio":
      case "voice":
        await processAudioMessage(phoneNumber, messageId, message.audio || message.voice);
        break;
      
      case "image":
        await processImageMessage(phoneNumber, messageId, message.image);
        break;
      
      default:
        console.log(`⚠️ Tipo de mensaje no soportado: ${messageType}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Procesar mensaje de texto
async function processTextMessage(phoneNumber: string, messageId: string, text: string) {
  console.log(`💬 Texto recibido de ${phoneNumber}: ${text}`);
  
  // Importar dinámicamente para evitar problemas de edge runtime
  const { processWhatsAppMessage } = await import("@/services/whatsapp/messageProcessor");
  
  await processWhatsAppMessage({
    phoneNumber,
    messageId,
    type: "TEXT",
    content: text,
  });
}

// Procesar mensaje de voz
async function processAudioMessage(phoneNumber: string, messageId: string, audio: any) {
  console.log(`🎤 Audio recibido de ${phoneNumber}`);
  
  const audioUrl = await downloadWhatsAppMedia(audio.id);
  
  const { processWhatsAppMessage } = await import("@/services/whatsapp/messageProcessor");
  
  await processWhatsAppMessage({
    phoneNumber,
    messageId,
    type: "AUDIO",
    audioUrl,
  });
}

// Procesar imagen (recibo)
async function processImageMessage(phoneNumber: string, messageId: string, image: any) {
  console.log(`📸 Imagen recibida de ${phoneNumber}`);
  
  const imageUrl = await downloadWhatsAppMedia(image.id);
  
  const { processWhatsAppMessage } = await import("@/services/whatsapp/messageProcessor");
  
  await processWhatsAppMessage({
    phoneNumber,
    messageId,
    type: "IMAGE",
    imageUrl,
  });
}

// Descargar media de WhatsApp
async function downloadWhatsAppMedia(mediaId: string): Promise<string> {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0";

  try {
    // 1. Obtener la URL del media
    const mediaResponse = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
    });

    const mediaData = await mediaResponse.json();
    const mediaUrl = mediaData.url;

    // 2. Descargar el archivo
    const fileResponse = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
    });

    const buffer = await fileResponse.arrayBuffer();

    // 3. Aquí deberías subir a tu storage (S3, Cloudinary, etc.)
    // Por ahora, retornamos una URL temporal
    // TODO: Implementar upload a storage permanente
    
    return mediaUrl; // Temporal
  } catch (error) {
    console.error("Error descargando media:", error);
    throw error;
  }
}




