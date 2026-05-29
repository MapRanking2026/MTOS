import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getUserRole(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return (data?.role as "super_admin" | "admin" | "account_manager" | "client" | undefined) ?? "account_manager";
}

export async function isSuperAdmin(userId: string) {
  return (await getUserRole(userId)) === "super_admin";
}

