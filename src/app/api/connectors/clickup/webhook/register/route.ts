import crypto from "crypto";
import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/authz";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decryptString } from "@/lib/crypto";

type CreateWebhookResponse = { id?: string; webhook?: { id?: string } };

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isSuperAdmin(data.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data: conn } = await admin
    .schema("private")
    .from("clickup_connection")
    .select("access_token_enc, team_id, list_id")
    .eq("id", 1)
    .maybeSingle();

  if (!conn?.access_token_enc) {
    return NextResponse.json({ error: "ClickUp is not connected." }, { status: 400 });
  }
  if (!conn.team_id || !conn.list_id) {
    return NextResponse.json({ error: "Set teamId and listId first." }, { status: 400 });
  }

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "APP_BASE_URL is not configured." }, { status: 500 });
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/webhooks/clickup`;
  const secret = crypto.randomBytes(32).toString("hex");
  const accessToken = decryptString(conn.access_token_enc);

  const webhookRes = await fetch(`https://api.clickup.com/api/v2/team/${encodeURIComponent(conn.team_id)}/webhook`, {
    method: "POST",
    headers: {
      Authorization: accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint,
      secret,
      list_id: conn.list_id,
      events: ["taskCreated", "taskUpdated", "taskDeleted"],
    }),
  });

  if (!webhookRes.ok) {
    const text = await webhookRes.text();
    return NextResponse.json(
      { error: "Webhook registration failed.", status: webhookRes.status, details: text },
      { status: 500 }
    );
  }

  const json = (await webhookRes.json()) as CreateWebhookResponse;
  const webhookId = json.id ?? json.webhook?.id;
  if (!webhookId) {
    return NextResponse.json({ error: "Webhook response missing id." }, { status: 500 });
  }

  await admin
    .schema("private")
    .from("clickup_connection")
    .update({ webhook_id: webhookId, webhook_secret: secret })
    .eq("id", 1);

  return NextResponse.json({ ok: true, webhookId, endpoint });
}
