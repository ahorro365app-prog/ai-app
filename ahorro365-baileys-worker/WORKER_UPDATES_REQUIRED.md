# 📋 Actualizaciones Requeridas en Worker para Deduplicación

## ⚠️ Se requieren 2 cambios MANUALES en el Worker

### CAMBIO 1: En `src/services/whatsapp.ts`

En el event handler `messages.upsert`, agregar `messageId: msg.key.id`:

```ts
this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
  for (const msg of messages) {
    if (msg.key.fromMe) continue;

    const messageData: IWhatsAppMessage = {
      from: msg.key.remoteJid || '',
      message: msg.message?.conversation || '',
      timestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now(),
      type: msg.message?.audioMessage ? 'audio' : 
            msg.message?.imageMessage ? 'image' : 'text',
      data: msg.message,
      messageId: msg.key.id, // ← AGREGAR ESTA LÍNEA
    };

    if (this.onMessageCallback) {
      this.onMessageCallback(messageData);
    }
  }
});
```

### CAMBIO 2: En `src/index.ts`

En el callback que hace POST al backend, agregar `wa_message_id`:

```ts
const messageData = {
  from: message.from,
  message: message.message,
  type: message.type,
  text: message.message,
  wa_message_id: (message as any).messageId, // ← AGREGAR ESTA LÍNEA
  timestamp: message.timestamp
};

await axios.post(
  `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/webhooks/baileys`,
  messageData
);
```

### Verificación

Después de los cambios, el payload POST debe incluir:

```json
{
  "from": "...",
  "message": "...",
  "type": "audio|text|image",
  "wa_message_id": "3EB0...ABC",
  "timestamp": 1234567890000
}
```

---

## 🚀 Deploy

1. Hacer cambios en `whatsapp.ts` e `index.ts`
2. Commit y push
3. Fly.io redeploya automáticamente
4. Verificar en logs: `wa_message_id` debe aparecer en el payload


