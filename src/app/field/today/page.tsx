import { getTodayJobs } from "@/lib/jobs/queries";
import { TodayClient } from "@/components/field/TodayClient";

export const dynamic = "force-dynamic";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function TodayPage() {
  const today = todayISO();
  const data = await getTodayJobs(today);
  return <TodayClient initial={data} />;
}
