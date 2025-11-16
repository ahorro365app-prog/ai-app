import { messaging, firebaseAdminInitialized } from '@/lib/firebaseAdminServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type NotificationType =
  | 'transaction'
  | 'marketing'
  | 'system'
  | 'reminder'
  | 'referral'
  | 'payment';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  type?: NotificationType;
  adminId?: string;
  userId?: string;
  token?: string;
  filters?: Record<string, any>;
  campaignId?: string;
}

interface TokenRecord {
  id: string;
  token: string;
  user_id: string | null;
  is_active: boolean;
}

export class NotificationService {
  async sendToToken(payload: NotificationPayload & { token: string }) {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();

    if (!firebaseAdminInitialized || !messaging) {
      console.warn('Firebase Admin no inicializado. Notificación no enviada.');
      return {
        success: false,
        error: 'Firebase Admin no está configurado en el entorno',
      };
    }

    const log = await supabase
      .from('notification_logs')
      .insert({
        user_id: payload.userId || null,
        type: payload.type || 'system',
        title: payload.title,
        body: payload.body,
        image_url: payload.imageUrl || null,
        data: payload.data || {},
        filters: payload.filters || (payload.userId ? { userId: payload.userId } : {}),
        status: 'sent',
        sent_by: payload.adminId || null,
        sent_at: now,
        last_event_at: now,
        updated_at: now,
        campaign_id: payload.campaignId || null,
      })
      .select('id')
      .single();

    const logId = log.data?.id;
    const originalData = payload.data || {};
    const normalizedData = Object.fromEntries(
      Object.entries({
        ...originalData,
        ...(logId ? { logId } : {}),
      }).map(([key, value]) => {
        if (value === undefined || value === null) {
          return [key, ''];
        }
        if (typeof value === 'string') {
          return [key, value];
        }
        try {
          return [key, JSON.stringify(value)];
        } catch {
          return [key, String(value)];
        }
      })
    );

    try {
      await messaging.send({
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: normalizedData,
      });

      await this.markTokenUsed(payload.token);

      return { success: true };
    } catch (error: any) {
      console.error('Error enviando notificación:', error);

      if (logId) {
        await supabase
          .from('notification_logs')
          .update({
            status: 'failed',
            error_message: error?.message || 'Error desconocido',
            updated_at: new Date().toISOString(),
            last_event_at: new Date().toISOString(),
          })
          .eq('id', logId);
      }

      if (error?.code === 'messaging/registration-token-not-registered') {
        await this.deactivateToken(payload.token);
      }

      return {
        success: false,
        error: error?.message || 'Error enviando notificación',
      };
    }
  }

  async getTokensForUser(userId: string): Promise<TokenRecord[]> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('fcm_tokens')
      .select('id, token, user_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error obteniendo tokens de usuario:', error);
      throw error;
    }

    return data || [];
  }

  private async markTokenUsed(token: string) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('fcm_tokens')
      .update({
        last_used_at: new Date().toISOString(),
        is_active: true,
      })
      .eq('token', token);

    if (error) {
      console.error('Error actualizando token FCM:', error);
    }
  }

  private async deactivateToken(token: string) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('fcm_tokens')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('token', token);

    if (error) {
      console.error('Error desactivando token FCM:', error);
    }
  }
}

export const notificationService = new NotificationService();

