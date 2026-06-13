import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContextForUser } from "@/lib/workspace";
import type { WorkspaceMembershipRole } from "@/lib/mtos-types";

const MANAGEABLE_ROLES: WorkspaceMembershipRole[] = ["admin", "account_manager", "client"];
const MANAGER_ROLES = new Set<WorkspaceMembershipRole>(["super_admin", "admin", "account_manager"]);

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceContextForUser(data.user.id);
  if (!workspace?.tenant.id) {
    return NextResponse.json({ error: "No active workspace found." }, { status: 400 });
  }
  if (!workspace.tenant.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId =
    typeof body === "object" && body !== null && "userId" in body
      ? String((body as { userId?: unknown }).userId ?? "")
      : "";
  const role =
    typeof body === "object" && body !== null && "role" in body
      ? String((body as { role?: unknown }).role ?? "")
      : "";

  if (!userId || !MANAGEABLE_ROLES.includes(role as WorkspaceMembershipRole)) {
    return NextResponse.json({ error: "userId and a valid role are required." }, { status: 400 });
  }

  if (userId === data.user.id) {
    return NextResponse.json({ error: "Update another member from the workspace admin panel." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("user_id, role")
    .eq("tenant_id", workspace.tenant.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Member not found in this workspace." }, { status: 404 });
  }

  if (membership.role !== role && MANAGER_ROLES.has(membership.role) && !MANAGER_ROLES.has(role as WorkspaceMembershipRole)) {
    const { count } = await admin
      .from("tenant_memberships")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", workspace.tenant.id)
      .in("role", Array.from(MANAGER_ROLES));

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Keep at least one workspace manager before demoting this member." },
        { status: 400 }
      );
    }
  }

  const { error } = await admin
    .from("tenant_memberships")
    .update({ role })
    .eq("tenant_id", workspace.tenant.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Failed to update member role.", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId, role });
}
