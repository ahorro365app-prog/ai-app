import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { handleError, handleValidationError, ErrorType } from '@/lib/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return handleValidationError('No transcript provided');
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return handleError(
        new Error('ANTHROPIC_API_KEY not configured'),
        'Error de configuración del servidor',
        ErrorType.INTERNAL
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analiza el siguiente texto y extrae información sobre un gasto:

"${transcript}"

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "amount": número (el monto del gasto),
  "category": string (una de estas: "comida", "transporte", "entretenimiento", "compras", "salud", "servicios", "otro"),
  "description": string (descripción breve del gasto)
}

Si no puedes identificar algún campo, usa null. No incluyas ningún texto adicional, solo el JSON.`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Intentar parsear el JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });

  } catch (error: any) {
    return handleError(
      error,
      'Error al procesar el gasto',
      ErrorType.EXTERNAL_API
    );
  }
}



