/* ── A3c canonicalization candidate ──────────────────────────
   Minimal local Booking + Customer shapes + buildCustomerList +
   formatPhone, used by ops modals that previously imported from
   apps/marketing/src/app/admin/shared.ts. Identical to the inline
   block in NewBookingModal.tsx — extracted once both Pass 2 and
   Pass 5 needed it. Canonicalize into @coastal/shared-types in A3c.
   ──────────────────────────────────────────────────────────── */

export type FirestoreTimestamp = { toDate: () => Date };

export interface Booking {
  id: string;
  name?: string;
  customerName?: string;
  phone?: string;
  customerPhone?: string;
  email?: string;
  customerEmail?: string;
  address?: string;
  status?: string;
  createdAt?: FirestoreTimestamp;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vesselYear?: string;
  vesselMake?: string;
  vesselModel?: string;
}

export interface Customer {
  key: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalBookings: number;
  lastBookingDate: string;
  lastBookingStatus?: string;
  bookings: Booking[];
}

// Re-exported from the canonical formatter (A3e PRIORITY-1) so existing
// consumers that import `formatPhone` from customerTypes keep working.
// Placeholder differs from format.ts default (returns '-' here to preserve
// long-standing display behavior in customer modals).
import { formatPhone as canonicalFormatPhone } from './format';
export function formatPhone(phone?: string): string {
  return canonicalFormatPhone(phone, '-');
}

export function buildCustomerList(bookings: Booking[]): Customer[] {
  const map = new Map<string, Booking[]>();
  bookings.forEach((b) => {
    const phone = b.phone || b.customerPhone;
    const email = b.email || b.customerEmail;
    const key = phone?.replace(/\D/g, '') || email?.toLowerCase() || b.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  });

  const customers: Customer[] = [];
  map.forEach((bks, key) => {
    const sorted = [...bks].sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
      return bTime - aTime;
    });
    const latest = sorted[0];
    customers.push({
      key,
      name: latest.name || latest.customerName || '-',
      phone: latest.phone || latest.customerPhone,
      email: latest.email || latest.customerEmail,
      address: latest.address,
      totalBookings: sorted.length,
      lastBookingDate: '',
      lastBookingStatus: latest.status,
      bookings: sorted,
    });
  });

  customers.sort((a, b) => {
    const aTime = a.bookings[0]?.createdAt?.toDate?.()?.getTime() ?? 0;
    const bTime = b.bookings[0]?.createdAt?.toDate?.()?.getTime() ?? 0;
    return bTime - aTime;
  });

  return customers;
}
