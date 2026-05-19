"use client";

/* A3f Phase 1.4: Sidebar accepts a `variant` prop ('full' | 'icon', default
 * 'full') so Phase 4 can mount two instances at different breakpoints:
 *
 * - 'full' (default): 240px wide column with section headers + icon + label
 *   rows + ⌘K footer. Unchanged from the pre-A3f behavior.
 * - 'icon': 72px wide column with icon-only rows. Each row is a button
 *   that opens the SidebarOverlay (Phase 1.5), where the user picks a
 *   labeled destination. Hover tooltip surfaces the label inline for
 *   discoverability at the md breakpoint (768-1023px).
 *
 * Data source intentionally stays on SIDEBAR_SECTIONS for Phase 1. Phase
 * 3 swaps to getSidebarGroups(role) for role-based filtering. Likewise,
 * the default-export Sidebar() wrapper keeps the existing
 * `hidden md:flex w-60` aside so the existing (app) layout call site sees
 * zero visual change in Phase 1; Phase 4 introduces variant-specific
 * breakpoint visibility classes.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wrench } from "lucide-react";
import {
  Kbd,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@coastal/shared-ui";
import { SIDEBAR_SECTIONS, type SidebarItem as SidebarItemType } from "@/lib/sidebarConfig";
import { useLayout } from "./ClientLayoutProvider";
import { SidebarOverlay } from "./SidebarOverlay";

type SidebarVariant = "full" | "icon";

export function SidebarContent({ variant = "full" }: { variant?: SidebarVariant } = {}) {
  const pathname = usePathname();
  const { setMobileSidebarOpen } = useLayout();
  const [overlayOpen, setOverlayOpen] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <div className="flex h-full flex-col bg-card border-r border-border w-[72px] items-center">
          <button
            type="button"
            onClick={() => setOverlayOpen(true)}
            aria-label="Expand navigation"
            className="w-12 h-12 my-3 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Wrench className="w-5 h-5 text-primary-foreground" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <TooltipProvider delayDuration={150}>
            <nav className="flex-1 w-full py-2 px-2 space-y-1 overflow-y-auto" aria-label="Icon navigation">
              {SIDEBAR_SECTIONS.flatMap((section) => section.items).map((item) => {
                const Icon = item.icon;
                const active =
                  item.available &&
                  (pathname === item.href || pathname.startsWith(`${item.href}/`));
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setOverlayOpen(true)}
                        disabled={!item.available}
                        aria-label={item.label}
                        className={`w-12 h-12 mx-auto rounded-md flex items-center justify-center transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : item.available
                              ? "text-foreground hover:bg-muted"
                              : "text-muted-foreground/50 cursor-not-allowed"
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </TooltipProvider>
        </div>
        <SidebarOverlay open={overlayOpen} onOpenChange={setOverlayOpen} />
      </>
    );
  }

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Coastal Ops</div>
            <div className="text-[11px] text-muted-foreground leading-tight">Owner</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarRow
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  onNavigate={() => setMobileSidebarOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            Press <Kbd>⌘K</Kbd>
          </span>
          <span>v0.A3a</span>
        </div>
      </div>
    </div>
  );
}

function SidebarRow({
  item,
  active,
  onNavigate,
}: {
  item: SidebarItemType;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const baseClasses =
    "w-full px-3 py-1.5 rounded-md flex items-center gap-2 text-sm text-left transition-colors";
  const activeClasses = active
    ? "bg-primary text-primary-foreground"
    : "text-foreground hover:bg-muted";

  if (item.available) {
    return (
      <Link href={item.href} className={`${baseClasses} ${activeClasses}`} onClick={onNavigate}>
        <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-accent/15 text-accent-text"
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
      title={item.availableIn ? `Available in ${item.availableIn}` : undefined}
      className={`${baseClasses} text-muted-foreground/70 cursor-not-allowed`}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
      <span className="flex-1">{item.label}</span>
      {item.availableIn && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
          {item.availableIn}
        </span>
      )}
    </button>
  );
}

interface SidebarProps {
  variant?: SidebarVariant;
  className?: string;
}

/** Default aside wrapper. When called without props (existing layout.tsx
 * call site), renders the unchanged `hidden md:flex w-60` full sidebar
 * at md+ breakpoints. Phase 4 introduces breakpoint-specific call sites
 * via the `className` override (e.g. `hidden md:flex lg:hidden` for the
 * icon variant). */
export function Sidebar({ variant = "full", className }: SidebarProps = {}) {
  const widthClass = variant === "icon" ? "w-[72px]" : "w-60";
  const defaultVisibility = "hidden md:flex";
  return (
    <aside className={`${className ?? defaultVisibility} ${widthClass} min-h-screen shrink-0`}>
      <SidebarContent variant={variant} />
    </aside>
  );
}
