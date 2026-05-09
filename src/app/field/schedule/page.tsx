import { getScheduleJobs } from "@/lib/jobs/queries";
import { ScheduleClient } from "@/components/field/ScheduleClient";

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

  return <ScheduleClient initialJobs={jobs} today={today} />;
}
