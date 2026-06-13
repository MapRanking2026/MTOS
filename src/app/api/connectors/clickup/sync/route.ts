import { NextResponse } from "next/server";

import { getClickUpConnection, touchClickUpLastSync } from "@/lib/clickup-connection";
import {
  buildClientSlug,
  CLICKUP_CLIENT_HEALTH_TRACKER_LIST_ID,
  extractAccountManagerName,
  fetchAllClickUpListTasks,
  getUserFirstName,
  normalizeFirstName,
  normalizeStatus,
} from "@/lib/clickup-client-sync";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decryptString } from "@/lib/crypto";
import { getWorkspaceContextForUser } from "@/lib/workspace";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceContextForUser(data.user.id);
  if (!workspace?.tenant.id) {
    return NextResponse.json({ error: "No active workspace found for this user." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const conn = await getClickUpConnection(admin, data.user.id);

  if (!conn?.access_token_enc) {
    return NextResponse.json({ error: "ClickUp is not connected." }, { status: 400 });
  }

  const accessToken = decryptString(conn.access_token_enc);
  const currentUserFirstName = getUserFirstName({
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  });

  if (!currentUserFirstName) {
    return NextResponse.json(
      { error: "Unable to determine the current user's first name for ClickUp matching." },
      { status: 400 }
    );
  }

  let tasks;
  try {
    tasks = await fetchAllClickUpListTasks(accessToken, CLICKUP_CLIENT_HEALTH_TRACKER_LIST_ID);
  } catch (err) {
    return NextResponse.json(
      { error: "ClickUp tasks fetch failed.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  let matched = 0;
  let skipped = 0;
  let upserted = 0;
  for (const t of tasks) {
    const accountManagerName = extractAccountManagerName(t);
    const accountManagerFirstName = normalizeFirstName(accountManagerName);
    if (!accountManagerFirstName || accountManagerFirstName !== currentUserFirstName) {
      skipped += 1;
      continue;
    }

    matched += 1;
    const status = normalizeStatus(t.status?.status);

    const { error } = await admin.from("clients").upsert(
      {
        clickup_task_id: t.id,
        name: t.name,
        slug: buildClientSlug(t.name, t.id),
        status,
        tenant_id: workspace.tenant.id,
        account_manager_user_id: data.user.id,
      },
      { onConflict: "clickup_task_id" }
    );
    if (!error) upserted += 1;
  }

  await touchClickUpLastSync(admin, data.user.id, new Date().toISOString());

  return NextResponse.json({
    ok: true,
    sourceListId: CLICKUP_CLIENT_HEALTH_TRACKER_LIST_ID,
    matchedFirstName: currentUserFirstName,
    fetched: tasks.length,
    matched,
    skipped,
    upserted,
  });
}
