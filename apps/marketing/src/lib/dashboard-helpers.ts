/* ─── Field Manager dashboard helpers ────────────────────── */
/* All "today" / "this week" computation in America/New_York. */

const TZ = 'America/New_York';

const dateOnlyFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const weekdayFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  weekday: 'short',
});

const longDateFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

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

/* ── Date string utilities ─────────────────────────────── */

export function dateToESTISO(d: Date): string {
  return dateOnlyFmt.format(d); // "YYYY-MM-DD"
}

export function getTodayESTISO(now: Date = new Date()): string {
  return dateOnlyFmt.format(now);
}

export function getLongDateLabel(now: Date = new Date()): string {
  return longDateFmt.format(now);
}

function dowEST(now: Date): number {
  const day = weekdayFmt.format(now);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
}

function isoAddDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function getWeekBoundsESTISO(now: Date = new Date()): {
  weekStartISO: string;
  weekEndISO: string;
} {
  const todayISO = getTodayESTISO(now);
  const dow = dowEST(now); // 0 = Sun … 6 = Sat
  const daysFromMon = (dow + 6) % 7; // 0 if Mon, 6 if Sun
  const weekStartISO = isoAddDays(todayISO, -daysFromMon);
  const weekEndISO = isoAddDays(weekStartISO, 6);
  return { weekStartISO, weekEndISO };
}

/* ── Money + relative time ─────────────────────────────── */

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

/* ── Booking hour-of-day for today's-schedule sort ────── */

const TIME_WINDOW_HOURS: Record<string, number> = {
  'early-morning': 7,
  earlyMorning: 7,
  morning: 9,
  midday: 11,
  afternoon: 13,
  'late-afternoon': 15,
  lateAfternoon: 15,
  late: 16,
};

export function bookingStartHour(b: {
  confirmedArrivalWindow?: string;
  timeWindow?: string;
}): number {
  if (b.confirmedArrivalWindow) {
    // Format examples: "8:00 - 9:00 AM", "11:00 AM - 12:00 PM", "12:00 - 1:00 PM"
    const m = b.confirmedArrivalWindow.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
    );
    if (m) {
      let h = parseInt(m[1], 10);
      const startAP = (m[3] || m[6]).toUpperCase();
      if (startAP === 'PM' && h !== 12) h += 12;
      if (startAP === 'AM' && h === 12) h = 0;
      return h;
    }
  }
  if (b.timeWindow && b.timeWindow in TIME_WINDOW_HOURS) {
    return TIME_WINDOW_HOURS[b.timeWindow];
  }
  return 99;
}

export function fmtBookingDate(dateStr?: string, now: Date = new Date()): string {
  if (!dateStr) return 'TBD';
  const todayISO = getTodayESTISO(now);
  if (dateStr === todayISO) return 'Today';
  if (dateStr === isoAddDays(todayISO, 1)) return 'Tomorrow';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return monthDayFmt.format(dt);
}

export function formatBookingTimeLabel(b: {
  confirmedArrivalWindow?: string;
  timeWindow?: string;
}): string {
  if (b.confirmedArrivalWindow) {
    return b.confirmedArrivalWindow.split(' - ')[0] || b.confirmedArrivalWindow;
  }
  if (b.timeWindow) {
    const labels: Record<string, string> = {
      'early-morning': '7:00 AM',
      earlyMorning: '7:00 AM',
      morning: '9:00 AM',
      midday: '11:00 AM',
      afternoon: '1:00 PM',
      'late-afternoon': '3:00 PM',
      lateAfternoon: '3:00 PM',
      late: '4:00 PM',
    };
    return labels[b.timeWindow] || b.timeWindow;
  }
  return 'TBD';
}
