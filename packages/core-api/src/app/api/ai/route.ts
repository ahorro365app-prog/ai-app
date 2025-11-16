import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const messages: { role: string; content: string }[] = body?.messages ?? [];

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Sandbox: si no hay claves, responde con eco y una ayuda.
  if (!anthropicKey && !openaiKey) {
    const last = messages[messages.length - 1]?.content ?? "";
    const reply = `Sandbox: recibí "${last}". Agrega ANTHROPIC_API_KEY u OPENAI_API_KEY en .env.local para respuestas reales.`;
    return NextResponse.json({ reply });
  }

  // Placeholder: integración real se añadirá tras configurar claves y límites.
  const reply = "Integración IA real pendiente de configuración de claves y modelo.";
  return NextResponse.json({ reply });
}


