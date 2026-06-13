"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  LayoutGrid,
  PlugZap,
  ShieldAlert,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import type { AppShellData } from "@/lib/mtos-types";

export function CommandPalette({ data }: { data: AppShellData }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function run(to: string) {
    setOpen(false);
    router.push(to);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Search clients, pages, actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => run("/dashboard")}>
              <LayoutGrid className="size-4" />
              Command Center
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run("/churn")}>
              <ShieldAlert className="size-4" />
              Churn Monitoring
            </CommandItem>
            <CommandItem onSelect={() => run("/clients")}>
              <Users className="size-4" />
              Clients
            </CommandItem>
            <CommandItem onSelect={() => run("/connectors")}>
              <PlugZap className="size-4" />
              Connectors
            </CommandItem>
            <CommandItem onSelect={() => run("/connectors/clickup")}>
              <PlugZap className="size-4" />
              ClickUp Connector
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Clients">
            {data.clients.length === 0 ? (
              <CommandItem disabled>
                <Users className="size-4" />
                No clients loaded
              </CommandItem>
            ) : (
              data.clients.map((client) => (
                <CommandItem key={client.id} onSelect={() => run(client.href)}>
                  <Activity className="size-4" />
                  {client.name}
                  <CommandShortcut>{client.healthScore}</CommandShortcut>
                </CommandItem>
              ))
            )}
          </CommandGroup>
          {data.alerts.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Alerts">
                {data.alerts.slice(0, 4).map((alert) => (
                  <CommandItem key={alert.id} onSelect={() => run(alert.href)}>
                    <AlertTriangle className="size-4" />
                    {alert.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem onSelect={() => run("/settings")}>
              <SlidersHorizontal className="size-4" />
              Settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
