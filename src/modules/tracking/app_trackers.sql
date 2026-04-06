-- Run this in Supabase SQL editor before using /api/trackers/views
create table if not exists public.app_trackers (
  id bigserial primary key,
  device_id char(10) not null check (device_id ~ '^\d{10}$'),
  view text not null,
  view_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_id, view)
);

create index if not exists idx_app_trackers_device_last_seen
  on public.app_trackers (device_id, last_seen_at desc);

create or replace function public.set_updated_at_app_trackers()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_app_trackers on public.app_trackers;
create trigger trg_set_updated_at_app_trackers
before update on public.app_trackers
for each row execute procedure public.set_updated_at_app_trackers();
