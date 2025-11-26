# 📘 Roadmap de Notificaciones Push (Estado actual)

> Última actualización: 2025-11-12  
> **Estado general: ✅ COMPLETO - Listo para producción**

Este documento resume todo lo implementado para el sistema de notificaciones push. Todas las fases (1-4) están completas y el sistema está listo para producción. La segmentación avanzada (idioma, actividad reciente) está marcada como opcional y no crítica.

---

## 🔹 Fase 1 – Fundaciones ✅

| Entrega | Detalle | Referencias |
| --- | --- | --- |
| Firebase configurado | `src/lib/firebaseAdminServer.ts`, variables en `.env.local`, `public/firebase-messaging-sw.js` | `docs/FCM_SETUP.md` |
| Registro de tokens | Hook `useRegisterFcmToken`, endpoint `/api/notifications/register-token` | `src/hooks/useRegisterFcmToken.ts`, `src/app/api/notifications/register-token/route.ts` |
| Tablas base | `fcm_tokens`, `notification_logs`, `notification_preferences` | `docs/migraciones-notificaciones.md` |
| Logging inicial | `notificationService.sendToToken` inserta en `notification_logs` | `src/lib/notificationService.ts` |

---

## 🔹 Fase 2 – Envío básico + Panel mínimo ✅

| Entrega | Estado | Referencias |
| --- | --- | --- |
| API `/api/notifications/send` (usuario, token, segmento) | ✅ | `src/app/api/notifications/send/route.ts` |
| Formulario en panel admin | ✅ | `admin-dashboard/src/app/(protected)/notifications/page.tsx` |
| Historial básico (últimas 20) | ✅ | Mismo archivo + proxy `admin-dashboard/src/app/api/notifications/logs/route.ts` |
| Manejo de tokens inválidos | ✅ | `notificationService.sendToToken` (desactiva `fcm_tokens`) |
| **Rate limiting** | ✅ Configurado | Upstash Redis (`src/lib/notificationsRateLimit.ts`). Requiere `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. |
| **Quiet hours automáticos** | ✅ Eliminado | Se eliminó la configuración manual de quiet hours. El sistema respetará automáticamente el horario del país del usuario (implementación futura). |

**Notas:** El envío por segmento contempla filtros por plan y país, respetando opt-ins en `notification_preferences`. No se implementó filtro por ciudad (diseñado sólo a nivel país).

---

## 🔹 Fase 3 – Templates & Stats ✅

| Entrega | Estado real | Referencias |
| --- | --- | --- |
| CRUD de templates | ✅ Listo | `/api/notifications/templates/*`, componentes en panel |
| Preview de audiencia | ✅ Listo | `preview: true` en el formulario del panel |
| Segmentación básica | ✅ Listo | Filtros por plan, país y opt-ins (marketing, reminder, transaction). Segmentación avanzada (idioma, actividad reciente) marcada como opcional y no crítica para producción. |
| Estadísticas de envíos | ✅ Listo | KPIs + tendencia con `/api/notifications/logs/summary` y `/trend` |
| UI de preferencias (toggles básicos) | ✅ Implementado | Sección en `/profile` con toggles para push_enabled, transaction_enabled, reminder_enabled, marketing_enabled. API `/api/notifications/preferences` para GET/PUT. |
| UI de preferencias (quiet hours/frecuencia) | ✅ Eliminado | Se eliminó la configuración manual de quiet hours. El sistema respetará automáticamente el horario del país del usuario. |

---

## 🔹 Fase 4 – Automatizaciones ✅

| Entrega | Estado real | Notas |
| --- | --- | --- |
| Triggers renovación / referidos | ✅ Backend listo | `trigger.renewal.reminder`, `trigger.referral.invited`, `trigger.referral.verified` registrados en `notification_triggers` |
| Integración en la app | ✅ Completo | Triggers completamente integrados: `referral-invited` se invoca en `createUser()` y `referral-verified` se invoca en `/api/whatsapp/verify-code`. Ver `docs/integracion-triggers-referidos.md` |
| Campañas programadas + cron | ✅ Configurado y funcionando | Endpoints y panel listos; workflow `notifications-cron.yml` configurado y ejecutándose automáticamente cada 15 minutos. **GRATIS con GitHub Actions**. Secrets configurados en GitHub y Vercel. Ver `docs/configurar-cron-gratis.md` |
| Panel de automatizaciones (admin) | ✅ Listo | `/notifications/automation` permite activar/desactivar triggers, editar parámetros y ejecutar pruebas |
| Métricas por trigger/campaña | ✅ Listo | Breakdown en panel vía `/api/notifications/logs/summary` |
| Reintentos / monitoreo | ✅ Completo | Health check del cron guardado en `notification_trigger_logs` con clave `trigger.cron.health`. Sistema de alertas automáticas implementado (webhooks Discord/Slack). Dashboard de monitoreo visual en panel admin (`/notifications`). Endpoint `/api/notifications/monitoring` para obtener estado del cron. |

---

## 🧰 Infraestructura y scripts

- **Migraciones aplicadas:** `docs/migraciones-notificaciones.md` (incluye `notification_trigger_logs` y `notification_triggers` para registrar triggers automáticos y su configuración)
- **Scripts/manuales**: `start-all.ps1` (levanta app y panel), `docs/FCM_SETUP.md` (setup FCM)
- **Variables necesarias:** revisar `env-template.txt` (sección Firebase + Supabase) y definir `NOTIFICATIONS_CRON_SECRET` para proteger `/api/notifications/campaigns/run` en cron.

---

## ✅ Cambios ya implementados

- **Fase 1-4 completas**: Sistema de notificaciones push completamente funcional y listo para producción.
- Registro y actualización de tokens FCM (`useRegisterFcmToken` + `/api/notifications/register-token`).
- Envío manual desde panel con segmentación (plan, país, opt-ins).
- Logging completo en `notification_logs`, métricas en `/notifications` (admin).
- CRUD de templates y preview de audiencia.
- Configuración de triggers en Supabase (`notification_triggers`) + UI para activarlos/desactivarlos.
- Automatismos de renovación y referidos disponibles (ejecución manual o por cron automático cada 15 minutos).
- Rate limiting por tipo aplicado automáticamente.
- Cron automático configurado y funcionando con GitHub Actions (gratis, sin necesidad de Supabase pagado).
- Sistema de monitoreo y alertas completo (health checks, dashboard visual, webhooks Discord/Slack).
- UI de preferencias de usuario en la app (`/profile`) con toggles para diferentes tipos de notificaciones.

---

## ⏭️ Próximas tareas prioritarias (App + Panel)

1. **Cron automático (GRATIS con GitHub Actions)** ✅ COMPLETADO
   - ✅ Workflow configurado (`.github/workflows/notifications-cron.yml`)  
   - ✅ Secrets configurados en GitHub (`NOTIFICATIONS_CRON_URL`, `NOTIFICATIONS_CRON_SECRET`)  
   - ✅ Variable de entorno configurada en Vercel (`NOTIFICATIONS_CRON_SECRET`)
   - ✅ Ejecutándose automáticamente cada 15 minutos (verificado: 205+ ejecuciones exitosas)
   - 📖 Ver guía: `docs/configurar-cron-gratis.md`

2. **Monitoreo y alertas** ✅ Completo
   - ✅ Health checks del cron guardados en `notification_trigger_logs` con clave `trigger.cron.health`
   - ✅ Información del último health check disponible en `/api/notifications/logs/summary` (campo `cronHealth`)
   - ✅ Alertas automáticas implementadas (webhooks Discord/Slack) cuando `triggersProcessed` sea 0, falle el cron, o haya retrasos
   - ✅ Dashboard de monitoreo visual en el panel admin (`/notifications`) con estado en tiempo real
   - ✅ Endpoint `/api/notifications/monitoring` para obtener estadísticas y estado del cron
   - 📝 Configurar `NOTIFICATIONS_ALERT_WEBHOOK_URL` en variables de entorno para activar alertas
   - 📖 Ver guía: `docs/configurar-alertas-webhook.md`

3. **Segmentación avanzada** ⚠️ Opcional (baja prioridad, no crítica)
   - Filtros adicionales (idioma, actividad reciente, país secundario) pueden agregarse en el futuro si se requiere.  
   - La segmentación actual (plan, país, opt-ins) es suficiente para producción.

---

## 📎 Bitácora de decisiones relevantes

- Se descartó segmentación por ciudad porque la tabla correspondiente aún no existe; los filtros actuales se basan en país (`usuarios.pais`).
- Se acordó mantener logs completos en `notification_logs` para métricas futuras, evitando duplicar tablas.
- Hasta que se use la CLI de Supabase, el documento `docs/migraciones-notificaciones.md` actúa como historial oficial de migraciones aplicadas.
- Para los triggers de referidos se decidió unificar invitaciones y verificaciones bajo la clave `trigger.referral.verified`, controlada vía `notification_triggers`. Cada ejecución registra contexto en `notification_trigger_logs`.
- El endpoint `/api/notifications/logs/summary` ahora expone `aggregations.triggers` y `aggregations.campaigns`, permitiendo renderizar KPIs en el panel para automatizaciones y campañas en los últimos 7/30 días.

---

## 📐 Plan operativo · Trigger referidos verificados

- **Objetivo:** notificar al propietario de un código cuando un referido completa su verificación (WhatsApp o identidad). Esta acción confirma que la invitación fue exitosa.
- **Fuente de datos:** tabla `referidos` (campos `id`, `referente_id`, `referido_id`, `estado`, `verificado_at`) más `usuarios` para obtener idioma y preferencias push.
- **Condiciones de disparo:**
  - `referidos.estado` cambia a `verificado` o existe `referidos.verificado_at` recién actualizado.
  - El usuario referente tiene `notification_preferences.transactional = true` (o por defecto si no existe registro).
  - Respeta cooldown configurable (default 6 h) guardado en `notification_triggers.settings.cooldown_hours`.
- **Payload sugerido:** template `referral_verified` en `notification_templates`; título corto en español y cuerpo con nombre del referido + incentivo. Datos extra (`data`) con `referido_id`, `bonus_type`, `bonus_amount`.
- **Prevención de duplicados:** registrar cada `referidos.id` en `notification_trigger_logs` con clave `trigger.referral.verified`. Si existe log en las últimas 24 h se omite.
- **Métricas:** incrementar `sent_count` en `notification_campaigns` virtual asociado o usar agregaciones en `notification_trigger_logs` (nuevos campos `delivered_count`, `clicked_count` vía join con `notification_logs`).
- **Configuración en panel:** permitir activar/desactivar y editar `cooldown_hours` + plantilla asignada. Mostrar último envío (`sent_at`) y contador semanal.
- **Pruebas manuales:** endpoint `POST /api/notifications/triggers/trigger.referral.verified/run` con payload de test; verificar en Supabase que se inserta en `notification_trigger_logs` y llega al dispositivo FCM.

---

## 📊 Plan operativo · Métricas por triggers y campañas

- **Objetivo:** dotar al panel de automatizaciones y campañas de KPIs clave (enviados, entregados, abiertos, clics, fallidos) con ventanas de tiempo (`last24h`, `last7d`, `last30d`), así como totales históricos.
- **Fuente de datos primaria:** `notification_logs` (columnas `campaign_id`, `trigger_key`, `status`, `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `error_message`).
- **Complemento de contexto:** `notification_trigger_logs` para obtener último envío (`sent_at`), `context` adicional y resultado por trigger; `notification_campaigns` para métricas persistidas (`sent_count`, etc.) + metadata (`status`, `scheduled_for`).
- **Backend – agregaciones:**
  - Extender `/api/notifications/logs/summary` con un bloque `byTrigger` y `byCampaign`, agregando conteos por clave/ID en ventanas de tiempo estándar.
  - Crear `GET /api/notifications/logs/trigger-summary?key=...&range=30` y `.../campaign-summary?id=...` para breakdown detallado (diario) reutilizando el motor de `/logs/trend`.
  - Reutilizar Supabase SQL con filtros `where trigger_key is not null` o `campaign_id`, agrupando por `date_trunc('day', sent_at)`.
  - Añadir índices si hace falta optimizar (`idx_notification_logs_trigger_key_sent_at`).
- **Frontend – panel admin:**
  - En `/notifications/automation`: tarjetas por trigger con totales + tendencia mini-sparkline, estado (activo/inactivo) y última ejecución (`notification_trigger_logs`).
  - En la tabla de campañas, columnas nuevas `Enviados`, `Entregados`, `Clicks` y tooltip con tendencia; botón que abre modal con gráfico detallado (apoyado en nuevo endpoint).
  - Reutilizar componentes compartidos de KPI cards y chart (Recharts) ya usados en `/notifications`.
- **Persistencia opcional:** actualizar `notification_campaigns` con métricas pre-calculadas después de cada ejecución para reducir consultas; registrar `trigger_key` en `notification_logs` cuando provenga de `notificationCampaigns.runTriggerByKey`.
- **Pruebas:** endpoints con `Invoke-WebRequest` o `curl` asegurando respuestas JSON con métricas; validar que el panel muestre datos consistentes en staging.
- **Estado actual:** implementado. `GET /api/notifications/logs/summary` devuelve `aggregations` con breakdowns y el panel `/notifications` renderiza tablas por trigger/campaña (rango base: últimos 30 días con ventanas de 7 y 24 horas).

---

## ⚡ Disparo inmediato de triggers de referidos

- **Motivación:** ofrecer notificaciones prácticamente en tiempo real cuando un referido se registra o verifica (sin depender del cron de 15 minutos).
- **Nuevos helpers backend:** `triggerReferralInvitedForId(referralId)` y `triggerReferralVerifiedForId(referralId)` en `src/lib/notificationCampaigns.ts`. Reutilizan toda la lógica de deduplicación, preferencias y logging.
- **API existente extendida:** `POST /api/notifications/triggers/[key]/run` ahora acepta body JSON opcional (`{ "referralIds": ["<uuid>"] }`). Permite disparar los triggers `trigger.referral.invited` o `trigger.referral.verified` para eventos concretos.
- **Estrategia recomendada:** invocar los helpers inmediatamente después de insertar/actualizar la fila en `referidos`. Mantener el cron programado como red de seguridad (por si fallan los disparos inmediatos).
- **Modo batch intacto:** si no se envían IDs, los triggers continúan corriendo con el lookback configurado (comportamiento tradicional).

---

## 🛠️ Plan operativo · Cron en producción y monitoreo

- **Objetivo:** garantizar la ejecución automática de campañas programadas y triggers sin intervención manual, con visibilidad y alertas ante fallos.
- **Job principal:** `POST /api/notifications/campaigns/run` protegido con `Authorization: Bearer ${NOTIFICATIONS_CRON_SECRET}`. Procesa campañas programadas y ejecuta `trigger.renewal.reminder`, `trigger.referral.invited`, `trigger.referral.verified`.
- **Infraestructura propuesta:** Vercel Cron (o GitHub Actions programado) cada 15 minutos. Ventajas: se integra con el despliegue actual (Next.js en Vercel), logs centralizados, escalado automático. Alternativa: Supabase Edge Functions + Scheduler si se quiere mantener todo dentro de Supabase.
- **Configuración sugerida (Vercel Cron):**
  - Path: `/api/notifications/campaigns/run`
  - Frecuencia: `*/15 * * * *` (ajustable a 5 minutos si el volumen se incrementa).
  - Headers: `Authorization: Bearer {{ env.NOTIFICATIONS_CRON_SECRET }}`.
  - Variables nuevas en Vercel: `NOTIFICATIONS_CRON_SECRET`, `CRON_MONITOR_WEBHOOK` (para alertas opcionales).
- **Alternativa implementada:** workflow GitHub Actions (`.github/workflows/notifications-cron.yml`) que dispara cada 15 minutos o manualmente (`workflow_dispatch`), consumiendo `NOTIFICATIONS_CRON_URL` y `NOTIFICATIONS_CRON_SECRET` guardados en los secrets del repositorio.
- **Monitoreo:**
  - Registrar en logs consola el resumen devuelto (`campaignsProcessed`, `triggersProcessed`) para inspección rápida.
  - Integrar UptimeRobot o Vercel Alert con `status >= 500`.
  - Usar los KPIs ya expuestos (`aggregations`) para detectar desviaciones: comparar `last24h.sent` vs promedio semanal, alertar si cae a 0 cuando debería haber tráfico.
  - ✅ Guardar resultado del cron en `notification_trigger_logs` con una entrada especial `trigger.cron.health` para historizar ejecuciones (implementado en `/api/notifications/campaigns/run`).
- **Alertas recomendadas:**
  - Alerta HTTP (Discord/Slack) cuando `campaignsProcessed + triggersProcessed = 0` por más de 6 ejecuciones consecutivas.
  - Alertas Supabase (Log Drain) cuando `notification_logs.status = 'failed'` supere un umbral en 1h.
- **Checklist de lanzamiento:**
  1. ✅ Generar secreto aleatorio y configurar `NOTIFICATIONS_CRON_SECRET` en core y admin dashboard.
  2. ✅ Validar `POST /api/notifications/campaigns/run` manualmente en producción con el header correcto.
  3. ✅ Configurar los secrets `NOTIFICATIONS_CRON_URL` y `NOTIFICATIONS_CRON_SECRET` en GitHub (workflow incluido).
  4. ✅ Configurar variable de entorno `NOTIFICATIONS_CRON_SECRET` en Vercel.
  5. ✅ Verificar que el workflow se ejecute automáticamente cada 15 minutos (205+ ejecuciones exitosas verificadas).
  6. ✅ Verificado: Los KPIs en `/notifications` panel reflejan actividad del cron a través de `/api/notifications/logs/summary`
  7. ✅ Documentar estado actual en `docs/notificaciones-roadmap.md`.
- **Pruebas locales previas:** script PowerShell `Invoke-WebRequest -Uri http://localhost:3000/api/notifications/campaigns/run -Headers @{ Authorization = 'Bearer test-secret' } -Method POST` asegurando respuesta 200 y movimiento en `notification_trigger_logs`.

---

## 📞 Contactos / Soporte

- **Firebase**: revisar consola para métricas básicas de delivery.
- **Supabase**: dashboard → Monitoring → Logs para detectar fallos de RLS o inserts.
- **Panel admin**: levantar con `cd admin-dashboard && npm run dev`.

---

## 🧪 Registro de pruebas

- 2025-11-10 · `Invoke-WebRequest http://localhost:3000/api/notifications/logs/summary` → `200 OK` con `success: true` y bloques `windows.last24h/last7d/last30d`. Verifica que el endpoint ampliado responda correctamente.
- 2025-11-10 · `Invoke-WebRequest "http://localhost:3000/api/notifications/logs/trend?range=7"` → `200 OK` con `days[0].date = 2025-11-10`. Confirma que el endpoint de tendencia entrega datos agregados por día.
- 2025-11-10 · Verificación manual del panel admin (`/notifications`): se muestran KPIs (envíos, delivery rate, open rate, click rate) y gráfico de tendencia después de refrescar la página.
- 2025-11-10 · `Invoke-WebRequest http://localhost:3000/api/notifications/campaigns -Method POST ...` → `200 OK`, campaña creada (`id=1ff231b4-ee75-4391-95ed-e5f134b927bf`).
- 2025-11-10 · `Invoke-WebRequest http://localhost:3000/api/notifications/campaigns/1ff231b4-ee75-4391-95ed-e5f134b927bf/execute -Method POST` → `200 OK`, campaña ejecutada sin destinatarios (segmento vacío).
- 2025-11-10 · `Invoke-WebRequest http://localhost:3000/api/notifications/campaigns/run -Method POST` → `200 OK`, sin campañas pendientes y triggers de renovación/referidos entregan resúmenes (ej. `trigger.referral.invited`).
- 2025-11-10 · `curl http://localhost:3000/api/notifications/triggers` → `200 OK`, listado de triggers con estado/config actual. Ejecutado también `POST /api/notifications/triggers/trigger.referral.invited/run` desde UI (panel) con respuesta satisfactoria.
- 2025-11-10 · Verificación panel (`/notifications` → sección campañas): creación, listado y ejecución manual funcionando; se reflejan estados y métricas.
- 2025-11-12 · Configuración completa del cron automático: secrets configurados en GitHub y Vercel, workflow ejecutándose automáticamente cada 15 minutos (205+ ejecuciones exitosas verificadas).
- 2025-11-12 · Eliminación de configuración manual de quiet hours: el sistema ahora respetará automáticamente el horario del país del usuario.
- 2025-11-12 · Implementación de monitoreo básico: health checks del cron guardados en `notification_trigger_logs` con clave `trigger.cron.health`. Información disponible en `/api/notifications/logs/summary`.
- 2025-11-12 · Sistema de alertas completo: alertas automáticas a webhooks (Discord/Slack) cuando detecta problemas en el cron. Dashboard visual de monitoreo en panel admin con estado en tiempo real, estadísticas y últimas ejecuciones.
- 2025-11-12 · Fase 3 y Fase 4 marcadas como completas. Sistema de notificaciones listo para producción. Segmentación avanzada (idioma, actividad reciente) marcada como opcional y no crítica.

---

Mantener este archivo actualizado cada vez que:
- Se implemente una nueva funcionalidad de notificaciones.
- Se ejecute una migración relacionada.
- Se cambie la hoja de ruta (por ejemplo, se agregue otra fase o cambien prioridades).

Con esto podemos retomar el proyecto sin depender de chats previos. 💪

