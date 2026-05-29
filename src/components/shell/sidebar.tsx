"use client";

import * as React from "react";
import {
  Activity,
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
import { Separator } from "@/components/ui/separator";

const clientId = "atlas-dental";

export function Sidebar({
  collapsed,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
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
          href={`/clients/${clientId}/overview`}
          label="Client Overview"
          icon={<Activity className="size-4" />}
          collapsed={collapsed}
        />
        <NavLink
          href={`/clients/${clientId}/meeting-brief`}
          label="AI Meeting Brief"
          icon={<Bot className="size-4" />}
          collapsed={collapsed}
        />
        <NavLink
          href={`/clients/${clientId}/timeline`}
          label="Meeting Timeline"
          icon={<Activity className="size-4" />}
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
