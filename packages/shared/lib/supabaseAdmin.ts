import { createClient } from '@supabase/supabase-js';

// Cache para el cliente (evita crear múltiples instancias)
let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

/**
 * Valida que las variables de entorno necesarias estén configuradas
 * @throws Error si falta alguna variable o es un placeholder
 */
function validateEnvironmentVariables(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validar URL
  if (!url || url === 'your_supabase_url_here' || url.trim() === '') {
    const errorMessage = `
❌ NEXT_PUBLIC_SUPABASE_URL no está configurada correctamente

📝 Instrucciones:
   1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/settings/api
   2. Copia la "Project URL"
   3. Agrega a .env.local: NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
   4. Reinicia el servidor (npm run dev)
    `;
    console.error(errorMessage);
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no configurada. Revisa la consola para instrucciones.');
  }

  // Validar que la URL sea válida
  try {
    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith('http')) {
      throw new Error('URL debe usar http:// o https://');
    }
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL no es una URL válida: ${url}`);
  }

  // Validar Service Role Key
  if (!key || key.trim() === '' || key === 'your_service_role_key_here') {
    const errorMessage = `
❌ SUPABASE_SERVICE_ROLE_KEY no está configurada correctamente

📝 Instrucciones:
   1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/settings/api
   2. Copia la "service_role" key (NO la anon key)
   3. Agrega a .env.local: SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui
   4. ⚠️ IMPORTANTE: Esta key tiene permisos admin, manténla segura
   5. Reinicia el servidor (npm run dev)
    `;
    console.error(errorMessage);
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada. Revisa la consola para instrucciones.');
  }

  // Validar que la key no sea demasiado corta (sanity check)
  if (key.length < 20) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY parece inválida (demasiado corta)');
  }
}

/**
 * Obtiene el cliente de Supabase con permisos de administrador
 * Valida las variables de entorno la primera vez que se llama
 * 
 * @returns Cliente de Supabase configurado
 * @throws Error si las variables de entorno no están configuradas
 */
// Detectar si estamos en build time
const isBuildTime = typeof window === 'undefined' && 
  (process.env.NEXT_PHASE === 'phase-production-build' || 
   process.env.VERCEL === '1' && !process.env.NEXT_PUBLIC_SUPABASE_URL);

export function getSupabaseAdmin() {
  // Durante build time, retornar un objeto dummy que no cause errores
  if (isBuildTime) {
    // Retornar un objeto que tenga la misma estructura pero no haga nada
    return {
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      rpc: () => Promise.resolve({ data: null, error: null }),
    } as any;
  }
  
  // Validar variables de entorno (solo la primera vez)
  if (!supabaseAdminClient) {
    // Obtener variables de entorno
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Validar que existan
    if (!url || !key) {
      validateEnvironmentVariables();
    }
    
    // Validar formato de URL
    try {
      const urlObj = new URL(url!);
      if (!urlObj.protocol.startsWith('http')) {
        throw new Error('URL debe usar http:// o https://');
      }
    } catch {
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL no es una URL válida: ${url}`);
    }
    
    // Crear cliente
    supabaseAdminClient = createClient(url!, key!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Cliente Supabase Admin creado correctamente');
    }
  }
  
  return supabaseAdminClient as any;
}


