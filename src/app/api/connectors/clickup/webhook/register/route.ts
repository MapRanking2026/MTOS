import crypto from "crypto";
import { NextResponse } from "next/server";

import { getClickUpConnection, upsertClickUpConnection } from "@/lib/clickup-connection";
import { CLICKUP_CLIENT_HEALTH_TRACKER_LIST_ID } from "@/lib/clickup-client-sync";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decryptString } from "@/lib/crypto";

type CreateWebhookResponse = { id?: string; webhook?: { id?: string } };

function getWebhookEndpoint(baseUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("APP_BASE_URL must be a valid absolute URL.");
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local");

  if (isLocalhost) {
    throw new Error("ClickUp webhooks require a public URL. Replace APP_BASE_URL localhost with your live HTTPS app URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("ClickUp webhooks require HTTPS. Update APP_BASE_URL to your public https:// app URL.");
  }

  return `${parsed.toString().replace(/\/$/, "")}/api/webhooks/clickup`;
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const conn = await getClickUpConnection(admin, data.user.id);

  if (!conn?.access_token_enc) {
    return NextResponse.json({ error: "ClickUp is not connected." }, { status: 400 });
  }
  if (!conn.team_id) {
    return NextResponse.json({ error: "Set teamId first." }, { status: 400 });
  }

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "APP_BASE_URL is not configured." }, { status: 500 });
  }

  let endpoint: string;
  try {
    endpoint = getWebhookEndpoint(baseUrl);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Webhook registration is unavailable for this environment.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }

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
      list_id: CLICKUP_CLIENT_HEALTH_TRACKER_LIST_ID,
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

  await upsertClickUpConnection(admin, data.user.id, {
    list_id: CLICKUP_CLIENT_HEALTH_TRACKER_LIST_ID,
    webhook_id: webhookId,
    webhook_secret: secret,
  });

  return NextResponse.json({ ok: true, webhookId, endpoint });
}
