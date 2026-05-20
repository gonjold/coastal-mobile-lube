"use client";

/* A3f Polish Round 3 Unit 3: TodayHeader now renders just the date in
 * the WO page-title scale (20/600 mobile, 24/600 lg+). The earlier
 * "X in progress, Y upcoming, Z unassigned" prose retired since the
 * Segmented status bar below it carries those counts. */

function formatToday(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function TodayHeader() {
  return (
    <h1 className="text-[20px] lg:text-2xl font-semibold tracking-tight text-[#0B2040]">
      {formatToday()}
    </h1>
  );
}
