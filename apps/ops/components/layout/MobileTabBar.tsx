"use client";

/* A3f Phase 1.2 / Round 3 Unit 6: fixed-bottom tab bar for mobile (<768px).
 * Hidden at md+. Renders the primary tabs from getTabBarItems(role) plus a
 * "More" button when getDrawerItems(role) is non-empty.
 *
 * Owner / admin layout (Unit 6):
 *   Today, Schedule, [center create +], Jobs, More
 *   - 3 primary tabs around an elevated 54px orange + button that opens
 *     the same create flow the desktop TopBar "New" dropdown drives
 *     (booking / customer / invoice). The button is context-aware on
 *     /jobs, /today, /schedule, /invoices, /customers (single tap opens
 *     the matching modal); on neutral routes it falls back to a dropdown.
 *   - The center button replaces the floating NewActionFAB on owner/admin
 *     so there is only one create affordance on those roles.
 *
 * Tech layout: Today, Schedule, Customers, Jobs (4 primary tabs, no center
 * button, no drawer; tech has no overflow items in TECH_NAV).
 *
 * Active-state detection mirrors the existing Sidebar: a tab is active when
 * pathname === item.href OR pathname starts with item.href + "/".
 *
 * Touch targets per WO §SUCCESS-CRITERIA item 10: 56px min via
 * min-w-[56px] min-h-[56px]. Safe-area inset handled via paddingBottom.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coastal/shared-ui";
import { useAuth } from "@/lib/useAuth";
import { useAdminModal } from "@/lib/AdminModalContext";
import { getTabBarItems, getDrawerItems } from "@/lib/nav";
import { MoreDrawer } from "./MoreDrawer";

type PrimaryAction = "booking" | "customer" | "invoice";

function primaryActionForPath(pathname: string): PrimaryAction | null {
  if (pathname.startsWith("/jobs")) return "booking";
  if (pathname.startsWith("/today")) return "booking";
  if (pathname.startsWith("/schedule")) return "booking";
  if (pathname.startsWith("/invoices")) return "invoice";
  if (pathname.startsWith("/customers")) return "customer";
  return null;
}

const ACTION_LABEL: Record<PrimaryAction, string> = {
  booking: "New booking",
  customer: "New customer",
  invoice: "New invoice",
};

const centerBtnClass =
  "h-[54px] w-[54px] rounded-full bg-[#E07B2D] text-white flex items-center justify-center shadow-[0_6px_16px_rgba(224,123,45,0.45)] ring-4 ring-[#FAF7F2] hover:bg-[#c96a23] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E07B2D]/60 transition-transform";

function CenterCreateButton() {
  const { openModal } = useAdminModal();
  const pathname = usePathname() ?? "";
  const primary = primaryActionForPath(pathname);

  const button = (
    <button
      type="button"
      aria-label={primary ? ACTION_LABEL[primary] : "New booking, customer, or invoice"}
      onClick={primary ? () => openModal(primary) : undefined}
      className={centerBtnClass}
    >
      <Plus className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
    </button>
  );

  return (
    <div className="flex flex-1 items-start justify-center" style={{ marginTop: -20 }}>
      {primary ? (
        button
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" sideOffset={12}>
            <DropdownMenuItem onSelect={() => openModal("booking")}>New booking</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openModal("customer")}>New customer</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openModal("invoice")}>New invoice</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function MobileTabBar() {
  const { role } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabs = getTabBarItems(role);
  const drawerItems = getDrawerItems(role);
  const showCenter = role === "owner" || role === "admin_only";
  const centerInsertIndex = showCenter ? 2 : -1;

  if (tabs.length === 0) return null;

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary mobile navigation"
      >
        <div className="flex h-16 items-stretch justify-around px-2">
          {tabs.map((item, idx) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Fragment key={item.href}>
                {idx === centerInsertIndex && <CenterCreateButton />}
                <Link
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
              </Fragment>
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
