import { NextResponse } from "next/server";

import { getClickUpConnection } from "@/lib/clickup-connection";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decryptString } from "@/lib/crypto";

export async function GET() {
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

  const accessToken = decryptString(conn.access_token_enc);
  const res = await fetch("https://api.clickup.com/api/v2/team", {
    headers: { Authorization: accessToken },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Failed to fetch workspaces.", status: res.status, details: text },
      { status: 500 }
    );
  }

  const json = (await res.json()) as unknown;
  return NextResponse.json(json);
}
