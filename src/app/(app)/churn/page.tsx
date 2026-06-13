import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
import { countOverdueActions, getWorkspaceSnapshot } from "@/lib/mtos-data";

export default async function ChurnPage() {
  const workspace = await getWorkspaceSnapshot();
  const highRiskClients = workspace.clients.filter((client) => client.churnRisk >= 50);
  const overdueActions = countOverdueActions(workspace.actions);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-400">
            Churn Monitoring
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            {workspace.source === "setup" ? "Workspace setup" : "Leadership view"}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Proactive risk queue.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {workspace.sourceMessage}
        </p>
      </div>

      {workspace.clients.length === 0 ? (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-xl">
          <div className="text-lg font-semibold tracking-tight">No live churn queue yet.</div>
          <div className="mt-2 max-w-2xl text-sm text-muted-foreground">
            As soon as real clients, meetings, and signals land in Supabase, this page will show the actual retention queue instead of demo data.
          </div>
        </Card>
      ) : (
        <>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">High Risk</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{highRiskClients.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Accounts with elevated retention pressure.
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Overdue Actions</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{overdueActions}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Follow-ups that already missed their due date.
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Open Alerts</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{workspace.alerts.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Signals that need proactive communication.
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">AI Alert</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {workspace.alerts[0]?.detail ??
                "No critical retention signal is active right now. Continue monitoring action-item completion and meeting cadence."}
            </div>
          </div>
          <Link
            href={
              workspace.alerts[0]?.href ??
              `/clients/${workspace.focusClient?.slug ?? workspace.clients[0]?.slug}/meeting-brief`
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 hover:text-foreground"
          >
            Prepare Brief <ArrowRight className="size-4" />
          </Link>
        </div>
        <Separator className="my-3 bg-border/60" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Next Meeting</TableHead>
              <TableHead>Recommendation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspace.clients
              .filter((client) => client.churnRisk >= 35)
              .map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.slug}/overview`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.healthScore}</TableCell>
                  <TableCell>{client.churnRisk}%</TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.nextMeetingAt
                      ? new Date(client.nextMeetingAt).toLocaleDateString()
                      : "Schedule now"}
                  </TableCell>
                  <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                    {client.aiRecommendation}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
        </>
      )}
    </div>
  );
}
