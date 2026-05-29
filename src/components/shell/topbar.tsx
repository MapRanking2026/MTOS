"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Command, Menu, Search } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
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

export function Topbar({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  const [query, setQuery] = React.useState("");

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
            <span className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1 ring-1 ring-border/60">
              <Command className="size-3.5" />
              Ctrl K
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
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
              <DropdownMenuLabel>Live Alerts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/churn" className="flex flex-col items-start gap-0.5">
                  <span className="text-sm">Sentiment drop detected</span>
                  <span className="text-xs text-muted-foreground">
                    Recommend Recovery Call within 72 hours
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/clients/atlas-dental/overview"
                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="text-sm">Momentum up +18%</span>
                  <span className="text-xs text-muted-foreground">
                    Keyword refinements improved stability
                  </span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
