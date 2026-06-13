import { cookies } from "next/headers";

import { ClickUpConnectorClient } from "@/components/connectors/clickup-connector-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ClickUpConnectorPage() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.getUser();

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/connectors/clickup/status`, {
    headers: {
      cookie: (await cookies())
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; "),
    },
    cache: "no-store",
  });

  const status = (await res.json()) as {
    connected: boolean;
    configured: boolean;
    teamId: string | null;
    listId: string | null;
    lastSyncAt: string | null;
    oauthReady?: boolean;
    oauthError?: string | null;
  };

  return (
    <ClickUpConnectorClient
      initialStatus={{
        connected: Boolean(status.connected),
        configured: Boolean(status.configured),
        teamId: status.teamId ?? null,
        listId: status.listId ?? null,
        lastSyncAt: status.lastSyncAt ?? null,
        oauthReady: status.oauthReady ?? true,
        oauthError: status.oauthError ?? null,
      }}
    />
  );
}
