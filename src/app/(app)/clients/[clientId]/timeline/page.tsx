import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="rounded-xl bg-muted/50 ring-1 ring-border/60">
            Meeting Timeline
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            {clientId}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Chronological account memory (wireframe)
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Next step: interactive timeline feed with category filters, search, expandable events,
          sentiment indicators, and linked artifacts.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">May 19 — Monthly Review</div>
            <Badge className="rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-400">
              Sentiment ↑
            </Badge>
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="text-sm text-muted-foreground">
            AI summary and action items placeholder. Attachments and transcript links will live
            here.
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Apr 22 — Growth Strategy</div>
            <Badge className="rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-400">
              Risk noted
            </Badge>
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="text-sm text-muted-foreground">
            KPI progression and commitments placeholder.
          </div>
        </Card>
      </div>
    </div>
  );
}

