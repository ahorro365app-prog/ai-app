import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

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

export interface CountryRules {
  country_code: string;
  country_name: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  categorias: string[];
  palabras_clave: Record<string, string[]>;
  slang: Record<string, string>;
  ejemplos?: any[];
}

/**
 * Obtiene las reglas de un país desde Supabase
 * Si no encuentra o hay error, devuelve fallback de Bolivia
 */
export async function getCountryRules(countryCode: string): Promise<CountryRules> {
  try {
    logger.debug(`🌍 Fetching rules for country: ${countryCode}`);
    
    const { data, error } = await getSupabase()
      .from('reglas_pais')
      .select('*')
      .eq('country_code', countryCode);

    if (error) {
      logger.error('❌ Error fetching country rules:', error);
      return getBoliviaFallback();
    }

    if (!data || data.length === 0) {
      logger.warn(`⚠️ No rules found for ${countryCode}, using Bolivia fallback`);
      return getBoliviaFallback();
    }

    // Convertir las reglas de Supabase a nuestro formato
    const rules = data.map(regla => ({
      categoria: regla.categoria,
      palabras_clave: regla.palabras_clave,
      slang: regla.slang,
    }));

    logger.debug(`✅ Rules loaded for ${countryCode}`);

    // Retornar formato consolidado
    return {
      country_code: countryCode,
      country_name: getCountryName(countryCode),
      currency: getCountryCurrency(countryCode),
      currency_symbol: getCountrySymbol(countryCode),
      timezone: getCountryTimezone(countryCode),
      categorias: ['transporte', 'comida', 'salud', 'educacion', 'servicios', 'otros'],
      palabras_clave: {},
      slang: {},
      ejemplos: rules,
    };
    
  } catch (error) {
    logger.error('❌ Error in getCountryRules:', error);
    logger.debug('🔄 Using Bolivia fallback');
    return getBoliviaFallback();
  }
}

/**
 * Obtiene nombre del país por código
 */
function getCountryName(code: string): string {
  const names: Record<string, string> = {
    'BOL': 'Bolivia',
    'ARG': 'Argentina',
    'MEX': 'México',
    'PER': 'Perú',
    'COL': 'Colombia',
    'CHL': 'Chile',
  };
  return names[code] || 'Bolivia';
}

/**
 * Obtiene moneda del país
 */
function getCountryCurrency(code: string): string {
  const currencies: Record<string, string> = {
    'BOL': 'BOB',
    'ARG': 'ARS',
    'MEX': 'MXN',
    'PER': 'PEN',
    'COL': 'COP',
    'CHL': 'CLP',
  };
  return currencies[code] || 'BOB';
}

/**
 * Obtiene símbolo de moneda
 */
export function getCountrySymbol(code: string): string {
  const symbols: Record<string, string> = {
    'BOL': 'Bs',
    'ARG': '$',
    'MEX': '$',
    'PER': 'S/.',
    'COL': '$',
    'CHL': '$',
  };
  return symbols[code] || 'Bs';
}

/**
 * Obtiene timezone
 */
function getCountryTimezone(code: string): string {
  const timezones: Record<string, string> = {
    'BOL': 'America/La_Paz',
    'ARG': 'America/Argentina/Buenos_Aires',
    'MEX': 'America/Mexico_City',
    'PER': 'America/Lima',
    'COL': 'America/Bogota',
    'CHL': 'America/Santiago',
  };
  return timezones[code] || 'America/La_Paz';
}

/**
 * Reglas hardcodeadas de Bolivia como fallback
 */
function getBoliviaFallback(): CountryRules {
  return {
    country_code: 'BOL',
    country_name: 'Bolivia',
    currency: 'BOB',
    currency_symbol: 'Bs',
    timezone: 'America/La_Paz',
    categorias: [
      'transporte',
      'comida',
      'mercado',
      'servicios',
      'salud',
      'educacion',
      'entretenimiento',
      'otros'
    ],
    palabras_clave: {
      transporte: ['taxi', 'trufi', 'micro', 'bus', 'minibus'],
      comida: ['almuerzo', 'cena', 'desayuno', 'cafe', 'restaurant'],
      mercado: ['mercado', 'tienda', 'compras', 'verduras', 'frutas'],
    },
    slang: {
      trufi: 'taxi compartido',
      micro: 'bus urbano',
      api: 'comida picante',
    },
    ejemplos: [],
  };
}


