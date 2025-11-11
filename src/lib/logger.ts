/**
 * Sistema de logging condicional
 * - En desarrollo: muestra todos los logs
 * - En producción: solo muestra errores y warnings críticos
 * - Permite debugging detallado durante desarrollo sin afectar producción
 */

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
   */
  debug: (...args: any[]) => {
    if (shouldLog('debug')) {
      console.log('🔍 [DEBUG]', ...args);
    }
  },

  /**
   * Info: Solo en desarrollo
   * Para información general del flujo
   */
  info: (...args: any[]) => {
    if (shouldLog('info')) {
      console.log('ℹ️ [INFO]', ...args);
    }
  },

  /**
   * Warning: Siempre visible
   * Para advertencias importantes que deberían verse en producción
   */
  warn: (...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn('⚠️ [WARN]', ...args);
    }
  },

  /**
   * Error: Siempre visible
   * Para errores críticos que siempre deben registrarse
   */
  error: (...args: any[]) => {
    if (shouldLog('error')) {
      console.error('❌ [ERROR]', ...args);
    }
  },

  /**
   * Log de éxito: Solo en desarrollo
   * Para logs de operaciones exitosas
   */
  success: (...args: any[]) => {
    if (shouldLog('info')) {
      console.log('✅ [SUCCESS]', ...args);
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
 */
export const webhookLogger = {
  received: (data: any) => {
    if (isDevelopment) {
      logger.debug('📱 Webhook recibido:', JSON.stringify(data, null, 2));
    }
  },
  success: (message: string, data?: any) => {
    if (isDevelopment) {
      logger.success(message, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  error: (message: string, error?: any) => {
    logger.error(message, error);
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


