import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { WorkspaceMembershipRole, WorkspaceTenant } from "@/lib/mtos-types";

type WorkspaceContext = {
  userId: string;
  email: string;
  platformRole: WorkspaceMembershipRole;
  tenant: WorkspaceTenant;
};

type TenantMembershipRow = {
  tenant_id: string;
  role: WorkspaceMembershipRole;
  created_at: string;
};

function buildSetupTenant(): WorkspaceTenant {
  return {
    id: null,
    name: "Workspace Setup",
    slug: "workspace-setup",
    membershipRole: "account_manager",
    platformRole: "account_manager",
    canManage: false,
  };
}

export function getSetupWorkspaceContext(): WorkspaceContext {
  return {
    userId: "setup-user",
    email: "setup@mtos.local",
    platformRole: "account_manager",
    tenant: buildSetupTenant(),
  };
}

async function loadWorkspaceContext(userId: string): Promise<WorkspaceContext | null> {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("email, role, default_tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email) {
    return null;
  }

  let tenantId = profile.default_tenant_id as string | null;
  let membership: TenantMembershipRow | null = null;

  if (tenantId) {
    const { data } = await admin
      .from("tenant_memberships")
      .select("tenant_id, role, created_at")
      .eq("user_id", userId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    membership = (data as TenantMembershipRow | null) ?? null;
  }

  if (!membership) {
    const { data } = await admin
      .from("tenant_memberships")
      .select("tenant_id, role, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    membership = (data as TenantMembershipRow | null) ?? null;
    tenantId = membership?.tenant_id ?? null;
  }

  if (!tenantId) {
    return {
      userId,
      email: profile.email,
      platformRole: (profile.role as WorkspaceMembershipRole | null) ?? "account_manager",
      tenant: buildSetupTenant(),
    };
  }

  const { data: tenantRow } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenantRow) {
    return null;
  }

  return {
    userId,
    email: profile.email,
    platformRole: (profile.role as WorkspaceMembershipRole | null) ?? "account_manager",
    tenant: {
      id: tenantRow.id,
      name: tenantRow.name,
      slug: tenantRow.slug,
      membershipRole: membership?.role ?? "account_manager",
      platformRole: (profile.role as WorkspaceMembershipRole | null) ?? "account_manager",
      canManage:
        profile.role === "super_admin" ||
        membership?.role === "super_admin" ||
        membership?.role === "admin" ||
        membership?.role === "account_manager",
    },
  };
}

export async function getCurrentWorkspaceContext(): Promise<WorkspaceContext | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user?.id) {
      return null;
    }

    return loadWorkspaceContext(data.user.id);
  } catch {
    return null;
  }
}

export async function getWorkspaceContextForUser(userId: string) {
  return loadWorkspaceContext(userId);
}
