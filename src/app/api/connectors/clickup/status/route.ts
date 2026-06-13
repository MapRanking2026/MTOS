import { NextResponse } from "next/server";

import { getClickUpConnection } from "@/lib/clickup-connection";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getClickUpOAuthConfig() {
  const clientId = process.env.CLICKUP_CLIENT_ID?.trim();
  const clientSecret = process.env.CLICKUP_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return {
      ready: false,
      error: "Add your ClickUp OAuth client ID and secret in .env.local before connecting.",
    };
  }

  if (clientId.includes(".apps.googleusercontent.com") || clientSecret.startsWith("GOCSPX-")) {
    return {
      ready: false,
      error:
        "ClickUp OAuth is misconfigured. Replace the Google OAuth values in CLICKUP_CLIENT_ID and CLICKUP_CLIENT_SECRET with your ClickUp app credentials.",
    };
  }

  if (clientId.includes("@")) {
    return {
      ready: false,
      error:
        "ClickUp OAuth is misconfigured. CLICKUP_CLIENT_ID looks like an email address instead of a ClickUp app client ID.",
    };
  }

  return { ready: true, error: null };
}

export async function GET() {
  const oauth = getClickUpOAuthConfig();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json(
      { connected: false, configured: false, oauthReady: oauth.ready, oauthError: oauth.error },
      { status: 401 }
    );
  }

  const admin = createSupabaseAdminClient();
  const conn = await getClickUpConnection(admin, data.user.id);

  return NextResponse.json({
    connected: Boolean(conn?.access_token_enc),
    configured: Boolean(conn?.team_id && conn?.list_id),
    teamId: conn?.team_id ?? null,
    listId: conn?.list_id ?? null,
    lastSyncAt: conn?.last_sync_at ?? null,
    oauthReady: oauth.ready,
    oauthError: oauth.error,
  });
}
