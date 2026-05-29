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
import { createSupabaseServerClient } from "@/lib/supabase/server";

function StatusBadge({ status }: { status: "active" | "paused" | "canceled" }) {
  if (status === "active") {
    return (
      <Badge className="rounded-xl bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/25 dark:text-blue-300">
        Active
      </Badge>
    );
  }
  if (status === "paused") {
    return (
      <Badge className="rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300">
        Paused
      </Badge>
    );
  }
  return (
    <Badge className="rounded-xl bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/25 dark:text-rose-300">
      Canceled
    </Badge>
  );
}

export default async function ClientsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const userId = data.user?.id ?? "";
  const { data: clients } = await supabase
    .from("clients")
    .select("id,name,status,clickup_task_id,updated_at")
    .eq("account_manager_user_id", userId)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-border/70">
            Clients
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            Assigned to you
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Your client list (synced from ClickUp).
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Active, paused, and canceled clients update based on ClickUp task status and assignee.
        </p>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Client Accounts</div>
          <Badge variant="secondary" className="rounded-xl">
            {clients?.length ?? 0}
          </Badge>
        </div>
        <Separator className="my-3 bg-border/60" />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ClickUp Task</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(clients ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No clients yet. Connect ClickUp and run a sync.
                </TableCell>
              </TableRow>
            ) : (
              (clients ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.clickup_task_id ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.updated_at ? new Date(c.updated_at).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

