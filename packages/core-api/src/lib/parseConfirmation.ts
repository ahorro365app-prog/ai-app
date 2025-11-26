/**
 * Parsea mensaje de usuario para confirmar transacción
 * Solo detecta confirmaciones POSITIVAS
 */
export function parseConfirmation(message: string): {
  type: 'confirm' | 'unclear' | 'empty';
  confidence: number;
} {
  if (!message || message.trim().length === 0) {
    return { type: 'empty', confidence: 0 };
  }

  const text = message.toLowerCase().trim();

  // Palabras que confirman
  const confirmWords = [
    'si', 'sí', 'ok', 'okey', 'está bien', 'esta bien',
    'perfecto', 'correcto', 'yes', 'yep', 'ya', 'listo',
    'bueno', 'vale', 'excelente', 'genial', 'bien',
    'confirmado', 'aprobado', 'aceptado', 'ok gracias',
    'si gracias', 'está correcto', 'esta correcto', 'claro',
    'dale', 'va', 'vaya', 'oki'
  ];

  // Emojis que confirman
  const confirmEmojis = ['✅', '👍', '✔️', '🆗', '👌'];

  // Verificar emojis primero (son más claros)
  for (const emoji of confirmEmojis) {
    if (message.includes(emoji)) {
      return { type: 'confirm', confidence: 0.95 };
    }
  }

  // Luego verificar palabras
  for (const word of confirmWords) {
    if (text.includes(word)) {
      return { type: 'confirm', confidence: 0.85 };
    }
  }

  // No coincide con nada
  return { type: 'unclear', confidence: 0 };
}

