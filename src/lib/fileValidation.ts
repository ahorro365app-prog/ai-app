/**
 * Utilidades para validación de archivos
 * Valida tanto headers MIME como contenido real (magic bytes)
 */

// Magic bytes para tipos de archivo comunes
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
};

/**
 * Valida que el contenido del archivo coincida con su tipo MIME
 * @param buffer Buffer del archivo
 * @param mimeType Tipo MIME declarado
 * @returns true si el contenido coincide con el tipo MIME
 */
export function validateFileContent(buffer: Buffer, mimeType: string): boolean {
  // Obtener magic bytes esperados para este tipo MIME
  const expectedBytes = MAGIC_BYTES[mimeType];
  
  if (!expectedBytes) {
    // Si no tenemos magic bytes para este tipo, confiar en el MIME type
    // (pero registrar advertencia)
    return true;
  }

  // Verificar que el buffer tenga al menos el tamaño mínimo
  const minLength = Math.max(...expectedBytes.map(bytes => bytes.length));
  if (buffer.length < minLength) {
    return false;
  }

  // Verificar que al menos uno de los patrones coincida
  return expectedBytes.some(pattern => {
    return pattern.every((byte, index) => buffer[index] === byte);
  });
}

/**
 * Valida un archivo completo (tipo MIME y contenido)
 * @param file Archivo a validar
 * @param allowedTypes Tipos MIME permitidos
 * @returns Objeto con resultado de validación
 */
export async function validateFile(
  file: File,
  allowedTypes: string[]
): Promise<{ valid: boolean; error?: string }> {
  // 1. Validar tipo MIME
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${file.type}. Solo se aceptan: ${allowedTypes.join(', ')}`,
    };
  }

  // 2. Validar contenido (magic bytes)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const contentValid = validateFileContent(buffer, file.type);
    
    if (!contentValid) {
      return {
        valid: false,
        error: `El contenido del archivo no coincide con su tipo MIME (${file.type}). Posible archivo malicioso.`,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Error al validar el contenido del archivo',
    };
  }

  return { valid: true };
}


