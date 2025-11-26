/**
 * Utilidades de sanitización de inputs
 * Previene XSS, inyección de datos maliciosos, y normaliza inputs
 */

/**
 * Sanitiza un string: trim, escape HTML básico, y normaliza espacios
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim y normalizar espacios múltiples
  let sanitized = input.trim().replace(/\s+/g, ' ');

  // Escape HTML básico (sin usar librería externa)
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

/**
 * Sanitiza un string pero permite HTML básico (solo para casos específicos)
 * NO usar para inputs de usuario directos
 */
export function sanitizeStringAllowBasicHTML(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim y normalizar espacios
  let sanitized = input.trim().replace(/\s+/g, ' ');

  // Solo permitir tags HTML básicos seguros
  const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'p', 'br'];
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match; // Permitir tag
    }
    return ''; // Eliminar tag no permitido
  });

  // Escape atributos peligrosos
  sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // Eliminar event handlers
  sanitized = sanitized.replace(/javascript:/gi, ''); // Eliminar javascript: URLs

  return sanitized;
}

/**
 * Valida y sanitiza una URL
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Validar formato básico de URL
  try {
    const urlObj = new URL(trimmed);
    
    // Solo permitir http y https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }

    // Validar que no sea javascript: o data:
    if (trimmed.toLowerCase().startsWith('javascript:') || 
        trimmed.toLowerCase().startsWith('data:')) {
      return null;
    }

    return trimmed;
  } catch {
    // Si no es una URL válida, retornar null
    return null;
  }
}

/**
 * Valida y sanitiza un email
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();

  // Validar formato básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Validar longitud
  if (trimmed.length > 255) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitiza un número (entero o decimal)
 */
export function sanitizeNumber(input: string | number | null | undefined): number | null {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }

  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  const num = parseFloat(trimmed);

  if (isNaN(num)) {
    return null;
  }

  return num;
}

/**
 * Sanitiza un entero
 */
export function sanitizeInteger(input: string | number | null | undefined): number | null {
  const num = sanitizeNumber(input);
  if (num === null) {
    return null;
  }

  return Number.isInteger(num) ? num : Math.floor(num);
}

/**
 * Sanitiza un objeto aplicando sanitización recursiva a strings
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      (sanitized as any)[key] = sanitizeString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      (sanitized as any)[key] = value;
    } else if (Array.isArray(value)) {
      (sanitized as any)[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (value && typeof value === 'object') {
      (sanitized as any)[key] = sanitizeObject(value);
    } else {
      (sanitized as any)[key] = value;
    }
  }

  return sanitized;
}


