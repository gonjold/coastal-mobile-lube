'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Badge, Button, statusBadgeVariant } from '@coastal/shared-ui';
import {
  formatBookingService,
  formatBookingVehicle,
  getBookingArrivalTime,
  getBookingCustomerName,
} from '@coastal/shared-types';
import { db } from '@/lib/firebase';
import type { BookingDoc } from '@/lib/queries/bookings';
import { Segmented, type SegmentedItem } from '@/components/ui/Segmented';

const TZ = 'America/New_York';
const isoFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' });
const weekdayLongFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' });
const monthFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'long', year: 'numeric' });
const monthShortFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short', day: 'numeric' });

type ScheduleView = 'day' | 'week' | 'month';

const SCHEDULE_VIEWS: SegmentedItem<ScheduleView>[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

const VIEW_STORAGE_KEY = 'coastal:schedule:view';

function toIso(d: Date): string {
  return isoFmt.format(d);
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

function startOfWeekMon(anchor: Date): Date {
  const iso = toIso(anchor);
  const [y, m, d] = iso.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 12));
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayFmt.format(utc));
  const daysFromMon = (dow + 6) % 7;
  return addDays(utc, -daysFromMon);
}

function startOfMonth(anchor: Date): Date {
  const iso = toIso(anchor);
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1, 12));
}

function endOfMonth(anchor: Date): Date {
  const iso = toIso(anchor);
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0, 12));
}

/* A3f Polish Round 3 Unit 5: Schedule now opens on Day view by default
 * and offers a Day / Week / Month toggle. Last chosen view persists in
 * sessionStorage so navigating away and back within the session keeps
 * the user's choice; a fresh tab returns to Day. */
function readStoredView(): ScheduleView {
  if (typeof window === 'undefined') return 'day';
  const stored = window.sessionStorage.getItem(VIEW_STORAGE_KEY);
  if (stored === 'day' || stored === 'week' || stored === 'month') return stored;
  return 'day';
}

export default function SchedulePage() {
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ScheduleView>('day');

  // Read sessionStorage after mount to keep server + client HTML matched.
  useEffect(() => {
    setView(readStoredView());
  }, []);

  function changeView(next: ScheduleView) {
    setView(next);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(VIEW_STORAGE_KEY, next);
    }
  }

  useEffect(() => {
    const q = query(collection(db, 'bookings'));
    return onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as BookingDoc)).filter(b => b.isTest !== true));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, BookingDoc[]>();
    for (const b of bookings) {
      const iso = b.confirmedDate || (b as { preferredDate?: string }).preferredDate;
      if (!iso) continue;
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso)!.push(b);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => getBookingArrivalTime(a).localeCompare(getBookingArrivalTime(b)));
    }
    return map;
  }, [bookings]);

  const dayIso = toIso(anchor);
  const dayBookings = byDay.get(dayIso) ?? [];
  const dayLabel = `${weekdayLongFmt.format(anchor)}, ${monthShortFmt.format(anchor)}`;

  const weekStart = useMemo(() => startOfWeekMon(anchor), [anchor]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekRangeLabel = `${toIso(weekDays[0]).slice(5)} – ${toIso(weekDays[6]).slice(5)}`;

  const monthGrid = useMemo(() => {
    const first = startOfMonth(anchor);
    const last = endOfMonth(anchor);
    const firstDow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayFmt.format(first));
    const leadingBlanks = (firstDow + 6) % 7; // Monday-first grid.
    const totalDays = last.getUTCDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push(null);
    for (let i = 0; i < totalDays; i++) cells.push(addDays(first, i));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [anchor]);
  const monthLabel = monthFmt.format(anchor);

  const navAria =
    view === 'day' ? { prev: 'Previous day', next: 'Next day' } :
    view === 'week' ? { prev: 'Previous week', next: 'Next week' } :
    { prev: 'Previous month', next: 'Next month' };

  function shiftAnchor(direction: -1 | 1) {
    setAnchor(prev => {
      if (view === 'day') return addDays(prev, direction);
      if (view === 'week') return addDays(prev, direction * 7);
      // Month: jump to first of next/prev month.
      const iso = toIso(prev);
      const [y, m] = iso.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1 + direction, 1, 12));
    });
  }

  const rangeLabel = view === 'day' ? dayLabel : view === 'week' ? weekRangeLabel : monthLabel;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px]">
      {/* A3f Phase 6A.8 + Polish Round 3 Unit 5: header stacks on mobile
          so the nav row never clips. Day/Week/Month toggle sits between
          the title block and the prev/next controls. New booking button
          hides below md (FAB carries create there). */}
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="text-[20px] lg:text-2xl font-semibold tracking-tight text-[#0B2040]">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Click a job card to open it.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => shiftAnchor(-1)} aria-label={navAria.prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => shiftAnchor(1)} aria-label={navAria.next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-1 whitespace-nowrap">{rangeLabel}</span>
          <Button disabled title="New booking modal lands in STEP 13" className="hidden md:inline-flex ml-2">
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New booking
          </Button>
        </div>
      </header>

      <div className="mb-4 lg:max-w-sm">
        <Segmented<ScheduleView>
          ariaLabel="Schedule view"
          items={SCHEDULE_VIEWS}
          value={view}
          onChange={changeView}
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : view === 'day' ? (
        <DayView dayBookings={dayBookings} />
      ) : view === 'week' ? (
        <WeekView days={weekDays} byDay={byDay} />
      ) : (
        <MonthView cells={monthGrid} byDay={byDay} onPickDay={(d) => { setAnchor(d); changeView('day'); }} />
      )}
    </div>
  );
}

function DayCardLink({ b }: { b: BookingDoc }) {
  const arrival = getBookingArrivalTime(b);
  const customer = getBookingCustomerName(b) || '(no name)';
  const service = formatBookingService(b);
  const vehicle = formatBookingVehicle(b);
  return (
    <Link
      href={`/jobs/${b.id}`}
      className="block bg-white border border-[#0B2040]/8 rounded-[10px] p-2.5 text-xs shadow-[0_1px_2px_rgba(11,32,64,0.06)] transition-colors hover:bg-[#0B2040]/3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E07B2D]/60"
    >
      <div className="text-[11px] font-semibold tabular-nums text-[#0B2040] mb-1">{arrival || 'Time TBD'}</div>
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <span className="text-[13px] font-semibold leading-tight truncate text-[#0B2040]">{customer}</span>
        <Badge variant={statusBadgeVariant(b.status)} className="font-normal text-[10px] px-1.5 py-0 shrink-0">{b.status}</Badge>
      </div>
      {service && <div className="text-[#0B2040]/58 truncate">{service}</div>}
      {vehicle && <div className="text-[#0B2040]/58 truncate">{vehicle}</div>}
    </Link>
  );
}

function DayView({ dayBookings }: { dayBookings: BookingDoc[] }) {
  if (dayBookings.length === 0) {
    return (
      <div className="rounded-[14px] border border-[#0B2040]/8 bg-white py-12 text-center text-sm text-[#0B2040]/58 shadow-[0_1px_2px_rgba(11,32,64,0.06)]">
        No jobs scheduled for this day.
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {dayBookings.map(b => <DayCardLink key={b.id} b={b} />)}
    </div>
  );
}

function WeekView({ days, byDay }: { days: Date[]; byDay: Map<string, BookingDoc[]> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map(day => {
        const iso = toIso(day);
        const dayBookings = byDay.get(iso) ?? [];
        const dayLabel = weekdayFmt.format(day);
        const dayOfMonth = day.getUTCDate();
        return (
          <div key={iso} className="bg-white border border-[#0B2040]/8 rounded-[14px] overflow-hidden flex flex-col min-h-[200px] shadow-[0_1px_2px_rgba(11,32,64,0.06)]">
            <div className="px-3 py-2 border-b border-[#0B2040]/8 flex items-baseline justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#0B2040]/45">{dayLabel}</div>
              <div className="text-sm font-semibold text-[#0B2040]">{dayOfMonth}</div>
            </div>
            <div className="flex-1 p-2 space-y-2">
              {dayBookings.length === 0 ? (
                <div className="text-xs text-[#0B2040]/45 py-4 text-center">No jobs scheduled</div>
              ) : (
                dayBookings.map(b => <DayCardLink key={b.id} b={b} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({
  cells,
  byDay,
  onPickDay,
}: {
  cells: (Date | null)[];
  byDay: Map<string, BookingDoc[]>;
  onPickDay: (d: Date) => void;
}) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="bg-white border border-[#0B2040]/8 rounded-[14px] overflow-hidden shadow-[0_1px_2px_rgba(11,32,64,0.06)]">
      <div className="grid grid-cols-7 border-b border-[#0B2040]/8 bg-[#0B2040]/3">
        {dayLabels.map(l => (
          <div key={l} className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#0B2040]/45 text-center">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) {
            return <div key={`blank-${i}`} className="min-h-[64px] bg-[#0B2040]/3" />;
          }
          const iso = toIso(d);
          const count = byDay.get(iso)?.length ?? 0;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPickDay(d)}
              className="min-h-[64px] px-2 py-2 text-left border-t border-r border-[#0B2040]/8 last:border-r-0 transition-colors hover:bg-[#0B2040]/3 focus-visible:outline-none focus-visible:bg-[#E07B2D]/5"
              aria-label={`Open ${iso}, ${count} job${count === 1 ? '' : 's'}`}
            >
              <div className="text-[13px] font-semibold text-[#0B2040] tabular-nums">{d.getUTCDate()}</div>
              {count > 0 && (
                <div className="mt-1 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E07B2D]" aria-hidden="true" />
                  <span className="text-[11px] font-semibold text-[#0B2040]/58 tabular-nums">{count}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
