'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  type AppUser,
  type Booking,
  getServiceLabel,
} from '@/app/admin/shared';
import {
  bookingStartHour,
  formatBookingTimeLabel,
} from '@/lib/dashboard-helpers';
import FmReturnPathWriter from '@/components/tech/FmReturnPathWriter';

export default function UnassignedBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [resolved, setResolved] = useState(false);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [bookingsErr, setBookingsErr] = useState<string | null>(null);

  /* ── Resolve current user / role (admin gate, mirrors /tech/page.tsx) ─ */
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

  /* ── Non-admin techs go back to their jobs list ─ */
  useEffect(() => {
    if (!resolved) return;
    if (user && user.isActive && user.role !== 'admin') {
      router.replace('/tech/jobs');
    }
  }, [resolved, user, router]);

  /* ── Bookings listener ─ */
  useEffect(() => {
    if (!resolved || !user || user.role !== 'admin') return;
    const q = query(
      collection(db, 'bookings'),
      where('status', 'in', ['pending', 'confirmed', 'in-progress']),
    );
    return onSnapshot(
      q,
      (snap) => {
        setBookings(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking),
        );
        setBookingsErr(null);
      },
      (err) => {
        console.error('Unassigned bookings listener failed:', err);
        setBookingsErr(err.message || 'Failed to load bookings');
      },
    );
  }, [resolved, user]);

  const unassigned = useMemo(() => {
    if (!bookings) return [];
    return bookings
      .filter((b) => !b.isTest && !b.assignedTechId)
      .sort((a, b) => {
        const dateA = a.confirmedDate || a.preferredDate || '9999-99-99';
        const dateB = b.confirmedDate || b.preferredDate || '9999-99-99';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return bookingStartHour(a) - bookingStartHour(b);
      });
  }, [bookings]);

  if (!resolved || !user) return null;
  if (user.role !== 'admin') return null;

  const loading = bookings === null;

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
          Unassigned Bookings
        </h1>
        {!loading && (
          <p className="mt-0.5 text-xs text-slate-500">
            {unassigned.length} {unassigned.length === 1 ? 'booking' : 'bookings'} need a tech
          </p>
        )}
      </div>

      {bookingsErr ? (
        <section className="rounded-xl bg-white shadow-sm p-4">
          <div className="text-sm text-red-700 py-2">
            Couldn&apos;t load. Pull to refresh or check connection.
          </div>
        </section>
      ) : loading ? (
        <section className="rounded-xl bg-white shadow-sm p-4">
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-slate-100 rounded"
                style={{ opacity: 1 - i * 0.2 }}
              />
            ))}
          </div>
        </section>
      ) : unassigned.length === 0 ? (
        <section className="rounded-xl bg-white shadow-sm p-6 text-center">
          <div className="text-sm text-slate-500">
            No unassigned bookings — everyone&apos;s covered.
          </div>
        </section>
      ) : (
        <section className="rounded-xl bg-white shadow-sm p-2">
          <div className="space-y-1">
            {unassigned.map((b) => (
              <BookingRow key={b.id} b={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Row ───────────────────────────────────────────────── */

function BookingRow({ b }: { b: Booking }) {
  const time = formatBookingTimeLabel(b);
  const dateLabel = formatDateLabel(b.confirmedDate || b.preferredDate);
  const customer = b.name || b.customerName || 'Customer';
  const service = getServiceLabel(b) || 'Service';
  return (
    <Link
      href={`/tech/jobs/${b.id}`}
      className="flex items-center gap-3 min-h-[56px] px-2 py-2 rounded-lg active:bg-slate-100 hover:bg-slate-50"
    >
      <div className="w-[80px] flex-shrink-0">
        <div className="text-[11px] text-slate-500">{dateLabel}</div>
        <div className="text-[13px] font-semibold text-slate-700">{time}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#0B2040] truncate">
          {customer}
        </div>
        <div className="text-xs text-slate-500 truncate">{service}</div>
      </div>
      <StatusPill status={b.status} />
    </Link>
  );
}

function formatDateLabel(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatusPill({ status }: { status?: string }) {
  const cls = pillClass(status);
  const label = (status || '—').replace('-', ' ').replace('_', ' ');
  return (
    <span
      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

function pillClass(status?: string): string {
  switch (status) {
    case 'confirmed':
    case 'pending':
      return 'bg-[#DBEAFE] text-[#1E3A8A]';
    case 'in-progress':
      return 'bg-[#E07B2D] text-white';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
