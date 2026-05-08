'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser, Booking } from '@/app/admin/shared';
import { ScheduleFilters } from '@/components/tech/ScheduleFilters';
import { ScheduleBookingRow } from '@/components/tech/ScheduleBookingRow';
import FmReturnPathWriter from '@/components/tech/FmReturnPathWriter';
import { bookingStartHour } from '@/lib/dashboard-helpers';
import {
  applyDivisionFilter,
  applySearchFilter,
  applyStatusFilter,
  applyTimeFilter,
  coerceDivision,
  coerceStatus,
  coerceTime,
  FILTER_DEFAULTS,
} from '@/lib/schedule-filters';

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleLoading />}>
      <SchedulePageInner />
    </Suspense>
  );
}

function SchedulePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ── Filter state from URL (with defaults) ── */
  const time = coerceTime(searchParams.get('time'));
  const status = coerceStatus(searchParams.get('status'));
  const division = coerceDivision(searchParams.get('division'));
  const q = searchParams.get('q') || '';

  /* ── Auth gate (admin only, mirror /tech/unassigned) ── */
  const [user, setUser] = useState<AppUser | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }
      if (!fbUser) {
        setUser(null);
        setResolved(true);
        return;
      }
      unsubUser = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => {
          setUser(snap.exists() ? (snap.data() as AppUser) : null);
          setResolved(true);
        },
        () => setResolved(true),
      );
    });
    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  useEffect(() => {
    if (!resolved) return;
    if (user && user.isActive && user.role !== 'admin') {
      router.replace('/tech/jobs');
    }
  }, [resolved, user, router]);

  /* ── Live data ── */
  const [allBookings, setAllBookings] = useState<Booking[] | null>(null);
  const [bookingsErr, setBookingsErr] = useState<string | null>(null);
  const [techsByUid, setTechsByUid] = useState<Record<string, AppUser>>({});

  useEffect(() => {
    if (!resolved || !user || user.role !== 'admin') return;
    const unsub = onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        setAllBookings(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking),
        );
        setBookingsErr(null);
      },
      (err) => {
        console.error('Schedule bookings listener failed:', err);
        setBookingsErr(err.message || 'Failed to load schedule');
      },
    );
    return () => unsub();
  }, [resolved, user]);

  useEffect(() => {
    if (!resolved || !user || user.role !== 'admin') return;
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const map: Record<string, AppUser> = {};
      snap.forEach((d) => {
        map[d.id] = { uid: d.id, ...(d.data() as Omit<AppUser, 'uid'>) };
      });
      setTechsByUid(map);
    });
    return () => unsub();
  }, [resolved, user]);

  /* ── In-memory filter + sort ── */
  const filtered = useMemo(() => {
    if (!allBookings) return [];
    let list = allBookings.filter((b) => !b.isTest);
    list = applyTimeFilter(list, time);
    list = applyStatusFilter(list, status);
    list = applyDivisionFilter(list, division);
    if (q) list = applySearchFilter(list, q);
    return [...list].sort((a, b) => {
      const dateA = a.confirmedDate || a.preferredDate || '9999-99-99';
      const dateB = b.confirmedDate || b.preferredDate || '9999-99-99';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return bookingStartHour(a) - bookingStartHour(b);
    });
  }, [allBookings, time, status, division, q]);

  /* ── URL filter setter ── */
  function setFilter(
    key: 'time' | 'status' | 'division' | 'q',
    value: string,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    const isDefault =
      (key === 'time' && value === FILTER_DEFAULTS.time) ||
      (key === 'status' && value === FILTER_DEFAULTS.status) ||
      (key === 'division' && value === FILTER_DEFAULTS.division) ||
      (key === 'q' && value === FILTER_DEFAULTS.q);
    if (isDefault) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `/tech/schedule?${qs}` : '/tech/schedule', {
      scroll: false,
    });
  }

  function resetFilters() {
    router.replace('/tech/schedule', { scroll: false });
  }

  /* ── Auth gate render guards ── */
  if (!resolved || !user) return null;
  if (user.role !== 'admin') return null;

  const loading = allBookings === null;

  return (
    <div className="space-y-3 -mx-4 px-4 py-2 sm:mx-0 sm:px-0">
      <FmReturnPathWriter />
      <div className="px-1 pt-1">
        <Link
          href="/tech"
          className="text-xs font-semibold text-[#0B2040] hover:opacity-80"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-extrabold text-[#0B2040]">
          Schedule
        </h1>
      </div>

      <ScheduleFilters
        time={time}
        status={status}
        division={division}
        q={q}
        resultCount={filtered.length}
        onChange={setFilter}
        onReset={resetFilters}
      />

      <div className="pb-8">
        {bookingsErr ? (
          <ScheduleError />
        ) : loading ? (
          <ScheduleSkeleton />
        ) : filtered.length === 0 ? (
          <ScheduleEmpty
            time={time}
            status={status}
            division={division}
            q={q}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => (
              <ScheduleBookingRow
                key={b.id}
                booking={b}
                techName={
                  b.assignedTechId
                    ? techsByUid[b.assignedTechId]?.displayName || null
                    : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── States ─────────────────────────────────────────────── */

function ScheduleLoading() {
  return (
    <div className="space-y-3 py-2">
      <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
      <ScheduleSkeleton />
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg bg-white shadow-sm"
          style={{ opacity: 1 - i * 0.2 }}
        />
      ))}
    </div>
  );
}

function ScheduleError() {
  return (
    <div className="rounded-xl bg-white shadow-sm p-4 text-sm text-red-700">
      Couldn&apos;t load schedule. Pull to refresh or check connection.
    </div>
  );
}

function ScheduleEmpty({
  time,
  status,
  division,
  q,
}: {
  time: string;
  status: string;
  division: string;
  q: string;
}) {
  let message = 'No bookings match these filters.';
  if (q) {
    message = `No bookings match "${q}". Try a different search.`;
  } else if (
    time === 'today' &&
    status === FILTER_DEFAULTS.status &&
    division === FILTER_DEFAULTS.division
  ) {
    message = 'Nothing scheduled for today.';
  }
  return (
    <div className="rounded-xl bg-white shadow-sm p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
