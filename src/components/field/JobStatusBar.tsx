"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { JobDetail } from "@/lib/jobs/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const variant = (s: string) => {
  switch (s) {
    case "in_progress":
    case "confirmed":
      return "default" as const;
    case "completed":
      return "secondary" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

const label = (s: string) => {
  switch (s) {
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "scheduled":
      return "Scheduled";
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Pending";
    case "new-lead":
      return "New lead";
    default:
      return s || "—";
  }
};

const nextStateAction = (status: string) => {
  switch (status) {
    case "pending":
    case "confirmed":
    case "scheduled":
      return { to: "in_progress", label: "Start job" };
    case "in_progress":
      return { to: "completed", label: "Mark complete" };
    case "completed":
      return { to: "in_progress", label: "Re-open" };
    default:
      return null;
  }
};

function formatHeaderDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function JobStatusBar({ job }: { job: JobDetail }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const action = nextStateAction(job.status);

  async function transition(to: string) {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/field/jobs/${job.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || `HTTP ${res.status}`);
      }
      toast.success(`Job ${label(to).toLowerCase()}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2 px-4 py-3">
        <Link
          href="/field/today"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out active:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex flex-1 flex-col">
          <h1 className="font-display text-lg font-bold leading-tight">
            {formatHeaderDate(job.scheduledDate)} ·{" "}
            {job.scheduledWindow ?? "Anytime"}
          </h1>
          <Badge variant={variant(job.status)} className="mt-1 self-start">
            {label(job.status)}
          </Badge>
        </div>
      </div>
      {action && job.status !== "cancelled" && (
        <div className="px-4 pb-3">
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => transition(action.to)}
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {action.label}
          </Button>
        </div>
      )}
    </header>
  );
}
