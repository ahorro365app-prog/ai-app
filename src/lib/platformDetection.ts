/**
 * Tipo para las plataformas soportadas
 */
export type Platform = 'web' | 'android' | 'ios';

/**
 * Detecta la plataforma actual donde se está ejecutando la aplicación
 * 
 * @returns La plataforma detectada: 'web', 'android' o 'ios'
 */
export function detectPlatform(): Platform {
  // Verificar si estamos en un entorno de navegador
  if (typeof window === 'undefined') {
    return 'web';
  }

  // Verificar si estamos en Capacitor (aplicación nativa)
  const capacitor = (window as any).Capacitor;
  if (capacitor) {
    const platform = capacitor.getPlatform();
    if (platform === 'android') {
      return 'android';
    }
    if (platform === 'ios') {
      return 'ios';
    }
  }

  // Verificar User Agent para detectar Android/iOS en navegador
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Detectar Android
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  // Detectar iOS
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }

  // Por defecto, asumir que es web
  return 'web';
}







