import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ChurnPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-400">
            Churn Monitoring
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            Leadership view
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Proactive risk queue (wireframe)
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Next step: risk heatmap, alert center, and a TanStack table with severity badges and
          AI recommendations.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">High Risk</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">4</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Missed meetings + sentiment drops
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">SLA Breach</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">2</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Recovery calls needed within 72h
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">Escalations</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">1</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Lead quality concern unresolved
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">AI Alert</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Client sentiment dropped sharply after unresolved lead quality complaints.
              Recommend Recovery Call within 72 hours.
            </div>
          </div>
          <Link
            href="/clients/atlas-dental/meeting-brief"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 hover:text-foreground"
          >
            Prepare Brief <ArrowRight className="size-4" />
          </Link>
        </div>
        <Separator className="my-3 bg-border/60" />
        <div className="text-xs text-muted-foreground">
          Table and heatmap will live here.
        </div>
      </Card>
    </div>
  );
}

