-- Migration: crear tabla notification_logs para historial de notificaciones

create table if not exists public.notification_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.usuarios(id) on delete cascade,
  type varchar(50) not null default 'system',
  title varchar(100) not null,
  body text not null,
  image_url text,
  data jsonb default '{}'::jsonb,
  filters jsonb default '{}'::jsonb,
  status varchar(20) not null default 'sent',
  error_message text,
  sent_by uuid,
  campaign_id uuid,
  sent_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_notification_logs_user_date
  on public.notification_logs (user_id, sent_at desc);

create index if not exists idx_notification_logs_status
  on public.notification_logs (status, sent_at desc);



