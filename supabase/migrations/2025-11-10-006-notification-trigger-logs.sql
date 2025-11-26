-- Migration: crear tabla para registrar triggers de notificaciones

create table if not exists public.notification_trigger_logs (
  id uuid primary key default uuid_generate_v4(),
  trigger_key text not null,
  user_id uuid references public.usuarios(id) on delete cascade,
  campaign_id uuid references public.notification_campaigns(id) on delete set null,
  context jsonb default '{}'::jsonb,
  sent_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_notification_trigger_logs_key_user
  on public.notification_trigger_logs (trigger_key, user_id, sent_at desc);

