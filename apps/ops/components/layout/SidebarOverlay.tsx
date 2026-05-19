"use client";

/* A3f Phase 1.5: left-side sheet that surfaces the full-width sidebar with
 * labels when the icon-only Sidebar variant (Phase 1.4) is tapped at the
 * md (768-1023px) breakpoint. Auto-closes on item selection.
 *
 * Mirrors the existing Sidebar's group + row rendering so the user sees
 * the same content they get on lg+ but invoked on demand. Uses the same
 * data source the Sidebar uses (SIDEBAR_SECTIONS in Phase 1; Phase 3
 * swaps both to getSidebarGroups(role)).
 *
 * The icon-only Sidebar variant owns the open state and passes it down via
 * controlled `open` + `onOpenChange` props.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@coastal/shared-ui";
import { Wrench } from "lucide-react";
import { SIDEBAR_SECTIONS } from "@/lib/sidebarConfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SidebarOverlay({ open, onOpenChange }: Props) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="border-b border-border px-5 py-5">
          <SheetTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wrench className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold leading-tight">Coastal Ops</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Sidebar overlay navigation">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  if (item.available) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors min-h-[40px] ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
                          strokeWidth={active ? 2 : 1.75}
                          aria-hidden="true"
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              active
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-accent/15 text-accent-text"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  }
                  return (
                    <button
                      type="button"
                      disabled
                      key={item.href}
                      title={item.availableIn ? `Available in ${item.availableIn}` : undefined}
                      className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground/70 cursor-not-allowed min-h-[40px]"
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.availableIn && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                          {item.availableIn}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
