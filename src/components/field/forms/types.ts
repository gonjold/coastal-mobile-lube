import type { AssetType } from "@/types";

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type AssetSummary = {
  id: string;
  customerId: string;
  type: AssetType;
  displayName: string;
  nickname?: string;
  year?: number | string | null;
  make?: string | null;
  model?: string | null;
};

/**
 * Canonical field-side time-window keys. Verified 2026-05-09 against
 * `src/components/BookingWizardModal.tsx` (the public booking flow source
 * of truth) and `formatTimeWindow` in `src/app/admin/shared.ts`. Stored
 * in Firestore on `bookings.timeWindow`; the field view layer derives
 * `scheduledWindow` via `formatTimeWindow` for human-friendly labels.
 */
export const TIME_WINDOW_OPTIONS = [
  { value: "morning", label: "Morning (7-10am)" },
  { value: "midday", label: "Midday (10am-1pm)" },
  { value: "afternoon", label: "Afternoon (1-4pm)" },
  { value: "late", label: "Late (4-6pm)" },
] as const;

export type TimeWindowKey = (typeof TIME_WINDOW_OPTIONS)[number]["value"];
