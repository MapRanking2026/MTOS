"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bot,
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

const clientId = "atlas-dental";

export function CommandPalette() {
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
            <CommandItem onSelect={() => run(`/clients/${clientId}/overview`)}>
              <Activity className="size-4" />
              Client Overview
            </CommandItem>
            <CommandItem onSelect={() => run(`/clients/${clientId}/meeting-brief`)}>
              <Bot className="size-4" />
              AI Meeting Brief
            </CommandItem>
            <CommandItem onSelect={() => run(`/clients/${clientId}/timeline`)}>
              <Activity className="size-4" />
              Meeting Timeline
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
