/**
 * Utilidad para sanitizar datos antes de loguearlos
 * Previene exposición de información sensible en logs
 * 
 * Sanitiza:
 * - Números de teléfono (trunca a primeros 5 dígitos)
 * - Tokens y API keys (trunca a primeros 10 caracteres)
 * - Secrets y passwords (reemplaza con ***REDACTED***)
 */

/**
 * Sanitiza un valor para logging
 */
export function sanitizeForLog(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Strings
  if (typeof data === 'string') {
    // Truncar números de teléfono (10+ dígitos)
    if (data.match(/^\d{10,}$/)) {
      return data.substring(0, 5) + '...';
    }
    
    // Truncar tokens y API keys
    if (data.length > 50) {
      // Tokens de WhatsApp (empiezan con EA o son muy largos)
      if (data.startsWith('EA') || data.startsWith('gsk_') || data.startsWith('Bearer ')) {
        return data.substring(0, 10) + '...';
      }
      // Otros tokens largos
      if (data.length > 100) {
        return data.substring(0, 10) + '...';
      }
    }
    
    return data;
  }

  // Objetos y arrays
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeForLog(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Campos sensibles: reemplazar completamente
      if (
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('password') ||
        lowerKey.includes('passwd') ||
        lowerKey.includes('key') && (lowerKey.includes('api') || lowerKey.includes('private'))
      ) {
        sanitized[key] = '***REDACTED***';
      }
      // Campos de teléfono: truncar
      else if (lowerKey.includes('phone') || lowerKey.includes('telefono') || lowerKey.includes('wa_id')) {
        if (typeof value === 'string') {
          sanitized[key] = value.substring(0, 5) + '...';
        } else {
          sanitized[key] = sanitizeForLog(value);
        }
      }
      // Otros campos: sanitizar recursivamente
      else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    
    return sanitized;
  }

  // Otros tipos (números, booleanos, etc.)
  return data;
}

/**
 * Sanitiza un objeto específicamente para logs de webhooks
 */
export function sanitizeWebhookData(data: any): any {
  if (!data) return data;

  const sanitized = { ...data };

  // Sanitizar campos específicos de webhooks
  if (sanitized.entry) {
    sanitized.entry = sanitized.entry.map((entry: any) => {
      if (entry.changes) {
        entry.changes = entry.changes.map((change: any) => {
          if (change.value) {
            // Sanitizar contactos
            if (change.value.contacts) {
              change.value.contacts = change.value.contacts.map((contact: any) => ({
                ...contact,
                wa_id: contact.wa_id ? contact.wa_id.substring(0, 5) + '...' : contact.wa_id,
              }));
            }
            // Sanitizar mensajes
            if (change.value.messages) {
              change.value.messages = change.value.messages.map((msg: any) => {
                const sanitizedMsg = { ...msg };
                if (sanitizedMsg.from) {
                  sanitizedMsg.from = sanitizedMsg.from.substring(0, 5) + '...';
                }
                return sanitizedMsg;
              });
            }
          }
          return change;
        });
      }
      return entry;
    });
  }

  return sanitized;
}

