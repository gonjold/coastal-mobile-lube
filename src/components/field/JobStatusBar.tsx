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

// Customer-first pinned bar: occupies the top of the viewport (replaces
// the FieldPageHeader on /field/jobs/*). position:fixed not sticky for
// iOS Safari URL-bar resilience. h-20 fits two truncating text lines.
export function JobStatusBar({ job }: { job: JobDetail }) {
  const customerName = job.customer.name?.trim() || "Customer";
  const assetDesc = job.asset.displayName?.trim() ?? null;
  const dateShort = formatHeaderDate(job.scheduledDate);
  const timeSlot = job.scheduledWindow ?? "Anytime";
  const detailLine = assetDesc
    ? `${assetDesc} · ${dateShort} · ${timeSlot}`
    : `${dateShort} · ${timeSlot}`;

  return (
    <header
      data-job-status-bar
      className="fixed inset-x-0 top-0 z-40 flex h-20 items-center gap-3 border-b border-border bg-background px-4"
    >
      <Link
        href="/field/today"
        aria-label="Back"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out active:bg-muted"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate font-display text-base font-semibold leading-tight text-foreground">
          {customerName}
        </h1>
        <p className="truncate text-sm leading-tight text-muted-foreground">
          {detailLine}
        </p>
      </div>
      <Badge variant={variant(job.status)} className="shrink-0">
        {label(job.status)}
      </Badge>
    </header>
  );
}
