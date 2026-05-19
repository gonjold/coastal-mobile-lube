/* Booking helpers used by ops tech components. Copied verbatim from
 * apps/marketing/src/app/admin/shared.ts per Decision 6. */

import type { Booking } from './booking';

export function formatTimeWindow(tw?: string): string | undefined {
  if (!tw) return undefined;
  const labels: Record<string, string> = {
    "early-morning": "Early Morning (7-9)",
    "earlyMorning": "Early Morning (7-9)",
    "morning": "Morning (9-11)",
    "midday": "Midday (11-1)",
    "afternoon": "Afternoon (1-3)",
    "late-afternoon": "Late Afternoon (3-5)",
    "lateAfternoon": "Late Afternoon (3-5)",
    "late": "Late (4-6)",
  };
  return labels[tw] || tw;
}

export function getServiceLabel(b: Booking): string {
  if (b.service) return b.service;
  if (b.selectedServices?.length) {
    const names = b.selectedServices.map((s) => s.name || (s as Record<string, unknown>).label).filter(Boolean).join(", ");
    if (names) return names;
  }
  if (b.serviceCategory) return b.serviceCategory;
  return "";
}
