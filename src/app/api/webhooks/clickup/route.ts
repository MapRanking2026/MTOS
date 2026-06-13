import crypto from "crypto";
import { NextResponse } from "next/server";

import { getClickUpConnectionByWebhookId, touchClickUpLastSync } from "@/lib/clickup-connection";
import {
  buildClientSlug,
  buildTenantFirstNameUserMap,
  CLICKUP_CLIENT_HEALTH_TRACKER_LIST_ID,
  extractAccountManagerName,
  normalizeFirstName,
  normalizeStatus,
  type ClickUpTask,
} from "@/lib/clickup-client-sync";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptString } from "@/lib/crypto";
import { getWorkspaceContextForUser } from "@/lib/workspace";

type WebhookPayload = {
  webhook_id?: string;
  event?: string;
  task_id?: string;
};

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
  const conn = await getClickUpConnectionByWebhookId(admin, payload.webhook_id);

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
  const taskListId = task.list?.id == null ? null : String(task.list.id);
  if (taskListId && taskListId !== CLICKUP_CLIENT_HEALTH_TRACKER_LIST_ID) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const workspace = await getWorkspaceContextForUser(conn.user_id);
  if (!workspace?.tenant.id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const status = normalizeStatus(task.status?.status);
  const accountManagerFirstName = normalizeFirstName(extractAccountManagerName(task));
  if (!accountManagerFirstName) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { byFirstName, ambiguousFirstNames } = await buildTenantFirstNameUserMap(admin, workspace.tenant.id);
  if (ambiguousFirstNames.has(accountManagerFirstName)) {
    return NextResponse.json({ ok: true, ignored: true, ambiguous: true });
  }

  const managerUserId = byFirstName.get(accountManagerFirstName);
  if (!managerUserId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await admin.from("clients").upsert(
    {
      clickup_task_id: task.id,
      name: task.name,
      slug: buildClientSlug(task.name, task.id),
      status,
      tenant_id: workspace.tenant.id,
      account_manager_user_id: managerUserId,
    },
    { onConflict: "clickup_task_id" }
  );

  await touchClickUpLastSync(admin, conn.user_id, new Date().toISOString());

  return NextResponse.json({ ok: true });
}
