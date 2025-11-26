/**
 * Utilidades de gestión de sesiones
 * Proporciona funciones para invalidar sesiones y gestionar tokens
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Invalida todas las sesiones de un usuario (logout forzado)
 * Útil cuando se detecta actividad sospechosa o cambio de contraseña
 * 
 * @param userId ID del usuario
 * @param reason Razón de la invalidación (para logging)
 */
export async function invalidateUserSessions(
  userId: string,
  reason: string = 'Invalidación manual'
): Promise<void> {
  try {
    // En Supabase Auth, las sesiones se invalidan automáticamente
    // cuando se cambia la contraseña o se revoca el token
    
    // Para tokens JWT personalizados (Admin Panel), necesitarías:
    // 1. Almacenar tokens en una tabla de sesiones
    // 2. Marcar como inválidos cuando se invalide la sesión
    // 3. Verificar en cada request si el token está en la lista de inválidos
    
    // Por ahora, documentamos el proceso para implementación futura
    logger.info(`🔄 Invalidación de sesiones para usuario ${userId}: ${reason}`);
    
    // TODO: Implementar tabla de sesiones inválidas cuando sea necesario
    // Ejemplo de estructura:
    // CREATE TABLE invalidated_sessions (
    //   token_hash TEXT PRIMARY KEY,
    //   user_id UUID,
    //   invalidated_at TIMESTAMP DEFAULT NOW(),
    //   reason TEXT
    // );
  } catch (error: any) {
    logger.error('Error invalidando sesiones:', error);
    throw error;
  }
}

/**
 * Limpia todas las cookies de sesión de una respuesta
 * Útil para logout completo
 */
export function clearAllSessionCookies(response: NextResponse): NextResponse {
  // Cookies comunes a limpiar
  const cookiesToClear = [
    'admin-token',
    'admin-refresh-token',
    'admin-elevated',
    'session-token',
    'auth-token',
  ];

  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
  });

  return response;
}

/**
 * Verifica si un token está en la lista de tokens inválidos
 * (Requiere implementación de tabla de sesiones inválidas)
 * 
 * @param tokenHash Hash del token a verificar
 * @returns true si el token está inválido
 */
export async function isTokenInvalidated(tokenHash: string): Promise<boolean> {
  // TODO: Implementar cuando se agregue tabla de sesiones inválidas
  // const { data } = await supabase
  //   .from('invalidated_sessions')
  //   .select('token_hash')
  //   .eq('token_hash', tokenHash)
  //   .single();
  // return !!data;
  
  return false; // Por ahora, asumir que todos los tokens son válidos
}

/**
 * Documentación para implementación futura de refresh tokens con rotación
 */
export const SESSION_MANAGEMENT_FUTURE = {
  /**
   * Refresh Tokens con Rotación:
   * 
   * 1. Al hacer login, generar:
   *    - Access token (corto, 15 minutos)
   *    - Refresh token (largo, 7 días)
   * 
   * 2. Al usar refresh token:
   *    - Invalidar el refresh token usado
   *    - Generar nuevo par (access + refresh)
   *    - Esto previene reutilización de tokens robados
   * 
   * 3. Al detectar reutilización de refresh token:
   *    - Invalidar todas las sesiones del usuario
   *    - Requerir login nuevamente
   *    - Alertar al usuario de actividad sospechosa
   */
  
  /**
   * Detección de Sesiones Concurrentes:
   * 
   * 1. Almacenar sesiones activas en tabla:
   *    - user_id, session_id, ip_address, user_agent, created_at, last_activity
   * 
   * 2. Limitar número de sesiones concurrentes (ej: 5)
   * 
   * 3. Al exceder límite:
   *    - Invalidar sesión más antigua
   *    - O requerir confirmación del usuario
   */
  
  /**
   * Timeout de Inactividad:
   * 
   * 1. Registrar última actividad en cada request
   * 
   * 2. Si inactivo por más de X minutos (ej: 30):
   *    - Invalidar sesión
   *    - Requerir login nuevamente
   */
};


