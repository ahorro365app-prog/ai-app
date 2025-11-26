/**
 * Construye mensajes de preview para transacciones
 * Formato exacto según sistema Baileys original
 */

import type { GroqTransaction } from '@/services/groqService';
import { getCountrySymbol } from './countryRules';

/**
 * Construye preview para transacción SIMPLE (1 transacción)
 * @param expenseData - Datos de la transacción
 * @param processedType - Tipo procesado (AUDIO/TEXTO)
 * @param countryCode - Código del país del usuario (ej: 'BOL', 'PER')
 */
export function construirPreviewSimple(
  expenseData: GroqTransaction | null,
  processedType: string = 'TEXTO',
  countryCode: string = 'BOL'
): string {
  if (!expenseData) {
    return '❌ No se pudo procesar la transacción';
  }

  const tipoEmoji = expenseData.tipo === 'ingreso' ? '📈' : '📉';
  const tipoTexto = expenseData.tipo === 'ingreso' ? 'INGRESO' : 'GASTO';
  const currencySymbol = getCountrySymbol(countryCode);
  
  return `✅ *${processedType.toUpperCase()} PROCESADO*
${tipoEmoji} *${tipoTexto}*
*Monto (${currencySymbol}):* ${expenseData.monto || 0}
*Método de Pago:* ${expenseData.metodoPago || 'efectivo'}
*Categoría:* ${expenseData.categoria || 'otros'}
*Descripción:* ${expenseData.descripcion || 'Sin descripción'}

*¿Está bien?*
✅ *Responde:* sí / ok / perfecto / está bien
⏰ Sin confirmación se guarda automáticamente en 30 minutos
📱 (Tienes 48h para editarla o eliminarla en la app)`;
}

/**
 * Construye preview para transacciones MÚLTIPLES (N transacciones)
 * @param transactions - Array de transacciones
 * @param processedType - Tipo procesado (AUDIO/TEXTO)
 * @param previousPendingCount - Número de transacciones pendientes previas (opcional)
 * @param countryCode - Código del país del usuario (ej: 'BOL', 'PER')
 */
export function construirPreviewMultiple(
  transactions: GroqTransaction[],
  processedType: string = 'TEXTO',
  previousPendingCount: number = 0,
  countryCode: string = 'BOL'
): string {
  if (!transactions || transactions.length === 0) {
    return '❌ No se pudieron procesar las transacciones';
  }

  const currencySymbol = getCountrySymbol(countryCode);
  let preview = `✅ *${transactions.length} ${processedType.toUpperCase()}S PROCESADOS*\n\n`;
  
  transactions.forEach((tx, i) => {
    const emoji = tx.tipo === 'ingreso' ? '📈' : '📉';
    const tipoTexto = tx.tipo === 'ingreso' ? 'INGRESO' : 'GASTO';
    const signo = tx.tipo === 'ingreso' ? '+' : '';
    preview += `${i+1}) ${emoji} *${tipoTexto}*\n`;
    preview += `   *Monto:* ${signo}${tx.monto} ${currencySymbol}\n`;
    preview += `   *Categoría:* ${tx.categoria}\n`;
    preview += `   *Descripción:* ${tx.descripcion || 'Sin descripción'}\n`;
    preview += `   💳 ${tx.metodoPago || 'efectivo'}\n\n`;
  });
  
  // Solo mostrar advertencia si hay transacciones pendientes previas
  if (previousPendingCount > 0) {
    const totalPending = previousPendingCount + transactions.length;
    preview += `⚠️ Tienes ${totalPending} transacciones pendientes (${previousPendingCount} anteriores + ${transactions.length} nuevas)\n\n`;
  }
  
  preview += `*¿Están bien estas ${transactions.length}?*\n`;
  preview += `✅ *Responde:* sí / ok / perfecto / está bien\n`;
  preview += `⏰ Sin confirmación se guardan automáticamente en 30 minutos\n`;
  preview += `📱 (Puedes editarlas o eliminarlas en 48h en la app)`;
  
  return preview;
}




