import { NextResponse } from "next/server";

import { upsertClickUpConnection } from "@/lib/clickup-connection";
import { encryptString } from "@/lib/crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token =
    typeof body === "object" && body !== null && "token" in body
      ? String((body as { token?: unknown }).token ?? "").trim()
      : "";

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const validateRes = await fetch("https://api.clickup.com/api/v2/user", {
    headers: { Authorization: token },
  });

  if (!validateRes.ok) {
    const text = await validateRes.text();
    return NextResponse.json(
      { error: "ClickUp token validation failed.", status: validateRes.status, details: text },
      { status: 400 }
    );
  }

  let accessTokenEnc: string;
  try {
    accessTokenEnc = encryptString(token);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to encrypt ClickUp token.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
  try {
    const admin = createSupabaseAdminClient();
    await upsertClickUpConnection(admin, data.user.id, {
      access_token_enc: accessTokenEnc,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to save token.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
