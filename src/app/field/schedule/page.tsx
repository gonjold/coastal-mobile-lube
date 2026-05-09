import { getScheduleJobs } from "@/lib/jobs/queries";
import { ScheduleClient, ScheduleHeaderActions } from "@/components/field/ScheduleClient";

export const dynamic = "force-dynamic";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export default async function SchedulePage() {
  const today = todayISO();
  const startDate = shiftDate(today, -7);
  const endDate = shiftDate(today, 90);

  const jobs = await getScheduleJobs({ startDate, endDate });

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-display text-xl font-bold text-foreground">
            Schedule
          </h1>
          <ScheduleHeaderActions />
        </div>
      </header>
      <ScheduleClient initialJobs={jobs} today={today} />
    </div>
  );
}
