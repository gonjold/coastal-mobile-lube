"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BookingDoc } from "@/lib/queries/bookings";
import {
  partitionToday,
  subscribeTodayJobs,
  type TodayView,
} from "@/lib/queries/today";
import TodayHeader from "@/components/today/TodayHeader";
import TodayJobCard from "@/components/today/TodayJobCard";
import TodayEmptyState from "@/components/today/TodayEmptyState";
import { Segmented, type SegmentedItem } from "@/components/ui/Segmented";

const SEGMENT_ITEMS: SegmentedItem<TodayView>[] = [
  { key: "in-progress", label: "In Progress" },
  { key: "upcoming", label: "Upcoming" },
  { key: "unassigned", label: "Unassigned" },
];

function isView(v: string | null): v is TodayView {
  return v === "in-progress" || v === "upcoming" || v === "unassigned";
}

function TodayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<BookingDoc[] | null>(null);

  useEffect(() => {
    const unsub = subscribeTodayJobs(setJobs);
    return () => {
      unsub();
    };
  }, []);

  const partitions = useMemo(
    () => (jobs ? partitionToday(jobs) : null),
    [jobs],
  );

  const requested = searchParams.get("view");
  const defaultView: TodayView =
    partitions && partitions["in-progress"].length > 0 ? "in-progress" : "upcoming";
  const view: TodayView = isView(requested) ? requested : defaultView;

  function switchView(next: TodayView) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.replace(`/today?${params.toString()}`);
  }

  const counts: Record<TodayView, number> = {
    "in-progress": partitions?.["in-progress"].length ?? 0,
    upcoming: partitions?.upcoming.length ?? 0,
    unassigned: partitions?.unassigned.length ?? 0,
  };

  const rows = partitions?.[view] ?? [];

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <TodayHeader />

      {/* A3f Polish Round 3 Unit 3: three big In-Progress/Upcoming/
          Unassigned buttons replaced by the unified Segmented bar so the
          status filter sits on one compact row and never wraps. */}
      <Segmented<TodayView>
        ariaLabel="Today status filter"
        items={SEGMENT_ITEMS.map((it) => ({ ...it, count: counts[it.key] }))}
        value={view}
        onChange={switchView}
      />

      {!partitions ? (
        <div className="text-sm text-muted-foreground">Loading today's jobs…</div>
      ) : rows.length === 0 ? (
        <TodayEmptyState view={view} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          {rows.map((b) => (
            <TodayJobCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <TodayPageInner />
    </Suspense>
  );
}
