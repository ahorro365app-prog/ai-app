import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notificationService';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { enforceNotificationRateLimit } from '@/lib/notificationsRateLimit';
import {
  computeSegmentTokens,
  NotificationCategory,
  SegmentFilters,
  TokenWithUser,
  isWithinQuietHours,
} from '@/lib/notificationSegments';

type SubscriptionPlan = 'free' | 'smart' | 'pro' | 'caducado';

type TargetType = 'user' | 'token' | 'segment';

interface SendNotificationBody {
  target?: TargetType;
  token?: string;
  userId?: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
  imageUrl?: string;
  type?: NotificationCategory;
  segment?: SegmentFilters;
  preview?: boolean;
  adminId?: string;
}

interface NotificationPreferenceRow {
  push_enabled: boolean | null;
  marketing_enabled: boolean | null;
  reminder_enabled: boolean | null;
  transaction_enabled: boolean | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  timezone?: string | null;
}

const TEMPLATE_FILTER_DEFAULTS = {
  plans: [] as SubscriptionPlan[],
  countries: [] as string[],
  onlyMarketingOptIn: false,
  onlyReminderOptIn: false,
  onlyTransactionOptIn: false,
  respectOptOut: true,
};

const normalizeArray = (value?: string[] | null) =>
  Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [];

const formatRetryAfter = (reset?: number | null) => {
  if (!reset || Number.isNaN(reset)) {
    return null;
  }
  const diffMs = reset * 1000 - Date.now();
  if (diffMs <= 0) {
    return null;
  }
  const diffSeconds = Math.ceil(diffMs / 1000);
  let humanReadable: string;
  if (diffSeconds < 60) {
    humanReadable = `${diffSeconds} segundos`;
  } else if (diffSeconds < 3600) {
    humanReadable = `${Math.ceil(diffSeconds / 60)} minutos`;
  } else {
    humanReadable = `${Math.ceil(diffSeconds / 3600)} horas`;
  }
  return {
    retryAfterSeconds: diffSeconds,
    humanReadable,
  };
};

const buildFiltersMetadata = (
  target: TargetType,
  body: SendNotificationBody
): Record<string, any> => {
  if (target === 'user' && body.userId) {
    return { target: 'user', userId: body.userId };
  }

  if (target === 'token' && body.token) {
    return { target: 'token', token: body.token };
  }

  const segment = body.segment || {};
  return {
    target: 'segment',
    segment: {
      plans: normalizeArray(segment.plans),
      countries: normalizeArray(segment.countries),
      onlyMarketingOptIn: segment.onlyMarketingOptIn ?? false,
      onlyReminderOptIn: segment.onlyReminderOptIn ?? false,
      onlyTransactionOptIn: segment.onlyTransactionOptIn ?? false,
      respectOptOut: segment.respectOptOut !== false,
    },
  };
};

export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationBody = await request.json();
    const isPreview = !!body.preview;
    const supabase = getSupabaseAdmin();
    const notificationType: NotificationCategory = body.type ?? 'system';

    if (!isPreview && (!body.title || !body.body)) {
      return NextResponse.json(
        { success: false, message: 'Título y mensaje son obligatorios' },
        { status: 400 }
      );
    }

    const targetType: TargetType = body.segment
      ? 'segment'
      : body.target
      ? body.target
      : body.token
      ? 'token'
      : 'user';

    const filtersMetadata = buildFiltersMetadata(targetType, body);
    const adminId = body.adminId || 'admin-panel';
    let quietHoursFilteredUsers = 0;

    if (!isPreview) {
      const rateLimitResult = await enforceNotificationRateLimit(notificationType, adminId);
      if (!rateLimitResult.allowed) {
        const retryInfo = formatRetryAfter(rateLimitResult.reset);
        const windowLabel =
          rateLimitResult.label === 'daily'
            ? 'diario'
            : rateLimitResult.label === 'weekly'
            ? 'semanal'
            : 'por hora';
        const baseMessage = `Se alcanzó el límite ${windowLabel} para notificaciones ${notificationType}.`;
        const message = retryInfo
          ? `${baseMessage} Intenta nuevamente en aproximadamente ${retryInfo.humanReadable}.`
          : baseMessage;

        const headers: Record<string, string> = {};
        if (retryInfo) {
          headers['Retry-After'] = `${retryInfo.retryAfterSeconds}`;
        }

        return NextResponse.json(
          {
            success: false,
            message,
            rateLimit: {
              window: rateLimitResult.window,
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              reset: rateLimitResult.reset,
              label: rateLimitResult.label,
            },
          },
          { status: 429, headers }
        );
      }
    }

    let tokens: TokenWithUser[] = [];

    if (targetType === 'token') {
      if (!body.token) {
        return NextResponse.json(
          { success: false, message: 'Debes proporcionar un token FCM' },
          { status: 400 }
        );
      }
      tokens = [{ token: body.token }];
    } else if (targetType === 'user') {
      if (!body.userId) {
        return NextResponse.json(
          { success: false, message: 'Debes proporcionar un userId' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('fcm_tokens')
        .select('token, user_id')
        .eq('user_id', body.userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error obteniendo tokens de usuario:', error);
        return NextResponse.json(
          { success: false, message: 'No se pudieron obtener los tokens del usuario' },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Usuario sin tokens registrados' },
          { status: 404 }
        );
      }

      tokens = data.map((row) => ({ token: row.token, userId: row.user_id }));

      if (!isPreview) {
        const { data: prefData, error: prefError } = await supabase
          .from('notification_preferences')
          .select(
            'push_enabled, marketing_enabled, reminder_enabled, transaction_enabled, timezone'
          )
          .eq('user_id', body.userId)
          .maybeSingle();

        if (prefError && prefError.code !== 'PGRST116') {
          console.error('Error obteniendo preferencias de notificación del usuario:', prefError);
          return NextResponse.json(
            { success: false, message: 'No se pudieron obtener las preferencias del usuario' },
            { status: 500 }
          );
        }

        if (prefData) {
          if (prefData.push_enabled !== true) {
            return NextResponse.json(
              {
                success: false,
                message: 'El usuario deshabilitó las notificaciones push.',
              },
              { status: 409 }
            );
          }

          if (notificationType === 'marketing' && prefData.marketing_enabled !== true) {
            return NextResponse.json(
              {
                success: false,
                message: 'El usuario no aceptó recibir notificaciones de marketing.',
              },
              { status: 409 }
            );
          }

          if (notificationType === 'reminder' && prefData.reminder_enabled !== true) {
            return NextResponse.json(
              {
                success: false,
                message: 'El usuario no aceptó recibir recordatorios.',
              },
              { status: 409 }
            );
          }

          if (notificationType === 'transaction' && prefData.transaction_enabled !== true) {
            return NextResponse.json(
              {
                success: false,
                message: 'El usuario no aceptó recibir alertas de transacciones.',
              },
              { status: 409 }
            );
          }

          // Quiet hours ya no se verifican aquí - el sistema respetará automáticamente el horario del país
        }
      }
    } else {
      const segmentFilters = {
        ...TEMPLATE_FILTER_DEFAULTS,
        ...body.segment,
      };

      try {
        const segmentResult = await computeSegmentTokens(
          {
            plans: normalizeArray(segmentFilters.plans),
            countries: normalizeArray(segmentFilters.countries),
            respectOptOut: segmentFilters.respectOptOut,
            onlyMarketingOptIn: segmentFilters.onlyMarketingOptIn,
            onlyReminderOptIn: segmentFilters.onlyReminderOptIn,
            onlyTransactionOptIn: segmentFilters.onlyTransactionOptIn,
          },
          notificationType
        );

        quietHoursFilteredUsers = segmentResult.quietHoursFilteredUsers;
        tokens = segmentResult.tokens;

        if (tokens.length === 0) {
        if (body.preview) {
          return NextResponse.json({
            success: true,
            preview: {
                users: segmentResult.usersMatched,
              tokens: 0,
                quietHoursFilteredUsers,
            },
          });
        }
        return NextResponse.json(
          { success: false, message: 'El segmento seleccionado no tiene destinatarios.' },
          { status: 404 }
        );
      }

        if (body.preview) {
          return NextResponse.json({
            success: true,
            preview: {
              users: segmentResult.usersMatched,
              tokens: tokens.length,
              quietHoursFilteredUsers,
            },
          });
        }
      } catch (segmentError: any) {
        console.error('Error resolviendo segmento de notificaciones:', segmentError);
        return NextResponse.json(
          {
            success: false,
            message: 'No se pudieron obtener destinatarios para el segmento.',
          },
          { status: 500 }
        );
      }
    }

    const uniqueTokens = Array.from(
      new Map(tokens.map((item) => [item.token, item])).values()
    );

    if (uniqueTokens.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No hay tokens para enviar notificaciones.' },
        { status: 404 }
      );
    }

    if (body.preview) {
      const uniqueUsers = new Set(uniqueTokens.map((item) => item.userId).filter(Boolean));
      return NextResponse.json({
        success: true,
        preview: {
          users: uniqueUsers.size,
          tokens: uniqueTokens.length,
          quietHoursFilteredUsers,
        },
      });
    }

    const results = await Promise.all(
      uniqueTokens.map((item) =>
        notificationService
          .sendToToken({
            token: item.token,
            title: body.title!,
            body: body.body!,
            data: body.data,
            imageUrl: body.imageUrl,
            type: notificationType,
            userId: item.userId || undefined,
            adminId,
            filters: filtersMetadata,
          })
          .then((result) => ({
            ...result,
            token: item.token,
            userId: item.userId || null,
          }))
      )
    );

    const failed = results.filter((r) => !r.success);
    const succeeded = results.filter((r) => r.success);

    if (failed.length === results.length) {
      return NextResponse.json(
        {
          success: false,
          message: 'No se pudieron enviar las notificaciones',
          failed: failed.map((r) => ({
            token: r.token,
            userId: r.userId,
            error: r.error || 'Error desconocido',
          })),
        },
        { status: 500 }
      );
    }

    const uniqueSuccessUsers = new Set(
      succeeded.map((item) => item.userId || undefined).filter(Boolean)
    );

    if (failed.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Notificaciones enviadas con advertencias',
        summary: {
          tokensTotales: uniqueTokens.length,
          tokensEnviados: succeeded.length,
          tokensFallidos: failed.length,
          usuariosConExito: uniqueSuccessUsers.size,
          tokensInvalidos: failed.map((item) => item.token).filter(Boolean),
          ...(quietHoursFilteredUsers > 0
            ? { usuariosFiltradosPorQuietHours: quietHoursFilteredUsers }
            : {}),
        },
        failed: failed.map((r) => ({
          token: r.token,
          userId: r.userId,
          error: r.error || 'Error desconocido',
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notificaciones enviadas correctamente',
      summary: {
        tokensTotales: uniqueTokens.length,
        tokensEnviados: succeeded.length,
        usuariosConExito: uniqueSuccessUsers.size,
        ...(quietHoursFilteredUsers > 0
          ? { usuariosFiltradosPorQuietHours: quietHoursFilteredUsers }
          : {}),
      },
    });
  } catch (error: any) {
    console.error('Error en /api/notifications/send:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno enviando notificación' },
      { status: 500 }
    );
  }
}

