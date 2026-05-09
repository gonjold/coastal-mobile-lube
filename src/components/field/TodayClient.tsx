"use client";

import type { TodayJobs } from "@/lib/jobs/queries";
import { TodayCard } from "./TodayCard";
import { CalendarCheck, Sun } from "lucide-react";

export function TodayClient({ initial }: { initial: TodayJobs }) {
  return (
    <div className="flex flex-col gap-6 p-4">
      <Section
        title="In progress"
        emptyIcon={<Sun className="h-10 w-10 text-muted-foreground/50" />}
        emptyText="Nothing in progress right now."
      >
        {initial.inProgress.map((job) => (
          <TodayCard key={job.id} job={job} mode="in-progress" />
        ))}
      </Section>

      <Section
        title="Upcoming today"
        emptyIcon={
          <CalendarCheck className="h-10 w-10 text-muted-foreground/50" />
        }
        emptyText="No more jobs today. Nice work."
      >
        {initial.upcoming.map((job) => (
          <TodayCard key={job.id} job={job} mode="upcoming" />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  emptyIcon,
  emptyText,
  children,
}: {
  title: string;
  emptyIcon: React.ReactNode;
  emptyText: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const hasItems = arr.filter(Boolean).length > 0;

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {hasItems ? (
        <div className="flex flex-col gap-2">{children}</div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
          {emptyIcon}
          <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
        </div>
      )}
    </section>
  );
}
