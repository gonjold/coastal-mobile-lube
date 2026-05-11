import Link from "next/link";
import type { ScheduleJob } from "@/lib/jobs/queries";
import { Badge } from "@coastal/shared-ui";
import { ChevronRight, MapPin } from "lucide-react";

const statusVariant = (status: string) => {
  switch (status) {
    case "in_progress":
      return "default" as const;
    case "completed":
      return "secondary" as const;
    case "cancelled":
      return "destructive" as const;
    case "confirmed":
      return "default" as const;
    case "new-lead":
      return "outline" as const;
    default:
      return "outline" as const;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
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
      return status || "—";
  }
};

export function ScheduleJobCard({ job }: { job: ScheduleJob }) {
  const assetText = job.asset.displayName ?? "No asset linked";

  return (
    <Link
      href={`/field/jobs/${job.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 ease-out active:bg-muted"
    >
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {job.scheduledWindow ?? "Anytime"}
          </span>
          <Badge variant={statusVariant(job.status)}>
            {statusLabel(job.status)}
          </Badge>
        </div>
        <span className="truncate text-sm text-foreground">
          {job.customer.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {assetText}
        </span>
        {job.customer.address && (
          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" strokeWidth={1.75} />
            {job.customer.address}
          </span>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
