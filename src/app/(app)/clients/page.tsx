import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  countOverdueActions,
  getNextMeetingForClient,
  getWorkspaceSnapshot,
} from "@/lib/mtos-data";

function StatusBadge({ status }: { status: "active" | "paused" | "canceled" }) {
  if (status === "active") {
    return (
      <Badge className="rounded-xl bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/25 dark:text-blue-300">
        Active
      </Badge>
    );
  }
  if (status === "paused") {
    return (
      <Badge className="rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300">
        Paused
      </Badge>
    );
  }
  return (
    <Badge className="rounded-xl bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/25 dark:text-rose-300">
      Canceled
    </Badge>
  );
}

export default async function ClientsPage() {
  const workspace = await getWorkspaceSnapshot();

  const clientStats = workspace.clients.map((client) => {
    const actions = workspace.actions.filter((action) => action.clientId === client.id);
    const upcomingMeeting = getNextMeetingForClient(workspace.meetings, client.id);

    return {
      ...client,
      openActions: actions.filter((action) => action.status !== "done").length,
      overdueActions: countOverdueActions(actions),
      nextMeetingAt: upcomingMeeting?.meetingAt ?? client.nextMeetingAt,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-border/70">
            Clients
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            {workspace.source === "setup" ? "Live workspace" : "Assigned to you"}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Client accounts, health signals, and next actions.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {workspace.sourceMessage}
        </p>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Client Accounts</div>
          <Badge variant="secondary" className="rounded-xl">
            {clientStats.length}
          </Badge>
        </div>
        <Separator className="my-3 bg-border/60" />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Open Actions</TableHead>
              <TableHead>Next Meeting</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No live clients yet. Connect a data source or add client records to populate this dashboard.
                </TableCell>
              </TableRow>
            ) : (
              clientStats.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.slug}/overview`} className="hover:underline">
                      {client.name}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">{client.industry}</div>
                  </TableCell>
                  <TableCell>{client.healthScore}</TableCell>
                  <TableCell className="text-muted-foreground">{client.churnRisk}%</TableCell>
                  <TableCell>
                    <StatusBadge status={client.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.openActions}
                    {client.overdueActions > 0 ? ` (${client.overdueActions} overdue)` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.nextMeetingAt ? new Date(client.nextMeetingAt).toLocaleString() : "Not scheduled"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
