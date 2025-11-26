type SupportedCountry =
  | "BO"
  | "AR"
  | "BR"
  | "CL"
  | "CO"
  | "EC"
  | "PE"
  | "PY"
  | "UY"
  | "VE"
  | "MX"
  | "US"
  | "EU"
  | "ES"
  | "UK";

const COUNTRY_TIMEZONE: Record<SupportedCountry, string> = {
  BO: "America/La_Paz",
  AR: "America/Argentina/Buenos_Aires",
  BR: "America/Sao_Paulo",
  CL: "America/Santiago",
  CO: "America/Bogota",
  EC: "America/Guayaquil",
  PE: "America/Lima",
  PY: "America/Asuncion",
  UY: "America/Montevideo",
  VE: "America/Caracas",
  MX: "America/Mexico_City",
  US: "America/New_York",
  EU: "Europe/Berlin",
  ES: "Europe/Madrid",
  UK: "Europe/London",
};

const DEFAULT_TIMEZONE = COUNTRY_TIMEZONE.BO;

export const getTimezoneForCountry = (countryCode?: string) => {
  if (!countryCode) return DEFAULT_TIMEZONE;
  const normalized = countryCode.toUpperCase() as SupportedCountry;
  return COUNTRY_TIMEZONE[normalized] || DEFAULT_TIMEZONE;
};

const getTimeParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
};

const buildDateFromParts = (parts: Record<string, string>) => {
  const year = parseInt(parts.year, 10);
  const month = parseInt(parts.month, 10);
  const day = parseInt(parts.day, 10);
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);
  const second = parseInt(parts.second, 10);

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
};

/**
 * Obtiene el offset de zona horaria en formato +/-HH:MM
 * Usa una tabla de offsets conocidos para mayor confiabilidad
 */
const getTimezoneOffset = (timeZone: string): string => {
  // Tabla de offsets conocidos (sin horario de verano para simplificar)
  // Estos son los offsets estándar para cada zona horaria
  const timezoneOffsets: Record<string, string> = {
    'America/La_Paz': '-04:00',           // Bolivia: UTC-4
    'America/Argentina/Buenos_Aires': '-03:00', // Argentina: UTC-3
    'America/Sao_Paulo': '-03:00',        // Brasil: UTC-3
    'America/Santiago': '-03:00',         // Chile: UTC-3
    'America/Bogota': '-05:00',           // Colombia: UTC-5
    'America/Guayaquil': '-05:00',        // Ecuador: UTC-5
    'America/Lima': '-05:00',             // Perú: UTC-5
    'America/Asuncion': '-04:00',         // Paraguay: UTC-4
    'America/Montevideo': '-03:00',       // Uruguay: UTC-3
    'America/Caracas': '-04:00',          // Venezuela: UTC-4
    'America/Mexico_City': '-06:00',      // México: UTC-6
    'America/New_York': '-05:00',         // USA Este: UTC-5 (EST)
    'Europe/Berlin': '+01:00',            // Alemania: UTC+1 (CET)
    'Europe/Madrid': '+01:00',            // España: UTC+1 (CET)
    'Europe/London': '+00:00',            // Reino Unido: UTC+0 (GMT)
  };
  
  // Si tenemos el offset en la tabla, usarlo directamente
  if (timezoneOffsets[timeZone]) {
    return timezoneOffsets[timeZone];
  }
  
  // Fallback: calcular dinámicamente (menos confiable pero funciona para otros casos)
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timeZone }));
  const offsetMs = tzDate.getTime() - utcDate.getTime();
  const offsetMinutes = Math.floor(offsetMs / (1000 * 60));
  const offsetHours = Math.floor(offsetMinutes / 60);
  const offsetMins = Math.abs(offsetMinutes % 60);
  const offsetSign = offsetHours >= 0 ? '+' : '-';
  return `${offsetSign}${String(Math.abs(offsetHours)).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
};

/**
 * Construye un string ISO con offset explícito interpretando el año/mes/día/hora/minuto/segundo
 * en la zona horaria del país indicado.
 * Esto es crítico para Supabase que necesita el offset explícito para interpretar correctamente la fecha.
 */
export const buildISODateForCountry = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  countryCode?: string
): string => {
  const timeZone = getTimezoneForCountry(countryCode);
  const offsetStr = getTimezoneOffset(timeZone);
  
  // Construir fecha ISO con offset explícito
  // Ejemplo: 2025-11-18T23:24:00-04:00
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}${offsetStr}`;
};

/**
 * Construye un ISO string a partir de una fecha YYYY-MM-DD interpretada
 * en la zona horaria del país indicado.
 */
export const buildISODateFromString = (dateString: string, countryCode?: string): string => {
  const [year, month, day] = dateString.split("-").map((value) => parseInt(value, 10));

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    dateString.split("-").length !== 3
  ) {
    throw new Error(`Fecha inválida recibida: ${dateString}`);
  }

  return buildISODateForCountry(year, month, day, 0, 0, 0, countryCode);
};

/**
 * Devuelve la fecha actual en formato YYYY-MM-DD respetando la zona horaria
 * del país indicado.
 */
export const getTodayForCountry = (countryCode?: string): string => {
  const timeZone = getTimezoneForCountry(countryCode);
  const now = new Date();
  const parts = getTimeParts(now, timeZone);

  return `${parts.year}-${parts.month}-${parts.day}`;
};

/**
 * Extrae la fecha (YYYY-MM-DD) de un string ISO en la zona horaria del país del usuario.
 * Normaliza el formato de Supabase (+00:00 -> Z) para asegurar interpretación UTC correcta.
 * 
 * @param isoString - String ISO de fecha (ej: '2025-11-26T00:38:22+00:00')
 * @param userCountryCode - Código de país del usuario (ej: 'BO', 'AR', 'MX')
 * @returns String de fecha en formato YYYY-MM-DD en la zona horaria del país
 */
export const extractDateInUserTimezone = (
  isoString: string,
  userCountryCode?: string
): string => {
  // 1. Normalizar formato: +00:00 -> Z (asegurar interpretación UTC explícita)
  let normalized = isoString;
  if (normalized.endsWith('+00:00')) {
    normalized = normalized.replace('+00:00', 'Z');
  }
  
  // 2. Crear Date desde string normalizado (ahora es UTC explícito)
  const date = new Date(normalized);
  
  // 3. Verificar que Date es válido
  if (isNaN(date.getTime())) {
    try {
      const fallbackDate = new Date(isoString.replace(/[+-]\d{2}:\d{2}$/, 'Z'));
      if (!isNaN(fallbackDate.getTime())) {
        return extractDateInUserTimezone(fallbackDate.toISOString(), userCountryCode);
      }
    } catch (e) {
      // Error en fallback
    }
    return getTodayForCountry(userCountryCode);
  }
  
  // 4. Obtener timezone del país
  const timeZone = getTimezoneForCountry(userCountryCode);
  
  // 5. Usar toLocaleString para obtener fecha en zona horaria del país
  const localDateStr = date.toLocaleString('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  // Formato: "MM/DD/YYYY" -> convertir a "YYYY-MM-DD"
  const [month, day, year] = localDateStr.split('/');
  const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  return result;
};

/**
 * Valida que una fecha esté dentro del rango permitido para transacciones
 * Reglas:
 * - Fechas pasadas: Solo "ayer" (1 día atrás)
 * - Fecha de hoy: Sí
 * - Fechas futuras: No
 * 
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @param countryCode - Código del país del usuario (opcional, default: 'BO')
 * @returns Objeto con valid: boolean y message opcional
 */
export const validateTransactionDate = (
  dateString: string,
  countryCode?: string
): { valid: boolean; message?: string } => {
  if (!dateString) {
    return { valid: false, message: 'La fecha es requerida' };
  }

  const timeZone = getTimezoneForCountry(countryCode);
  const today = getTodayForCountry(countryCode);
  
  // Calcular fecha de ayer
  const todayDate = new Date(`${today}T12:00:00`);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  
  const year = yesterdayDate.getFullYear();
  const month = String(yesterdayDate.getMonth() + 1).padStart(2, '0');
  const day = String(yesterdayDate.getDate()).padStart(2, '0');
  const yesterday = `${year}-${month}-${day}`;
  
  // Convertir fecha seleccionada a objeto Date para comparación
  const selectedDateObj = new Date(`${dateString}T12:00:00`);
  const todayDateObj = new Date(`${today}T12:00:00`);
  const yesterdayDateObj = new Date(`${yesterday}T12:00:00`);
  
  // Comparar solo las fechas (sin hora)
  const selectedDateOnly = dateString;
  const todayOnly = today;
  const yesterdayOnly = yesterday;
  
  // Validar: solo permite ayer o hoy
  if (selectedDateOnly === todayOnly) {
    return { valid: true };
  }
  
  if (selectedDateOnly === yesterdayOnly) {
    return { valid: true };
  }
  
  // Si es fecha futura
  if (selectedDateObj > todayDateObj) {
    return { 
      valid: false, 
      message: 'No se pueden crear transacciones para fechas futuras' 
    };
  }
  
  // Si es fecha más antigua que ayer
  if (selectedDateObj < yesterdayDateObj) {
    return { 
      valid: false, 
      message: 'Solo se pueden crear transacciones para ayer o hoy' 
    };
  }
  
  // Por defecto, no válida
  return { 
    valid: false, 
    message: 'La fecha debe ser ayer o hoy' 
  };
};