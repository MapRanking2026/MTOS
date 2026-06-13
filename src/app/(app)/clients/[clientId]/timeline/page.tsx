import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getClientOverview } from "@/lib/mtos-data";

export default async function TimelinePage({
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
          <Badge className="rounded-xl bg-muted/50 ring-1 ring-border/60">
            Meeting Timeline
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            {detail.client.name}
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            {detail.timeline.length} events
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Chronological account memory.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {detail.sourceMessage}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {detail.timeline.map((event) => (
          <Card key={event.id} className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{event.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
              <Badge
                className={
                  event.tone === "positive"
                    ? "rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-400"
                    : event.tone === "warning"
                      ? "rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-400"
                      : "rounded-xl bg-muted/50 ring-1 ring-border/60"
                }
              >
                {event.badge}
              </Badge>
            </div>
            <Separator className="my-3 bg-border/60" />
            <div className="text-sm text-muted-foreground">{event.summary}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
