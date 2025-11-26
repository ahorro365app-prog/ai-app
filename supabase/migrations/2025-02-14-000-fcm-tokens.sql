-- Migration: crear tabla de tokens FCM para notificaciones push

create table if not exists public.fcm_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.usuarios(id) on delete cascade,
  token text not null unique,
  device_type varchar(20),
  device_model varchar(100),
  app_version varchar(20),
  os_version varchar(20),
  last_ip inet,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  last_used_at timestamp with time zone default timezone('utc'::text, now()),
  is_active boolean default true
);

create index if not exists idx_fcm_tokens_user_id on public.fcm_tokens(user_id);
create index if not exists idx_fcm_tokens_active on public.fcm_tokens(user_id, is_active);
create index if not exists idx_fcm_tokens_last_used on public.fcm_tokens(last_used_at desc);

