import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/authz";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isSuperAdmin(data.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teamId =
    typeof body === "object" && body !== null && "teamId" in body
      ? String((body as { teamId?: unknown }).teamId ?? "")
      : "";
  const listId =
    typeof body === "object" && body !== null && "listId" in body
      ? String((body as { listId?: unknown }).listId ?? "")
      : "";

  if (!teamId || !listId) {
    return NextResponse.json({ error: "teamId and listId are required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .schema("private")
    .from("clickup_connection")
    .update({ team_id: teamId, list_id: listId })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
