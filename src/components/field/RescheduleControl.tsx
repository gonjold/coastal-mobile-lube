"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ScheduleForm,
  validateSchedule,
  type ScheduleFormValues,
} from "@/components/field/forms/ScheduleForm";
import type { JobDetail } from "@/lib/jobs/queries";
import type { TimeWindowKey } from "@/components/field/forms/types";

const RESCHEDULABLE = new Set(["confirmed", "in_progress"]);

const KNOWN_KEYS: TimeWindowKey[] = ["morning", "midday", "afternoon", "late"];

function inferWindowKey(raw: string | null): TimeWindowKey | "" {
  if (!raw) return "";
  const k = raw.toLowerCase();
  if ((KNOWN_KEYS as string[]).includes(k)) return k as TimeWindowKey;
  if (k.startsWith("morning")) return "morning";
  if (k.startsWith("midday")) return "midday";
  if (k.startsWith("afternoon")) return "afternoon";
  if (k.startsWith("late")) return "late";
  return "";
}

export function RescheduleControl({ job }: { job: JobDetail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<ScheduleFormValues>({
    date: job.scheduledDate,
    window: inferWindowKey(job.scheduledWindow ?? null),
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateSchedule>>(
    null,
  );

  if (!RESCHEDULABLE.has(job.status)) return null;

  function reset() {
    setValues({
      date: job.scheduledDate,
      window: inferWindowKey(job.scheduledWindow ?? null),
    });
    setErrors(null);
  }

  async function save() {
    if (pending) return;
    const e = validateSchedule(values);
    if (e) {
      setErrors(e);
      return;
    }
    setErrors(null);
    setPending(true);
    try {
      const res = await fetch(`/api/field/jobs/${job.id}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: values.date,
          timeWindow: values.window,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      toast.success("Booking rescheduled");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {/* Pill rendered at the top of the scroll area in page.tsx, below the
          fixed JobStatusBar and before JobActionButton — owns its horizontal
          padding so the wrapper page can render it as a JobSheet sibling. */}
      <div className="px-4 pt-2">
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="inline-flex h-8 w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/40 active:bg-muted"
        >
          <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.75} />
          Reschedule
        </button>
      </div>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Reschedule booking</SheetTitle>
            <SheetDescription>
              Pick a new date and arrival window.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <ScheduleForm
              values={values}
              onChange={setValues}
              errors={errors ?? {}}
              disabled={pending}
            />
          </div>
          <SheetFooter className="flex-row gap-2 px-4 pb-4">
            <Button
              variant="outline"
              className="flex-1"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={pending}
              onClick={save}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
