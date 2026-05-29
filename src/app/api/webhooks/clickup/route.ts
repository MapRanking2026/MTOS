import crypto from "crypto";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptString } from "@/lib/crypto";

type WebhookPayload = {
  webhook_id?: string;
  event?: string;
  task_id?: string;
};

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

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-signature") ?? "";
  const rawBody = await req.text();

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.webhook_id || !payload.task_id) {
    return NextResponse.json({ ok: true });
  }

  const admin = createSupabaseAdminClient();
  const { data: conn } = await admin
    .schema("private")
    .from("clickup_connection")
    .select("access_token_enc, webhook_secret, webhook_id")
    .eq("id", 1)
    .maybeSingle();

  if (!conn?.access_token_enc || !conn.webhook_secret || !conn.webhook_id) {
    return NextResponse.json({ error: "Unknown webhook." }, { status: 404 });
  }
  if (payload.webhook_id !== conn.webhook_id) {
    return NextResponse.json({ error: "Unknown webhook." }, { status: 404 });
  }

  const expected = crypto
    .createHmac("sha256", conn.webhook_secret)
    .update(rawBody)
    .digest("hex");

  if (!signature || !safeEqual(signature, expected)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const accessToken = decryptString(conn.access_token_enc);
  const taskRes = await fetch(`https://api.clickup.com/api/v2/task/${encodeURIComponent(payload.task_id)}`, {
    headers: { Authorization: accessToken },
  });

  if (!taskRes.ok) {
    return NextResponse.json({ ok: true });
  }

  const task = (await taskRes.json()) as ClickUpTask;
  const status = normalizeStatus(task.status?.status);
  const assigneeEmail = task.assignees?.[0]?.email;

  let managerUserId: string | null = null;
  if (assigneeEmail) {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id")
      .eq("email", assigneeEmail)
      .maybeSingle();
    if (profile?.id) managerUserId = profile.id;
  }

  await admin.from("clients").upsert(
    {
      clickup_task_id: task.id,
      name: task.name,
      status,
      account_manager_user_id: managerUserId,
    },
    { onConflict: "clickup_task_id" }
  );

  return NextResponse.json({ ok: true });
}
