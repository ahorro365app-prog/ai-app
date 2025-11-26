import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';
import { logger } from './logger';

/**
 * Obtiene el ID del usuario autenticado desde la petición
 * 
 * Intenta obtener el userId en este orden:
 * 1. Desde Supabase Auth session (si está disponible)
 * 2. Desde header Authorization personalizado (x-user-id)
 * 
 * ⚠️ IMPORTANTE: El userId NUNCA se acepta del body por seguridad.
 * Debe enviarse siempre en el header 'x-user-id'.
 * 
 * @param req - Request de Next.js
 * @returns userId o null si no se puede obtener
 */
export async function getAuthenticatedUserId(
  req: NextRequest
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  // 1. Intentar obtener desde Supabase Auth session
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        // Buscar usuario en tabla usuarios por el email/id de Supabase Auth
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('id')
          .or(`correo.eq.${user.email},id.eq.${user.id}`)
          .single();
        
        if (usuario) {
          return usuario.id;
        }
      }
    }
  } catch (error) {
    logger.warn('No se pudo obtener userId de Supabase Auth:', error);
  }

  // 2. Intentar obtener desde header Authorization personalizado (userId directo)
  const customAuthHeader = req.headers.get('x-user-id');
  if (customAuthHeader) {
    // ⚠️ SEGURIDAD: Validar que el usuario existe y está activo
    // Verificar formato UUID básico
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(customAuthHeader)) {
      logger.warn('⚠️ x-user-id no tiene formato UUID válido:', customAuthHeader);
      return null;
    }
    
    // Validar que el usuario existe y obtener información básica
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombre, correo, suscripcion')
      .eq('id', customAuthHeader)
      .single();
    
    if (error || !usuario) {
      logger.warn('⚠️ Usuario no encontrado con x-user-id:', customAuthHeader);
      return null;
    }
    
    // Verificar que el usuario no esté bloqueado (si hay campo de estado)
    // Nota: Si en el futuro se agrega un campo "activo" o "bloqueado", validarlo aquí
    // Por ahora, solo verificamos que existe
    
      return usuario.id;
  }

  // No se acepta userId del body por seguridad
  return null;
}


