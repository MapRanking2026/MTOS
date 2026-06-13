import crypto from "crypto";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getClickUpOAuthConfig() {
  const clientId = process.env.CLICKUP_CLIENT_ID?.trim();
  const clientSecret = process.env.CLICKUP_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return {
      ready: false,
      clientId: null,
      error: "ClickUp OAuth is not configured. Add CLICKUP_CLIENT_ID and CLICKUP_CLIENT_SECRET to .env.local.",
    };
  }

  if (clientId.includes(".apps.googleusercontent.com") || clientSecret.startsWith("GOCSPX-")) {
    return {
      ready: false,
      clientId: null,
      error:
        "ClickUp OAuth is misconfigured. Replace the Google OAuth values in CLICKUP_CLIENT_ID and CLICKUP_CLIENT_SECRET with your ClickUp app credentials.",
    };
  }

  if (clientId.includes("@")) {
    return {
      ready: false,
      clientId: null,
      error:
        "ClickUp OAuth is misconfigured. CLICKUP_CLIENT_ID looks like an email address instead of a ClickUp app client ID.",
    };
  }

  return { ready: true, clientId, error: null };
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const oauth = getClickUpOAuthConfig();
  const redirectUri = process.env.CLICKUP_REDIRECT_URI ?? `${url.origin}/api/connectors/clickup/callback`;

  if (!oauth.ready || !oauth.clientId) {
    return NextResponse.json({ error: oauth.error }, { status: 500 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(
    `https://app.clickup.com/api?client_id=${encodeURIComponent(
      oauth.clientId
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
