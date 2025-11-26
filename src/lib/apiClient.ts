/**
 * Helper para hacer llamadas API que funcionen tanto en web como en Capacitor
 * 
 * En Capacitor (app móvil), las APIs están en el servidor remoto
 * En web, las APIs están en el mismo servidor
 */

const getApiBaseUrl = (): string => {
  // Si estamos en Capacitor (app móvil)
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    // Usar la URL del servidor remoto para APIs
    return process.env.NEXT_PUBLIC_API_URL || 'https://ahorro365-core-api.vercel.app';
  }
  
  // Si estamos en web, usar ruta relativa (mismo servidor)
  return '';
};

/**
 * Hace una llamada fetch a una API
 * Automáticamente usa la URL correcta según el entorno
 */
export const apiFetch = async (
  endpoint: string,
  options?: RequestInit
): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('/') 
    ? `${baseUrl}${endpoint}` 
    : `${baseUrl}/${endpoint}`;
  
  return fetch(url, options);
};

/**
 * Helper para hacer GET requests
 */
export const apiGet = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Helper para hacer POST requests
 */
export const apiPost = async <T = any>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<T> => {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Helper para hacer PUT requests
 */
export const apiPut = async <T = any>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<T> => {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Helper para hacer DELETE requests
 */
export const apiDelete = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

