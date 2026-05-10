/* ─── Schedule list filter helpers ────────────────────────
 * In-memory filters for /tech/schedule. Booking dataset is
 * small (well under 1000 docs) so all filtering happens client-side.
 */

import type { Booking } from '@/app/admin/shared';
import {
  getTodayESTISO,
  getWeekBoundsESTISO,
} from '@/lib/dashboard-helpers';

export type TimeFilter = 'today' | 'week' | 'month' | 'all';
export type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled';
export type DivisionFilter = 'all' | 'auto' | 'marine' | 'fleet' | 'rv';

export const FILTER_DEFAULTS = {
  time: 'today' as TimeFilter,
  status: 'active' as StatusFilter,
  division: 'all' as DivisionFilter,
  q: '',
};

/* ── Division resolution ── */
export function getBookingDivision(b: Booking): DivisionFilter {
  const raw = (b.division || '').toLowerCase();
  if (raw === 'auto' || raw === 'marine' || raw === 'fleet' || raw === 'rv') {
    return raw;
  }
  if (b.serviceCategory === 'marine' || b.vesselMake) return 'marine';
  if (b.serviceCategory === 'fleet' || b.fleetSize) return 'fleet';
  if (b.serviceCategory === 'rv' || b.rvType) return 'rv';
  return 'auto';
}

/* ── Time filter (EST date math) ── */
export function applyTimeFilter(
  bookings: Booking[],
  time: TimeFilter,
  now: Date = new Date(),
): Booking[] {
  if (time === 'all') return bookings;
  const todayISO = getTodayESTISO(now);
  const { weekStartISO, weekEndISO } = getWeekBoundsESTISO(now);

  if (time === 'today') {
    return bookings.filter(
      (b) => (b.confirmedDate || b.preferredDate) === todayISO,
    );
  }
  if (time === 'week') {
    return bookings.filter((b) => {
      const ds = b.confirmedDate || b.preferredDate;
      return !!ds && ds >= weekStartISO && ds <= weekEndISO;
    });
  }
  if (time === 'month') {
    const monthPrefix = todayISO.slice(0, 7); // YYYY-MM
    return bookings.filter((b) => {
      const ds = b.confirmedDate || b.preferredDate;
      return !!ds && ds.startsWith(monthPrefix);
    });
  }
  return bookings;
}

/* ── Status filter ── */
export function applyStatusFilter(
  bookings: Booking[],
  status: StatusFilter,
): Booking[] {
  if (status === 'all') return bookings;
  if (status === 'active') {
    return bookings.filter(
      (b) =>
        b.status === 'pending' ||
        b.status === 'confirmed' ||
        b.status === 'in-progress',
    );
  }
  if (status === 'completed') {
    return bookings.filter((b) => b.status === 'completed');
  }
  if (status === 'cancelled') {
    return bookings.filter(
      (b) => b.status === 'cancelled' || b.status === 'dead',
    );
  }
  return bookings;
}

/* ── Division filter ── */
export function applyDivisionFilter(
  bookings: Booking[],
  division: DivisionFilter,
): Booking[] {
  if (division === 'all') return bookings;
  return bookings.filter((b) => getBookingDivision(b) === division);
}

/* ── Search filter (case-insensitive substring across name/phone/email/vehicle) ── */
export function applySearchFilter(
  bookings: Booking[],
  query: string,
): Booking[] {
  const q = query.toLowerCase().trim();
  if (!q) return bookings;
  return bookings.filter((b) => {
    const name = (b.name || b.customerName || '').toLowerCase();
    if (name.includes(q)) return true;
    const phone = (b.phone || b.customerPhone || '')
      .replace(/\D/g, '')
      .toLowerCase();
    const phoneQ = q.replace(/\D/g, '');
    if (phoneQ && phone.includes(phoneQ)) return true;
    const email = (b.email || b.customerEmail || '').toLowerCase();
    if (email.includes(q)) return true;
    const vehicleParts = [
      b.vehicleYear,
      b.vehicleMake,
      b.vehicleModel,
      b.vehicleInfo?.year,
      b.vehicleInfo?.make,
      b.vehicleInfo?.model,
      b.vesselMake,
      b.vesselModel,
    ].filter(Boolean);
    const vehicle = vehicleParts.join(' ').toLowerCase();
    if (vehicle.includes(q)) return true;
    return false;
  });
}

/* ── Validation helpers (for URL param coercion) ── */
export function coerceTime(v: string | null): TimeFilter {
  if (v === 'today' || v === 'week' || v === 'month' || v === 'all') return v;
  return FILTER_DEFAULTS.time;
}

export function coerceStatus(v: string | null): StatusFilter {
  if (
    v === 'all' ||
    v === 'active' ||
    v === 'completed' ||
    v === 'cancelled'
  )
    return v;
  return FILTER_DEFAULTS.status;
}

export function coerceDivision(v: string | null): DivisionFilter {
  if (
    v === 'all' ||
    v === 'auto' ||
    v === 'marine' ||
    v === 'fleet' ||
    v === 'rv'
  )
    return v;
  return FILTER_DEFAULTS.division;
}
