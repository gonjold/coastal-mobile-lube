/* ─── Field Manager dashboard helpers ──────────────────────
 * EST-anchored date utilities and slot helpers moved to
 * @coastal/shared-ui (see packages/shared-ui/src/lib/dates.ts).
 * This file retains only the marketing-local non-date helpers.
 */

const TZ = 'America/New_York';

const monthDayFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  month: 'short',
  day: 'numeric',
});

const monthDayTimeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function fmtMoney(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtRelativeTime(d: Date | undefined | null): string {
  if (!d) return '';
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 2) return 'Yesterday';
  if (diffSec < 86400 * 7) return monthDayFmt.format(d);
  return monthDayTimeFmt.format(d);
}
