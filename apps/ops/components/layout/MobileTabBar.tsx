"use client";

/* A3f Phase 1.2: fixed-bottom tab bar for mobile (<768px). Hidden at md+.
 * Renders the 4 primary tabs from getTabBarItems(role) plus a "More" button
 * when getDrawerItems(role) is non-empty (owner: 6 overflow items; tech: 0
 * so the More slot is hidden and the bar shows exactly 4 tabs).
 *
 * Active-state detection mirrors the existing Sidebar: a tab is active when
 * pathname === item.href OR pathname starts with item.href + "/" (so the
 * Jobs tab stays highlighted when the user is on /jobs/123).
 *
 * Touch targets per WO §SUCCESS-CRITERIA item 10: 56px min via
 * min-w-[56px] min-h-[56px]. Safe-area inset handled via paddingBottom
 * (iPhone notch + home indicator).
 *
 * Not yet wired into apps/ops/app/(app)/layout.tsx in Phase 1; Phase 4
 * adds <MobileTabBar /> there alongside the breakpoint switch for the
 * sidebar variants. Component compiles and renders blank in Phase 1.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { getTabBarItems, getDrawerItems } from "@/lib/nav";
import { MoreDrawer } from "./MoreDrawer";

export function MobileTabBar() {
  const { role } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabs = getTabBarItems(role);
  const drawerItems = getDrawerItems(role);

  if (tabs.length === 0) return null;

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary mobile navigation"
      >
        <div className="flex h-16 items-stretch justify-around px-2">
          {tabs.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[56px] rounded-md transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
          {drawerItems.length > 0 && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open more navigation"
              aria-expanded={drawerOpen}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[56px] rounded-md text-muted-foreground hover:text-foreground active:text-foreground transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              <span className="text-[10px] font-medium leading-tight">More</span>
            </button>
          )}
        </div>
      </nav>
      {drawerItems.length > 0 && (
        <MoreDrawer open={drawerOpen} onOpenChange={setDrawerOpen} items={drawerItems} />
      )}
    </>
  );
}
