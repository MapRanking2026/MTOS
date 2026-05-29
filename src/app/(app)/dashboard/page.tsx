import Link from "next/link";
import { ArrowRight, Bot, ShieldAlert, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const clientId = "atlas-dental";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-xl">
            Command Center
          </Badge>
          <Badge className="rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-border/70">
            Live signals
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          A strategic operating view of every client relationship.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          This is the AI-native control surface. Jump into a client, run a meeting brief,
          or review churn risk and escalation triggers.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-border/60">
              <Sparkles className="size-5" />
            </div>
            <Badge className="rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
              Momentum +18%
            </Badge>
          </div>
          <div className="mt-3 text-sm font-medium">Atlas Dental</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Sentiment stabilized after keyword refinements. Churn probability trending down.
          </div>
          <Separator className="my-3 bg-border/60" />
          <Link
            href={`/clients/${clientId}/overview`}
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
              Next meeting
            </Badge>
          </div>
          <div className="mt-3 text-sm font-medium">AI Meeting Brief</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Executive summary, wins, risks, talking points, and upsell opportunities—ready in
            one view.
          </div>
          <Separator className="my-3 bg-border/60" />
          <Link
            href={`/clients/${clientId}/meeting-brief`}
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
              3 alerts
            </Badge>
          </div>
          <div className="mt-3 text-sm font-medium">Churn Monitoring</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Risk heatmap, priority queues, and AI recommendations for proactive intervention.
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
    </div>
  );
}

