-- Migration: crear tabla notification_campaigns para campañas programadas

create table if not exists public.notification_campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  campaign_type varchar(50) not null default 'marketing',

  title text not null,
  body text not null,
  image_url text,
  data jsonb default '{}'::jsonb,

  filters jsonb not null default '{}'::jsonb,

  scheduled_for timestamptz,
  sent_at timestamptz,

  status varchar(20) not null default 'draft',

  target_users_count integer,
  sent_count integer default 0,
  delivered_count integer default 0,
  opened_count integer default 0,
  clicked_count integer default 0,
  failed_count integer default 0,

  created_by uuid references public.usuarios(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_notification_campaigns_status
  on public.notification_campaigns (status, scheduled_for);

create index if not exists idx_notification_campaigns_created_by
  on public.notification_campaigns (created_by, created_at desc);

