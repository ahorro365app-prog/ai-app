/**
 * Sistema de logging condicional
 * - En desarrollo: muestra todos los logs
 * - En producción: solo muestra errores y warnings críticos
 * - Permite debugging detallado durante desarrollo sin afectar producción
 */

import { sanitizeForLog, sanitizeWebhookData } from './sanitizeForLog';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuración de niveles por entorno
const LOG_LEVELS: Record<string, LogLevel[]> = {
  development: ['debug', 'info', 'warn', 'error'],
  production: ['warn', 'error'], // Solo errores y warnings en producción
  test: ['error'], // Solo errores en tests
};

const currentLogLevels = LOG_LEVELS[process.env.NODE_ENV || 'development'] || LOG_LEVELS.development;

function shouldLog(level: LogLevel): boolean {
  return currentLogLevels.includes(level);
}

/**
 * Logger principal
 * Uso:
 * - logger.debug('Mensaje de debug') - Solo en desarrollo
 * - logger.info('Mensaje informativo') - Solo en desarrollo
 * - logger.warn('Advertencia') - Siempre visible
 * - logger.error('Error crítico') - Siempre visible
 */
export const logger = {
  /**
   * Debug: Solo en desarrollo
   * Para logs detallados de debugging
   * Sanitiza automáticamente datos sensibles
   */
  debug: (...args: any[]) => {
    if (shouldLog('debug')) {
      const sanitized = args.map(arg => sanitizeForLog(arg));
      console.log('🔍 [DEBUG]', ...sanitized);
    }
  },

  /**
   * Info: Solo en desarrollo
   * Para información general del flujo
   * Sanitiza automáticamente datos sensibles
   */
  info: (...args: any[]) => {
    if (shouldLog('info')) {
      const sanitized = args.map(arg => sanitizeForLog(arg));
      console.log('ℹ️ [INFO]', ...sanitized);
    }
  },

  /**
   * Warning: Siempre visible
   * Para advertencias importantes que deberían verse en producción
   * Sanitiza automáticamente datos sensibles
   */
  warn: (...args: any[]) => {
    if (shouldLog('warn')) {
      const sanitized = args.map(arg => sanitizeForLog(arg));
      console.warn('⚠️ [WARN]', ...sanitized);
    }
  },

  /**
   * Error: Siempre visible
   * Para errores críticos que siempre deben registrarse
   * Sanitiza automáticamente datos sensibles
   */
  error: (...args: any[]) => {
    if (shouldLog('error')) {
      const sanitized = args.map(arg => sanitizeForLog(arg));
      console.error('❌ [ERROR]', ...sanitized);
    }
  },

  /**
   * Log de éxito: Solo en desarrollo
   * Para logs de operaciones exitosas
   * Sanitiza automáticamente datos sensibles
   */
  success: (...args: any[]) => {
    if (shouldLog('info')) {
      const sanitized = args.map(arg => sanitizeForLog(arg));
      console.log('✅ [SUCCESS]', ...sanitized);
    }
  },
};

/**
 * Helper para logs condicionales con contexto
 * Útil para logs de webhooks, APIs, etc.
 */
export function logWithContext(context: string, level: LogLevel = 'info') {
  return {
    log: (...args: any[]) => {
      if (shouldLog(level)) {
        console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
          `[${context}]`,
          ...args
        );
      }
    },
  };
}

/**
 * Helper para logs de webhooks (solo desarrollo)
 * Sanitiza automáticamente datos sensibles de webhooks
 */
export const webhookLogger = {
  received: (data: any) => {
    if (isDevelopment) {
      const sanitized = sanitizeWebhookData(data);
      logger.debug('📱 Webhook recibido:', JSON.stringify(sanitized, null, 2));
    }
  },
  success: (message: string, data?: any) => {
    if (isDevelopment) {
      const sanitized = data ? sanitizeForLog(data) : undefined;
      logger.success(message, sanitized ? JSON.stringify(sanitized, null, 2) : '');
    }
  },
  error: (message: string, error?: any) => {
    const sanitized = error ? sanitizeForLog(error) : undefined;
    logger.error(message, sanitized);
  },
};

/**
 * Helper para logs de servicios (Groq, etc.)
 */
export const serviceLogger = {
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      logger.debug(message, data);
    }
  },
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      logger.info(message, data);
    }
  },
  error: (message: string, error?: any) => {
    logger.error(message, error);
  },
};

// Exportar para uso en componentes del cliente (Next.js maneja esto automáticamente)
if (typeof window !== 'undefined') {
  // En el cliente, solo mostrar errores en producción
  (window as any).logger = isProduction
    ? { error: logger.error, warn: logger.warn }
    : logger;
}


