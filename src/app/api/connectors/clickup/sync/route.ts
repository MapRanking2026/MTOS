import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decryptString } from "@/lib/crypto";

type ClickUpTask = {
  id: string;
  name: string;
  status?: { status?: string };
  assignees?: Array<{ email?: string }>;
};

function normalizeStatus(raw?: string) {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("pause")) return "paused";
  if (v.includes("cancel")) return "canceled";
  return "active";
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: conn } = await admin
    .schema("private")
    .from("clickup_connection")
    .select("access_token_enc, list_id")
    .eq("id", 1)
    .maybeSingle();

  if (!conn?.access_token_enc) {
    return NextResponse.json({ error: "ClickUp is not connected." }, { status: 400 });
  }
  if (!conn.list_id) {
    return NextResponse.json({ error: "ClickUp list is not configured yet." }, { status: 400 });
  }

  const accessToken = decryptString(conn.access_token_enc);
  const tasksRes = await fetch(
    `https://api.clickup.com/api/v2/list/${encodeURIComponent(conn.list_id)}/task?archived=false&include_closed=true`,
    {
      headers: {
        Authorization: accessToken,
      },
    }
  );

  if (!tasksRes.ok) {
    const text = await tasksRes.text();
    return NextResponse.json(
      { error: "ClickUp tasks fetch failed.", status: tasksRes.status, details: text },
      { status: 500 }
    );
  }

  const tasksJson = (await tasksRes.json()) as { tasks?: ClickUpTask[] };
  const tasks = tasksJson.tasks ?? [];

  let upserted = 0;
  for (const t of tasks) {
    const status = normalizeStatus(t.status?.status);
    const assigneeEmail = t.assignees?.[0]?.email;

    let managerUserId: string | null = null;
    if (assigneeEmail) {
      const { data: profile } = await admin
        .from("user_profiles")
        .select("id")
        .eq("email", assigneeEmail)
        .maybeSingle();
      if (profile?.id) managerUserId = profile.id;
    }

    const { error } = await admin.from("clients").upsert(
      {
        clickup_task_id: t.id,
        name: t.name,
        status,
        account_manager_user_id: managerUserId,
      },
      { onConflict: "clickup_task_id" }
    );
    if (!error) upserted += 1;
  }

  await admin
    .schema("private")
    .from("clickup_connection")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("id", 1);

  return NextResponse.json({ ok: true, fetched: tasks.length, upserted });
}
