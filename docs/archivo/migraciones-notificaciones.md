# 📜 Historial de migraciones de notificaciones (Supabase)

> Nota: mientras no se utilice la CLI de Supabase, esta tabla actúa como fuente de verdad. Actualízala cada vez que se ejecute una nueva migración.

| Fecha aprox. | Archivo / versión | Estado | Descripción breve |
| --- | --- | --- | --- |
| 2025-02-14 | `2025-02-14-000-fcm-tokens.sql` | ✅ Aplicada (prod) | Crea `fcm_tokens` con metadatos de dispositivo, índices por usuario y actividad. |
| 2025-02-14 | `2025-02-14-001-notification-logs.sql` | ✅ Aplicada (prod) | Crea `notification_logs` (historial básico de envíos). |
| 2025-11-09 | `2025-11-09-002-notification-preferences.sql` | ✅ Aplicada (prod) | Agrega `notification_preferences` con flags por tipo y quiet hours. |
| 2025-11-09 | `2025-11-09-003-notification-templates.sql` | ✅ Aplicada (prod) | Biblioteca `notification_templates` con tags e índices. |
| 2025-11-10 | `2025-11-10-004-notification-logs-events.sql` | ✅ Aplicada (prod) | Extiende `notification_logs` con columnas `delivered_at`, `opened_at`, etc. |
| 2025-11-10 | `2025-11-10-004-notification-logs-extend.sql` | ✅ Aplicada (prod) | Ajusta tipo de `sent_by` a `text`, agrega `last_event_at`, índice por eventos. |
| 2025-11-10 | `2025-11-10-005-notification-campaigns.sql` | ✅ Aplicada (prod) | Crea `notification_campaigns` para campañas programadas (filtros, métricas y estados). |
| 2025-11-10 | `2025-11-10-006-notification-trigger-logs.sql` | ✅ Aplicada (prod) | Registra envíos automáticos de triggers (`notification_trigger_logs`). |
| 2025-11-10 | `2025-11-10-007-notification-triggers-config.sql` | ✅ Aplicada (prod) | Configuración persistente para triggers automáticos (`notification_triggers`). |

## Próximos pasos sugeridos
- Cuando se vuelva a ejecutar una migración, añadir una fila con fecha, archivo y propósito.
- Si empiezas a usar `supabase db push`, este archivo puede convertirse en un resumen y la tabla `supabase_migrations.schema_migrations` será la fuente oficial.

