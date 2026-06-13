import Link from "next/link";
import { ArrowRight, Bot, CalendarClock, ShieldAlert, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getUpcomingMeetings, getWorkspaceSnapshot } from "@/lib/mtos-data";

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const workspace = await getWorkspaceSnapshot();
  const upcomingMeetings = getUpcomingMeetings(workspace.meetings).slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-xl">
            Command Center
          </Badge>
          <Badge className="rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-border/70">
            {workspace.source === "setup" ? "Workspace setup" : "Live signals"}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          A strategic operating view of every client relationship.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {workspace.sourceMessage}
        </p>
      </div>

      {!workspace.focusClient ? (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-xl">
          <div className="text-lg font-semibold tracking-tight">Your live dashboard is ready.</div>
          <div className="mt-2 max-w-2xl text-sm text-muted-foreground">
            No demo data is shown anymore. Add or sync real clients to populate health signals,
            meetings, churn monitoring, and AI meeting briefs.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/connectors"
              className="inline-flex items-center gap-2 rounded-xl bg-sidebar-primary px-4 py-2 text-sm font-medium text-sidebar-primary-foreground"
            >
              Open Connectors <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm font-medium"
            >
              Open Settings <ArrowRight className="size-4" />
            </Link>
          </div>
        </Card>
      ) : (
        <>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-border/60">
              <Sparkles className="size-5" />
            </div>
            <Badge className="rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
              Avg health {workspace.metrics.avgHealthScore}
            </Badge>
          </div>
          <div className="mt-3 text-sm font-medium">{workspace.focusClient.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {workspace.focusClient.sentimentSummary}
          </div>
          <Separator className="my-3 bg-border/60" />
          <Link
            href={`/clients/${workspace.focusClient.slug}/overview`}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 hover:text-foreground"
          >
            Open Client Overview <ArrowRight className="size-4" />
          </Link>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20 dark:text-cyan-400">
              <Bot className="size-5" />
            </div>
            <Badge variant="secondary" className="rounded-xl">
              {workspace.metrics.meetingsNext7Days} upcoming
            </Badge>
          </div>
          <div className="mt-3 text-sm font-medium">AI Meeting Brief</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Generate a grounded brief using client health, timeline signals, opportunities, and open follow-up work.
          </div>
          <Separator className="my-3 bg-border/60" />
          <Link
            href={`/clients/${workspace.focusClient.slug}/meeting-brief`}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 hover:text-foreground"
          >
            Generate Brief <ArrowRight className="size-4" />
          </Link>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-400">
              <ShieldAlert className="size-5" />
            </div>
            <Badge className="rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-400">
              {workspace.metrics.attentionClients} accounts
            </Badge>
          </div>
          <div className="mt-3 text-sm font-medium">Churn Monitoring</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Escalations, overdue follow-ups, and retention guidance stay visible in one operating queue.
          </div>
          <Separator className="my-3 bg-border/60" />
          <Link
            href="/churn"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 hover:text-foreground"
          >
            Review Risk Queue <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Workspace KPIs</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Client health, follow-up pressure, and expansion readiness in one layer.
              </div>
            </div>
            <Badge variant="secondary" className="rounded-xl">
              Supabase-first
            </Badge>
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/60">
              <div className="text-xs text-muted-foreground">Managed clients</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">{workspace.metrics.totalClients}</div>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/60">
              <div className="text-xs text-muted-foreground">Open actions</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">{workspace.metrics.openActions}</div>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/60">
              <div className="text-xs text-muted-foreground">Overdue actions</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">{workspace.metrics.overdueActions}</div>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/60">
              <div className="text-xs text-muted-foreground">Expansion pipeline</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">
                {currency(workspace.metrics.pipelineValue)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="size-4" />
            Upcoming Meetings
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid gap-3">
            {upcomingMeetings.map((meeting) => {
              const client = workspace.clients.find((entry) => entry.id === meeting.clientId);
              return (
                <Link
                  key={meeting.id}
                  href={`/clients/${client?.slug ?? meeting.clientId}/timeline`}
                  className="rounded-xl bg-muted/25 p-3 ring-1 ring-border/60 transition hover:bg-muted/40"
                >
                  <div className="text-sm font-medium">{meeting.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {client?.name ?? "Client"} · {new Date(meeting.meetingAt).toLocaleString()}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Recommended Moves</div>
            <Badge variant="secondary" className="rounded-xl">
              AI assisted
            </Badge>
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid gap-3">
            {workspace.recommendations.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60 transition hover:bg-muted/40"
              >
                <div className="text-sm font-medium">{item.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{item.detail}</div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Attention Queue</div>
            <Badge className="rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-400">
              {workspace.alerts.length} alerts
            </Badge>
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid gap-3">
            {workspace.alerts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No active escalations right now.</div>
            ) : (
              workspace.alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className="rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60 transition hover:bg-muted/40"
                >
                  <div className="text-sm font-medium">{alert.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{alert.detail}</div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
