/**
 * Validación de Variables de Entorno
 * 
 * Valida que todas las variables de entorno requeridas estén configuradas
 * al iniciar la aplicación. Lanza errores claros si faltan variables críticas.
 * 
 * Uso:
 * - Llamar en el inicio de API routes críticos
 * - Llamar en middleware si es necesario
 * - No bloquear en desarrollo si algunas variables opcionales faltan
 */

import { logger } from './logger';

type EnvVarConfig = {
  name: string;
  required: boolean;
  description: string;
  example?: string;
  validate?: (value: string) => boolean | string; // Retorna true si válido, o mensaje de error
};

/**
 * Configuración de variables de entorno requeridas para la app principal
 */
const APP_ENV_VARS: EnvVarConfig[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'URL del proyecto de Supabase',
    example: 'https://xxxxx.supabase.co',
    validate: (value) => {
      try {
        const url = new URL(value);
        return url.protocol.startsWith('http');
      } catch {
        return 'Debe ser una URL válida (http:// o https://)';
      }
    },
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Clave anónima (pública) de Supabase',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    validate: (value) => {
      if (value.length < 50) {
        return 'La clave debe tener al menos 50 caracteres';
      }
      return true;
    },
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Clave de servicio (SECRETO) de Supabase - NO exponer',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    validate: (value) => {
      if (value.length < 50) {
        return 'La clave debe tener al menos 50 caracteres';
      }
      if (value.includes('your_service_role_key_here')) {
        return 'Debe ser una clave real, no un placeholder';
      }
      return true;
    },
  },
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'URL de la API REST de Upstash Redis (para rate limiting)',
    example: 'https://xxxxx.upstash.io',
    validate: (value) => {
      try {
        const url = new URL(value);
        return url.protocol.startsWith('http');
      } catch {
        return 'Debe ser una URL válida';
      }
    },
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    description: 'Token de autenticación de Upstash Redis (SECRETO)',
    example: 'AXxxxxx...',
  },
  {
    name: 'NEXT_PUBLIC_GROQ_API_KEY',
    required: false,
    description: 'API Key de Groq para procesamiento de IA (SECRETO)',
    example: 'gsk_xxxxx...',
  },
  {
    name: 'META_WHATSAPP_TOKEN',
    required: false,
    description: 'Token de verificación de WhatsApp Meta (SECRETO)',
  },
  {
    name: 'WEBHOOK_VERIFY_TOKEN',
    required: false,
    description: 'Token de verificación para webhooks (SECRETO)',
  },
];

/**
 * Resultado de la validación
 */
export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  invalid: Array<{ name: string; error: string }>;
  warnings: string[];
}

/**
 * Valida las variables de entorno configuradas
 */
export function validateEnvironmentVariables(
  envVars: EnvVarConfig[] = APP_ENV_VARS
): EnvValidationResult {
  const missing: string[] = [];
  const invalid: Array<{ name: string; error: string }> = [];
  const warnings: string[] = [];

  for (const envVar of envVars) {
    const value = process.env[envVar.name];

    // Verificar si está presente
    if (!value || value.trim() === '') {
      if (envVar.required) {
        missing.push(envVar.name);
      } else {
        warnings.push(`${envVar.name} no está configurada (opcional)`);
      }
      continue;
    }

    // Verificar placeholders comunes
    if (
      value.includes('your_') ||
      value.includes('_here') ||
      value === 'xxx' ||
      value === 'xxxxx'
    ) {
      if (envVar.required) {
        invalid.push({
          name: envVar.name,
          error: 'Contiene un placeholder, debe ser un valor real',
        });
      } else {
        warnings.push(`${envVar.name} contiene un placeholder (opcional)`);
      }
      continue;
    }

    // Validar con función personalizada si existe
    if (envVar.validate) {
      const validationResult = envVar.validate(value);
      if (validationResult !== true) {
        invalid.push({
          name: envVar.name,
          error: typeof validationResult === 'string' ? validationResult : 'Valor inválido',
        });
      }
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

/**
 * Valida y lanza error si faltan variables críticas
 * Útil para usar en API routes o middleware
 */
export function enforceEnvironmentValidation(
  envVars: EnvVarConfig[] = APP_ENV_VARS
): void {
  const result = validateEnvironmentVariables(envVars);

  if (!result.valid) {
    const errors: string[] = [];

    if (result.missing.length > 0) {
      errors.push('Variables faltantes:');
      result.missing.forEach((name) => {
        const config = envVars.find((v) => v.name === name);
        errors.push(`  - ${name}: ${config?.description || 'Sin descripción'}`);
        if (config?.example) {
          errors.push(`    Ejemplo: ${config.example}`);
        }
      });
    }

    if (result.invalid.length > 0) {
      errors.push('Variables inválidas:');
      result.invalid.forEach(({ name, error }) => {
        errors.push(`  - ${name}: ${error}`);
      });
    }

    const errorMessage = `
❌ ERROR: Variables de entorno no configuradas correctamente

${errors.join('\n')}

📝 Instrucciones:
   1. Revisa el archivo ENV_VARIABLES.md para ver todas las variables requeridas
   2. Agrega las variables faltantes a .env.local
   3. Reinicia el servidor (npm run dev)
    `;

    logger.error(errorMessage);
    throw new Error('Variables de entorno no configuradas. Revisa la consola para detalles.');
  }

  // Mostrar warnings en desarrollo
  if (process.env.NODE_ENV === 'development' && result.warnings.length > 0) {
    logger.warn('⚠️ Advertencias de variables de entorno:');
    result.warnings.forEach((warning) => logger.warn(`  ${warning}`));
  }
}

/**
 * Obtiene el valor de una variable de entorno con validación
 */
export function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    if (required) {
      throw new Error(`Variable de entorno requerida no configurada: ${name}`);
    }
    return '';
  }

  // Verificar placeholders
  if (value.includes('your_') || value.includes('_here')) {
    if (required) {
      throw new Error(`Variable de entorno ${name} contiene un placeholder, debe ser un valor real`);
    }
  }

  return value;
}

/**
 * Exporta la configuración para documentación
 */
export { APP_ENV_VARS };







