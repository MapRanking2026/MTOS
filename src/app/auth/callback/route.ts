import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    if (role === "super_admin") {
      const { data: existing } = await admin
        .from("user_profiles")
        .select("id")
        .eq("role", "super_admin")
        .maybeSingle();

      if (!existing) {
        await admin.from("user_profiles").upsert({ id: user.id, email: user.email, role: "super_admin" });
      } else {
        await admin.from("user_profiles").upsert({ id: user.id, email: user.email });
      }
    } else {
      await admin.from("user_profiles").upsert({ id: user.id, email: user.email });
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
