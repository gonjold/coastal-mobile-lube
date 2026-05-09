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
  const [y, m, d] = today.split("-").map(Number);
  const niceDate = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background px-4 py-3">
        <h1 className="font-display text-xl font-bold text-foreground">
          Today
        </h1>
        <p className="text-xs text-muted-foreground">{niceDate}</p>
      </header>
      <TodayClient initial={data} />
    </div>
  );
}
