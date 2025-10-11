import { PrismaClient } from "@prisma/client";
import { transcribeAudio } from "./whisperService";
import { extractExpenseData } from "./aiService";
import { sendWhatsAppMessage } from "./whatsappSender";

const prisma = new PrismaClient();

interface MessageData {
  phoneNumber: string;
  messageId: string;
  type: "TEXT" | "AUDIO" | "IMAGE";
  content?: string;
  audioUrl?: string;
  imageUrl?: string;
}

export async function processWhatsAppMessage(data: MessageData) {
  try {
    console.log(`🔄 Procesando mensaje ${data.messageId} de ${data.phoneNumber}`);

    // 1. Identificar o crear usuario por número de teléfono
    const user = await findOrCreateUserByPhone(data.phoneNumber);

    if (!user) {
      await sendWhatsAppMessage(
        data.phoneNumber,
        "⚠️ No pudimos identificar tu cuenta. Por favor regístrate en la app primero: https://tuapp.com/sign-up"
      );
      return;
    }

    // 2. Guardar mensaje en BD
    const savedMessage = await prisma.whatsappMessage.create({
      data: {
        userId: user.id,
        phoneNumber: data.phoneNumber,
        messageId: data.messageId,
        messageType: data.type,
        content: data.content,
        audioUrl: data.audioUrl,
        imageUrl: data.imageUrl,
        direction: "INBOUND",
      },
    });

    let textToProcess = data.content;

    // 3. Si es audio, convertir a texto
    if (data.type === "AUDIO" && data.audioUrl) {
      console.log("🎙️ Transcribiendo audio...");
      textToProcess = await transcribeAudio(data.audioUrl);
      
      // Actualizar mensaje con transcripción
      await prisma.whatsappMessage.update({
        where: { id: savedMessage.id },
        data: { content: textToProcess },
      });

      console.log(`✅ Audio transcrito: "${textToProcess}"`);
    }

    // 4. Si es imagen (recibo), usar OCR
    if (data.type === "IMAGE" && data.imageUrl) {
      console.log("📸 Procesando imagen con OCR...");
      // TODO: Implementar OCR
      textToProcess = await extractTextFromImage(data.imageUrl);
    }

    // 5. Procesar con IA para extraer datos del gasto
    if (textToProcess) {
      console.log("🤖 Procesando con IA...");
      const expenseData = await extractExpenseData(textToProcess, user);

      if (expenseData.isExpense) {
        // 6. Crear el gasto en la BD
        const expense = await prisma.expense.create({
          data: {
            userId: user.id,
            amount: expenseData.amount,
            description: expenseData.description,
            categoryId: expenseData.categoryId,
            date: expenseData.date || new Date(),
            source: data.type === "AUDIO" ? "VOICE" : data.type === "IMAGE" ? "OCR" : "WHATSAPP",
            currency: user.currency || "USD",
            metadata: {
              whatsappMessageId: savedMessage.id,
              originalText: textToProcess,
            },
          },
        });

        // 7. Marcar mensaje como procesado
        await prisma.whatsappMessage.update({
          where: { id: savedMessage.id },
          data: {
            processed: true,
            expenseCreated: true,
            aiResponse: expenseData.confirmationMessage,
          },
        });

        // 8. Enviar confirmación al usuario
        await sendWhatsAppMessage(
          data.phoneNumber,
          expenseData.confirmationMessage
        );

        console.log(`✅ Gasto creado: ${expense.id}`);
      } else {
        // No es un gasto, responder con mensaje de ayuda
        const helpMessage = `👋 Hola! No pude identificar un gasto en tu mensaje.

Ejemplos de cómo puedes registrar gastos:
• "Gasté 50 en almuerzo"
• "Compré en el supermercado por 120"
• "Uber 25"
• "Netflix 79"

¿En qué puedo ayudarte? 🤖`;

        await prisma.whatsappMessage.update({
          where: { id: savedMessage.id },
          data: {
            processed: true,
            aiResponse: helpMessage,
          },
        });

        await sendWhatsAppMessage(data.phoneNumber, helpMessage);
      }
    }

    // 9. Registrar uso
    await prisma.usage.create({
      data: {
        userId: user.id,
        type: data.type === "AUDIO" ? "VOICE_TRANSCRIPTION" : "WHATSAPP",
        success: true,
      },
    });

  } catch (error) {
    console.error("❌ Error procesando mensaje:", error);
    
    // Enviar mensaje de error al usuario
    await sendWhatsAppMessage(
      data.phoneNumber,
      "⚠️ Ocurrió un error procesando tu mensaje. Por favor intenta de nuevo."
    );
  }
}

// Buscar o crear usuario por número de teléfono
async function findOrCreateUserByPhone(phoneNumber: string) {
  try {
    // Limpiar número de teléfono (quitar espacios, guiones, etc.)
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, "");

    // Buscar usuario existente
    let user = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    // Si no existe, verificar si hay un usuario con Clerk pendiente de vincular
    // (usuario que se registró pero no vinculó su WhatsApp)
    if (!user) {
      // Por ahora retornamos null, pero podrías implementar
      // lógica para enviar un código de verificación y vincular cuenta
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error buscando usuario:", error);
    return null;
  }
}

// Placeholder para OCR de imágenes
async function extractTextFromImage(imageUrl: string): Promise<string> {
  // TODO: Implementar con Google Vision API, Tesseract, etc.
  return "Procesando imagen...";
}




