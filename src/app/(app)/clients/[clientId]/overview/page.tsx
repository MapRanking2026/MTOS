import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getClientOverview } from "@/lib/mtos-data";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const detail = await getClientOverview(clientId);

  if (!detail.client) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-border/70">
            Client Overview
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            {detail.client.name}
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            {detail.source === "setup" ? "Workspace setup" : detail.client.industry}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Strategic snapshot for the next client conversation.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {detail.sourceMessage}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">AI Insight</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {detail.client.executiveSummary}
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="text-sm text-muted-foreground">{detail.client.aiRecommendation}</div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Health Snapshot</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Use this scorecard to set urgency, tone, and follow-up expectations before the meeting.
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/30 px-3 py-2 ring-1 ring-border/60">
              <div className="text-[11px] text-muted-foreground">Health score</div>
              <div className="text-2xl font-semibold tracking-tight">{detail.client.healthScore}</div>
            </div>
            <div className="rounded-xl bg-muted/30 px-3 py-2 ring-1 ring-border/60">
              <div className="text-[11px] text-muted-foreground">Churn risk</div>
              <div className="text-2xl font-semibold tracking-tight">{detail.client.churnRisk}%</div>
            </div>
            <div className="rounded-xl bg-muted/30 px-3 py-2 ring-1 ring-border/60">
              <div className="text-[11px] text-muted-foreground">Monthly value</div>
              <div className="text-sm font-semibold tracking-tight">
                ${detail.client.monthlyValue.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl bg-muted/30 px-3 py-2 ring-1 ring-border/60">
              <div className="text-[11px] text-muted-foreground">Next meeting</div>
              <div className="text-sm font-semibold tracking-tight">
                {detail.client.nextMeetingAt
                  ? new Date(detail.client.nextMeetingAt).toLocaleDateString()
                  : "Unscheduled"}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Open Actions</div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid gap-3">
            {detail.actions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No open action items for this client yet.</div>
            ) : (
              detail.actions.map((action) => (
                <div key={action.id} className="rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold tracking-tight">{action.title}</div>
                    <Badge variant="secondary" className="rounded-xl">
                      {action.priority}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {action.ownerName} owns this item.
                    {action.dueAt ? ` Due ${new Date(action.dueAt).toLocaleDateString()}.` : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Signals And Opportunities</div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid gap-3">
            {detail.signals.map((signal) => (
              <div key={signal.id} className="rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold tracking-tight">{signal.label}</div>
                  <Badge variant="secondary" className="rounded-xl">
                    {signal.severity}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{signal.detail}</div>
              </div>
            ))}
            {detail.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold tracking-tight">{opportunity.title}</div>
                  <Badge className="rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300">
                    ${opportunity.value.toLocaleString()}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{opportunity.summary}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Recent Account Memory</div>
          <Badge variant="secondary" className="rounded-xl">
            {detail.timeline.length} events
          </Badge>
        </div>
        <Separator className="my-3 bg-border/60" />
        <div className="grid gap-3 md:grid-cols-2">
          {detail.timeline.slice(0, 4).map((event) => (
            <div key={event.id} className="rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold tracking-tight">{event.title}</div>
                <Badge variant="secondary" className="rounded-xl">
                  {event.badge}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{event.summary}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(event.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
