import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildWorkspaceName(email: string) {
  const prefix = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "MTOS";
  return `${prefix.replace(/\b\w/g, (char) => char.toUpperCase())} Workspace`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/dashboard";

  const supabase = await createSupabaseServerClient();
  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({
          type: type as "magiclink" | "email",
          token_hash: tokenHash,
        })
      : { data: null, error: new Error("Missing auth callback parameters.") };

  if (error) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const user = data?.user;
  if (user?.email) {
    const admin = createSupabaseAdminClient();

    const superEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
    const role = superEmail && user.email.toLowerCase() === superEmail ? "super_admin" : "account_manager";
    let effectiveRole: "super_admin" | "admin" | "account_manager" | "client" = "account_manager";

    if (role === "super_admin") {
      const { data: existing } = await admin
        .from("user_profiles")
        .select("id")
        .eq("role", "super_admin")
        .maybeSingle();

      if (!existing) {
        await admin.from("user_profiles").upsert({ id: user.id, email: user.email, role: "super_admin" });
        effectiveRole = "super_admin";
      } else {
        await admin.from("user_profiles").upsert({ id: user.id, email: user.email });
        effectiveRole = "account_manager";
      }
    } else {
      await admin.from("user_profiles").upsert({ id: user.id, email: user.email });
      effectiveRole = "account_manager";
    }

    const { data: profile } = await admin
      .from("user_profiles")
      .select("default_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    const { data: existingMembership } = await admin
      .from("tenant_memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let tenantId = profile?.default_tenant_id ?? existingMembership?.tenant_id ?? null;

    if (!tenantId) {
      const workspaceName = buildWorkspaceName(user.email);
      const workspaceSlug = `${slugify(workspaceName)}-${user.id.slice(0, 8)}`;
      const { data: tenant, error: tenantError } = await admin
        .from("tenants")
        .insert({
          name: workspaceName,
          slug: workspaceSlug,
          created_by: user.id,
        })
        .select("id, name")
        .single();

      if (!tenantError && tenant) {
        tenantId = tenant.id;
        const membershipRole = effectiveRole === "super_admin" ? "admin" : effectiveRole;
        await admin.from("tenant_memberships").upsert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: membershipRole,
        });
        await admin.from("tenant_settings").upsert({
          tenant_id: tenant.id,
          brand_name: tenant.name,
          support_email: user.email,
        });
      }
    } else {
      const membershipRole = effectiveRole === "super_admin" ? "admin" : effectiveRole;
      await admin.from("tenant_memberships").upsert({
        tenant_id: tenantId,
        user_id: user.id,
        role: membershipRole,
      });
    }

    if (tenantId) {
      await admin
        .from("user_profiles")
        .update({ default_tenant_id: tenantId })
        .eq("id", user.id);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
