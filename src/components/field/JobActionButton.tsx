"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobDetail } from "@/lib/jobs/queries";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const label = (s: string) => {
  switch (s) {
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
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

export function JobActionButton({ job }: { job: JobDetail }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const action = nextStateAction(job.status);

  if (!action || job.status === "cancelled") return null;

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
    <Button
      className="w-full"
      disabled={pending}
      onClick={() => transition(action.to)}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {action.label}
    </Button>
  );
}
