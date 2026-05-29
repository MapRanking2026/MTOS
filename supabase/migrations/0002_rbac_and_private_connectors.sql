create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('super_admin', 'admin', 'account_manager', 'client');
  end if;
end$$;

alter table public.user_profiles
add column if not exists role public.user_role not null default 'account_manager';

create unique index if not exists user_profiles_one_super_admin
on public.user_profiles (role)
where role = 'super_admin';

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
using (id = auth.uid());

drop policy if exists "user_profiles_upsert_own" on public.user_profiles;

create schema if not exists private;

revoke all on schema private from anon;
revoke all on schema private from authenticated;

grant usage on schema private to service_role;

create table if not exists private.clickup_connection (
  id int primary key default 1,
  access_token_enc text,
  team_id text,
  list_id text,
  webhook_id text,
  webhook_secret text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clickup_connection_singleton check (id = 1)
);

insert into private.clickup_connection (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists clickup_connection_set_updated_at on private.clickup_connection;
create trigger clickup_connection_set_updated_at
before update on private.clickup_connection
for each row execute function public.set_updated_at();

alter table private.clickup_connection disable row level security;

grant all on private.clickup_connection to service_role;

