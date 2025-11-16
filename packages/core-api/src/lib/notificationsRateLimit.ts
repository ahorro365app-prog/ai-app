import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type NotificationRateLimitRule = {
  window: string;
  limit: number;
  label: string;
};

type NotificationRateLimitLimiter = {
  limiter: Ratelimit;
  window: string;
  limit: number;
  label: string;
};

export type NotificationRateLimitResult = {
  allowed: boolean;
  enabled: boolean;
  window?: string;
  limit?: number;
  remaining?: number;
  reset?: number;
  label?: string;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured = Boolean(redisUrl && redisToken);

let redis: Redis | null = null;

if (isConfigured) {
  redis = new Redis({
    url: redisUrl as string,
    token: redisToken as string,
  });
} else {
  console.warn('[notificationsRateLimit] UPSTASH_REDIS_REST_URL y/o UPSTASH_REDIS_REST_TOKEN no están configurados. Rate limiting deshabilitado para notificaciones.');
}

const NOTIFICATION_RATE_LIMIT_RULES: Record<string, NotificationRateLimitRule[]> = {
  marketing: [
    { window: '1 h', limit: 2, label: 'hourly' },
    { window: '1 d', limit: 5, label: 'daily' },
    { window: '7 d', limit: 15, label: 'weekly' },
  ],
  transaction: [
    { window: '1 h', limit: 10, label: 'hourly' },
    { window: '1 d', limit: 50, label: 'daily' },
  ],
  reminder: [
    { window: '1 h', limit: 3, label: 'hourly' },
    { window: '1 d', limit: 10, label: 'daily' },
  ],
  referral: [
    { window: '1 h', limit: 4, label: 'hourly' },
    { window: '1 d', limit: 12, label: 'daily' },
  ],
  payment: [
    { window: '1 h', limit: 5, label: 'hourly' },
    { window: '1 d', limit: 20, label: 'daily' },
  ],
  system: [
    { window: '1 h', limit: 20, label: 'hourly' },
    { window: '1 d', limit: 100, label: 'daily' },
  ],
};

const notificationLimiters: Record<string, NotificationRateLimitLimiter[]> = {};

if (redis) {
  for (const [type, rules] of Object.entries(NOTIFICATION_RATE_LIMIT_RULES)) {
    notificationLimiters[type] = rules.map((rule) => ({
      limiter: new Ratelimit({
        redis: redis as Redis,
        limiter: Ratelimit.slidingWindow(rule.limit, rule.window),
        analytics: true,
        prefix: `notifications/${type}/${rule.label}`,
      }),
      window: rule.window,
      limit: rule.limit,
      label: rule.label,
    }));
  }
}

export async function enforceNotificationRateLimit(
  type: string,
  identifier: string
): Promise<NotificationRateLimitResult> {
  if (!redis) {
    return { allowed: true, enabled: false };
  }

  const limiters = notificationLimiters[type] ?? [];

  if (limiters.length === 0) {
    return { allowed: true, enabled: true };
  }

  for (const entry of limiters) {
    const key = `${identifier}:${type}`;
    const result = await entry.limiter.limit(key);
    if (!result.success) {
      return {
        allowed: false,
        enabled: true,
        window: entry.window,
        limit: entry.limit,
        remaining: result.remaining,
        reset: result.reset,
        label: entry.label,
      };
    }
  }

  return { allowed: true, enabled: true };
}

