"use client";

import { Card } from "@coastal/shared-ui";

interface Props {
  view: "in-progress" | "upcoming" | "unassigned";
}

const COPY: Record<Props["view"], { title: string; body: string }> = {
  "in-progress": {
    title: "Nothing in progress",
    body: "Once a tech checks in, the job appears here.",
  },
  upcoming: {
    title: "No upcoming jobs today",
    body: "Confirmed jobs scheduled for today show up in this tab.",
  },
  unassigned: {
    title: "No unassigned jobs",
    body: "Every job today has a tech. Reassign from the job detail.",
  },
};

export default function TodayEmptyState({ view }: Props) {
  const c = COPY[view];
  return (
    <Card className="p-6 text-center text-sm text-muted-foreground lg:p-8">
      <div className="text-base font-medium text-foreground">{c.title}</div>
      <div className="mt-1">{c.body}</div>
    </Card>
  );
}
