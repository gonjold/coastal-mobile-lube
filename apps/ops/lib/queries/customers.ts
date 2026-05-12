import { collection, getDocs, query, where, type QuerySnapshot, type DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import type { BookingShape } from "@coastal/shared-types";

export interface CustomerRow {
  /** Canonical id if backed by a customers/{id} doc; null if derived only. */
  customerId: string | null;
  /** Stable dedupe key (phone digits, lowercased email, or fallback). */
  key: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate: string;
  lastBookingTimestamp: number;
  bookingIds: string[];
}

interface CustomerDoc {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface BookingDocWithId extends BookingShape {
  id: string;
  createdAt?: { toDate: () => Date };
  isTest?: boolean;
  invoiceId?: string;
}

function mapSnap<T>(snap: QuerySnapshot<DocumentData>): T[] {
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
}

function normalizePhone(p?: string): string {
  return (p || "").replace(/\D/g, "");
}

function normalizeEmail(e?: string): string {
  return (e || "").trim().toLowerCase();
}

function dedupeKey(c: { phone?: string; email?: string; id?: string }): string {
  return normalizePhone(c.phone) || normalizeEmail(c.email) || c.id || "";
}

/** Merges bookings-derived customers with the customers collection. Deduped by
 * phone-digits (preferred) or email (lowercase). On tie, the customers-collection
 * entry wins. Total-spent is computed from invoice totals attached to the
 * customer's bookings (best-effort: requires invoices fetched separately). */
export async function buildMergedCustomerList(): Promise<CustomerRow[]> {
  const [bookingsSnap, customersSnap] = await Promise.all([
    getDocs(collection(db, "bookings")),
    getDocs(collection(db, "customers")),
  ]);

  const bookings = mapSnap<BookingDocWithId>(bookingsSnap)
    .filter(b => b.isTest !== true);
  const customers = mapSnap<CustomerDoc>(customersSnap);

  // Group bookings by dedupe key.
  const groupedByKey = new Map<string, BookingDocWithId[]>();
  for (const b of bookings) {
    const phone = normalizePhone(b.phone || b.customerPhone);
    const email = normalizeEmail(b.email || b.customerEmail);
    const key = phone || email || b.id;
    if (!groupedByKey.has(key)) groupedByKey.set(key, []);
    groupedByKey.get(key)!.push(b);
  }

  // Index customers by both phone and email for lookup.
  const customerByPhone = new Map<string, CustomerDoc>();
  const customerByEmail = new Map<string, CustomerDoc>();
  for (const c of customers) {
    const p = normalizePhone(c.phone);
    const e = normalizeEmail(c.email);
    if (p) customerByPhone.set(p, c);
    if (e) customerByEmail.set(e, c);
  }

  const linkedCustomerIds = new Set<string>();
  const rows: CustomerRow[] = [];

  for (const [key, bks] of groupedByKey) {
    const sorted = [...bks].sort((a, b) => {
      const aT = a.createdAt?.toDate().getTime() ?? 0;
      const bT = b.createdAt?.toDate().getTime() ?? 0;
      return bT - aT;
    });
    const latest = sorted[0];
    const phone = normalizePhone(latest.phone || latest.customerPhone);
    const email = normalizeEmail(latest.email || latest.customerEmail);
    const customer = (phone && customerByPhone.get(phone)) || (email && customerByEmail.get(email)) || null;
    if (customer) linkedCustomerIds.add(customer.id);

    rows.push({
      customerId: customer?.id ?? null,
      key,
      name: customer?.name || latest.name || latest.customerName || "(no name)",
      phone: customer?.phone || phone,
      email: customer?.email || email,
      address: customer?.address || latest.address || "",
      totalBookings: sorted.length,
      totalSpent: 0,
      lastBookingDate: latest.createdAt?.toDate().toISOString().slice(0, 10) ?? "",
      lastBookingTimestamp: latest.createdAt?.toDate().getTime() ?? 0,
      bookingIds: sorted.map(b => b.id),
    });
  }

  // Append customers-collection entries that had no booking matches.
  for (const c of customers) {
    if (linkedCustomerIds.has(c.id)) continue;
    rows.push({
      customerId: c.id,
      key: dedupeKey(c),
      name: c.name || "(no name)",
      phone: normalizePhone(c.phone),
      email: normalizeEmail(c.email),
      address: c.address || "",
      totalBookings: 0,
      totalSpent: 0,
      lastBookingDate: "",
      lastBookingTimestamp: 0,
      bookingIds: [],
    });
  }

  rows.sort((a, b) => b.lastBookingTimestamp - a.lastBookingTimestamp);
  return rows;
}

/** Fetch a single customer detail. Pulls the customer doc (if customerId is a
 * customers/{id} key), every booking attached, and any invoice totals. */
export async function fetchCustomerDetail(id: string): Promise<{
  customer: CustomerDoc | null;
  bookings: BookingDocWithId[];
  totalSpent: number;
} | null> {
  // Try as customers/{id} doc first.
  const directSnap = await getDocs(query(collection(db, "customers"), where("__name__", "==", id)));
  let customer: CustomerDoc | null = null;
  if (!directSnap.empty) {
    customer = { id: directSnap.docs[0].id, ...directSnap.docs[0].data() } as CustomerDoc;
  }

  if (!customer) {
    // id may be a booking-derived dedupe key. Try bookings keyed by phone digits.
    const phoneCandidate = id.replace(/\D/g, "");
    if (phoneCandidate.length >= 7) {
      const phoneMatchByCustomer = await getDocs(query(collection(db, "customers"), where("phone", "==", phoneCandidate)));
      if (!phoneMatchByCustomer.empty) {
        customer = { id: phoneMatchByCustomer.docs[0].id, ...phoneMatchByCustomer.docs[0].data() } as CustomerDoc;
      }
    }
  }

  // Collect attached bookings by customerId field or by phone/email match.
  const allBookingsSnap = await getDocs(collection(db, "bookings"));
  const allBookings = mapSnap<BookingDocWithId>(allBookingsSnap).filter(b => b.isTest !== true);
  let attached: BookingDocWithId[] = [];

  if (customer) {
    const targetPhone = normalizePhone(customer.phone);
    const targetEmail = normalizeEmail(customer.email);
    attached = allBookings.filter(b => {
      const p = normalizePhone(b.phone || b.customerPhone);
      const e = normalizeEmail(b.email || b.customerEmail);
      return (targetPhone && p === targetPhone) || (targetEmail && e === targetEmail);
    });
  } else {
    // Fall back to interpreting id as the dedupe key (booking-derived).
    attached = allBookings.filter(b => {
      const p = normalizePhone(b.phone || b.customerPhone);
      const e = normalizeEmail(b.email || b.customerEmail);
      return p === id || e === id || b.id === id;
    });
  }

  attached.sort((a, b) => {
    const aT = a.createdAt?.toDate().getTime() ?? 0;
    const bT = b.createdAt?.toDate().getTime() ?? 0;
    return bT - aT;
  });

  // Sum totals from invoices linked to attached bookings.
  const bookingIds = attached.map(b => b.id);
  let totalSpent = 0;
  if (bookingIds.length > 0) {
    // Firestore `in` allows up to 30 values; chunk for safety.
    const chunks: string[][] = [];
    for (let i = 0; i < bookingIds.length; i += 30) chunks.push(bookingIds.slice(i, i + 30));
    for (const chunk of chunks) {
      const invSnap = await getDocs(query(collection(db, "invoices"), where("bookingId", "in", chunk), where("status", "==", "paid")));
      for (const d of invSnap.docs) {
        const data = d.data() as { qbTotalAmount?: number; total?: number; isTest?: boolean; deleted?: boolean };
        if (data.isTest || data.deleted) continue;
        totalSpent += typeof data.qbTotalAmount === "number" ? data.qbTotalAmount : (data.total ?? 0);
      }
    }
  }

  return { customer, bookings: attached, totalSpent };
}
