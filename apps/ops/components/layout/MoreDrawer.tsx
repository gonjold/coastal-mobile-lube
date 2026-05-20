"use client";

/* A3f Phase 1.3: bottom-sheet drawer that surfaces MobileTabBar overflow
 * items. Triggered by tapping the "More" button in the 5th tab slot when
 * getDrawerItems(role).length > 0 (owner only; tech has no More because all
 * 4 nav items fit in the tab bar).
 *
 * Sign-out lives here too since the mobile flow has no other surface for
 * signing out once the desktop TopBar avatar dropdown is hidden by the
 * Phase 4 breakpoint switch.
 *
 * onOpenChange is wired to MobileTabBar's drawer state. Item clicks call
 * onOpenChange(false) explicitly to close on selection.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@coastal/shared-ui";
import { auth } from "@/lib/firebase";
import type { NavItem } from "@/lib/nav";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavItem[];
}

export function MoreDrawer({ open, onOpenChange, items }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    onOpenChange(false);
    await signOut(auth);
    router.push("/login");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader className="pb-2">
          <SheetTitle>More</SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto -mx-2 px-2 space-y-1" aria-label="More navigation">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-md px-3 py-3 min-h-[48px] hover:bg-muted active:bg-muted/80 transition-colors"
              >
                <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                <span className="text-base font-medium text-foreground">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border pt-2 -mx-2 px-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-md px-3 py-3 min-h-[48px] hover:bg-destructive/10 active:bg-destructive/20 transition-colors text-destructive"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-base font-medium">Sign out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
