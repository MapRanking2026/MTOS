"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Command, LogOut, Menu, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import type { AppShellData } from "@/lib/mtos-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function Topbar({
  onOpenSidebar,
  data,
}: {
  onOpenSidebar: () => void;
  data: AppShellData;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function signOut() {
    setLoggingOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast.success("Signed out.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="sticky top-0 z-40">
      <div className="pointer-events-none absolute inset-0 bg-background/70 backdrop-blur-xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border/60" />

      <div className="relative flex h-14 items-center gap-3 px-3 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl md:hidden"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>

        <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
          <Link href="/dashboard" className="shrink-0">
            <BrandMark />
          </Link>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, signals, meetings…"
              className="h-9 rounded-xl bg-muted/40 pl-9 shadow-none ring-1 ring-border/60 focus-visible:ring-2"
            />
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="rounded-xl">
              {data.source === "setup" ? "Workspace Setup" : data.tenant.name}
            </Badge>
            <span className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1 ring-1 ring-border/60">
              <Command className="size-3.5" />
              Ctrl K
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <Button variant="ghost" size="icon" className="rounded-xl" asChild>
            <Link href="/settings" aria-label="Open settings">
              <SlidersHorizontal className="size-4" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Sign out"
            onClick={signOut}
            disabled={loggingOut}
          >
            <LogOut className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Alerts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {data.alerts.length === 0 ? (
                <DropdownMenuItem disabled>No alerts right now.</DropdownMenuItem>
              ) : (
                data.alerts.map((alert) => (
                  <DropdownMenuItem key={alert.id} asChild>
                    <Link href={alert.href} className="flex flex-col items-start gap-0.5">
                      <span className="text-sm">{alert.title}</span>
                      <span className="text-xs text-muted-foreground">{alert.detail}</span>
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
