"use client";

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Loader2, Send, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface TestResult {
  timestamp: string;
  checks: {
    environmentVariables?: {
      status: string;
      details: Record<string, boolean>;
      missing: string[];
    };
    firebaseAdminInitialized?: {
      status: string;
      initialized: boolean;
    };
    messagingInstance?: {
      status: string;
      exists: boolean;
    };
    fcmTokens?: {
      status: string;
      count: number;
      error?: string;
      sample?: Array<{
        id: string;
        userId: string;
        deviceType: string;
        created: string;
        tokenPreview: string;
      }>;
    };
    recentLogs?: {
      status: string;
      count: number;
      error?: string;
      recent?: Array<{
        id: string;
        status: string;
        title: string;
        sentAt: string;
        error?: string;
      }>;
    };
    userPreferences?: {
      status: string;
      usersWithPushEnabled: number;
      error?: string;
    };
  };
  summary: {
    allPassed: boolean;
    canSendNotifications: boolean;
    message: string;
  };
}

export default function TestNotificationsPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  const runTest = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/notifications/test-firebase');
      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      logger.error('Error ejecutando test:', error);
      setTestResult({
        timestamp: new Date().toISOString(),
        checks: {},
        summary: {
          allPassed: false,
          canSendNotifications: false,
          message: `Error: ${error.message}`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const response = await fetch('/api/notifications/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setSendResult(data);
    } catch (error: any) {
      logger.error('Error enviando notificación:', error);
      setSendResult({
        success: false,
        message: `Error: ${error.message}`,
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
      case 'error':
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prueba de Notificaciones Firebase</h1>
              <p className="text-sm text-gray-600">Verifica que el sistema de notificaciones esté funcionando</p>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={runTest}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Verificar Configuración
                </>
              )}
            </button>

            <button
              onClick={sendTestNotification}
              disabled={sending || !testResult?.summary.canSendNotifications}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Notificación de Prueba
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div className="space-y-4">
              {/* Resumen */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  testResult.summary.allPassed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {testResult.summary.allPassed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h2 className="font-bold text-lg">
                    {testResult.summary.allPassed ? '✅ Todo Correcto' : '⚠️ Problemas Detectados'}
                  </h2>
                </div>
                <p className="text-sm text-gray-700">{testResult.summary.message}</p>
              </div>

              {/* Variables de Entorno */}
              {testResult.checks.environmentVariables && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    {getStatusIcon(testResult.checks.environmentVariables.status)}
                    <h3 className="font-semibold">Variables de Entorno</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    {Object.entries(testResult.checks.environmentVariables.details).map(([key, exists]) => (
                      <div key={key} className="flex items-center gap-2">
                        {exists ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={exists ? 'text-gray-700' : 'text-red-600 font-medium'}>
                          {key} {exists ? '✅' : '❌'}
                        </span>
                      </div>
                    ))}
                    {testResult.checks.environmentVariables.missing.length > 0 && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                        <strong>Faltantes:</strong> {testResult.checks.environmentVariables.missing.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Firebase Admin */}
              {testResult.checks.firebaseAdminInitialized && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(testResult.checks.firebaseAdminInitialized.status)}
                    <h3 className="font-semibold">Firebase Admin SDK</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Inicializado: {testResult.checks.firebaseAdminInitialized.initialized ? '✅ Sí' : '❌ No'}
                  </p>
                </div>
              )}

              {/* Instancia de Messaging */}
              {testResult.checks.messagingInstance && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(testResult.checks.messagingInstance.status)}
                    <h3 className="font-semibold">Instancia de Messaging</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Disponible: {testResult.checks.messagingInstance.exists ? '✅ Sí' : '❌ No'}
                  </p>
                </div>
              )}

              {/* Tokens FCM */}
              {testResult.checks.fcmTokens && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(testResult.checks.fcmTokens.status)}
                    <h3 className="font-semibold">Tokens FCM Activos</h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    Total: <strong>{testResult.checks.fcmTokens.count}</strong> tokens activos
                  </p>
                  {testResult.checks.fcmTokens.error && (
                    <p className="text-xs text-red-600 mb-2">Error: {testResult.checks.fcmTokens.error}</p>
                  )}
                  {testResult.checks.fcmTokens.sample && testResult.checks.fcmTokens.sample.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-gray-600">Ejemplos:</p>
                      {testResult.checks.fcmTokens.sample.map((token) => (
                        <div key={token.id} className="text-xs bg-white p-2 rounded border border-gray-200">
                          <div>Device: {token.deviceType}</div>
                          <div>Token: {token.tokenPreview}</div>
                          <div className="text-gray-500">Creado: {new Date(token.created).toLocaleString('es-ES')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Logs Recientes */}
              {testResult.checks.recentLogs && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(testResult.checks.recentLogs.status)}
                    <h3 className="font-semibold">Logs Recientes</h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    Últimas notificaciones: <strong>{testResult.checks.recentLogs.count}</strong>
                  </p>
                  {testResult.checks.recentLogs.recent && testResult.checks.recentLogs.recent.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {testResult.checks.recentLogs.recent.map((log) => (
                        <div
                          key={log.id}
                          className={`text-xs p-2 rounded border ${
                            log.status === 'sent'
                              ? 'bg-green-50 border-green-200'
                              : log.status === 'failed'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{log.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                log.status === 'sent'
                                  ? 'bg-green-200 text-green-800'
                                  : log.status === 'failed'
                                  ? 'bg-red-200 text-red-800'
                                  : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {new Date(log.sentAt).toLocaleString('es-ES')}
                          </div>
                          {log.error && (
                            <div className="text-red-600 mt-1">
                              <div className="font-semibold">Error: {log.error}</div>
                              {(log.error.includes('Requested entity was not found') || 
                                log.error.includes('registration token') ||
                                log.error.includes('invalid registration')) && (
                                <div className="text-xs mt-1 bg-red-100 p-1 rounded">
                                  ⚠️ Token inválido - Se desactivará automáticamente
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Resultado del envío de prueba */}
          {sendResult && (
            <div
              className={`mt-6 p-4 rounded-lg border-2 ${
                sendResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {sendResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-semibold">
                  {sendResult.success ? '✅ Notificación Enviada' : '❌ Error al Enviar'}
                </h3>
              </div>
              <p className="text-sm text-gray-700">{sendResult.message}</p>
              {sendResult.details && (
                <div className="mt-2 text-xs bg-white p-2 rounded border border-gray-200">
                  <div><strong>Título:</strong> {sendResult.details.title}</div>
                  <div><strong>Mensaje:</strong> {sendResult.details.body}</div>
                </div>
              )}
              {sendResult.error && (
                <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                  <strong>Error:</strong> {sendResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

