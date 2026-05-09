function formatDayLabel(date: string, today: string): string {
  if (date === today) return "Today";
  const [yd, md, dd] = date.split("-").map(Number);
  const [yt, mt, dt] = today.split("-").map(Number);
  const d = new Date(yd, md - 1, dd);
  const t = new Date(yt, mt - 1, dt);
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function ScheduleDayHeader({
  date,
  today,
  count,
}: {
  date: string;
  today: string;
  count: number;
}) {
  const isPast = date < today;
  return (
    <div
      data-schedule-day-header
      data-day={date}
      className={`sticky top-14 z-20 flex items-baseline justify-between border-y border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
        isPast ? "text-muted-foreground" : "text-foreground"
      }`}
    >
      <span>{formatDayLabel(date, today)}</span>
      <span className="text-muted-foreground">
        {count} {count === 1 ? "job" : "jobs"}
      </span>
    </div>
  );
}
