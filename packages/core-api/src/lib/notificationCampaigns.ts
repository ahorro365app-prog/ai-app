import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  computeSegmentTokens,
  NotificationCategory,
  SegmentFilters,
  isWithinQuietHours,
} from '@/lib/notificationSegments';
import { notificationService } from '@/lib/notificationService';

const ALLOWED_TYPES: NotificationCategory[] = [
  'transaction',
  'marketing',
  'system',
  'reminder',
  'referral',
  'payment',
];

const sanitizeJson = (value: any) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const TRIGGER_KEY_RENEWAL = 'trigger.renewal.reminder';
const TRIGGER_KEY_REFERRAL_INVITED = 'trigger.referral.invited';
const TRIGGER_KEY_REFERRAL_VERIFIED = 'trigger.referral.verified';

const RENEWAL_DEFAULTS = {
  daysBefore: 3,
  limit: 200,
};

const REFERRAL_INVITED_DEFAULTS = {
  limit: 200,
  lookbackDays: 7,
};

const REFERRAL_VERIFIED_DEFAULTS = {
  limit: 200,
  lookbackDays: 7,
};

type TriggerResult = {
  triggerKey: string;
  success: boolean;
  message: string;
  summary?: Record<string, any>;
  error?: string;
};

async function recordTriggerLogs(entries: Array<{ trigger_key: string; user_id: string; context?: Record<string, any> }>) {
  if (entries.length === 0) return;
  const supabase = getSupabaseAdmin();
  const payload = entries.map((entry) => ({
    trigger_key: entry.trigger_key,
    user_id: entry.user_id,
    context: sanitizeJson(entry.context ?? {}),
  }));
  const { error } = await supabase.from('notification_trigger_logs').insert(payload);
  if (error) {
    console.error('Error registrando trigger logs:', error);
  }
}

async function getNotificationPreferencesMap(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, any>();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('user_id, push_enabled, reminder_enabled, marketing_enabled, transaction_enabled')
    .in('user_id', userIds);

  if (error) {
    console.error('Error obteniendo preferencias de notificaciones:', error);
    return new Map();
  }

  return new Map((data || []).map((pref: any) => [pref.user_id, pref]));
}

async function getActiveTokensForUser(userId: string) {
  try {
    const tokens = await notificationService.getTokensForUser(userId);
    return (tokens || []).map((token: any) => token.token);
  } catch (error) {
    console.error('Error obteniendo tokens para usuario:', userId, error);
    return [];
  }
}

type TriggerSettingsMeta = {
  key: string;
  label: string;
  type: 'number' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
};

type TriggerDefinition<TSettings extends Record<string, any> = Record<string, any>> = {
  key: string;
  label: string;
  description: string;
  defaults: TSettings;
  settingsMeta: TriggerSettingsMeta[];
  runner: (options?: Partial<TSettings>) => Promise<TriggerResult>;
};

type TriggerConfigResponse<TSettings extends Record<string, any>> = {
  isActive: boolean;
  settings: TSettings;
};

const TRIGGER_DEFINITIONS: TriggerDefinition[] = [];

function getTriggerDefinition(triggerKey: string): TriggerDefinition | undefined {
  return TRIGGER_DEFINITIONS.find((definition) => definition.key === triggerKey);
}

async function getTriggerConfig<TSettings extends Record<string, any>>(
  triggerKey: string,
  defaults: TSettings
): Promise<TriggerConfigResponse<TSettings>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notification_triggers')
    .select('is_active, settings')
    .eq('trigger_key', triggerKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const now = new Date().toISOString();
    const insertResult = await supabase
      .from('notification_triggers')
      .upsert({
        trigger_key: triggerKey,
        is_active: true,
        settings: defaults,
        updated_at: now,
      });

    if (insertResult.error) {
      console.error('Error creando configuración por defecto de trigger:', insertResult.error);
    }

    return { isActive: true, settings: defaults };
  }

  const mergedSettings = { ...defaults, ...(data.settings || {}) } as TSettings;
  const isActive = data.is_active ?? true;

  return { isActive, settings: mergedSettings };
}

async function setTriggerConfig<TSettings extends Record<string, any>>(
  triggerKey: string,
  defaults: TSettings,
  updates: {
    isActive?: boolean;
    settings?: Partial<TSettings>;
  }
): Promise<TriggerConfigResponse<TSettings>> {
  const current = await getTriggerConfig(triggerKey, defaults);
  const nextSettings = {
    ...current.settings,
    ...(updates.settings || {}),
  } as TSettings;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('notification_triggers')
    .upsert({
      trigger_key: triggerKey,
      is_active:
        typeof updates.isActive === 'boolean' ? updates.isActive : current.isActive,
      settings: nextSettings,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }

  return {
    isActive:
      typeof updates.isActive === 'boolean' ? updates.isActive : current.isActive,
    settings: nextSettings,
  };
}

async function getLastTriggerLog(triggerKey: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notification_trigger_logs')
    .select('sent_at, context')
    .eq('trigger_key', triggerKey)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error obteniendo último log de trigger:', triggerKey, error);
    return null;
  }

  return data || null;
}

export async function getTriggerStatus(triggerKey: string) {
  const definition = getTriggerDefinition(triggerKey);
  if (!definition) {
    throw new Error(`Trigger no encontrado: ${triggerKey}`);
  }

  const config = await getTriggerConfig(definition.key, definition.defaults);
  const lastLog = await getLastTriggerLog(definition.key);

  return {
    key: definition.key,
    label: definition.label,
    description: definition.description,
    isActive: config.isActive,
    settings: config.settings,
    settingsMeta: definition.settingsMeta,
    lastRun: {
      sentAt: lastLog?.sent_at ?? null,
      summary: (lastLog?.context as Record<string, any>) || undefined,
    },
  };
}

export async function listTriggerStatuses() {
  const results = [] as Array<Awaited<ReturnType<typeof getTriggerStatus>>>;

  for (const definition of TRIGGER_DEFINITIONS) {
    results.push(await getTriggerStatus(definition.key));
  }

  return results;
}

export async function updateTriggerConfig(triggerKey: string, updates: {
  isActive?: boolean;
  settings?: Record<string, any>;
}) {
  const definition = getTriggerDefinition(triggerKey);
  if (!definition) {
    throw new Error(`Trigger no encontrado: ${triggerKey}`);
  }

  return setTriggerConfig(triggerKey, definition.defaults, updates);
}

export async function runTriggerByKey(triggerKey: string, options?: Record<string, any>) {
  const definition = getTriggerDefinition(triggerKey);
  if (!definition) {
    throw new Error(`Trigger no encontrado: ${triggerKey}`);
  }

  return definition.runner(options || {});
}

export class CampaignExecutionError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function executeCampaignById(campaignId: string) {
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: campaign, error: fetchError } = await supabase
    .from('notification_campaigns')
    .select('*')
    .eq('id', campaignId)
    .maybeSingle();

  if (fetchError) {
    throw new CampaignExecutionError(fetchError.message || 'Error obteniendo campaña');
  }

  if (!campaign) {
    throw new CampaignExecutionError('Campaña no encontrada', 404);
  }

  if (campaign.status === 'sending') {
    throw new CampaignExecutionError('La campaña ya se encuentra en ejecución.', 409);
  }

  if (campaign.status === 'sent') {
    throw new CampaignExecutionError('La campaña ya fue enviada.', 409);
  }

  if (campaign.status === 'cancelled') {
    throw new CampaignExecutionError('La campaña fue cancelada y no puede ejecutarse.', 409);
  }

  const notificationType: NotificationCategory = ALLOWED_TYPES.includes(
    campaign.campaign_type
  )
    ? campaign.campaign_type
    : 'marketing';

  const filters = sanitizeJson(campaign.filters) as SegmentFilters;

  let markedAsSending = false;
  try {
    await supabase
      .from('notification_campaigns')
      .update({
        status: 'sending',
        updated_at: nowIso,
      })
      .eq('id', campaignId);
    markedAsSending = true;

    let segmentResult;
    try {
      segmentResult = await computeSegmentTokens(filters, notificationType);
    } catch (segmentError: any) {
      throw new CampaignExecutionError(
        segmentError?.message || 'No se pudo obtener el segmento de usuarios.',
        500
      );
    }

    const tokens = segmentResult.tokens;
    const targetUsers = segmentResult.usersMatched;
    const quietHoursFiltered = segmentResult.quietHoursFilteredUsers;

    if (tokens.length === 0) {
      await supabase
        .from('notification_campaigns')
        .update({
          status: 'sent',
          sent_at: nowIso,
          updated_at: nowIso,
          target_users_count: targetUsers,
          sent_count: 0,
          failed_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
        })
        .eq('id', campaignId);

      return {
        message: 'Campaña ejecutada sin destinatarios.',
        summary: {
          targetUsers,
          quietHoursFiltered,
          tokens: 0,
          sent: 0,
          failed: 0,
        },
        failed: [],
      };
    }

    const filtersMetadata = {
      target: 'segment',
      segment: filters,
      campaignId,
    };

    const results = await Promise.all(
      tokens.map((tokenItem) =>
        notificationService
          .sendToToken({
            token: tokenItem.token,
            title: campaign.title,
            body: campaign.body,
            imageUrl: campaign.image_url || undefined,
            data: sanitizeJson(campaign.data),
            type: notificationType,
            adminId: campaign.created_by || 'campaign',
            userId: tokenItem.userId || undefined,
            filters: filtersMetadata,
            campaignId,
          })
          .then((result) => ({
            ...result,
            token: tokenItem.token,
            userId: tokenItem.userId,
          }))
      )
    );

    const failed = results.filter((res) => !res.success);
    const succeeded = results.filter((res) => res.success);

    const statusFinal = failed.length === results.length ? 'failed' : 'sent';

    await supabase
      .from('notification_campaigns')
      .update({
        status: statusFinal,
        sent_at: nowIso,
        updated_at: new Date().toISOString(),
        target_users_count: targetUsers,
        sent_count: succeeded.length,
        failed_count: failed.length,
        delivered_count: succeeded.length,
        opened_count: 0,
        clicked_count: 0,
      })
      .eq('id', campaignId);

    return {
      message:
        failed.length === 0 ? 'Campaña enviada correctamente.' : 'Campaña enviada con advertencias.',
      summary: {
        targetUsers,
        quietHoursFiltered,
        tokens: tokens.length,
        sent: succeeded.length,
        failed: failed.length,
      },
      failed: failed.map((item) => ({
        token: item.token,
        userId: item.userId,
        error: item.error || 'Error desconocido',
      })),
    };
  } catch (error: any) {
    if (markedAsSending) {
      await supabase
        .from('notification_campaigns')
        .update({
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
    }

    if (error instanceof CampaignExecutionError) {
      throw error;
    }

    throw new CampaignExecutionError(error?.message || 'Error ejecutando campaña');
  }
}

type RenewalReminderOptions = {
  daysBefore?: number;
  limit?: number;
};

type ReferralTriggerOptions = {
  limit?: number;
  lookbackDays?: number;
  referralIds?: string[];
};

type RenewalReminderSummary = {
  evaluatedUsers: number;
  alreadyProcessed: number;
  eligibleUsers: number;
  notifiedUsers: number;
  notificationAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  skipped: {
    noTokens: number;
    optOut: number;
    quietHours: number;
  };
  settings?: {
    daysBefore: number;
    limit: number;
  };
};

async function runRenewalReminder(settings: { daysBefore: number; limit: number }) {
  const supabase = getSupabaseAdmin();
  const notificationType: NotificationCategory = 'reminder';

  const now = new Date();
  const targetStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + settings.daysBefore,
      0,
      0,
      0,
      0
    )
  );
  const targetEnd = new Date(targetStart.getTime() + 24 * 60 * 60 * 1000);

  try {
    let userQuery = supabase
      .from('usuarios')
      .select('id, suscripcion, fecha_expiracion_suscripcion')
      .in('suscripcion', ['smart', 'pro'])
      .not('fecha_expiracion_suscripcion', 'is', null)
      .gte('fecha_expiracion_suscripcion', targetStart.toISOString())
      .lt('fecha_expiracion_suscripcion', targetEnd.toISOString())
      .order('fecha_expiracion_suscripcion', { ascending: true })
      .limit(settings.limit);

    const { data: candidates, error: candidatesError } = await userQuery;
    if (candidatesError) {
      throw candidatesError;
    }

    const candidateUsers = candidates || [];
    if (candidateUsers.length === 0) {
      return {
        triggerKey: TRIGGER_KEY_RENEWAL,
        success: true,
        message: 'Sin usuarios para recordatorio de renovación.',
        summary: {
          evaluatedUsers: 0,
          alreadyProcessed: 0,
          eligibleUsers: 0,
          notifiedUsers: 0,
          notificationAttempts: 0,
          successfulAttempts: 0,
          failedAttempts: 0,
          skipped: { noTokens: 0, optOut: 0, quietHours: 0 },
          settings,
        },
      };
    }

    const candidateIds = candidateUsers.map((user: any) => user.id).filter(Boolean);

    let alreadyProcessedIds = new Set<string>();
    if (candidateIds.length > 0) {
      const { data: alreadyLogged, error: logsError } = await supabase
        .from('notification_trigger_logs')
        .select('user_id')
        .eq('trigger_key', TRIGGER_KEY_RENEWAL)
        .gte('sent_at', targetStart.toISOString())
        .in('user_id', candidateIds);

      if (logsError) {
        throw logsError;
      }

      alreadyProcessedIds = new Set(
        (alreadyLogged || []).map((row: any) => row.user_id).filter(Boolean)
      );
    }

    const usersToProcess = candidateUsers.filter((user: any) => !alreadyProcessedIds.has(user.id));

    if (usersToProcess.length === 0) {
      return {
        triggerKey: TRIGGER_KEY_RENEWAL,
        success: true,
        message: 'Usuarios ya notificados previamente para esta fecha de renovación.',
        summary: {
          evaluatedUsers: candidateUsers.length,
          alreadyProcessed: candidateUsers.length,
          eligibleUsers: 0,
          notifiedUsers: 0,
          notificationAttempts: 0,
          successfulAttempts: 0,
          failedAttempts: 0,
          skipped: { noTokens: 0, optOut: 0, quietHours: 0 },
          settings,
        },
      };
    }

    let preferencesMap = new Map<string, any>();
    const { data: prefsData, error: prefsError } = await supabase
      .from('notification_preferences')
      .select(
        'user_id, push_enabled, reminder_enabled, marketing_enabled, transaction_enabled, timezone'
      )
      .in('user_id', usersToProcess.map((user: any) => user.id));

    if (prefsError) {
      throw prefsError;
    }

    preferencesMap = new Map((prefsData || []).map((pref: any) => [pref.user_id, pref]));

    let notifiedUsers = 0;
    let notificationAttempts = 0;
    let successfulAttempts = 0;
    let failedAttempts = 0;
    let skippedNoTokens = 0;
    let skippedOptOut = 0;
    let skippedQuietHours = 0;

    const triggerLogs: Array<{ trigger_key: string; user_id: string; context?: Record<string, any> }> = [];

    for (const user of usersToProcess) {
      const userId = user.id as string;
      const expiresAtIso = user.fecha_expiracion_suscripcion as string;
      const expiresAt = expiresAtIso ? new Date(expiresAtIso) : null;
      const preference = preferencesMap.get(userId);
      const plan = (user.suscripcion || '').toString();

      const contextBase = {
        plan,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        daysBefore: settings.daysBefore,
      };

      if (preference?.push_enabled === false || preference?.reminder_enabled === false) {
        skippedOptOut += 1;
        triggerLogs.push({
          trigger_key: TRIGGER_KEY_RENEWAL,
          user_id: userId,
          context: {
            ...contextBase,
            skippedReason: 'opt_out',
          },
        });
        continue;
      }

      if (isWithinQuietHours(notificationType, preference)) {
        skippedQuietHours += 1;
        triggerLogs.push({
          trigger_key: TRIGGER_KEY_RENEWAL,
          user_id: userId,
          context: {
            ...contextBase,
            skippedReason: 'quiet_hours',
          },
        });
        continue;
      }

      const tokens = await getActiveTokensForUser(userId);

      if (!tokens || tokens.length === 0) {
        skippedNoTokens += 1;
        triggerLogs.push({
          trigger_key: TRIGGER_KEY_RENEWAL,
          user_id: userId,
          context: {
            ...contextBase,
            skippedReason: 'no_tokens',
          },
        });
        continue;
      }

      let sentForUser = 0;
      let attemptsForUser = 0;

      const title = plan
        ? `Tu plan ${plan.toUpperCase()} vence pronto`
        : 'Tu suscripción vence pronto';
      const daysRemaining = expiresAt
        ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
        : settings.daysBefore;
      const body =
        daysRemaining <= 0
          ? 'Tu plan vence hoy. Renueva para seguir disfrutando de Ahorro365.'
          : daysRemaining === 1
          ? 'Tu plan vence mañana. Renueva para evitar interrupciones.'
          : `Tu plan vence en ${daysRemaining} días. Renueva para evitar interrupciones.`;
      const filtersMetadata = {
        trigger: TRIGGER_KEY_RENEWAL,
        daysBefore: settings.daysBefore,
        plan,
      };

      for (const token of tokens) {
        attemptsForUser += 1;
        notificationAttempts += 1;
        const result = await notificationService.sendToToken({
          token,
          title,
          body,
          type: notificationType,
          adminId: 'trigger:renewal',
          userId,
          filters: filtersMetadata,
          data: {
            screen: 'Subscription',
            triggerKey: TRIGGER_KEY_RENEWAL,
            expiresAt: expiresAt ? expiresAt.toISOString() : '',
            daysBefore: String(settings.daysBefore),
          },
        });

        if (result.success) {
          sentForUser += 1;
          successfulAttempts += 1;
        } else {
          failedAttempts += 1;
        }
      }

      if (sentForUser > 0) {
        notifiedUsers += 1;
      }

      triggerLogs.push({
        trigger_key: TRIGGER_KEY_RENEWAL,
        user_id: userId,
        context: {
          ...contextBase,
          attempts: attemptsForUser,
          sent: sentForUser,
        },
      });
    }

    await recordTriggerLogs(triggerLogs);

    const summary: RenewalReminderSummary = {
      evaluatedUsers: candidateUsers.length,
      alreadyProcessed: candidateUsers.length - usersToProcess.length,
      eligibleUsers: usersToProcess.length,
      notifiedUsers,
      notificationAttempts,
      successfulAttempts,
      failedAttempts,
      skipped: {
        noTokens: skippedNoTokens,
        optOut: skippedOptOut,
        quietHours: skippedQuietHours,
      },
      settings,
    };

    return {
      triggerKey: TRIGGER_KEY_RENEWAL,
      success: true,
      message:
        notifiedUsers > 0
          ? `Recordatorios de renovación enviados a ${notifiedUsers} usuarios.`
          : 'No se enviaron recordatorios de renovación.',
      summary,
    };
  } catch (error: any) {
    console.error('Error ejecutando trigger de renovación:', error);
    return {
      triggerKey: TRIGGER_KEY_RENEWAL,
      success: false,
      message: 'Error ejecutando trigger de renovación.',
      error: error?.message || 'Error desconocido ejecutando trigger de renovación',
    };
  }
}

export async function executeRenewalReminderTrigger(
  options: RenewalReminderOptions = {}
): Promise<TriggerResult & { summary?: RenewalReminderSummary }> {
  const config = await getTriggerConfig(TRIGGER_KEY_RENEWAL, RENEWAL_DEFAULTS);
  const merged = {
    ...config.settings,
    ...options,
  };

  const sanitized = {
    daysBefore: Math.max(0, Math.floor(Number(merged.daysBefore ?? RENEWAL_DEFAULTS.daysBefore))),
    limit: Math.min(Math.max(Math.floor(Number(merged.limit ?? RENEWAL_DEFAULTS.limit)), 1), 500),
  };

  if (!config.isActive) {
    return {
      triggerKey: TRIGGER_KEY_RENEWAL,
      success: true,
      message: 'Trigger de renovación desactivado.',
      summary: {
        evaluatedUsers: 0,
        alreadyProcessed: 0,
        eligibleUsers: 0,
        notifiedUsers: 0,
        notificationAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        skipped: { noTokens: 0, optOut: 0, quietHours: 0 },
        settings: sanitized,
      },
    };
  }

  const result = await runRenewalReminder(sanitized);
  if (result.summary) {
    result.summary.settings = sanitized;
  }
  return result;
}

export async function executeReferralInvitedTrigger(
  options: ReferralTriggerOptions = {}
): Promise<TriggerResult> {
  const config = await getTriggerConfig(TRIGGER_KEY_REFERRAL_INVITED, REFERRAL_INVITED_DEFAULTS);
  const merged = {
    ...config.settings,
    ...options,
  };

  if (!config.isActive) {
    return {
      triggerKey: TRIGGER_KEY_REFERRAL_INVITED,
      success: true,
      message: 'Trigger de referidos (invitados) desactivado.',
      summary: {
        referralsEvaluated: 0,
        alreadyProcessed: 0,
        eligible: 0,
        notifiedUsers: 0,
        notificationsSent: 0,
        skipped: { optOut: 0, noTokens: 0 },
        settings: {
          limit: Number(merged.limit ?? REFERRAL_INVITED_DEFAULTS.limit),
          lookbackDays: Number(merged.lookbackDays ?? REFERRAL_INVITED_DEFAULTS.lookbackDays),
        },
      },
    };
  }

  const supabase = getSupabaseAdmin();
  const limit = Math.min(Math.max(Number(merged.limit ?? REFERRAL_INVITED_DEFAULTS.limit), 1), 500);
  const lookbackDays = Math.min(Math.max(Number(merged.lookbackDays ?? REFERRAL_INVITED_DEFAULTS.lookbackDays), 1), 30);
  const lookbackStart = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const referralIds =
    Array.isArray(merged.referralIds) && merged.referralIds.length > 0
      ? merged.referralIds.map((id: any) => String(id).trim()).filter(Boolean)
      : [];
  const executionMode = referralIds.length > 0 ? 'direct' : 'batch';

  try {
    const referralQuery = supabase
      .from('referidos')
      .select(
        `id, referidor_id, referido_id, fecha_registro,
         referidor:referidor_id(nombre, correo),
         referido:referido_id(nombre, telefono)`
      )
      .order('fecha_registro', { ascending: true });

    if (referralIds.length > 0) {
      referralQuery.in('id', referralIds).limit(referralIds.length);
    } else {
      referralQuery.gte('fecha_registro', lookbackStart).limit(limit);
    }

    const { data, error } = await referralQuery;

    if (error) {
      throw error;
    }

    const referrals = (data || []) as any[];

    if (referrals.length === 0) {
      return {
        triggerKey: TRIGGER_KEY_REFERRAL_INVITED,
        success: true,
        message: 'Sin nuevos registros de referidos recientes.',
        summary: {
          referralsEvaluated: 0,
          alreadyProcessed: 0,
          eligible: 0,
          notifiedUsers: 0,
          notificationsSent: 0,
          skipped: { optOut: 0, noTokens: 0 },
          settings: { limit, lookbackDays },
          mode: executionMode,
        },
      };
    }

    const referidorIds = Array.from(
      new Set(referrals.map((referral: any) => referral.referidor_id).filter(Boolean))
    );

    const { data: logged, error: loggedError } = referidorIds.length
      ? await supabase
          .from('notification_trigger_logs')
          .select('user_id, context')
          .eq('trigger_key', TRIGGER_KEY_REFERRAL_INVITED)
          .in('user_id', referidorIds)
      : { data: [], error: null };

    if (loggedError) {
      throw loggedError;
    }

    const alreadyLoggedPairs = new Set<string>();
    (logged || []).forEach((log: any) => {
      const ctx = log.context as any;
      if (ctx?.referido_id) {
        alreadyLoggedPairs.add(`${log.user_id}:${ctx.referido_id}`);
      }
    });

    const preferencesMap = await getNotificationPreferencesMap(referidorIds);

    let alreadyProcessed = 0;
    let eligible = 0;
    let notifiedUsers = 0;
    let notificationsSent = 0;
    let skippedOptOut = 0;
    let skippedNoTokens = 0;

    const logs: Array<{ trigger_key: string; user_id: string; context?: Record<string, any> }> = [];

    for (const referral of referrals) {
      const referidorId = referral.referidor_id as string | null;
      const referidoId = referral.referido_id as string | null;

      if (!referidorId || !referidoId) {
        continue;
      }

      const key = `${referidorId}:${referidoId}`;
      if (alreadyLoggedPairs.has(key)) {
        alreadyProcessed += 1;
        continue;
      }

      eligible += 1;

      const preference = preferencesMap.get(referidorId);
      if (preference?.push_enabled === false) {
        skippedOptOut += 1;
        logs.push({
          trigger_key: TRIGGER_KEY_REFERRAL_INVITED,
          user_id: referidorId,
          context: {
            event: 'invited',
            referido_id: referidoId,
            skippedReason: 'opt_out',
          },
        });
        alreadyLoggedPairs.add(key);
        continue;
      }

      const tokens = await getActiveTokensForUser(referidorId);

      if (tokens.length === 0) {
        skippedNoTokens += 1;
        logs.push({
          trigger_key: TRIGGER_KEY_REFERRAL_INVITED,
          user_id: referidorId,
          context: {
            event: 'invited',
            referido_id: referidoId,
            skippedReason: 'no_tokens',
          },
        });
        alreadyLoggedPairs.add(key);
        continue;
      }

      let sentForUser = 0;

      const referredName = referral.referido?.nombre?.trim();
      const title = '🎉 Nuevo referido usando tu código';
      const body = referredName
        ? `${referredName} se registró con tu código. Cuando verifique su WhatsApp sumará a tus beneficios.`
        : 'Un nuevo usuario se registró con tu código. Cuando verifique su WhatsApp sumará a tus beneficios.';

      const filtersMetadata = {
        trigger: TRIGGER_KEY_REFERRAL_INVITED,
        referidoId,
      };

      for (const token of tokens) {
        const result = await notificationService.sendToToken({
          token,
          title,
          body,
          type: 'referral',
          adminId: 'trigger:referral',
          userId: referidorId,
          filters: filtersMetadata,
          data: {
            screen: 'Referrals',
            triggerKey: TRIGGER_KEY_REFERRAL_INVITED,
            referidoId,
            event: 'invited',
          },
        });

        if (result.success) {
          sentForUser += 1;
          notificationsSent += 1;
        }
      }

      if (sentForUser > 0) {
        notifiedUsers += 1;
      }

      logs.push({
        trigger_key: TRIGGER_KEY_REFERRAL_INVITED,
        user_id: referidorId,
        context: {
          event: 'invited',
          referido_id: referidoId,
          sent: sentForUser,
        },
      });

      alreadyLoggedPairs.add(key);
    }

    await recordTriggerLogs(logs);

    return {
      triggerKey: TRIGGER_KEY_REFERRAL_INVITED,
      success: true,
      message:
        notifiedUsers > 0
          ? `Notificaciones de nuevos referidos enviadas a ${notifiedUsers} usuarios.`
          : 'No se enviaron notificaciones de nuevos referidos.',
      summary: {
        referralsEvaluated: referrals.length,
        alreadyProcessed,
        eligible,
        notifiedUsers,
        notificationsSent,
        skipped: {
          optOut: skippedOptOut,
          noTokens: skippedNoTokens,
        },
        logsInserted: logs.length,
        settings: { limit, lookbackDays },
        mode: executionMode,
      },
    };
  } catch (error: any) {
    console.error('Error ejecutando trigger de referidos (invitados):', error);
    return {
      triggerKey: TRIGGER_KEY_REFERRAL_INVITED,
      success: false,
      message: 'Error ejecutando trigger de referidos (invitados).',
      error: error?.message || 'Error desconocido ejecutando trigger de referidos (invitados)',
      summary: {
        settings: { limit, lookbackDays },
        mode: executionMode,
      },
    };
  }
}

export async function executeReferralVerifiedTrigger(
  options: ReferralTriggerOptions = {}
): Promise<TriggerResult> {
  const config = await getTriggerConfig(TRIGGER_KEY_REFERRAL_VERIFIED, REFERRAL_VERIFIED_DEFAULTS);
  const merged = {
    ...config.settings,
    ...options,
  };

  if (!config.isActive) {
    return {
      triggerKey: TRIGGER_KEY_REFERRAL_VERIFIED,
      success: true,
      message: 'Trigger de referidos (verificados) desactivado.',
      summary: {
        referralsEvaluated: 0,
        alreadyProcessed: 0,
        eligible: 0,
        notifiedUsers: 0,
        notificationsSent: 0,
        skipped: { optOut: 0, noTokens: 0 },
        settings: {
          limit: Number(merged.limit ?? REFERRAL_VERIFIED_DEFAULTS.limit),
          lookbackDays: Number(merged.lookbackDays ?? REFERRAL_VERIFIED_DEFAULTS.lookbackDays),
        },
      },
    };
  }

  const supabase = getSupabaseAdmin();
  const limit = Math.min(Math.max(Number(merged.limit ?? REFERRAL_VERIFIED_DEFAULTS.limit), 1), 500);
  const lookbackDays = Math.min(Math.max(Number(merged.lookbackDays ?? REFERRAL_VERIFIED_DEFAULTS.lookbackDays), 1), 30);
  const lookbackStart = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const referralIds =
    Array.isArray(merged.referralIds) && merged.referralIds.length > 0
      ? merged.referralIds.map((id: any) => String(id).trim()).filter(Boolean)
      : [];
  const executionMode = referralIds.length > 0 ? 'direct' : 'batch';

  try {
    const referralQuery = supabase
      .from('referidos')
      .select(
        `id, referidor_id, referido_id, verifico_whatsapp, fecha_verificacion,
         referidor:referidor_id(nombre, correo, referidos_verificados),
         referido:referido_id(nombre, telefono)`
      )
      .eq('verifico_whatsapp', true)
      .not('fecha_verificacion', 'is', null)
      .order('fecha_verificacion', { ascending: true });

    if (referralIds.length > 0) {
      referralQuery.in('id', referralIds).limit(referralIds.length);
    } else {
      referralQuery.gte('fecha_verificacion', lookbackStart).limit(limit);
    }

    const { data, error } = await referralQuery;

    if (error) {
      throw error;
    }

    const referrals = (data || []) as any[];

    if (referrals.length === 0) {
      return {
        triggerKey: TRIGGER_KEY_REFERRAL_VERIFIED,
        success: true,
        message: 'Sin referidos verificados recientes.',
        summary: {
          referralsEvaluated: 0,
          alreadyProcessed: 0,
          eligible: 0,
          notifiedUsers: 0,
          notificationsSent: 0,
          skipped: { optOut: 0, noTokens: 0 },
          settings: { limit, lookbackDays },
          mode: executionMode,
        },
      };
    }

    const referidorIds = Array.from(
      new Set(referrals.map((referral: any) => referral.referidor_id).filter(Boolean))
    );

    const { data: logged, error: loggedError } = referidorIds.length
      ? await supabase
          .from('notification_trigger_logs')
          .select('user_id, context')
          .eq('trigger_key', TRIGGER_KEY_REFERRAL_VERIFIED)
          .in('user_id', referidorIds)
      : { data: [], error: null };

    if (loggedError) {
      throw loggedError;
    }

    const alreadyLoggedPairs = new Set<string>();
    (logged || []).forEach((log: any) => {
      const ctx = log.context as any;
      if (ctx?.referido_id) {
        alreadyLoggedPairs.add(`${log.user_id}:${ctx.referido_id}`);
      }
    });

    const preferencesMap = await getNotificationPreferencesMap(referidorIds);

    let alreadyProcessed = 0;
    let eligible = 0;
    let notifiedUsers = 0;
    let notificationsSent = 0;
    let skippedOptOut = 0;
    let skippedNoTokens = 0;

    const logs: Array<{ trigger_key: string; user_id: string; context?: Record<string, any> }> = [];

    for (const referral of referrals) {
      const referidorId = referral.referidor_id as string | null;
      const referidoId = referral.referido_id as string | null;

      if (!referidorId || !referidoId) {
        continue;
      }

      const key = `${referidorId}:${referidoId}`;
      if (alreadyLoggedPairs.has(key)) {
        alreadyProcessed += 1;
        continue;
      }

      eligible += 1;

      const preference = preferencesMap.get(referidorId);
      if (preference?.push_enabled === false) {
        skippedOptOut += 1;
        logs.push({
          trigger_key: TRIGGER_KEY_REFERRAL_VERIFIED,
          user_id: referidorId,
          context: {
            event: 'verified',
            referido_id: referidoId,
            skippedReason: 'opt_out',
          },
        });
        alreadyLoggedPairs.add(key);
        continue;
      }

      const tokens = await getActiveTokensForUser(referidorId);

      if (tokens.length === 0) {
        skippedNoTokens += 1;
        logs.push({
          trigger_key: TRIGGER_KEY_REFERRAL_VERIFIED,
          user_id: referidorId,
          context: {
            event: 'verified',
            referido_id: referidoId,
            skippedReason: 'no_tokens',
          },
        });
        alreadyLoggedPairs.add(key);
        continue;
      }

      let sentForUser = 0;

      const referredName = referral.referido?.nombre?.trim();
      const count = referral.referidor?.referidos_verificados || 0;
      const title = '✅ ¡Tu referido se verificó!';
      const body = referredName
        ? `${referredName} verificó su WhatsApp. Ya llevas ${count} referidos verificados.`
        : `Un referido verificó su WhatsApp. Ya llevas ${count} referidos verificados.`;

      const filtersMetadata = {
        trigger: TRIGGER_KEY_REFERRAL_VERIFIED,
        referidoId,
      };

      for (const token of tokens) {
        const result = await notificationService.sendToToken({
          token,
          title,
          body,
          type: 'referral',
          adminId: 'trigger:referral',
          userId: referidorId,
          filters: filtersMetadata,
          data: {
            screen: 'Referrals',
            triggerKey: TRIGGER_KEY_REFERRAL_VERIFIED,
            referidoId,
            event: 'verified',
          },
        });

        if (result.success) {
          sentForUser += 1;
          notificationsSent += 1;
        }
      }

      if (sentForUser > 0) {
        notifiedUsers += 1;
      }

      logs.push({
        trigger_key: TRIGGER_KEY_REFERRAL_VERIFIED,
        user_id: referidorId,
        context: {
          event: 'verified',
          referido_id: referidoId,
          sent: sentForUser,
        },
      });
      alreadyLoggedPairs.add(key);
    }

    await recordTriggerLogs(logs);

    return {
      triggerKey: TRIGGER_KEY_REFERRAL_VERIFIED,
      success: true,
      message:
        notifiedUsers > 0
          ? `Notificaciones de referidos verificados enviadas a ${notifiedUsers} usuarios.`
          : 'No se enviaron notificaciones de referidos verificados.',
      summary: {
        referralsEvaluated: referrals.length,
        alreadyProcessed,
        eligible,
        notifiedUsers,
        notificationsSent,
        skipped: {
          optOut: skippedOptOut,
          noTokens: skippedNoTokens,
        },
        logsInserted: logs.length,
        settings: { limit, lookbackDays },
        mode: executionMode,
      },
    };
  } catch (error: any) {
    console.error('Error ejecutando trigger de referidos (verificados):', error);
    return {
      triggerKey: TRIGGER_KEY_REFERRAL_VERIFIED,
      success: false,
      message: 'Error ejecutando trigger de referidos (verificados).',
      error: error?.message || 'Error desconocido ejecutando trigger de referidos (verificados)',
      summary: {
        settings: { limit, lookbackDays },
        mode: executionMode,
      },
    };
  }
}

export async function triggerReferralInvitedForIds(referralIds: string[]) {
  const ids = Array.isArray(referralIds)
    ? referralIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length === 0) {
    return {
      triggerKey: TRIGGER_KEY_REFERRAL_INVITED,
      success: true,
      message: 'Sin referidos específicos para procesar.',
      summary: {
        referralsEvaluated: 0,
        alreadyProcessed: 0,
        eligible: 0,
        notifiedUsers: 0,
        notificationsSent: 0,
        skipped: { optOut: 0, noTokens: 0 },
        logsInserted: 0,
        settings: { limit: 0, lookbackDays: 0 },
        mode: 'direct',
      },
    };
  }

  return executeReferralInvitedTrigger({
    referralIds: ids,
    limit: ids.length,
  });
}

export async function triggerReferralInvitedForId(referralId: string) {
  return triggerReferralInvitedForIds([referralId]);
}

export async function triggerReferralVerifiedForIds(referralIds: string[]) {
  const ids = Array.isArray(referralIds)
    ? referralIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length === 0) {
    return {
      triggerKey: TRIGGER_KEY_REFERRAL_VERIFIED,
      success: true,
      message: 'Sin referidos verificados específicos para procesar.',
      summary: {
        referralsEvaluated: 0,
        alreadyProcessed: 0,
        eligible: 0,
        notifiedUsers: 0,
        notificationsSent: 0,
        skipped: { optOut: 0, noTokens: 0 },
        logsInserted: 0,
        settings: { limit: 0, lookbackDays: 0 },
        mode: 'direct',
      },
    };
  }

  return executeReferralVerifiedTrigger({
    referralIds: ids,
    limit: ids.length,
  });
}

export async function triggerReferralVerifiedForId(referralId: string) {
  return triggerReferralVerifiedForIds([referralId]);
}

TRIGGER_DEFINITIONS.push(
  {
    key: TRIGGER_KEY_RENEWAL,
    label: 'Recordatorio de renovación',
    description: 'Envía recordatorios a usuarios con suscripción próxima a vencer.',
    defaults: RENEWAL_DEFAULTS,
    settingsMeta: [
      { key: 'daysBefore', label: 'Días antes del vencimiento', type: 'number', min: 0, max: 30, step: 1 },
      { key: 'limit', label: 'Usuarios por corrida', type: 'number', min: 1, max: 500, step: 1 },
    ],
    runner: executeRenewalReminderTrigger,
  },
  {
    key: TRIGGER_KEY_REFERRAL_INVITED,
    label: 'Referidos registrados',
    description: 'Notifica cuando un usuario usa tu código de referido.',
    defaults: REFERRAL_INVITED_DEFAULTS,
    settingsMeta: [
      { key: 'limit', label: 'Registros por corrida', type: 'number', min: 1, max: 500, step: 1 },
      { key: 'lookbackDays', label: 'Días a revisar', type: 'number', min: 1, max: 30, step: 1 },
    ],
    runner: executeReferralInvitedTrigger,
  },
  {
    key: TRIGGER_KEY_REFERRAL_VERIFIED,
    label: 'Referidos verificados',
    description: 'Notifica cuando un referido verifica su WhatsApp y suma a tus beneficios.',
    defaults: REFERRAL_VERIFIED_DEFAULTS,
    settingsMeta: [
      { key: 'limit', label: 'Verificaciones por corrida', type: 'number', min: 1, max: 500, step: 1 },
      { key: 'lookbackDays', label: 'Días a revisar', type: 'number', min: 1, max: 30, step: 1 },
    ],
    runner: executeReferralVerifiedTrigger,
  }
);

