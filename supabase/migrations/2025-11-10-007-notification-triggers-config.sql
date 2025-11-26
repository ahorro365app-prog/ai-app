-- Migration: configuración de triggers automáticos de notificaciones

create table if not exists public.notification_triggers (
  trigger_key text primary key,
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);






