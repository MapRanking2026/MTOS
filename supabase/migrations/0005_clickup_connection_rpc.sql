create or replace function public.get_clickup_connection()
returns table (
  id int,
  access_token_enc text,
  team_id text,
  list_id text,
  webhook_id text,
  webhook_secret text,
  last_sync_at timestamptz,
  tenant_id uuid
)
language sql
security definer
set search_path = public, private
as $$
  select
    c.id,
    c.access_token_enc,
    c.team_id,
    c.list_id,
    c.webhook_id,
    c.webhook_secret,
    c.last_sync_at,
    c.tenant_id
  from private.clickup_connection c
  where c.id = 1
$$;

create or replace function public.upsert_clickup_connection(
  p_access_token_enc text default null,
  p_team_id text default null,
  p_list_id text default null,
  p_webhook_id text default null,
  p_webhook_secret text default null,
  p_last_sync_at timestamptz default null,
  p_tenant_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into private.clickup_connection (
    id,
    access_token_enc,
    team_id,
    list_id,
    webhook_id,
    webhook_secret,
    last_sync_at,
    tenant_id
  )
  values (
    1,
    p_access_token_enc,
    p_team_id,
    p_list_id,
    p_webhook_id,
    p_webhook_secret,
    p_last_sync_at,
    p_tenant_id
  )
  on conflict (id) do update
  set
    access_token_enc = coalesce(excluded.access_token_enc, private.clickup_connection.access_token_enc),
    team_id = coalesce(excluded.team_id, private.clickup_connection.team_id),
    list_id = coalesce(excluded.list_id, private.clickup_connection.list_id),
    webhook_id = coalesce(excluded.webhook_id, private.clickup_connection.webhook_id),
    webhook_secret = coalesce(excluded.webhook_secret, private.clickup_connection.webhook_secret),
    last_sync_at = coalesce(excluded.last_sync_at, private.clickup_connection.last_sync_at),
    tenant_id = coalesce(excluded.tenant_id, private.clickup_connection.tenant_id);
end;
$$;

create or replace function public.set_clickup_last_sync(
  p_last_sync_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  update private.clickup_connection
  set last_sync_at = p_last_sync_at
  where id = 1;
end;
$$;

revoke all on function public.get_clickup_connection() from public, anon, authenticated;
revoke all on function public.upsert_clickup_connection(text, text, text, text, text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.set_clickup_last_sync(timestamptz) from public, anon, authenticated;

grant execute on function public.get_clickup_connection() to service_role;
grant execute on function public.upsert_clickup_connection(text, text, text, text, text, timestamptz, uuid) to service_role;
grant execute on function public.set_clickup_last_sync(timestamptz) to service_role;

