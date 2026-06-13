do $$
begin
  if not exists (select 1 from pg_type where typname = 'meeting_status') then
    create type public.meeting_status as enum ('scheduled', 'completed', 'at_risk');
  end if;

  if not exists (select 1 from pg_type where typname = 'meeting_sentiment') then
    create type public.meeting_sentiment as enum ('up', 'steady', 'down');
  end if;

  if not exists (select 1 from pg_type where typname = 'action_status') then
    create type public.action_status as enum ('todo', 'in_progress', 'blocked', 'done');
  end if;

  if not exists (select 1 from pg_type where typname = 'action_priority') then
    create type public.action_priority as enum ('low', 'medium', 'high');
  end if;

  if not exists (select 1 from pg_type where typname = 'signal_severity') then
    create type public.signal_severity as enum ('low', 'medium', 'high');
  end if;

  if not exists (select 1 from pg_type where typname = 'opportunity_stage') then
    create type public.opportunity_stage as enum ('qualified', 'proposal', 'won', 'nurture');
  end if;
end$$;

alter table public.clients
add column if not exists slug text,
add column if not exists industry text,
add column if not exists health_score int not null default 70,
add column if not exists churn_risk int not null default 25,
add column if not exists sentiment_summary text,
add column if not exists monthly_value numeric(12,2) not null default 0,
add column if not exists next_meeting_at timestamptz,
add column if not exists last_touch_at timestamptz,
add column if not exists executive_summary text,
add column if not exists ai_recommendation text;

update public.clients
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

create unique index if not exists clients_slug_unique on public.clients (slug);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  meeting_at timestamptz not null,
  meeting_type text not null default 'Monthly Touch',
  status public.meeting_status not null default 'scheduled',
  sentiment public.meeting_sentiment not null default 'steady',
  summary text not null default '',
  next_step text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meetings_client_idx on public.meetings (client_id, meeting_at desc);

drop trigger if exists meetings_set_updated_at on public.meetings;
create trigger meetings_set_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

alter table public.meetings enable row level security;

drop policy if exists "meetings_select_assigned" on public.meetings;
create policy "meetings_select_assigned"
on public.meetings
for select
using (
  exists (
    select 1
    from public.clients
    where clients.id = meetings.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);

drop policy if exists "meetings_mutate_assigned" on public.meetings;
create policy "meetings_mutate_assigned"
on public.meetings
for all
using (
  exists (
    select 1
    from public.clients
    where clients.id = meetings.client_id
      and clients.account_manager_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.clients
    where clients.id = meetings.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  title text not null,
  owner_name text not null,
  due_at timestamptz,
  status public.action_status not null default 'todo',
  priority public.action_priority not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists action_items_client_idx on public.action_items (client_id, due_at asc);

drop trigger if exists action_items_set_updated_at on public.action_items;
create trigger action_items_set_updated_at
before update on public.action_items
for each row execute function public.set_updated_at();

alter table public.action_items enable row level security;

drop policy if exists "action_items_select_assigned" on public.action_items;
create policy "action_items_select_assigned"
on public.action_items
for select
using (
  exists (
    select 1
    from public.clients
    where clients.id = action_items.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);

drop policy if exists "action_items_mutate_assigned" on public.action_items;
create policy "action_items_mutate_assigned"
on public.action_items
for all
using (
  exists (
    select 1
    from public.clients
    where clients.id = action_items.client_id
      and clients.account_manager_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.clients
    where clients.id = action_items.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);

create table if not exists public.client_opportunities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  stage public.opportunity_stage not null default 'qualified',
  value numeric(12,2) not null default 0,
  confidence numeric(5,2) not null default 0.5,
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_opportunities_client_idx on public.client_opportunities (client_id, updated_at desc);

drop trigger if exists client_opportunities_set_updated_at on public.client_opportunities;
create trigger client_opportunities_set_updated_at
before update on public.client_opportunities
for each row execute function public.set_updated_at();

alter table public.client_opportunities enable row level security;

drop policy if exists "client_opportunities_select_assigned" on public.client_opportunities;
create policy "client_opportunities_select_assigned"
on public.client_opportunities
for select
using (
  exists (
    select 1
    from public.clients
    where clients.id = client_opportunities.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);

drop policy if exists "client_opportunities_mutate_assigned" on public.client_opportunities;
create policy "client_opportunities_mutate_assigned"
on public.client_opportunities
for all
using (
  exists (
    select 1
    from public.clients
    where clients.id = client_opportunities.client_id
      and clients.account_manager_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.clients
    where clients.id = client_opportunities.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);

create table if not exists public.client_signals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  label text not null,
  detail text not null,
  severity public.signal_severity not null default 'medium',
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists client_signals_client_idx on public.client_signals (client_id, recorded_at desc);

alter table public.client_signals enable row level security;

drop policy if exists "client_signals_select_assigned" on public.client_signals;
create policy "client_signals_select_assigned"
on public.client_signals
for select
using (
  exists (
    select 1
    from public.clients
    where clients.id = client_signals.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);

drop policy if exists "client_signals_mutate_assigned" on public.client_signals;
create policy "client_signals_mutate_assigned"
on public.client_signals
for all
using (
  exists (
    select 1
    from public.clients
    where clients.id = client_signals.client_id
      and clients.account_manager_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.clients
    where clients.id = client_signals.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);

create table if not exists public.wiki_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  category text not null default 'General',
  summary text not null default '',
  body_md text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wiki_documents_client_idx on public.wiki_documents (client_id, updated_at desc);

drop trigger if exists wiki_documents_set_updated_at on public.wiki_documents;
create trigger wiki_documents_set_updated_at
before update on public.wiki_documents
for each row execute function public.set_updated_at();

alter table public.wiki_documents enable row level security;

drop policy if exists "wiki_documents_select_assigned" on public.wiki_documents;
create policy "wiki_documents_select_assigned"
on public.wiki_documents
for select
using (
  client_id is null
  or exists (
    select 1
    from public.clients
    where clients.id = wiki_documents.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);

drop policy if exists "wiki_documents_mutate_assigned" on public.wiki_documents;
create policy "wiki_documents_mutate_assigned"
on public.wiki_documents
for all
using (
  client_id is null
  or exists (
    select 1
    from public.clients
    where clients.id = wiki_documents.client_id
      and clients.account_manager_user_id = auth.uid()
  )
)
with check (
  client_id is null
  or exists (
    select 1
    from public.clients
    where clients.id = wiki_documents.client_id
      and clients.account_manager_user_id = auth.uid()
  )
);
