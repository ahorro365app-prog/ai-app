-- Migration: extender notification_logs con columnas de eventos y metadatos

alter table if exists public.notification_logs
  add column if not exists delivered_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists clicked_at timestamptz,
  add column if not exists dismissed_at timestamptz,
  add column if not exists last_event_at timestamptz,
  add column if not exists updated_at timestamptz default timezone('utc'::text, now());

alter table if exists public.notification_logs
  alter column sent_by type text using sent_by::text;

create index if not exists idx_notification_logs_last_event
  on public.notification_logs (last_event_at desc nulls last);



