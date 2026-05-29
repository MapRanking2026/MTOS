import crypto from "crypto";
import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const clientId = process.env.CLICKUP_CLIENT_ID;
  const redirectUri = process.env.CLICKUP_REDIRECT_URI ?? `${url.origin}/api/connectors/clickup/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: "CLICKUP_CLIENT_ID is not configured." },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }
  if (!(await isSuperAdmin(data.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(
    `https://app.clickup.com/api?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`
  );

  res.cookies.set("cu_state", state, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return res;
}
