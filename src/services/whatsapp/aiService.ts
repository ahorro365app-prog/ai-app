import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const prisma = new PrismaClient();

interface ExpenseData {
  isExpense: boolean;
  amount: number;
  description: string;
  categoryId?: string;
  date?: Date;
  confirmationMessage: string;
}

export async function extractExpenseData(text: string, user: any): Promise<ExpenseData> {
  try {
    // Obtener categorías del usuario
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: user.id },
          { userId: null }, // Categorías globales
        ],
      },
    });

    const categoriesText = categories.map((c) => `- ${c.name}`).join("\n");

    const prompt = `Eres un asistente financiero inteligente. Analiza el siguiente mensaje y determina si describe un gasto.

Mensaje del usuario: "${text}"

Categorías disponibles:
${categoriesText}

Si es un gasto, extrae:
1. Monto (número)
2. Descripción corta
3. Categoría (elige la más apropiada de la lista)
4. Fecha (si se menciona, sino usa hoy)

Responde SOLO con un JSON válido:
{
  "isExpense": true/false,
  "amount": número,
  "description": "descripción",
  "category": "nombre de categoría",
  "date": "YYYY-MM-DD" o null,
  "confidence": 0-100
}

Si NO es un gasto, responde:
{
  "isExpense": false,
  "confidence": 0
}`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const data = JSON.parse(responseText);

    if (!data.isExpense) {
      return {
        isExpense: false,
        amount: 0,
        description: "",
        confirmationMessage: "No pude identificar un gasto en tu mensaje.",
      };
    }

    // Buscar la categoría
    const category = categories.find(
      (c) => c.name.toLowerCase() === data.category?.toLowerCase()
    );

    // Crear mensaje de confirmación personalizado
    const confirmationMessage = generateConfirmationMessage(
      data.amount,
      data.description,
      category?.name || "Sin categoría",
      user.currency || "USD"
    );

    return {
      isExpense: true,
      amount: data.amount,
      description: data.description,
      categoryId: category?.id,
      date: data.date ? new Date(data.date) : undefined,
      confirmationMessage,
    };
  } catch (error) {
    console.error("Error extrayendo datos con IA:", error);
    return {
      isExpense: false,
      amount: 0,
      description: "",
      confirmationMessage: "No pude procesar tu mensaje correctamente.",
    };
  }
}

function generateConfirmationMessage(
  amount: number,
  description: string,
  category: string,
  currency: string
): string {
  const currencySymbols: Record<string, string> = {
    USD: "$",
    BOB: "Bs",
    MXN: "$",
    ARS: "$",
    COP: "$",
    EUR: "€",
  };

  const symbol = currencySymbols[currency] || currency;

  return `✅ ¡Gasto registrado!

💰 Monto: ${symbol} ${amount.toFixed(2)}
📝 Descripción: ${description}
🏷️ Categoría: ${category}
📅 Fecha: ${new Date().toLocaleDateString("es-ES")}

Puedes ver todos tus gastos en la app 📱`;
}




