'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Badge, Button } from '@coastal/shared-ui';
import {
  formatBookingService,
  formatBookingVehicle,
  getBookingArrivalTime,
  getBookingCustomerName,
} from '@coastal/shared-types';
import { db } from '@/lib/firebase';
import type { BookingDoc } from '@/lib/queries/bookings';

const TZ = 'America/New_York';
const isoFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' });

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

function statusVariant(s: string | undefined): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!s) return 'outline';
  if (s === 'completed' || s === 'invoiced') return 'default';
  if (s === 'confirmed' || s === 'in-progress') return 'secondary';
  if (s === 'cancelled' || s === 'dead') return 'destructive';
  return 'outline';
}

export default function SchedulePage() {
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'bookings'));
    return onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as BookingDoc)).filter(b => b.isTest !== true));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  const weekStart = useMemo(() => startOfWeekMon(anchor), [anchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const byDay = useMemo(() => {
    const map = new Map<string, BookingDoc[]>();
    for (const day of days) map.set(toIso(day), []);
    for (const b of bookings) {
      const iso = b.confirmedDate || (b as { preferredDate?: string }).preferredDate;
      if (!iso) continue;
      if (map.has(iso)) map.get(iso)!.push(b);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => getBookingArrivalTime(a).localeCompare(getBookingArrivalTime(b)));
    }
    return map;
  }, [bookings, days]);

  const rangeLabel = `${toIso(days[0]).slice(5)} – ${toIso(days[6]).slice(5)}`;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Week view · click a card to open the job</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAnchor(d => addDays(d, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(d => addDays(d, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">{rangeLabel}</span>
          <Button disabled title="New booking modal lands in STEP 13" className="ml-2">
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New booking
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {days.map(day => {
            const iso = toIso(day);
            const dayBookings = byDay.get(iso) ?? [];
            const dayLabel = weekdayFmt.format(day);
            const dayOfMonth = day.getUTCDate();
            return (
              <div key={iso} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col min-h-[200px]">
                <div className="px-3 py-2 border-b border-border flex items-baseline justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{dayLabel}</div>
                  <div className="text-sm font-semibold">{dayOfMonth}</div>
                </div>
                <div className="flex-1 p-2 space-y-2">
                  {dayBookings.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-4 text-center">No jobs scheduled</div>
                  ) : (
                    dayBookings.map(b => (
                      <Link
                        key={b.id}
                        href={`/jobs/${b.id}`}
                        className="block bg-muted/30 hover:bg-muted/60 border border-border rounded p-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-semibold truncate">{getBookingCustomerName(b) || '(no name)'}</span>
                          <Badge variant={statusVariant(b.status)} className="font-normal text-[10px] px-1.5 py-0">{b.status}</Badge>
                        </div>
                        <div className="text-muted-foreground truncate">{formatBookingService(b)}</div>
                        <div className="text-muted-foreground truncate">{formatBookingVehicle(b)}</div>
                        <div className="text-muted-foreground">{getBookingArrivalTime(b)}</div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
