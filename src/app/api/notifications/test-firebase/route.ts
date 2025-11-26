import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdminInitialized, messaging } from '@/lib/firebaseAdminServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { handleError, ErrorType } from '@/lib/errorHandler';

/**
 * GET /api/notifications/test-firebase
 * 
 * Endpoint de prueba para verificar que Firebase está configurado correctamente
 * y que puede enviar notificaciones.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      checks: {},
      summary: {
        allPassed: false,
        canSendNotifications: false,
      },
    };

    // 1. Verificar variables de entorno
    const envVars = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      NEXT_PUBLIC_FIREBASE_VAPID_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    };

    results.checks.environmentVariables = {
      status: Object.values(envVars).every(v => v) ? 'ok' : 'missing',
      details: envVars,
      missing: Object.entries(envVars)
        .filter(([_, exists]) => !exists)
        .map(([key]) => key),
    };

    // 2. Verificar inicialización de Firebase Admin
    results.checks.firebaseAdminInitialized = {
      status: firebaseAdminInitialized ? 'ok' : 'failed',
      initialized: firebaseAdminInitialized,
    };

    // 3. Verificar instancia de messaging
    results.checks.messagingInstance = {
      status: messaging ? 'ok' : 'failed',
      exists: !!messaging,
    };

    // 4. Verificar tokens FCM en la base de datos
    const { data: tokens, error: tokensError } = await supabase
      .from('fcm_tokens')
      .select('id, user_id, token, is_active, device_type, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    results.checks.fcmTokens = {
      status: tokensError ? 'error' : 'ok',
      count: tokens?.length || 0,
      error: tokensError?.message,
      sample: tokens?.slice(0, 3).map(t => ({
        id: t.id,
        userId: t.user_id,
        deviceType: t.device_type,
        created: t.created_at,
        tokenPreview: t.token?.substring(0, 20) + '...',
      })),
    };

    // 5. Verificar logs de notificaciones recientes
    const { data: recentLogs, error: logsError } = await supabase
      .from('notification_logs')
      .select('id, status, title, sent_at, error_message')
      .order('sent_at', { ascending: false })
      .limit(5);

    results.checks.recentLogs = {
      status: logsError ? 'error' : 'ok',
      count: recentLogs?.length || 0,
      error: logsError?.message,
      recent: recentLogs?.map(log => ({
        id: log.id,
        status: log.status,
        title: log.title,
        sentAt: log.sent_at,
        error: log.error_message,
      })),
    };

    // 6. Verificar preferencias de notificaciones
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id, push_enabled, marketing_enabled')
      .eq('push_enabled', true)
      .limit(5);

    results.checks.userPreferences = {
      status: prefError ? 'error' : 'ok',
      usersWithPushEnabled: preferences?.length || 0,
      error: prefError?.message,
    };

    // Determinar si puede enviar notificaciones
    const canSend =
      firebaseAdminInitialized &&
      !!messaging &&
      Object.values(envVars).every(v => v) &&
      (tokens?.length || 0) > 0;

    results.summary.allPassed = canSend;
    results.summary.canSendNotifications = canSend;

    // Mensaje de resumen
    if (canSend) {
      results.summary.message = '✅ Firebase está configurado correctamente y puede enviar notificaciones';
    } else {
      const issues: string[] = [];
      if (!firebaseAdminInitialized) issues.push('Firebase Admin no inicializado');
      if (!messaging) issues.push('Instancia de messaging no disponible');
      if (results.checks.environmentVariables.missing.length > 0) {
        issues.push(`Variables faltantes: ${results.checks.environmentVariables.missing.join(', ')}`);
      }
      if ((tokens?.length || 0) === 0) {
        issues.push('No hay tokens FCM activos registrados');
      }
      results.summary.message = `⚠️ No se puede enviar notificaciones: ${issues.join('; ')}`;
    }

    return NextResponse.json(results, {
      status: canSend ? 200 : 503,
    });
  } catch (error: any) {
    return handleError(error, 'Error verificando configuración de Firebase', ErrorType.INTERNAL_ERROR);
  }
}

