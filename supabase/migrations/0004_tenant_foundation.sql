create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tenants_slug_unique on public.tenants (slug);

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

create table if not exists public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'account_manager',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_memberships_user_idx on public.tenant_memberships (user_id, tenant_id);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  brand_name text,
  support_email text,
  primary_color text,
  terminology jsonb not null default '{}'::jsonb,
  workflow_defaults jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists tenant_settings_set_updated_at on public.tenant_settings;
create trigger tenant_settings_set_updated_at
before update on public.tenant_settings
for each row execute function public.set_updated_at();

alter table private.clickup_connection
add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.user_profiles
add column if not exists default_tenant_id uuid references public.tenants(id) on delete set null;

alter table public.clients
add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.meetings
add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.action_items
add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.client_opportunities
add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.client_signals
add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.wiki_documents
add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

with seeded_tenant as (
  insert into public.tenants (name, slug)
  select 'MTOS Workspace', 'mtos-workspace'
  where not exists (select 1 from public.tenants)
  returning id
),
default_tenant as (
  select id from seeded_tenant
  union all
  select id from public.tenants order by created_at asc limit 1
)
update public.user_profiles
set default_tenant_id = (select id from default_tenant limit 1)
where default_tenant_id is null;

with default_tenant as (
  select id from public.tenants order by created_at asc limit 1
)
update private.clickup_connection
set tenant_id = coalesce(tenant_id, (select id from default_tenant))
where tenant_id is null;

insert into public.tenant_memberships (tenant_id, user_id, role)
select
  user_profiles.default_tenant_id,
  user_profiles.id,
  case
    when user_profiles.role = 'super_admin' then 'admin'::public.user_role
    else user_profiles.role
  end
from public.user_profiles
where user_profiles.default_tenant_id is not null
on conflict (tenant_id, user_id) do nothing;

insert into public.tenant_settings (tenant_id, brand_name, support_email)
select
  tenants.id,
  tenants.name,
  (
    select user_profiles.email
    from public.user_profiles
    where user_profiles.default_tenant_id = tenants.id
    order by user_profiles.created_at asc
    limit 1
  )
from public.tenants
on conflict (tenant_id) do nothing;

with default_tenant as (
  select id from public.tenants order by created_at asc limit 1
)
update public.clients
set tenant_id = coalesce(tenant_id, (select id from default_tenant))
where tenant_id is null;

update public.meetings
set tenant_id = clients.tenant_id
from public.clients
where meetings.client_id = clients.id
  and meetings.tenant_id is null;

update public.action_items
set tenant_id = clients.tenant_id
from public.clients
where action_items.client_id = clients.id
  and action_items.tenant_id is null;

update public.client_opportunities
set tenant_id = clients.tenant_id
from public.clients
where client_opportunities.client_id = clients.id
  and client_opportunities.tenant_id is null;

update public.client_signals
set tenant_id = clients.tenant_id
from public.clients
where client_signals.client_id = clients.id
  and client_signals.tenant_id is null;

with default_tenant as (
  select id from public.tenants order by created_at asc limit 1
)
update public.wiki_documents
set tenant_id = coalesce(wiki_documents.tenant_id, clients.tenant_id, (select id from default_tenant))
from public.clients
where wiki_documents.tenant_id is null
  and (wiki_documents.client_id = clients.id or wiki_documents.client_id is null);

with default_tenant as (
  select id from public.tenants order by created_at asc limit 1
)
update public.wiki_documents
set tenant_id = (select id from default_tenant)
where tenant_id is null;

alter table public.clients alter column tenant_id set not null;
alter table public.meetings alter column tenant_id set not null;
alter table public.action_items alter column tenant_id set not null;
alter table public.client_opportunities alter column tenant_id set not null;
alter table public.client_signals alter column tenant_id set not null;
alter table public.wiki_documents alter column tenant_id set not null;

create index if not exists clients_tenant_idx on public.clients (tenant_id, status);
create index if not exists meetings_tenant_idx on public.meetings (tenant_id, meeting_at desc);
create index if not exists action_items_tenant_idx on public.action_items (tenant_id, due_at asc);
create index if not exists client_opportunities_tenant_idx on public.client_opportunities (tenant_id, updated_at desc);
create index if not exists client_signals_tenant_idx on public.client_signals (tenant_id, recorded_at desc);
create index if not exists wiki_documents_tenant_idx on public.wiki_documents (tenant_id, updated_at desc);

create or replace function public.current_platform_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.user_profiles where id = auth.uid()),
    'account_manager'::public.user_role
  );
$$;

create or replace function public.has_tenant_access(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_platform_role() = 'super_admin'::public.user_role
    or exists (
      select 1
      from public.tenant_memberships
      where tenant_memberships.tenant_id = target_tenant_id
        and tenant_memberships.user_id = auth.uid()
    );
$$;

create or replace function public.can_manage_tenant(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_platform_role() = 'super_admin'::public.user_role
    or exists (
      select 1
      from public.tenant_memberships
      where tenant_memberships.tenant_id = target_tenant_id
        and tenant_memberships.user_id = auth.uid()
        and tenant_memberships.role in ('admin', 'account_manager', 'super_admin')
    );
$$;

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.tenant_settings enable row level security;

drop policy if exists "tenants_select_member" on public.tenants;
create policy "tenants_select_member"
on public.tenants
for select
using (public.has_tenant_access(id));

drop policy if exists "tenants_mutate_manager" on public.tenants;
create policy "tenants_mutate_manager"
on public.tenants
for all
using (public.can_manage_tenant(id))
with check (public.can_manage_tenant(id));

drop policy if exists "tenant_memberships_select_member" on public.tenant_memberships;
create policy "tenant_memberships_select_member"
on public.tenant_memberships
for select
using (
  user_id = auth.uid()
  or public.can_manage_tenant(tenant_id)
);

drop policy if exists "tenant_memberships_mutate_manager" on public.tenant_memberships;
create policy "tenant_memberships_mutate_manager"
on public.tenant_memberships
for all
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));

drop policy if exists "tenant_settings_select_member" on public.tenant_settings;
create policy "tenant_settings_select_member"
on public.tenant_settings
for select
using (public.has_tenant_access(tenant_id));

drop policy if exists "tenant_settings_mutate_manager" on public.tenant_settings;
create policy "tenant_settings_mutate_manager"
on public.tenant_settings
for all
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));

drop policy if exists "clients_select_assigned" on public.clients;
drop policy if exists "clients_insert_assigned" on public.clients;
drop policy if exists "clients_update_assigned" on public.clients;
drop policy if exists "clients_tenant_member_select" on public.clients;
drop policy if exists "clients_tenant_manager_mutate" on public.clients;
create policy "clients_tenant_member_select"
on public.clients
for select
using (public.has_tenant_access(tenant_id));

create policy "clients_tenant_manager_mutate"
on public.clients
for all
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));

drop policy if exists "meetings_select_assigned" on public.meetings;
drop policy if exists "meetings_mutate_assigned" on public.meetings;
drop policy if exists "meetings_tenant_member_select" on public.meetings;
drop policy if exists "meetings_tenant_manager_mutate" on public.meetings;
create policy "meetings_tenant_member_select"
on public.meetings
for select
using (public.has_tenant_access(tenant_id));

create policy "meetings_tenant_manager_mutate"
on public.meetings
for all
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));

drop policy if exists "action_items_select_assigned" on public.action_items;
drop policy if exists "action_items_mutate_assigned" on public.action_items;
drop policy if exists "action_items_tenant_member_select" on public.action_items;
drop policy if exists "action_items_tenant_manager_mutate" on public.action_items;
create policy "action_items_tenant_member_select"
on public.action_items
for select
using (public.has_tenant_access(tenant_id));

create policy "action_items_tenant_manager_mutate"
on public.action_items
for all
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));

drop policy if exists "client_opportunities_select_assigned" on public.client_opportunities;
drop policy if exists "client_opportunities_mutate_assigned" on public.client_opportunities;
drop policy if exists "client_opportunities_tenant_member_select" on public.client_opportunities;
drop policy if exists "client_opportunities_tenant_manager_mutate" on public.client_opportunities;
create policy "client_opportunities_tenant_member_select"
on public.client_opportunities
for select
using (public.has_tenant_access(tenant_id));

create policy "client_opportunities_tenant_manager_mutate"
on public.client_opportunities
for all
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));

drop policy if exists "client_signals_select_assigned" on public.client_signals;
drop policy if exists "client_signals_mutate_assigned" on public.client_signals;
drop policy if exists "client_signals_tenant_member_select" on public.client_signals;
drop policy if exists "client_signals_tenant_manager_mutate" on public.client_signals;
create policy "client_signals_tenant_member_select"
on public.client_signals
for select
using (public.has_tenant_access(tenant_id));

create policy "client_signals_tenant_manager_mutate"
on public.client_signals
for all
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));

drop policy if exists "wiki_documents_select_assigned" on public.wiki_documents;
drop policy if exists "wiki_documents_mutate_assigned" on public.wiki_documents;
drop policy if exists "wiki_documents_tenant_member_select" on public.wiki_documents;
drop policy if exists "wiki_documents_tenant_manager_mutate" on public.wiki_documents;
create policy "wiki_documents_tenant_member_select"
on public.wiki_documents
for select
using (public.has_tenant_access(tenant_id));

create policy "wiki_documents_tenant_manager_mutate"
on public.wiki_documents
for all
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));
