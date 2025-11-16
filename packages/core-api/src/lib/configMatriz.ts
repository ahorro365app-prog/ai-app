import { createClient } from '@supabase/supabase-js';

// Lazy initialization para evitar errores durante build time
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Durante build time, retornar objeto dummy
    if (!url || !key || (process.env.VERCEL === '1' && !url)) {
      return {
        from: () => ({
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        }),
      } as any;
    }
    
    supabase = createClient(url, key);
  }
  return supabase;
}

export interface ConfigCompleta {
  country_code: string;
  categorias_base: Record<string, any>;
  monedas: Record<string, any>;
  metodos_pago: Record<string, any>;
  reglas_especificas: Record<string, any>;
  hereda_matriz: boolean;
}

/**
 * Obtiene la configuración completa (matriz + país)
 * Combina reglas base con especialización local
 */
export async function getConfigCompleta(countryCode: string): Promise<ConfigCompleta> {
  try {
    const { data, error } = await getSupabase()
      .rpc('obtener_config_completa', {
        p_country_code: countryCode
      });

    if (error) {
      console.error('Error obteniendo config completa:', error);
      throw error;
    }

    return data as ConfigCompleta;
  } catch (error) {
    console.error('Error en getConfigCompleta:', error);
    // Fallback a Bolivia
    return getConfigCompleta('BOL');
  }
}

/**
 * Registra feedback para aprendizaje automático
 */
export async function registrarAprendizaje(
  predictionId: string,
  categoriaCorrecta: string,
  palabraNueva?: string
) {
  try {
    // Extraer aprendizaje del feedback
    await getSupabase().rpc('extraer_aprendizaje_de_feedback');

    console.log('✅ Aprendizaje registrado');
  } catch (error) {
    console.error('❌ Error registrando aprendizaje:', error);
  }
}

/**
 * Aplica una mejora específica manualmente
 */
export async function aplicarMejora(
  countryCode: string,
  categoria: string,
  palabraNueva: string
): Promise<boolean> {
  try {
    const { data, error } = await getSupabase().rpc('aplicar_mejoras_feedback', {
      p_country_code: countryCode,
      p_categoria: categoria,
      p_palabra_nueva: palabraNueva
    });

    if (error) throw error;

    console.log('✅ Mejora aplicada:', palabraNueva);
    return data as boolean;
  } catch (error) {
    console.error('❌ Error aplicando mejora:', error);
    return false;
  }
}

/**
 * Obtiene estadísticas de aprendizaje por país
 */
export async function getStatsAprendizaje() {
  try {
    const { data, error } = await getSupabase()
      .from('estadisticas_feedback')
      .select('*');

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo stats:', error);
    return [];
  }
}

/**
 * Obtiene config de matriz (categorías, monedas, métodos)
 */
export async function getConfigMatriz(tipo?: 'categoria' | 'moneda' | 'metodo_pago') {
  try {
    const { data, error } = await getSupabase()
      .from('configuracion_matriz')
      .select('*')
      .eq('activo', true)
      .order('clave');

    if (error) throw error;

    if (tipo) {
      return data.filter(item => item.tipo === tipo);
    }

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo config matriz:', error);
    return [];
  }
}

