"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Status = {
  connected: boolean;
  configured?: boolean;
  teamId?: string | null;
  listId?: string | null;
  lastSyncAt?: string | null;
  oauthReady?: boolean;
  oauthError?: string | null;
};

type ClickUpListOption = {
  id: string;
  name: string;
  spaceName: string;
  folderName: string | null;
};

export function ClickUpConnectorClient({
  initialStatus,
}: {
  initialStatus: Status;
}) {
  const [status, setStatus] = React.useState<Status>(initialStatus);
  const [teamId, setTeamId] = React.useState(initialStatus.teamId ?? "");
  const [listId, setListId] = React.useState(initialStatus.listId ?? "");
  const [availableLists, setAvailableLists] = React.useState<ClickUpListOption[]>([]);
  const [apiToken, setApiToken] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function refresh() {
    const res = await fetch("/api/connectors/clickup/status");
    const json = (await res.json()) as Status;
    setStatus(json);
    setTeamId(json.teamId ?? "");
    setListId(json.listId ?? "");
  }

  async function connect() {
    if (status.oauthReady === false) {
      toast.error(status.oauthError ?? "ClickUp OAuth is not configured correctly yet.");
      return;
    }

    window.location.href = "/api/connectors/clickup/start";
  }

  async function saveApiToken() {
    setBusy(true);
    try {
      const res = await fetch("/api/connectors/clickup/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: apiToken }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("ClickUp API token saved.");
      setApiToken("");
      await refresh();
    } catch (err) {
      const raw =
        err && typeof err === "object" && "message" in err ? String((err as { message?: unknown }).message) : "";
      let message = raw || "Failed to save ClickUp API token.";
      try {
        const json = JSON.parse(raw) as { error?: unknown; details?: unknown };
        if (json?.error) {
          message = String(json.error);
          if (json.details) {
            message = `${message} ${String(json.details)}`;
          }
        }
      } catch {}
      toast.error(message.slice(0, 260));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/connectors/clickup/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, listId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("ClickUp configuration saved.");
      await refresh();
    } catch {
      toast.error("Failed to save configuration.");
    } finally {
      setBusy(false);
    }
  }

  async function sync() {
    setBusy(true);
    try {
      const res = await fetch("/api/connectors/clickup/sync", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Synced ClickUp clients.");
      await refresh();
    } catch {
      toast.error("Sync failed.");
    } finally {
      setBusy(false);
    }
  }

  async function registerWebhook() {
    setBusy(true);
    try {
      const res = await fetch("/api/connectors/clickup/webhook/register", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Webhook registered.");
      await refresh();
    } catch (err) {
      const raw =
        err && typeof err === "object" && "message" in err ? String((err as { message?: unknown }).message) : "";
      let message = raw || "Webhook registration failed.";
      try {
        const json = JSON.parse(raw) as { error?: unknown; details?: unknown };
        if (json?.error) {
          message = String(json.error);
          if (json.details) {
            message = `${message} ${String(json.details)}`;
          }
        }
      } catch {}
      toast.error(message.slice(0, 260));
    } finally {
      setBusy(false);
    }
  }

  async function detectTeamId() {
    setBusy(true);
    try {
      const res = await fetch("/api/connectors/clickup/teams");
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { teams?: Array<{ id?: string | number; name?: string }> };
      const teams = json.teams ?? [];
      if (teams.length === 1 && teams[0]?.id != null) {
        setTeamId(String(teams[0].id));
        toast.success(`Workspace detected: ${teams[0].name ?? teams[0].id}`);
      } else if (teams.length > 1) {
        toast.message("Multiple workspaces found. Pick the correct teamId from ClickUp.");
      } else {
        toast.error("No workspaces found for this ClickUp user.");
      }
    } catch {
      toast.error("Failed to detect workspace.");
    } finally {
      setBusy(false);
    }
  }

  async function detectLists() {
    if (!teamId) {
      toast.error("Detect or enter a teamId before loading ClickUp lists.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/connectors/clickup/lists?teamId=${encodeURIComponent(teamId)}`);
      if (!res.ok) throw new Error(await res.text());

      const json = (await res.json()) as { lists?: ClickUpListOption[] };
      const lists = json.lists ?? [];
      setAvailableLists(lists);

      if (lists.length === 0) {
        toast.error("No ClickUp lists were found for this workspace.");
        return;
      }

      const matchingCurrent = lists.find((entry) => entry.id === listId);
      if (!matchingCurrent) {
        setListId(lists[0].id);
      }

      if (lists.length === 1) {
        toast.success(`Loaded 1 ClickUp list: ${lists[0].name}`);
      } else {
        toast.success(`Loaded ${lists.length} ClickUp lists.`);
      }
    } catch {
      toast.error("Failed to load ClickUp lists.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-border/70">
            ClickUp
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            Connector
          </Badge>
          {status.connected ? (
            <Badge className="rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300">
              Connected
            </Badge>
          ) : (
            <Badge className="rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300">
              Not connected
            </Badge>
          )}
          {status.lastSyncAt ? (
            <Badge variant="secondary" className="rounded-xl">
              Last sync {new Date(status.lastSyncAt).toLocaleString()}
            </Badge>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sync client accounts from ClickUp.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Each MTOS user connects their own ClickUp account. Client routing uses the ClickUp
          Account Manager field and matches it to the MTOS user’s first name.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Connect</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Authorize your own ClickUp account for this MTOS user.
          </div>
          {status.oauthError ? (
            <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
              {status.oauthError}
            </div>
          ) : null}
          <Separator className="my-3 bg-border/60" />
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-xl"
              onClick={connect}
              disabled={busy || status.oauthReady === false}
            >
              Connect ClickUp
            </Button>
            <Button variant="secondary" className="rounded-xl" onClick={refresh} disabled={busy}>
              Refresh status
            </Button>
          </div>
          <div className="mt-3 grid gap-2">
            <div className="text-xs text-muted-foreground">
              Prefer not to use OAuth? Paste a ClickUp Personal API Token for your own account.
            </div>
            <Input
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="ClickUp Personal API Token"
              type="password"
              className="h-10 rounded-xl bg-muted/30 ring-1 ring-border/60"
              disabled={busy}
            />
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={saveApiToken}
              disabled={busy || !apiToken}
            >
              Save API token
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Configure</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Detect your ClickUp workspace, load available lists, and save the settings for your own
            MTOS user.
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid gap-2">
            <Input
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="teamId (workspace id)"
              className="h-10 rounded-xl bg-muted/30 ring-1 ring-border/60"
              disabled={busy}
            />
            <Input
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              placeholder="listId"
              className="h-10 rounded-xl bg-muted/30 ring-1 ring-border/60"
              disabled={busy}
            />
            {availableLists.length > 0 ? (
              <Select value={listId} onValueChange={setListId} disabled={busy}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/30 ring-1 ring-border/60">
                  <SelectValue placeholder="Select a ClickUp list" />
                </SelectTrigger>
                <SelectContent>
                  {availableLists.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.spaceName}
                      {entry.folderName ? ` / ${entry.folderName}` : ""}
                      {` / ${entry.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button className="rounded-xl" onClick={save} disabled={busy || !teamId || !listId}>
                Save
              </Button>
              <Button variant="secondary" className="rounded-xl" onClick={detectTeamId} disabled={busy}>
                Detect teamId
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={detectLists}
                disabled={busy || !teamId}
              >
                Detect lists
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={sync}
                disabled={busy || !status.connected || !status.configured}
              >
                Sync now
              </Button>
              <Button variant="secondary" className="rounded-xl" onClick={registerWebhook} disabled={busy}>
                Enable auto-sync
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {availableLists.length > 0
                ? `Loaded ${availableLists.length} lists for this workspace. `
                : "Load lists from ClickUp or paste a listId manually. "}
              Review your assigned clients in{" "}
              <Link className="text-foreground underline underline-offset-4" href="/clients">
                Clients
              </Link>
              .
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
