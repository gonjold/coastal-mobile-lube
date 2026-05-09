import Link from "next/link";
import type { ScheduleJob } from "@/lib/jobs/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckInButton } from "./CheckInButton";
import { Phone, MapPin, ChevronRight } from "lucide-react";

const statusVariant = (status: string) => {
  switch (status) {
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

const statusLabel = (status: string) => {
  switch (status) {
    case "in_progress":
      return "In progress";
    case "scheduled":
      return "Scheduled";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Pending";
    default:
      return status || "—";
  }
};

export function TodayCard({
  job,
  mode,
}: {
  job: ScheduleJob;
  mode: "in-progress" | "upcoming";
}) {
  const assetText = job.asset.displayName ?? "No asset linked";

  return (
    <Card>
      <CardContent className="p-4">
        <Link
          href={`/field/jobs/${job.id}`}
          className="flex items-start gap-3"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {job.scheduledWindow ?? "Anytime"}
              </span>
              <Badge variant={statusVariant(job.status)}>
                {statusLabel(job.status)}
              </Badge>
            </div>
            <span className="font-display text-base font-semibold">
              {job.customer.name}
            </span>
            <span className="text-sm text-muted-foreground">{assetText}</span>
            {job.customer.address && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" strokeWidth={1.75} />
                {job.customer.address}
              </span>
            )}
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>

        {mode === "upcoming" && (
          <div className="mt-3 flex items-stretch gap-2 border-t border-border pt-3">
            <CheckInButton jobId={job.id} />
            {job.customer.phone && (
              <a
                href={`tel:${job.customer.phone}`}
                className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold text-foreground transition-colors duration-150 ease-out active:bg-muted"
                aria-label="Call customer"
              >
                <Phone className="h-4 w-4" strokeWidth={1.75} /> Call
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
