/**
 * Sistema de alertas para notificaciones
 * Envía alertas a webhooks (Discord/Slack) cuando detecta problemas en el cron
 */

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  context?: Record<string, any>;
}

export interface CronHealthContext {
  campaignsProcessed: number;
  campaignsScheduled: number;
  triggersProcessed: number;
  triggersTotal: number;
  success: boolean;
  timestamp: string;
  campaignResults?: Array<{ id: string; success: boolean; message: string }>;
  triggerResults?: Array<{ triggerKey: string; success: boolean; message: string }>;
}

/**
 * Envía una alerta a un webhook (Discord o Slack)
 */
export async function sendAlertToWebhook(
  webhookUrl: string,
  payload: AlertPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // Formato para Discord/Slack (compatible con ambos)
    const discordPayload = {
      embeds: [
        {
          title: payload.title,
          description: payload.message,
          color: getSeverityColor(payload.severity),
          timestamp: payload.timestamp,
          fields: payload.context
            ? Object.entries(payload.context).map(([key, value]) => ({
                name: key,
                value: String(value),
                inline: true,
              }))
            : [],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Webhook responded with ${response.status}: ${errorText}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error enviando alerta a webhook:', error);
    return {
      success: false,
      error: error?.message || 'Error desconocido enviando alerta',
    };
  }
}

/**
 * Obtiene el color según la severidad (formato Discord)
 */
function getSeverityColor(severity: AlertSeverity): number {
  switch (severity) {
    case 'info':
      return 0x3498db; // Azul
    case 'warning':
      return 0xf39c12; // Naranja
    case 'error':
      return 0xe74c3c; // Rojo
    case 'critical':
      return 0x8b0000; // Rojo oscuro
    default:
      return 0x95a5a6; // Gris
  }
}

/**
 * Verifica el estado del cron y envía alertas si es necesario
 */
export async function checkCronHealthAndAlert(
  currentHealth: CronHealthContext,
  previousHealth: CronHealthContext | null
): Promise<{ alertsSent: number; errors: string[] }> {
  const alertsSent: string[] = [];
  const errors: string[] = [];
  const webhookUrl = process.env.NOTIFICATIONS_ALERT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('⚠️ NOTIFICATIONS_ALERT_WEBHOOK_URL no configurado. Alertas deshabilitadas.');
    return { alertsSent: 0, errors: [] };
  }

  // Alerta 1: Cron falló completamente
  if (!currentHealth.success) {
    const alert: AlertPayload = {
      title: '🚨 CRÍTICO: Cron de Notificaciones Falló',
      message: `El cron de notificaciones falló en su ejecución.\n\n**Campañas:** ${currentHealth.campaignsProcessed}/${currentHealth.campaignsScheduled}\n**Triggers:** ${currentHealth.triggersProcessed}/${currentHealth.triggersTotal} exitosos`,
      severity: 'critical',
      timestamp: currentHealth.timestamp,
      context: {
        campaignsProcessed: currentHealth.campaignsProcessed,
        triggersProcessed: currentHealth.triggersProcessed,
        triggersTotal: currentHealth.triggersTotal,
      },
    };

    const result = await sendAlertToWebhook(webhookUrl, alert);
    if (result.success) {
      alertsSent.push('critical-failure');
    } else {
      errors.push(`Error enviando alerta crítica: ${result.error}`);
    }
  }

  // Alerta 2: Ningún trigger se procesó (posible problema)
  if (currentHealth.triggersProcessed === 0 && currentHealth.triggersTotal > 0) {
    const alert: AlertPayload = {
      title: '⚠️ ADVERTENCIA: Ningún Trigger Procesado',
      message: `El cron se ejecutó pero ningún trigger fue procesado exitosamente.\n\n**Triggers ejecutados:** ${currentHealth.triggersTotal}\n**Triggers exitosos:** ${currentHealth.triggersProcessed}`,
      severity: 'warning',
      timestamp: currentHealth.timestamp,
      context: {
        triggersTotal: currentHealth.triggersTotal,
        triggersProcessed: currentHealth.triggersProcessed,
      },
    };

    const result = await sendAlertToWebhook(webhookUrl, alert);
    if (result.success) {
      alertsSent.push('no-triggers-processed');
    } else {
      errors.push(`Error enviando alerta de triggers: ${result.error}`);
    }
  }

  // Alerta 3: Cron no se ha ejecutado en más de 30 minutos (si tenemos health previo)
  if (previousHealth) {
    const previousTime = new Date(previousHealth.timestamp).getTime();
    const currentTime = new Date(currentHealth.timestamp).getTime();
    const minutesSinceLastRun = (currentTime - previousTime) / (1000 * 60);

    if (minutesSinceLastRun > 30) {
      const alert: AlertPayload = {
        title: '⚠️ ADVERTENCIA: Cron No Ejecutado',
        message: `El cron no se ha ejecutado en ${Math.round(minutesSinceLastRun)} minutos.\n\n**Última ejecución:** ${new Date(previousHealth.timestamp).toLocaleString('es-ES')}\n**Ejecución esperada:** Cada 15 minutos`,
        severity: 'warning',
        timestamp: currentHealth.timestamp,
        context: {
          minutesSinceLastRun: Math.round(minutesSinceLastRun),
          lastRunAt: previousHealth.timestamp,
        },
      };

      const result = await sendAlertToWebhook(webhookUrl, alert);
      if (result.success) {
        alertsSent.push('cron-delayed');
      } else {
        errors.push(`Error enviando alerta de retraso: ${result.error}`);
      }
    }
  }

  // Alerta 4: Múltiples fallos consecutivos (si tenemos health previo)
  if (previousHealth && !previousHealth.success && !currentHealth.success) {
    const alert: AlertPayload = {
      title: '🚨 CRÍTICO: Fallos Consecutivos del Cron',
      message: `El cron ha fallado en ejecuciones consecutivas.\n\n**Ejecución anterior:** Falló\n**Ejecución actual:** Falló\n\nRevisar logs inmediatamente.`,
      severity: 'critical',
      timestamp: currentHealth.timestamp,
      context: {
        previousSuccess: previousHealth.success,
        currentSuccess: currentHealth.success,
      },
    };

    const result = await sendAlertToWebhook(webhookUrl, alert);
    if (result.success) {
      alertsSent.push('consecutive-failures');
    } else {
      errors.push(`Error enviando alerta de fallos consecutivos: ${result.error}`);
    }
  }

  return {
    alertsSent: alertsSent.length,
    errors,
  };
}

/**
 * Obtiene el último health check del cron
 */
export async function getLastCronHealth(
  supabase: any
): Promise<CronHealthContext | null> {
  try {
    const { data, error } = await supabase
      .from('notification_trigger_logs')
      .select('context, sent_at')
      .eq('trigger_key', 'trigger.cron.health')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      ...(data.context as CronHealthContext),
      timestamp: data.sent_at,
    };
  } catch (error: any) {
    console.error('Error obteniendo último health check:', error);
    return null;
  }
}

/**
 * Obtiene los últimos N health checks del cron
 */
export async function getRecentCronHealths(
  supabase: any,
  limit: number = 10
): Promise<CronHealthContext[]> {
  try {
    const { data, error } = await supabase
      .from('notification_trigger_logs')
      .select('context, sent_at')
      .eq('trigger_key', 'trigger.cron.health')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      ...(item.context as CronHealthContext),
      timestamp: item.sent_at,
    }));
  } catch (error: any) {
    console.error('Error obteniendo health checks recientes:', error);
    return [];
  }
}

