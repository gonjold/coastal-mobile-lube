import { collection, getDocs, query, where, orderBy, limit as fbLimit, type QuerySnapshot, type DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { getCurrentWeekRange, getTodayESTISO } from "@coastal/shared-ui";

/** Minimal shape consumers read from the dashboard panels and KPIs. Full
 * Booking type lives in apps/marketing/src/app/admin/shared.ts; A3c
 * canonicalizes it into shared-types. */
export interface BookingDoc {
  id: string;
  status?: string;
  confirmedDate?: string;
  preferredDate?: string;
  isTest?: boolean;
  estimateLocked?: boolean;
  invoiceId?: string;
  estimateTotal?: number;
  customerEstimateSentAt?: { toDate: () => Date };
  createdAt?: { toDate: () => Date };
  assignedTechId?: string | null;
  // Allow consumers to read additional fields without re-typing each one.
  [key: string]: unknown;
}

const ACTIVE_WEEK_STATUSES = new Set(["confirmed", "in-progress", "completed"]);
const ACTIVE_PIPELINE_STATUSES_EXCLUDED = new Set(["cancelled", "dead"]);

function mapSnap(snap: QuerySnapshot<DocumentData>): BookingDoc[] {
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BookingDoc));
}

/** Bookings whose confirmedDate falls in the current EST week and whose status
 * is active. Test docs filtered client-side per walkthrough lock #3. */
export async function fetchBookingsThisWeek(): Promise<BookingDoc[]> {
  const { start, end } = getCurrentWeekRange();
  const q = query(
    collection(db, "bookings"),
    where("confirmedDate", ">=", start),
    where("confirmedDate", "<=", end),
  );
  const snap = await getDocs(q);
  return mapSnap(snap)
    .filter(b => b.isTest !== true)
    .filter(b => typeof b.status === "string" && ACTIVE_WEEK_STATUSES.has(b.status));
}

/** Jobs scheduled for today with active status. Limit caps the panel display. */
export async function fetchJobsInFlight(limitN = 5): Promise<BookingDoc[]> {
  const todayISO = getTodayESTISO();
  const q = query(
    collection(db, "bookings"),
    where("confirmedDate", "==", todayISO),
    orderBy("confirmedDate", "asc"),
    fbLimit(limitN * 4),
  );
  const snap = await getDocs(q);
  return mapSnap(snap)
    .filter(b => b.isTest !== true)
    .filter(b => b.status === "in-progress" || b.status === "confirmed")
    .slice(0, limitN);
}

/** Estimates locked + sent to customer but not yet invoiced. */
export async function fetchEstimatesAwaiting(limitN = 5): Promise<BookingDoc[]> {
  const q = query(
    collection(db, "bookings"),
    where("estimateLocked", "==", true),
  );
  const snap = await getDocs(q);
  const rows = mapSnap(snap)
    .filter(b => b.isTest !== true)
    .filter(b => !b.invoiceId)
    .filter(b => !(typeof b.status === "string" && ACTIVE_PIPELINE_STATUSES_EXCLUDED.has(b.status)));
  rows.sort((a, b) => {
    const aT = a.customerEstimateSentAt?.toDate().getTime() ?? a.createdAt?.toDate().getTime() ?? 0;
    const bT = b.customerEstimateSentAt?.toDate().getTime() ?? b.createdAt?.toDate().getTime() ?? 0;
    return bT - aT;
  });
  return rows.slice(0, limitN);
}

/** Sum of estimateTotal across all pipeline bookings (no limit). */
export async function fetchPipelineSum(): Promise<{ total: number; count: number }> {
  const q = query(
    collection(db, "bookings"),
    where("estimateLocked", "==", true),
  );
  const snap = await getDocs(q);
  const rows = mapSnap(snap)
    .filter(b => b.isTest !== true)
    .filter(b => !b.invoiceId)
    .filter(b => !(typeof b.status === "string" && ACTIVE_PIPELINE_STATUSES_EXCLUDED.has(b.status)));
  const total = rows.reduce((acc, b) => acc + (typeof b.estimateTotal === "number" ? b.estimateTotal : 0), 0);
  return { total, count: rows.length };
}
