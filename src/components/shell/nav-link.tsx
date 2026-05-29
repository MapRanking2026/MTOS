"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function NavLink({
  href,
  label,
  icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-sm text-muted-foreground transition",
        "hover:bg-muted/60 hover:text-foreground",
        active &&
          "bg-muted/60 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:border-white/10"
      )}
    >
      <span className="grid size-8 place-items-center rounded-md bg-background/40 ring-1 ring-border/60 transition group-hover:bg-background/60">
        {icon}
      </span>
      <span className={cn("truncate", collapsed && "sr-only")}>{label}</span>
    </Link>
  );
}

