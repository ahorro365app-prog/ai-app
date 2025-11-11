import { z } from 'zod';

/**
 * Schemas de validación Zod para endpoints de la API
 * Previene SQL injection, XSS, y inyección de datos maliciosos
 */

// =============================================
// VALIDACIONES COMUNES
// =============================================

/**
 * UUID válido
 */
export const uuidSchema = z.string().uuid('ID debe ser un UUID válido');

/**
 * Email válido
 */
export const emailSchema = z.string()
  .email('Email inválido')
  .max(255, 'Email demasiado largo')
  .toLowerCase()
  .trim();

/**
 * Teléfono válido (formato internacional)
 */
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono debe tener formato internacional válido')
  .max(20, 'Teléfono demasiado largo');

/**
 * URL válida
 */
export const urlSchema = z.string()
  .url('URL inválida')
  .max(2048, 'URL demasiado larga');

/**
 * Texto seguro (previene XSS básico)
 */
export const safeTextSchema = z.string()
  .max(5000, 'Texto demasiado largo')
  .refine(
    (val) => !/<script|javascript:|onerror|onload/i.test(val),
    'Texto contiene caracteres no permitidos'
  );

/**
 * Notas/Comentarios (más permisivo pero seguro)
 */
export const notesSchema = z.string()
  .max(1000, 'Notas demasiado largas')
  .optional()
  .nullable();

// =============================================
// SCHEMAS DE PAGOS
// =============================================

/**
 * Schema para crear un pago
 */
export const createPaymentSchema = z.object({
  plan: z.literal('pro', {
    errorMap: () => ({ message: 'Solo se acepta el plan "pro"' })
  }),
  monto_usdt: z.number()
    .positive('El monto debe ser positivo')
    .max(10000, 'El monto es demasiado alto'),
  direccion_wallet: z.string()
    .max(200, 'Dirección de wallet demasiado larga')
    .optional()
    .nullable(),
  hash_transaccion: z.string()
    .max(200, 'Hash de transacción demasiado largo')
    .optional()
    .nullable(),
  comprobante_url: urlSchema
    .optional()
    .nullable(),
  notas: notesSchema,
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// =============================================
// SCHEMAS DE AUDIO
// =============================================

/**
 * Schema para procesar audio
 */
export const processAudioSchema = z.object({
  user_id: uuidSchema,
  transcription: z.string()
    .max(5000, 'Transcripción demasiado larga')
    .optional(),
  audioDurationSeconds: z.number()
    .positive('La duración debe ser positiva')
    .max(15, 'El audio no puede exceder 15 segundos')
    .optional()
    .nullable(),
});

export type ProcessAudioInput = z.infer<typeof processAudioSchema>;

// =============================================
// SCHEMAS DE FEEDBACK
// =============================================

/**
 * Schema para confirmar feedback
 */
export const confirmFeedbackSchema = z.object({
  prediction_id: uuidSchema,
  confirmado: z.boolean({
    required_error: 'confirmado es requerido',
    invalid_type_error: 'confirmado debe ser true o false'
  }),
  comentario: z.string()
    .max(500, 'Comentario demasiado largo')
    .optional()
    .nullable(),
  usuario_id: uuidSchema.optional(),
  country_code: z.string()
    .length(3, 'Código de país debe tener 3 caracteres')
    .optional(),
});

export type ConfirmFeedbackInput = z.infer<typeof confirmFeedbackSchema>;

// =============================================
// SCHEMAS DE WEBHOOKS
// =============================================

/**
 * Schema para webhook de WhatsApp (Meta)
 * Validación básica de estructura
 */
export const whatsappWebhookSchema = z
  .object({
    object: z.literal('whatsapp_business_account').optional(),
  })
  .passthrough(); // Validación básica: aceptamos payload y lo inspeccionamos manualmente

export type WhatsAppWebhookInput = z.infer<typeof whatsappWebhookSchema>;

/**
 * Schema para webhook de Baileys
 */
export const baileysWebhookSchema = z.object({
  from: phoneSchema,
  type: z.literal('audio'),
  audioBase64: z.string()
    .min(1, 'Audio base64 es requerido')
    .refine(
      (val) => {
        try {
          // Validar que es base64 válido
          return Buffer.from(val, 'base64').length > 0;
        } catch {
          return false;
        }
      },
      'Audio base64 inválido'
    ),
  timestamp: z.number().positive().optional(),
});

export type BaileysWebhookInput = z.infer<typeof baileysWebhookSchema>;

// =============================================
// SCHEMAS DE ADMIN
// =============================================

/**
 * Schema para login de admin
 */
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(1, 'Contraseña es requerida')
    .max(200, 'Contraseña demasiado larga'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// =============================================
// HELPER PARA VALIDAR Y PARSEAR
// =============================================

/**
 * Valida datos con Zod y retorna error formateado si falla
 */
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const errorMessage = firstError?.message || 'Error de validación';
      const errorPath = firstError?.path?.join('.') || 'unknown';
      
      return {
        success: false,
        error: `${errorPath}: ${errorMessage}`,
        details: error.errors,
      };
    }
    
    return {
      success: false,
      error: 'Error de validación desconocido',
    };
  }
}

