import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { Button } from "@/components/ui/button";

const providers = [
  { id: "google", name: "Google Suite", desc: "GBP, Ads, GSC, GA4, Drive, Gmail, Calendar" },
  { id: "gohighlevel", name: "GoHighLevel", desc: "Calls, missed calls, lead quality signals" },
  { id: "clickup", name: "ClickUp", desc: "Tasks and client context", href: "/connectors/clickup" },
  { id: "mapranking", name: "Map Ranking", desc: "Rank tracker, heatmaps, scan comparisons" },
] as const;

export default function ConnectorsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-border/70">
            Connectors
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            Automation layer
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect the systems that power each monthly touch.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          This page becomes the single “connect + sync + verify” surface. For now, it’s wired
          for server endpoints and will show connection status once credentials are configured.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {providers.map((p) => (
          <Card
            key={p.id}
            className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold tracking-tight">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{p.desc}</div>
              </div>
              <Badge variant="secondary" className="rounded-xl">
                Not connected
              </Badge>
            </div>
            <Separator className="my-3 bg-border/60" />
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl" asChild>
                <a href={"href" in p ? p.href : `/api/connectors/${p.id}/start`}>Connect</a>
              </Button>
              <Button variant="secondary" className="rounded-xl" asChild>
                <a href={`/api/connectors/${p.id}/status`}>Check status</a>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
