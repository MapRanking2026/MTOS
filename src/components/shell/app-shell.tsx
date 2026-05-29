"use client";

import * as React from "react";

import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CommandPalette } from "@/components/shell/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="relative flex min-h-full w-full">
      <div className="hidden w-72 shrink-0 md:block">
        <Sidebar className="fixed inset-y-0 left-0 w-72" />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <Sidebar className="h-full w-full" />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="relative min-h-[calc(100vh-3.5rem)] flex-1 px-3 py-6 md:px-6">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_-10%,oklch(0.75_0.12_200_/_0.25),transparent_55%),radial-gradient(900px_circle_at_80%_0%,oklch(0.7_0.1_290_/_0.18),transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(0.145_0_0_/_0.55))] dark:bg-[linear-gradient(to_bottom,transparent,oklch(0.145_0_0_/_0.75))]" />
          </div>
          {children}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}

