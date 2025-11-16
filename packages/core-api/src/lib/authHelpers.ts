import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';

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
    console.warn('No se pudo obtener userId de Supabase Auth:', error);
  }

  // 2. Intentar obtener desde header Authorization personalizado (userId directo)
  const customAuthHeader = req.headers.get('x-user-id');
  if (customAuthHeader) {
    // Validar que el usuario existe
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', customAuthHeader)
      .single();
    
    if (usuario) {
      return usuario.id;
    }
  }

  // No se acepta userId del body por seguridad
  return null;
}


