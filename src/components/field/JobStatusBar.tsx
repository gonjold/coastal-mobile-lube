import Link from "next/link";
import type { JobDetail } from "@/lib/jobs/queries";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";

const variant = (s: string) => {
  switch (s) {
    case "in_progress":
    case "confirmed":
      return "default" as const;
    case "completed":
      return "secondary" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

const label = (s: string) => {
  switch (s) {
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "scheduled":
      return "Scheduled";
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Pending";
    case "new-lead":
      return "New lead";
    default:
      return s || "—";
  }
};

function formatHeaderDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Fixed at top:56 — directly under the field-layout's fixed page header.
// position:fixed (not sticky) because iOS Safari URL-bar reflow during
// scroll breaks the sticky containing block.
export function JobStatusBar({ job }: { job: JobDetail }) {
  return (
    <header
      data-job-status-bar
      className="fixed inset-x-0 top-14 z-30 flex h-14 items-center gap-2 border-b border-border bg-background px-4"
    >
      <Link
        href="/field/today"
        aria-label="Back"
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out active:bg-muted"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="flex-1 truncate font-display text-base font-bold leading-tight">
        {formatHeaderDate(job.scheduledDate)} ·{" "}
        {job.scheduledWindow ?? "Anytime"}
      </h1>
      <Badge variant={variant(job.status)}>{label(job.status)}</Badge>
    </header>
  );
}
