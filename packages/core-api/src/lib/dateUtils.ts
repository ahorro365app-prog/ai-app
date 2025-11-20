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

const getTimezoneForCountry = (countryCode?: string) => {
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
