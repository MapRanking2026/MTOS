"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  LayoutGrid,
  PlugZap,
  ShieldAlert,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/brand-mark";
import { NavLink } from "@/components/shell/nav-link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AppShellData } from "@/lib/mtos-types";

export function Sidebar({
  collapsed,
  className,
  data,
}: {
  collapsed?: boolean;
  className?: string;
  data: AppShellData;
}) {
  const featuredClient = data.clients[0];

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar/60 backdrop-blur-xl",
        "border-r border-sidebar-border/60",
        className
      )}
    >
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="grid size-9 place-items-center rounded-xl bg-sidebar-primary/12 text-sidebar-primary ring-1 ring-sidebar-border/70">
          <Bot className="size-4" />
        </div>
        <div className={cn("min-w-0", collapsed && "sr-only")}>
          <div className="flex items-center gap-2">
            <BrandMark />
          </div>
          <div className="truncate text-xs text-muted-foreground">Monthly Touch OS</div>
        </div>
      </div>

      <Separator className="bg-sidebar-border/60" />

      <div className="flex flex-col gap-1 px-2 py-3">
        <NavLink
          href="/dashboard"
          label="Command Center"
          icon={<LayoutGrid className="size-4" />}
          collapsed={collapsed}
        />
        <NavLink
          href="/churn"
          label="Churn Monitoring"
          icon={<ShieldAlert className="size-4" />}
          collapsed={collapsed}
        />
        <NavLink
          href="/clients"
          label="Clients"
          icon={<Users className="size-4" />}
          collapsed={collapsed}
        />
        <NavLink
          href="/connectors"
          label="Connectors"
          icon={<PlugZap className="size-4" />}
          collapsed={collapsed}
        />
      </div>

      {!collapsed && featuredClient ? (
        <>
          <Separator className="bg-sidebar-border/60" />
          <div className="px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Focus Client
              </div>
              <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[10px]">
                {data.source === "setup" ? "Setup" : "Live"}
              </Badge>
            </div>
            <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 p-3">
              <div className="text-sm font-medium">{featuredClient.name}</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Health {featuredClient.healthScore}</span>
                <span>Risk {featuredClient.churnRisk}%</span>
              </div>
              <div className="mt-3 grid gap-1.5">
                <NavLink
                  href={featuredClient.href}
                  label="Client Overview"
                  icon={<Activity className="size-4" />}
                  collapsed={false}
                />
                <NavLink
                  href={featuredClient.href.replace("/overview", "/meeting-brief")}
                  label="AI Meeting Brief"
                  icon={<Bot className="size-4" />}
                  collapsed={false}
                />
                <NavLink
                  href={featuredClient.href.replace("/overview", "/timeline")}
                  label="Meeting Timeline"
                  icon={<Activity className="size-4" />}
                  collapsed={false}
                />
              </div>
            </div>
          </div>
        </>
      ) : null}

      {!collapsed && data.alerts.length > 0 ? (
        <>
          <Separator className="bg-sidebar-border/60" />
          <div className="px-3 py-3">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Watchlist
            </div>
            <div className="grid gap-2">
              {data.alerts.slice(0, 3).map((alert) => (
                <a
                  key={alert.id}
                  href={alert.href}
                  className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 p-3 text-sm transition hover:bg-sidebar-accent/50"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{alert.title}</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">{alert.detail}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-auto px-2 pb-3">
        <NavLink
          href="/settings"
          label="Settings"
          icon={<SlidersHorizontal className="size-4" />}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
