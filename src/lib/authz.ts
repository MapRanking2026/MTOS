import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContextForUser } from "@/lib/workspace";
import type { WorkspaceMembershipRole } from "@/lib/mtos-types";

export async function getUserRole(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return (data?.role as WorkspaceMembershipRole | undefined) ?? "account_manager";
}

export async function isSuperAdmin(userId: string) {
  return (await getUserRole(userId)) === "super_admin";
}

export async function canManageWorkspace(userId: string) {
  const context = await getWorkspaceContextForUser(userId);
  return Boolean(context?.tenant.canManage);
}
