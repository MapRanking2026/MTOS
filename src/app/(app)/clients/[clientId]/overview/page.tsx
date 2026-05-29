import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-border/70">
            Client Overview
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            {clientId}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Strategic snapshot (wireframe)
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Next step: populate this view with health score radial, sentiment badge, KPI
          snapshot cards, and the AI insight banner.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">AI Insight</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Client momentum improved significantly after recent keyword refinements. Sentiment
            has stabilized and churn probability decreased 18% over the last 30 days.
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-lg bg-muted/40 px-2 py-1 ring-1 ring-border/60">
              Confidence 0.82
            </span>
            <span className="rounded-lg bg-muted/40 px-2 py-1 ring-1 ring-border/60">
              Signals 6
            </span>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">KPI Snapshot</div>
          <div className="mt-1 text-xs text-muted-foreground">
            GBP calls, rankings movement, reviews gained, leads generated, CPL, conversion rate.
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-muted/30 px-3 py-2 ring-1 ring-border/60">
              <div className="text-[11px] text-muted-foreground">Leads</div>
              <div className="text-sm font-semibold tracking-tight">142</div>
            </div>
            <div className="rounded-xl bg-muted/30 px-3 py-2 ring-1 ring-border/60">
              <div className="text-[11px] text-muted-foreground">CPL</div>
              <div className="text-sm font-semibold tracking-tight">$38</div>
            </div>
            <div className="rounded-xl bg-muted/30 px-3 py-2 ring-1 ring-border/60">
              <div className="text-[11px] text-muted-foreground">Conv.</div>
              <div className="text-sm font-semibold tracking-tight">12.4%</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

