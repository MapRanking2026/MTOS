import { NextResponse } from "next/server";

import { getClickUpConnection } from "@/lib/clickup-connection";
import { decryptString } from "@/lib/crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ClickUpSpace = {
  id: string | number;
  name: string;
};

type ClickUpFolder = {
  id: string | number;
  name: string;
};

type ClickUpList = {
  id: string | number;
  name: string;
};

type ClickUpListSummary = {
  id: string;
  name: string;
  spaceName: string;
  folderName: string | null;
};

async function fetchClickUpJson<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`https://api.clickup.com/api/v2${path}`, {
    headers: { Authorization: accessToken },
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`${res.status}:${details}`);
  }

  return (await res.json()) as T;
}

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const conn = await getClickUpConnection(admin, data.user.id);

  if (!conn?.access_token_enc) {
    return NextResponse.json({ error: "ClickUp is not connected." }, { status: 400 });
  }

  const url = new URL(req.url);
  const teamId = url.searchParams.get("teamId")?.trim() || conn.team_id?.trim();
  if (!teamId) {
    return NextResponse.json({ error: "teamId is required before loading lists." }, { status: 400 });
  }

  const accessToken = decryptString(conn.access_token_enc);

  try {
    const { spaces } = await fetchClickUpJson<{ spaces?: ClickUpSpace[] }>(
      `/team/${encodeURIComponent(teamId)}/space?archived=false`,
      accessToken
    );

    const summaries: ClickUpListSummary[] = [];

    await Promise.all(
      (spaces ?? []).map(async (space) => {
        const spaceId = String(space.id);
        const [spaceListsPayload, foldersPayload] = await Promise.all([
          fetchClickUpJson<{ lists?: ClickUpList[] }>(
            `/space/${encodeURIComponent(spaceId)}/list?archived=false`,
            accessToken
          ),
          fetchClickUpJson<{ folders?: ClickUpFolder[] }>(
            `/space/${encodeURIComponent(spaceId)}/folder?archived=false`,
            accessToken
          ),
        ]);

        for (const list of spaceListsPayload.lists ?? []) {
          summaries.push({
            id: String(list.id),
            name: list.name,
            spaceName: space.name,
            folderName: null,
          });
        }

        await Promise.all(
          (foldersPayload.folders ?? []).map(async (folder) => {
            const { lists } = await fetchClickUpJson<{ lists?: ClickUpList[] }>(
              `/folder/${encodeURIComponent(String(folder.id))}/list?archived=false`,
              accessToken
            );

            for (const list of lists ?? []) {
              summaries.push({
                id: String(list.id),
                name: list.name,
                spaceName: space.name,
                folderName: folder.name,
              });
            }
          })
        );
      })
    );

    const uniqueLists = Array.from(
      new Map(summaries.map((entry) => [entry.id, entry])).values()
    ).sort((a, b) => {
      const scopeA = `${a.spaceName} ${a.folderName ?? ""} ${a.name}`;
      const scopeB = `${b.spaceName} ${b.folderName ?? ""} ${b.name}`;
      return scopeA.localeCompare(scopeB);
    });

    return NextResponse.json({ teamId, lists: uniqueLists });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ClickUp lists error.";
    return NextResponse.json(
      { error: "Failed to fetch ClickUp lists.", details: message },
      { status: 500 }
    );
  }
}
