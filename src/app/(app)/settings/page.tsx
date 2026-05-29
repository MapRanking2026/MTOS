import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit rounded-xl">
          Settings
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Preferences (wireframe)</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Next step: tenant preferences, keyboard shortcut reference, and personalization.
        </p>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="text-sm font-medium">Keyboard Shortcuts</div>
        <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Open command palette</span>
            <span className="rounded-lg bg-muted/40 px-2 py-1 text-xs ring-1 ring-border/60">
              Ctrl K
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

