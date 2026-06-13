import type { SupabaseClient } from "@supabase/supabase-js";

export type ClickUpConnectionRow = {
  user_id: string;
  access_token_enc: string | null;
  team_id: string | null;
  list_id: string | null;
  webhook_id: string | null;
  webhook_secret: string | null;
  last_sync_at: string | null;
};

type ClickUpConnectionPatch = Partial<
  Pick<
    ClickUpConnectionRow,
    "access_token_enc" | "team_id" | "list_id" | "webhook_id" | "webhook_secret" | "last_sync_at"
  >
>;

function hasPatchKey<K extends keyof ClickUpConnectionPatch>(patch: ClickUpConnectionPatch, key: K) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

export async function getClickUpConnection(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin
    .from("clickup_connections")
    .select("user_id, access_token_enc, team_id, list_id, webhook_id, webhook_secret, last_sync_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ClickUpConnectionRow | null) ?? null;
}

export async function getClickUpConnectionByWebhookId(admin: SupabaseClient, webhookId: string) {
  const { data, error } = await admin
    .from("clickup_connections")
    .select("user_id, access_token_enc, team_id, list_id, webhook_id, webhook_secret, last_sync_at")
    .eq("webhook_id", webhookId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ClickUpConnectionRow | null) ?? null;
}

export async function upsertClickUpConnection(admin: SupabaseClient, userId: string, patch: ClickUpConnectionPatch) {
  const existing = await getClickUpConnection(admin, userId);

  const accessTokenEnc = hasPatchKey(patch, "access_token_enc") ? patch.access_token_enc ?? null : existing?.access_token_enc ?? null;
  const teamId = hasPatchKey(patch, "team_id") ? patch.team_id ?? null : existing?.team_id ?? null;
  const listId = hasPatchKey(patch, "list_id") ? patch.list_id ?? null : existing?.list_id ?? null;
  const webhookId = hasPatchKey(patch, "webhook_id") ? patch.webhook_id ?? null : existing?.webhook_id ?? null;
  const webhookSecret = hasPatchKey(patch, "webhook_secret") ? patch.webhook_secret ?? null : existing?.webhook_secret ?? null;
  const lastSyncAt = hasPatchKey(patch, "last_sync_at") ? patch.last_sync_at ?? null : existing?.last_sync_at ?? null;

  const payload = {
    user_id: userId,
    access_token_enc: accessTokenEnc,
    team_id: teamId,
    list_id: listId,
    webhook_id: webhookId,
    webhook_secret: webhookSecret,
    last_sync_at: lastSyncAt,
  };

  const { error } = await admin.from("clickup_connections").upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function touchClickUpLastSync(admin: SupabaseClient, userId: string, lastSyncAt: string) {
  const { error } = await admin.from("clickup_connections").update({ last_sync_at: lastSyncAt }).eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
