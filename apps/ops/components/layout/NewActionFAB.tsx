"use client";

/* A3f Phase 6A.7: mobile-only floating action button for the create menu.
 * Renders <md only — at md+ the TopBar's "New" dropdown reappears.
 * Sits bottom-right above MobileTabBar (h-16 + safe-area). On tap, opens
 * the same booking/customer/invoice menu the TopBar dropdown shows. */

import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coastal/shared-ui";
import { useAdminModal } from "@/lib/AdminModalContext";

export function NewActionFAB() {
  const { openModal } = useAdminModal();
  return (
    <div
      className="md:hidden fixed right-4 z-40"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="New booking, customer, or invoice"
            className="h-14 w-14 rounded-full bg-[#E07B2D] text-white shadow-lg shadow-black/20 flex items-center justify-center hover:bg-[#c96a23] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform"
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
    </div>
  );
}
