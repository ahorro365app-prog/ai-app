const DEFAULT_COUNTRY_CODE = "+591";

const normalizeDigits = (phone: string) => phone.replace(/\D/g, "");

export const validatePhoneNumber = (rawPhone: string): boolean => {
  const digits = normalizeDigits(rawPhone);
  if (!digits) return false;
  if (!/^\d+$/.test(digits)) return false;

  // Permitir números locales (8-9 dígitos) o internacionales (hasta 15).
  return digits.length >= 8 && digits.length <= 15;
};

export const formatPhoneNumber = (
  rawPhone: string,
  defaultCountryCode: string = DEFAULT_COUNTRY_CODE
): string => {
  if (!rawPhone) return "";

  let digits = normalizeDigits(rawPhone);

  // Quitar prefijo internacional doble cero si existe
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Si el número parece local (<= 8 dígitos), anteponer el código por defecto.
  if (digits.length <= 8 && defaultCountryCode) {
    const countryDigits = defaultCountryCode.replace(/\D/g, "");
    digits = `${countryDigits}${digits}`;
  }

  return `+${digits}`;
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERRAL_CODE_LENGTH = 8;

export const generateReferralCode = (): string => {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * REFERRAL_ALPHABET.length);
    code += REFERRAL_ALPHABET[index];
  }
  return code;
};

