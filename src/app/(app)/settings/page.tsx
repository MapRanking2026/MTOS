import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WorkspaceMembersManager } from "@/components/settings/workspace-members-manager";
import { getWorkspaceAdminSnapshot } from "@/lib/mtos-data";

export default async function SettingsPage() {
  const workspace = await getWorkspaceAdminSnapshot();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit rounded-xl">
          Settings
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Operator preferences and workspace readiness.</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {workspace.sourceMessage}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Workspace Health</div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Data source</span>
              <span className="rounded-lg bg-muted/40 px-2 py-1 text-xs ring-1 ring-border/60">
                {workspace.source === "setup" ? "Workspace setup" : "Supabase live"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Workspace</span>
              <span>{workspace.tenant.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Workspace slug</span>
              <span>{workspace.tenant.slug}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Your access</span>
              <span>{workspace.tenant.membershipRole.replaceAll("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tracked clients</span>
              <span>{workspace.metrics.totalClients}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Open actions</span>
              <span>{workspace.metrics.openActions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Upcoming meetings</span>
              <span>{workspace.metrics.meetingsNext7Days}</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Keyboard Shortcuts</div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Open command palette</span>
              <span className="rounded-lg bg-muted/40 px-2 py-1 text-xs ring-1 ring-border/60">
                Ctrl K
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Review churn queue</span>
              <span className="rounded-lg bg-muted/40 px-2 py-1 text-xs ring-1 ring-border/60">
                /churn
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Prepare meeting brief</span>
              <span className="rounded-lg bg-muted/40 px-2 py-1 text-xs ring-1 ring-border/60">
                Client → Brief
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Workspace Members</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Tenant memberships are now the foundation for future white-label, admin, and connector isolation work.
            </div>
          </div>
          <Badge variant="secondary" className="rounded-xl">
            {workspace.members.length} member{workspace.members.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <Separator className="my-3 bg-border/60" />
        <div className="grid gap-3">
          <WorkspaceMembersManager
            currentUserId={workspace.currentUserId}
            members={workspace.members}
            canManage={workspace.tenant.canManage}
          />
        </div>
      </Card>
    </div>
  );
}
