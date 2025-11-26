-- Migration: ampliar notification_logs con columnas de eventos y métricas

alter table public.notification_logs
  add column if not exists delivered_at timestamp with time zone,
  add column if not exists opened_at timestamp with time zone,
  add column if not exists clicked_at timestamp with time zone,
  add column if not exists dismissed_at timestamp with time zone,
  add column if not exists last_event_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

create index if not exists idx_notification_logs_last_event
  on public.notification_logs (last_event_at desc);


