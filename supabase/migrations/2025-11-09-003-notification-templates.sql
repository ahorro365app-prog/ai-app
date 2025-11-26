create table if not exists public.notification_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  type varchar(30) not null default 'system',
  title text not null,
  body text not null,
  data jsonb,
  tags text[],
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists notification_templates_type_idx
  on public.notification_templates(type);

create index if not exists notification_templates_tags_idx
  on public.notification_templates using gin(tags);




