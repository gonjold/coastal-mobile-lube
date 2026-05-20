"use client";

/* A3f Phase 6A.7 / Polish Round 3 Unit 2 + Unit 6: mobile-only floating
 * action button for the create menu. Renders below md only; at md+ the
 * TopBar "New" dropdown reappears. Sits bottom-right above MobileTabBar.
 *
 * Round 3 Unit 6: owner / admin_only now use the elevated center create
 * button inside MobileTabBar, so the floating FAB returns null for those
 * roles to avoid two competing create affordances. Tech still relies on
 * this FAB as the mobile create entry point.
 *
 * Context-aware: /jobs, /today, /schedule open New booking; /invoices
 * opens New invoice; /customers opens New customer. Single tap on a
 * scoped route opens the matching modal directly. On neutral pages it
 * falls back to a dropdown so every create action stays reachable.
 *
 * Round 3 size + shadow per WO: 48px circle, shadow
 * 0 4px 12px rgba(224,123,45,0.40), white plus glyph.
 *
 * Round 3 scroll-hide: tracks window scrollY. Hide on scroll-down
 * (delta > 6 and total > 80), show on scroll-up. Translate-y + opacity
 * transition so the FAB slides off-screen toward the tab bar and back. */

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coastal/shared-ui";
import { useAuth } from "@/lib/useAuth";
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
  "h-12 w-12 rounded-full bg-[#E07B2D] text-white shadow-[0_4px_12px_rgba(224,123,45,0.40)] flex items-center justify-center hover:bg-[#c96a23] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E07B2D]/60 focus-visible:ring-offset-2 transition-transform";

function useScrollHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (y < 80) {
          setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6) {
          setHidden(false);
        }
        lastY.current = y;
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}

export function NewActionFAB() {
  const { role } = useAuth();
  const { openModal } = useAdminModal();
  const pathname = usePathname() ?? "";
  const primary = primaryActionForPath(pathname);
  const hidden = useScrollHidden();

  // Owner / admin use the elevated center button in MobileTabBar instead.
  if (role !== "tech") return null;

  return (
    <div
      aria-hidden={hidden}
      className={`md:hidden fixed right-4 z-40 transition-[transform,opacity] duration-200 ease-out ${
        hidden ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
    >
      {primary ? (
        <button
          type="button"
          aria-label={ACTION_LABEL[primary]}
          onClick={() => openModal(primary)}
          className={fabClass}
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="New booking, customer, or invoice"
              className={fabClass}
            >
              <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
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
