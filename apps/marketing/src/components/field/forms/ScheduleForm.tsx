"use client";

import { Input } from "@coastal/shared-ui";
import { Label } from "@coastal/shared-ui";
import { TIME_WINDOW_OPTIONS, type TimeWindowKey } from "./types";

export type ScheduleFormValues = {
  date: string; // YYYY-MM-DD
  window: TimeWindowKey | "";
};

export const EMPTY_SCHEDULE: ScheduleFormValues = {
  date: "",
  window: "",
};

export type ScheduleFormErrors = Partial<
  Record<keyof ScheduleFormValues, string>
>;

export function ScheduleForm({
  values,
  onChange,
  errors,
  disabled,
  minDate,
}: {
  values: ScheduleFormValues;
  onChange: (v: ScheduleFormValues) => void;
  errors?: ScheduleFormErrors;
  disabled?: boolean;
  minDate?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sched-date">
          Date <span className="text-destructive">*</span>
        </Label>
        <Input
          id="sched-date"
          type="date"
          min={minDate}
          disabled={disabled}
          value={values.date}
          onChange={(e) =>
            onChange({ ...values, date: e.target.value })
          }
          aria-invalid={Boolean(errors?.date) || undefined}
        />
        {errors?.date && (
          <p className="text-xs text-destructive">{errors.date}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>
          Arrival window <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {TIME_WINDOW_OPTIONS.map((opt) => {
            const active = values.window === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({ ...values, window: opt.value })
                }
                className={`h-12 rounded-md border px-3 text-sm transition-colors duration-150 ease-out ${
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {errors?.window && (
          <p className="text-xs text-destructive">{errors.window}</p>
        )}
      </div>
    </div>
  );
}

export function validateSchedule(
  v: ScheduleFormValues,
): ScheduleFormErrors | null {
  const errors: ScheduleFormErrors = {};
  if (!v.date) errors.date = "Date is required";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date))
    errors.date = "Invalid date";
  if (!v.window) errors.window = "Pick an arrival window";
  return Object.keys(errors).length === 0 ? null : errors;
}
