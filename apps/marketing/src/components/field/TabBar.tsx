"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, CalendarDays, Users, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { QuickCreate } from "./QuickCreate";

const tabs = [
  { href: "/field/today", label: "Today", icon: Sun },
  { href: "/field/schedule", label: "Schedule", icon: CalendarDays },
  // center "+" inserted at runtime
  { href: "/field/customers", label: "Customers", icon: Users },
  { href: "/field/more", label: "More", icon: MoreHorizontal },
] as const;

export function TabBar() {
  const pathname = usePathname() ?? "";
  const [createOpen, setCreateOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav
        aria-label="Field navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex h-[72px] max-w-screen-sm items-stretch">
          {tabs.slice(0, 2).map((tab) => (
            <TabButton key={tab.href} {...tab} active={isActive(tab.href)} />
          ))}

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            aria-label="Quick create"
            className="-mt-4 flex flex-1 items-center justify-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-background transition-transform duration-150 ease-out active:scale-95">
              <Plus className="h-6 w-6" strokeWidth={2.25} />
            </span>
          </button>

          {tabs.slice(2).map((tab) => (
            <TabButton key={tab.href} {...tab} active={isActive(tab.href)} />
          ))}
        </div>
      </nav>

      <QuickCreate open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function TabButton({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Sun;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors duration-150 ease-out",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );
}
