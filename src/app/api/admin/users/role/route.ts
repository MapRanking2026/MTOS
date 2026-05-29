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

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email?: unknown }).email ?? "").toLowerCase()
      : "";
  const role =
    typeof body === "object" && body !== null && "role" in body
      ? String((body as { role?: unknown }).role ?? "")
      : "";

  if (!email || !["admin", "account_manager", "client", "super_admin"].includes(role)) {
    return NextResponse.json({ error: "email and valid role are required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("id").eq("email", email).maybeSingle();
  if (!profile?.id) {
    return NextResponse.json({ error: "User not found in user_profiles yet." }, { status: 404 });
  }

  const { error } = await admin.from("user_profiles").update({ role }).eq("id", profile.id);
  if (error) {
    return NextResponse.json({ error: "Failed to set role", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

