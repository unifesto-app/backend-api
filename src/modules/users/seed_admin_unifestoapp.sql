-- Ensure profiles table exists, then promote this account to super admin.
-- Run in Supabase SQL editor.

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique,
    full_name text,
    role text not null default 'attendee',
    status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
    add column if not exists email text;

alter table public.profiles
    add column if not exists full_name text;

alter table public.profiles
    add column if not exists role text not null default 'attendee';

alter table public.profiles
    add column if not exists status text not null default 'active';

alter table public.profiles
    add column if not exists created_at timestamptz not null default now();

alter table public.profiles
    add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_profiles_email_unique
    on public.profiles (lower(email));

insert into public.profiles (id, email, role, status)
select u.id, lower(u.email), 'super_admin', 'active'
from auth.users u
where lower(u.email) = 'unifestoapp@gmail.com'
on conflict (id) do update
set email = excluded.email,
        role = 'super_admin',
        status = 'active',
        updated_at = now();

-- If no rows were inserted, the user has not signed up in auth.users yet.
-- In that case, first sign in once with unifestoapp@gmail.com, then rerun this script.
