import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  CampaignExecutionError,
  executeCampaignById,
  executeRenewalReminderTrigger,
  executeReferralInvitedTrigger,
  executeReferralVerifiedTrigger,
} from '@/lib/notificationCampaigns'
import {
  checkCronHealthAndAlert,
  getLastCronHealth,
  type CronHealthContext,
} from '@/lib/notificationAlerts'
import { activateScheduledSmart } from '@/lib/activateScheduledSmart'
import { handleError, handleAuthError, ErrorType } from '@/lib/errorHandler'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const secret = process.env.NOTIFICATIONS_CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return handleAuthError('No autorizado')
    }
  }

  const supabase = getSupabaseAdmin()
  const nowIso = new Date().toISOString()
  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get('limit')) || 5, 1),
    20
  )

  const { data, error } = await supabase
    .from('notification_campaigns')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(limit)

  if (error) {
    return handleError(
      error,
      'No se pudieron obtener campañas programadas',
      ErrorType.DATABASE
    )
  }

  const campaigns = data || []

  const campaignResults = []
  for (const campaign of campaigns) {
    try {
      const result = await executeCampaignById(campaign.id)
      campaignResults.push({
        id: campaign.id,
        success: true,
        message: result.message,
        summary: result.summary,
      })
    } catch (error: any) {
      if (error instanceof CampaignExecutionError) {
        campaignResults.push({
          id: campaign.id,
          success: false,
          message: error.message,
          status: error.status,
        })
      } else {
        campaignResults.push({
          id: campaign.id,
          success: false,
          message: error?.message || 'Error ejecutando campaña',
          status: 500,
        })
      }
    }
  }

  const triggers = []
  try {
    const renewalResult = await executeRenewalReminderTrigger()
    triggers.push(renewalResult)
  } catch (error: any) {
    triggers.push({
      triggerKey: 'trigger.renewal.reminder',
      success: false,
      message: 'Error ejecutando trigger de renovación.',
      error: error?.message || 'Error desconocido ejecutando trigger de renovación',
    })
  }

  try {
    const referralInvitedResult = await executeReferralInvitedTrigger()
    triggers.push(referralInvitedResult)
  } catch (error: any) {
    triggers.push({
      triggerKey: 'trigger.referral.invited',
      success: false,
      message: 'Error ejecutando trigger de referidos (invitados).',
      error: error?.message || 'Error desconocido ejecutando trigger de referidos (invitados)',
    })
  }

  try {
    const referralVerifiedResult = await executeReferralVerifiedTrigger()
    triggers.push(referralVerifiedResult)
  } catch (error: any) {
    triggers.push({
      triggerKey: 'trigger.referral.verified',
      success: false,
      message: 'Error ejecutando trigger de referidos (verificados).',
      error: error?.message || 'Error desconocido ejecutando trigger de referidos (verificados)',
    })
  }

  // Activar Smart programado
  let smartActivationResult = { activated: 0, errors: 0, success: true }
  try {
    const smartResult = await activateScheduledSmart()
    smartActivationResult = {
      activated: smartResult.activated,
      errors: smartResult.errors,
      success: smartResult.success,
    }
    if (smartResult.activated > 0) {
      logger.debug(`✅ ${smartResult.activated} Smart(s) activado(s) programado(s)`)
    }
  } catch (error: any) {
    logger.warn('⚠️ Error activando Smart programado (no crítico)')
    smartActivationResult.success = false
  }

  // Calcular resumen para health check
  const campaignsProcessed = campaignResults.length
  const triggersProcessed = triggers.filter(t => t.success).length
  const triggersTotal = triggers.length
  const allSuccess = campaignResults.every(r => r.success) && triggers.every(t => t.success) && smartActivationResult.success
  
  const currentHealth: CronHealthContext = {
    campaignsProcessed,
    campaignsScheduled: campaigns.length,
    triggersProcessed,
    triggersTotal,
    success: allSuccess,
    timestamp: nowIso,
    campaignResults: campaignResults.map(r => ({
      id: r.id,
      success: r.success,
      message: r.message,
    })),
    triggerResults: triggers.map(t => ({
      triggerKey: t.triggerKey,
      success: t.success,
      message: t.message,
    })),
  }

  // Obtener health check anterior para comparar
  let previousHealth: CronHealthContext | null = null
  try {
    previousHealth = await getLastCronHealth(supabase)
  } catch (err: any) {
    logger.warn('⚠️ No se pudo obtener health check anterior (no crítico)')
  }

  // Guardar health check en notification_trigger_logs
  try {
    const { error: healthError } = await supabase
      .from('notification_trigger_logs')
      .insert({
        trigger_key: 'trigger.cron.health',
        user_id: null, // Health check no es para un usuario específico
        context: currentHealth,
      })

    if (healthError) {
      logger.warn('⚠️ Error guardando health check del cron (no crítico)')
      // No fallar el endpoint si el health check falla
    } else {
      logger.debug('✅ Health check del cron guardado exitosamente')
    }
  } catch (healthErr: any) {
    logger.warn('⚠️ Error guardando health check del cron (no crítico)')
    // No fallar el endpoint si el health check falla
  }

  // Verificar y enviar alertas si es necesario
  let alertsResult = { alertsSent: 0, errors: [] as string[] }
  try {
    alertsResult = await checkCronHealthAndAlert(currentHealth, previousHealth)
    if (alertsResult.alertsSent > 0) {
      logger.debug(`🔔 ${alertsResult.alertsSent} alerta(s) enviada(s)`)
    }
    if (alertsResult.errors.length > 0) {
      logger.warn('⚠️ Errores enviando alertas (no crítico)')
    }
  } catch (alertErr: any) {
    logger.warn('⚠️ Error verificando/enviando alertas (no crítico)')
    // No fallar el endpoint si las alertas fallan
  }

  return NextResponse.json({
    success: true,
    campaigns: {
      scheduledFound: campaigns.length,
      processed: campaignResults.length,
      results: campaignResults,
    },
    triggers,
    smartActivation: {
      activated: smartActivationResult.activated,
      errors: smartActivationResult.errors,
      success: smartActivationResult.success,
    },
    summary: {
      campaignsProcessed,
      triggersProcessed,
      triggersTotal,
      allSuccess,
    },
    alerts: {
      sent: alertsResult.alertsSent,
      errors: alertsResult.errors,
    },
  })
}

