import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export type NotificationCategory =
  | 'transaction'
  | 'marketing'
  | 'system'
  | 'reminder'
  | 'referral'
  | 'payment';

export type SegmentFilters = {
  plans?: string[];
  countries?: string[];
  respectOptOut?: boolean;
  onlyMarketingOptIn?: boolean;
  onlyReminderOptIn?: boolean;
  onlyTransactionOptIn?: boolean;
};

export type TokenWithUser = {
  token: string;
  userId?: string | null;
};

export type SegmentComputationResult = {
  tokens: TokenWithUser[];
  usersMatched: number;
  quietHoursFilteredUsers: number;
};

type NotificationPreferenceRow = {
  push_enabled: boolean | null;
  marketing_enabled: boolean | null;
  reminder_enabled: boolean | null;
  transaction_enabled: boolean | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  timezone?: string | null;
};

const COUNTRY_CODE_MAP: Record<string, string> = {
  AR: 'Argentina',
  BO: 'Bolivia',
  BR: 'Brasil',
  CL: 'Chile',
  CO: 'Colombia',
  CR: 'Costa Rica',
  EC: 'Ecuador',
  ES: 'España',
  MX: 'México',
  PA: 'Panamá',
  PE: 'Perú',
  PY: 'Paraguay',
  US: 'Estados Unidos',
  UY: 'Uruguay',
  VE: 'Venezuela',
};

const QUIET_HOURS_BLOCKED_TYPES = new Set<NotificationCategory>(['marketing', 'reminder']);
const DEFAULT_TIMEZONE = 'UTC';

const normalizeArray = (value?: string[] | null) =>
  Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [];

const normalizeValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const parseTimeToMinutes = (value?: string | null): number | null => {
  if (!value) return null;
  const [hoursStr, minutesStr] = value.split(':');
  if (typeof hoursStr === 'undefined' || typeof minutesStr === 'undefined') {
    return null;
  }
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

const getCurrentMinutesInTimezone = (timezone?: string | null): number => {
  const tz = timezone && timezone.trim().length > 0 ? timezone : DEFAULT_TIMEZONE;
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    }).formatToParts(now);

    const hourPart = parts.find((part) => part.type === 'hour')?.value ?? '0';
    const minutePart = parts.find((part) => part.type === 'minute')?.value ?? '0';
    const hours = Number(hourPart);
    const minutes = Number(minutePart);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return now.getUTCHours() * 60 + now.getUTCMinutes();
    }

    return hours * 60 + minutes;
  } catch {
    const now = new Date();
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  }
};

/**
 * @deprecated Ya no se usan quiet hours configurados por usuario.
 * El sistema respetará automáticamente el horario del país del usuario.
 * Esta función siempre retorna false para mantener compatibilidad con código existente.
 */
export const isWithinQuietHours = (
  type: NotificationCategory,
  prefs?: Pick<NotificationPreferenceRow, 'quiet_hours_start' | 'quiet_hours_end' | 'timezone'> | null
): boolean => {
  // Siempre retornar false - los horarios se respetarán automáticamente según el país
  return false;
};

export async function computeSegmentTokens(
  segmentFilters: SegmentFilters,
  notificationType: NotificationCategory
): Promise<SegmentComputationResult> {
  const supabase = getSupabaseAdmin();

  const segment = {
    plans: normalizeArray(segmentFilters.plans),
    countries: normalizeArray(segmentFilters.countries),
    respectOptOut: segmentFilters.respectOptOut !== false,
    onlyMarketingOptIn:
      segmentFilters.onlyMarketingOptIn ?? (notificationType === 'marketing'),
    onlyReminderOptIn:
      segmentFilters.onlyReminderOptIn ?? (notificationType === 'reminder'),
    onlyTransactionOptIn:
      segmentFilters.onlyTransactionOptIn ?? (notificationType === 'transaction'),
  };

  let userQuery = supabase
    .from('usuarios')
    .select(`
      id,
      suscripcion,
      pais
    `);

  if (segment.plans.length > 0) {
    userQuery = userQuery.in('suscripcion', segment.plans);
  }

  const { data: usersData, error: usersError } = await userQuery;

  if (usersError) {
    throw usersError;
  }

  const usersList = (usersData || []).filter((user: any) => {
    if (segment.countries.length === 0) {
      return true;
    }

    const userCountryRaw = (user.pais || '').trim();
    const userCountryNormalized = normalizeValue(userCountryRaw);

    return segment.countries.some((countryFilter) => {
      const code = countryFilter.toUpperCase();
      const mappedName = COUNTRY_CODE_MAP[code];
      const normalizedFilter = normalizeValue(countryFilter);

      if (!userCountryRaw) return false;

      if (
        userCountryRaw === countryFilter ||
        userCountryRaw === code ||
        userCountryNormalized === normalizedFilter
      ) {
        return true;
      }

      if (mappedName) {
        const mappedNormalized = normalizeValue(mappedName);
        if (
          userCountryRaw === mappedName ||
          userCountryRaw === `${mappedName} (${code})` ||
          userCountryNormalized === mappedNormalized
        ) {
          return true;
        }
      }

      return false;
    });
  });
  const userIds = usersList.map((user: any) => user.id);

  let preferencesMap = new Map<string, NotificationPreferenceRow>();

  if (userIds.length > 0) {
    const { data: prefsData, error: prefsError } = await supabase
      .from('notification_preferences')
      .select(
        'user_id, push_enabled, marketing_enabled, reminder_enabled, transaction_enabled, timezone'
      )
      .in('user_id', userIds);

    if (prefsError) {
      throw prefsError;
    }

    preferencesMap = new Map(
      (prefsData || []).map((pref: any) => [pref.user_id, pref])
    );
  }

  let quietHoursFilteredUsers = 0;

  const filteredUsers =
    usersList.filter((user: any) => {
      const prefs = preferencesMap.get(user.id);

      if (segment.respectOptOut && (!prefs || prefs.push_enabled !== true)) {
        return false;
      }

      if (segment.onlyMarketingOptIn && (!prefs || prefs.marketing_enabled !== true)) {
        return false;
      }

      if (segment.onlyReminderOptIn && (!prefs || prefs.reminder_enabled !== true)) {
        return false;
      }

      if (segment.onlyTransactionOptIn && (!prefs || prefs.transaction_enabled !== true)) {
        return false;
      }

      if (isWithinQuietHours(notificationType, prefs || null)) {
        quietHoursFilteredUsers += 1;
        return false;
      }

      return true;
    }) || [];

  const filteredUserIds = filteredUsers.map((user: any) => user.id);

  if (filteredUserIds.length === 0) {
    return {
      tokens: [],
      usersMatched: 0,
      quietHoursFilteredUsers,
    };
  }

  const { data: tokensData, error: tokensError } = await supabase
    .from('fcm_tokens')
    .select('token, user_id')
    .in('user_id', filteredUserIds)
    .eq('is_active', true);

  if (tokensError) {
    throw tokensError;
  }

  const uniqueTokens = new Map<string, TokenWithUser>();
  (tokensData || []).forEach((row) => {
    if (!uniqueTokens.has(row.token)) {
      uniqueTokens.set(row.token, { token: row.token, userId: row.user_id });
    }
  });

  return {
    tokens: Array.from(uniqueTokens.values()),
    usersMatched: filteredUserIds.length,
    quietHoursFilteredUsers,
  };
}

