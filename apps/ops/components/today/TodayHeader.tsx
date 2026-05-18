"use client";

import { Card } from "@coastal/shared-ui";

interface Props {
  inProgressCount: number;
  upcomingCount: number;
  unassignedCount: number;
}

function formatToday(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function TodayHeader({
  inProgressCount,
  upcomingCount,
  unassignedCount,
}: Props) {
  return (
    <Card className="flex flex-col gap-2 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground lg:text-2xl">
          {formatToday()}
        </h1>
        <p className="text-sm text-muted-foreground">
          {inProgressCount} in progress, {upcomingCount} upcoming,{" "}
          {unassignedCount} unassigned.
        </p>
      </div>
    </Card>
  );
}
