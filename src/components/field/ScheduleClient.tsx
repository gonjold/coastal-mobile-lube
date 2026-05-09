"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ScheduleJob } from "@/lib/jobs/queries";
import { ScheduleDayHeader } from "./ScheduleDayHeader";
import { ScheduleJobCard } from "./ScheduleJobCard";
import { DateJumper } from "./DateJumper";
import { TodayAnchor } from "./TodayAnchor";
import { CalendarDays } from "lucide-react";

type Props = {
  initialJobs: ScheduleJob[];
  today: string;
};

const OPEN_JUMPER_EVENT = "schedule:open-jumper";

function groupByDate(jobs: ScheduleJob[]): Map<string, ScheduleJob[]> {
  const m = new Map<string, ScheduleJob[]>();
  for (const job of jobs) {
    const key = job.scheduledDate;
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(job);
  }
  return m;
}

export function ScheduleClient({ initialJobs, today }: Props) {
  const [jumperOpen, setJumperOpen] = useState(false);
  const dayRefs = useRef(new Map<string, HTMLElement>());
  const todayRef = useRef<HTMLElement | null>(null);

  const grouped = useMemo(() => groupByDate(initialJobs), [initialJobs]);
  const days = useMemo(() => [...grouped.keys()].sort(), [grouped]);

  // Scroll to today on mount (or nearest day after if today is empty)
  useEffect(() => {
    const direct = dayRefs.current.get(today);
    if (direct) {
      direct.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    const nextDay = days.find((d) => d >= today);
    if (nextDay) {
      dayRefs.current.get(nextDay)?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    }
  }, [today, days]);

  // Header-action button dispatches a custom event that opens the jumper.
  useEffect(() => {
    const handler = () => setJumperOpen(true);
    window.addEventListener(OPEN_JUMPER_EVENT, handler);
    return () => window.removeEventListener(OPEN_JUMPER_EVENT, handler);
  }, []);

  function jumpTo(date: string) {
    setJumperOpen(false);
    const el = dayRefs.current.get(date);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const next = days.find((d) => d >= date);
    if (next) {
      dayRefs.current
        .get(next)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <>
      <div className="relative">
        {days.length === 0 ? (
          <EmptyState />
        ) : (
          days.map((date) => {
            const jobs = grouped.get(date)!;
            return (
              <section
                key={date}
                ref={(el) => {
                  if (el) {
                    dayRefs.current.set(date, el);
                    if (date === today) todayRef.current = el;
                  }
                }}
                aria-label={date}
              >
                <ScheduleDayHeader
                  date={date}
                  today={today}
                  count={jobs.length}
                />
                <div className="divide-y divide-border">
                  {jobs.map((job) => (
                    <ScheduleJobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      <TodayAnchor todayRef={todayRef} />

      <DateJumper
        open={jumperOpen}
        onOpenChange={setJumperOpen}
        today={today}
        availableDays={days}
        onJump={jumpTo}
      />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">No jobs scheduled</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        New bookings will show up here.
      </p>
    </div>
  );
}
