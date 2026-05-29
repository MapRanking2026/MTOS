import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/authz";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: conn } = await admin
    .schema("private")
    .from("clickup_connection")
    .select("team_id,list_id,last_sync_at,access_token_enc")
    .eq("id", 1)
    .maybeSingle();

  return NextResponse.json({
    connected: Boolean(conn?.access_token_enc),
    configured: Boolean(conn?.team_id && conn?.list_id),
    teamId: conn?.team_id ?? null,
    listId: conn?.list_id ?? null,
    lastSyncAt: conn?.last_sync_at ?? null,
    canManage: await isSuperAdmin(data.user.id),
  });
}
