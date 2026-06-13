import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { upsertClickUpConnection } from "@/lib/clickup-connection";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { encryptString } from "@/lib/crypto";

type ClickUpTokenResponse = {
  access_token: string;
  token_type?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const clientId = process.env.CLICKUP_CLIENT_ID;
  const clientSecret = process.env.CLICKUP_CLIENT_SECRET;
  const redirectUri = process.env.CLICKUP_REDIRECT_URI ?? `${url.origin}/api/connectors/clickup/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "CLICKUP_CLIENT_ID / CLICKUP_CLIENT_SECRET is not configured." },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const expectedState = (await cookies()).get("cu_state")?.value;
  if (!expectedState || !state || expectedState !== state) {
    return NextResponse.json({ error: "Invalid state." }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code." }, { status: 400 });
  }

  const tokenRes = await fetch("https://api.clickup.com/api/v2/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    return NextResponse.json(
      { error: "ClickUp token exchange failed.", status: tokenRes.status, details: text },
      { status: 500 }
    );
  }

  const tokenJson = (await tokenRes.json()) as ClickUpTokenResponse;
  if (!tokenJson.access_token) {
    return NextResponse.json({ error: "ClickUp token response missing access_token." }, { status: 500 });
  }

  let accessTokenEnc: string;
  try {
    accessTokenEnc = encryptString(tokenJson.access_token);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to encrypt ClickUp access token.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  const admin = createSupabaseAdminClient();
  try {
    await upsertClickUpConnection(admin, data.user.id, {
      access_token_enc: accessTokenEnc,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to save ClickUp connection.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  const res = NextResponse.redirect(new URL("/connectors/clickup", url.origin));
  res.cookies.delete("cu_state");
  return res;
}
