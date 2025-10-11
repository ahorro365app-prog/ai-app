const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error enviando mensaje de WhatsApp:", data);
      return false;
    }

    console.log(`✅ Mensaje enviado a ${to}`);
    return true;
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    return false;
  }
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  parameters: string[]
): Promise<boolean> {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "es",
          },
          components: [
            {
              type: "body",
              parameters: parameters.map((p) => ({
                type: "text",
                text: p,
              })),
            },
          ],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error enviando template:", data);
      return false;
    }

    console.log(`✅ Template enviado a ${to}`);
    return true;
  } catch (error) {
    console.error("Error enviando template:", error);
    return false;
  }
}




