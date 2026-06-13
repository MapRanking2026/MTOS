"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkspaceMemberRecord, WorkspaceMembershipRole } from "@/lib/mtos-types";

type Props = {
  currentUserId: string | null;
  members: WorkspaceMemberRecord[];
  canManage: boolean;
};

const ROLE_OPTIONS: WorkspaceMembershipRole[] = ["admin", "account_manager", "client"];

export function WorkspaceMembersManager({ currentUserId, members: initialMembers, canManage }: Props) {
  const [members, setMembers] = React.useState(initialMembers);
  const [draftRoles, setDraftRoles] = React.useState<Record<string, WorkspaceMembershipRole>>(() =>
    Object.fromEntries(initialMembers.map((member) => [member.userId, member.role]))
  );
  const [savingUserId, setSavingUserId] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  async function saveRole(userId: string) {
    const role = draftRoles[userId];
    if (!role) {
      return;
    }

    setSavingUserId(userId);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/admin/workspace/members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role }),
      });

      const json = (await response.json()) as { error?: string; role?: WorkspaceMembershipRole };
      if (!response.ok) {
        setStatusMessage(json.error ?? "Failed to update member role.");
        return;
      }

      setMembers((current) =>
        current.map((member) => (member.userId === userId ? { ...member, role } : member))
      );
      setStatusMessage("Workspace member updated.");
    } catch {
      setStatusMessage("Network error while updating member role.");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="grid gap-3">
      {members.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No live memberships found yet. Sign in again after running the latest migration to bootstrap your workspace membership.
        </div>
      ) : (
        members.map((member) => {
          const isSelf = currentUserId === member.userId;
          const draftRole = draftRoles[member.userId] ?? member.role;
          const roleChanged = draftRole !== member.role;

          return (
            <div
              key={member.userId}
              className="flex flex-col gap-3 rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <div className="text-sm font-medium">{member.email}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                  {member.isDefaultWorkspace ? " · default workspace" : ""}
                  {isSelf ? " · you" : ""}
                </div>
              </div>

              {canManage ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={draftRole}
                    onValueChange={(value) =>
                      setDraftRoles((current) => ({
                        ...current,
                        [member.userId]: value as WorkspaceMembershipRole,
                      }))
                    }
                    disabled={isSelf || savingUserId === member.userId}
                  >
                    <SelectTrigger className="w-[190px] rounded-xl bg-background/60">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => saveRole(member.userId)}
                    disabled={isSelf || !roleChanged || savingUserId === member.userId}
                  >
                    {savingUserId === member.userId ? "Saving..." : "Save role"}
                  </Button>
                </div>
              ) : (
                <Badge className="w-fit rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-border/70">
                  {member.role.replaceAll("_", " ")}
                </Badge>
              )}
            </div>
          );
        })
      )}

      {statusMessage ? <div className="text-sm text-muted-foreground">{statusMessage}</div> : null}
    </div>
  );
}
