"use client";

/* A3f Phase 6A.7 / Phase 6A polish: mobile-only floating action button for
 * the create menu. Renders <md only — at md+ the TopBar's "New" dropdown
 * reappears. Sits bottom-right above MobileTabBar (h-16 + safe-area).
 *
 * Context-aware: on /jobs, /today, /schedule → New booking;
 * on /invoices → New invoice; on /customers → New customer. Single tap
 * opens the matching modal directly. On neutral pages (home, team,
 * services, fees, integrations) the FAB falls back to a dropdown listing
 * all three create paths so every create action stays reachable. */

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coastal/shared-ui";
import { useAdminModal } from "@/lib/AdminModalContext";

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

const fabClass =
  "h-14 w-14 rounded-full bg-[#E07B2D] text-white shadow-lg shadow-black/20 flex items-center justify-center hover:bg-[#c96a23] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform";

export function NewActionFAB() {
  const { openModal } = useAdminModal();
  const pathname = usePathname() ?? "";
  const primary = primaryActionForPath(pathname);

  return (
    <div
      className="md:hidden fixed right-4 z-40"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
    >
      {primary ? (
        <button
          type="button"
          aria-label={ACTION_LABEL[primary]}
          onClick={() => openModal(primary)}
          className={fabClass}
        >
          <Plus className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="New booking, customer, or invoice"
              className={fabClass}
            >
              <Plus className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={8}>
            <DropdownMenuItem onSelect={() => openModal("booking")}>New booking</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openModal("customer")}>New customer</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openModal("invoice")}>New invoice</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
