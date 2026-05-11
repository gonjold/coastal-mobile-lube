"use client";

import { usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Button } from "@coastal/shared-ui";

// position:fixed (not sticky) because iOS Safari's URL-bar reflow during
// scroll breaks the sticky containing block, dropping the header out of
// place. Owned here so every field route shares one bar.
const TITLES: Record<string, string> = {
  "/field/today": "Today",
  "/field/schedule": "Schedule",
  "/field/customers": "Customers",
  "/field/more": "More",
};

export function FieldPageHeader() {
  const pathname = usePathname() ?? "";
  const title = TITLES[pathname] ?? "";
  const isSchedule = pathname === "/field/schedule";

  return (
    <header
      data-field-page-header
      className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4"
    >
      <h1 className="font-display text-xl font-bold text-foreground">
        {title}
      </h1>
      {isSchedule && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Jump to date"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("schedule:open-jumper"))
          }
        >
          <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
        </Button>
      )}
    </header>
  );
}
