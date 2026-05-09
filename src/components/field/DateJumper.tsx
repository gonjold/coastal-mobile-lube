"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  today: string;
  availableDays: string[];
  onJump: (date: string) => void;
};

function startOfMonth(iso: string): Date {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DateJumper({
  open,
  onOpenChange,
  today,
  availableDays,
  onJump,
}: Props) {
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(today));

  // Reset to today's month each time the dialog opens.
  useEffect(() => {
    if (open) setViewMonth(startOfMonth(today));
  }, [open, today]);

  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstWeekday = viewMonth.getDay();

  const availableSet = new Set(availableDays);

  const cells: Array<{ iso: string; day: number } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoFromDate(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d),
    );
    cells.push({ iso, day: d });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Jump to date</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() =>
              setViewMonth(
                new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{monthLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() =>
              setViewMonth(
                new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="py-1 font-semibold">
              {d}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const isToday = cell.iso === today;
            const hasJobs = availableSet.has(cell.iso);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onJump(cell.iso)}
                className={`relative flex h-9 items-center justify-center rounded-md text-sm transition-colors duration-150 ease-out ${
                  isToday
                    ? "bg-primary text-primary-foreground font-semibold"
                    : hasJobs
                      ? "bg-muted text-foreground hover:bg-muted/80"
                      : "text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {cell.day}
                {hasJobs && !isToday && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={() => onJump(today)}
        >
          Jump to today
        </Button>
      </DialogContent>
    </Dialog>
  );
}
