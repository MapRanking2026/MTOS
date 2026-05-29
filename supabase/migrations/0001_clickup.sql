create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_status') then
    create type public.client_status as enum ('active', 'paused', 'canceled');
  end if;
end$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_profiles_email_unique on public.user_profiles (email);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
using (id = auth.uid());

drop policy if exists "user_profiles_upsert_own" on public.user_profiles;
create policy "user_profiles_upsert_own"
on public.user_profiles
for all
using (id = auth.uid())
with check (id = auth.uid());

create table if not exists public.clickup_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token_enc text not null,
  team_id text,
  list_id text,
  webhook_id text,
  webhook_secret text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists clickup_connections_set_updated_at on public.clickup_connections;
create trigger clickup_connections_set_updated_at
before update on public.clickup_connections
for each row execute function public.set_updated_at();

alter table public.clickup_connections enable row level security;

drop policy if exists "clickup_connections_select_own" on public.clickup_connections;
create policy "clickup_connections_select_own"
on public.clickup_connections
for select
using (user_id = auth.uid());

drop policy if exists "clickup_connections_upsert_own" on public.clickup_connections;
create policy "clickup_connections_upsert_own"
on public.clickup_connections
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.client_status not null default 'active',
  account_manager_user_id uuid references auth.users(id),
  clickup_task_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clients_clickup_task_id_unique on public.clients (clickup_task_id);
create index if not exists clients_account_manager_idx on public.clients (account_manager_user_id);
create index if not exists clients_status_idx on public.clients (status);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

drop policy if exists "clients_select_assigned" on public.clients;
create policy "clients_select_assigned"
on public.clients
for select
using (account_manager_user_id = auth.uid());

drop policy if exists "clients_insert_assigned" on public.clients;
create policy "clients_insert_assigned"
on public.clients
for insert
with check (account_manager_user_id = auth.uid());

drop policy if exists "clients_update_assigned" on public.clients;
create policy "clients_update_assigned"
on public.clients
for update
using (account_manager_user_id = auth.uid())
with check (account_manager_user_id = auth.uid());

