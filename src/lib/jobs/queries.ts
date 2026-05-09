/**
 * Field UI data layer.
 *
 * Phase 1 introduced a forward-looking `Job` type, but the live operational
 * collection is still `bookings` (Booking shape in @/app/admin/shared). This
 * module reads bookings and shapes them into a Job-like view model the field
 * UI consumes. When a future migration moves data to a `jobs` collection,
 * only this file needs to change.
 */
import type { Booking } from "@/app/admin/shared";
import { getBookingCalendarDate, formatTimeWindow } from "@/app/admin/shared";
import { getAdminDb } from "@/lib/firebase-admin";

export type ScheduleJobStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "new-lead";

export type ScheduleJob = {
  id: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledWindow: string | null;
  status: ScheduleJobStatus | string;
  serviceCategory: string | null;
  serviceLabel: string;
  assignedTechId: string | null;
  notes: string | null;
  customer: {
    name: string;
    phone: string | null;
    address: string | null;
  };
  asset: {
    type: "vehicle" | "boat" | "trailer" | "fleet_vehicle" | "unknown";
    displayName: string | null;
  };
  // Phase C surface flags — used by 2D to lock the UI when QB is finalized.
  qboInvoiceFinalized: boolean;
  invoiceId: string | null;
  invoiceNumber: string | null;
  // Check-in surface — used by 2C/2D.
  techCheckedInAt: string | null;
  jobStartedAt: string | null;
  jobCompletedAt: string | null;
};

function customerName(b: Booking): string {
  const n = b.name || b.customerName || "";
  return n.trim() || "Unknown";
}

function customerPhone(b: Booking): string | null {
  return b.phone || b.customerPhone || null;
}

function customerAddress(b: Booking): string | null {
  if (b.address) return b.address;
  if (b.zip) return `ZIP ${b.zip}`;
  return null;
}

function assetView(b: Booking): ScheduleJob["asset"] {
  if (b.vehicleYear || b.vehicleMake || b.vehicleModel) {
    const parts = [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean);
    return {
      type: "vehicle",
      displayName: parts.join(" ") || null,
    };
  }
  if (b.vesselYear || b.vesselMake || b.vesselModel) {
    const parts = [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean);
    return {
      type: "boat",
      displayName: parts.join(" ") || null,
    };
  }
  return { type: "unknown", displayName: null };
}

function serviceLabelFor(b: Booking): string {
  if (b.service) return b.service;
  if (b.selectedServices?.length) {
    const names = b.selectedServices
      .map((s) => s.name)
      .filter(Boolean)
      .join(", ");
    if (names) return names;
  }
  if (b.serviceCategory) return b.serviceCategory;
  return "";
}

function tsToISO(ts: unknown): string | null {
  if (!ts) return null;
  const t = ts as { toDate?: () => Date };
  if (typeof t.toDate === "function") {
    return t.toDate().toISOString();
  }
  if (typeof ts === "string") return ts;
  return null;
}

/**
 * Adapter: Booking → ScheduleJob. Pure, no I/O — exported so the same shape
 * is used by Today, Schedule, and Job Sheet.
 */
export function bookingToScheduleJob(b: Booking): ScheduleJob | null {
  const date = getBookingCalendarDate(b);
  if (!date) return null;
  const window =
    b.confirmedArrivalWindow ?? formatTimeWindow(b.timeWindow) ?? null;
  return {
    id: b.id,
    scheduledDate: date,
    scheduledWindow: window,
    status: (b.status as ScheduleJobStatus) ?? "pending",
    serviceCategory: b.serviceCategory ?? null,
    serviceLabel: serviceLabelFor(b),
    assignedTechId: b.assignedTechId ?? null,
    notes: b.notes ?? null,
    customer: {
      name: customerName(b),
      phone: customerPhone(b),
      address: customerAddress(b),
    },
    asset: assetView(b),
    qboInvoiceFinalized: Boolean(b.invoiceId),
    invoiceId: b.invoiceId ?? null,
    invoiceNumber: b.invoiceNumber ?? null,
    techCheckedInAt: tsToISO(b.techCheckInAt),
    jobStartedAt: tsToISO(b.jobStartedAt),
    jobCompletedAt: tsToISO(b.jobCompletedAt),
  };
}

/**
 * Hydrate a list of Bookings into ScheduleJobs. Filters out test bookings,
 * bookings with no schedulable date, and sorts by date asc then start hour.
 */
export function hydrateJobs(bookings: Booking[]): ScheduleJob[] {
  const jobs: ScheduleJob[] = [];
  for (const b of bookings) {
    if (b.isTest) continue;
    const j = bookingToScheduleJob(b);
    if (j) jobs.push(j);
  }
  jobs.sort((a, b) => {
    if (a.scheduledDate !== b.scheduledDate) {
      return a.scheduledDate.localeCompare(b.scheduledDate);
    }
    const aw = a.scheduledWindow ?? "";
    const bw = b.scheduledWindow ?? "";
    return aw.localeCompare(bw);
  });
  return jobs;
}

/**
 * Server-side fetch: load bookings whose calendar date falls in [startDate,
 * endDate] (inclusive), hydrated into ScheduleJobs.
 *
 * Implementation note: bookings calendar date is derived (confirmedDate ||
 * preferredDate || createdAt). We can't index that in Firestore directly, so
 * we union-query on confirmedDate and preferredDate within the window and
 * dedupe by id. This is fine at Coastal's volume.
 */
export async function getScheduleJobs(opts: {
  startDate: string;
  endDate: string;
}): Promise<ScheduleJob[]> {
  const db = getAdminDb();
  if (!db) return [];

  try {
    const [confirmedSnap, preferredSnap] = await Promise.all([
      db
        .collection("bookings")
        .where("confirmedDate", ">=", opts.startDate)
        .where("confirmedDate", "<=", opts.endDate)
        .get(),
      db
        .collection("bookings")
        .where("preferredDate", ">=", opts.startDate)
        .where("preferredDate", "<=", opts.endDate)
        .get(),
    ]);

    const seen = new Map<string, Booking>();
    for (const d of confirmedSnap.docs) {
      seen.set(d.id, { id: d.id, ...(d.data() as Omit<Booking, "id">) });
    }
    for (const d of preferredSnap.docs) {
      if (!seen.has(d.id)) {
        seen.set(d.id, { id: d.id, ...(d.data() as Omit<Booking, "id">) });
      }
    }

    const jobs = hydrateJobs([...seen.values()]);
    // Final filter: confirmedDate may be in window but preferredDate older —
    // hydrateJobs picks getBookingCalendarDate which prefers confirmedDate,
    // so filter again on the resolved scheduledDate.
    return jobs.filter(
      (j) => j.scheduledDate >= opts.startDate && j.scheduledDate <= opts.endDate,
    );
  } catch (err) {
    console.error("[jobs.queries] getScheduleJobs failed:", err);
    return [];
  }
}

/**
 * Fetch a single ScheduleJob by id (booking doc id). Returns null if missing.
 */
export async function getScheduleJob(id: string): Promise<ScheduleJob | null> {
  const db = getAdminDb();
  if (!db) return null;

  try {
    const snap = await db.collection("bookings").doc(id).get();
    if (!snap.exists) return null;
    const booking = { id: snap.id, ...(snap.data() as Omit<Booking, "id">) };
    return bookingToScheduleJob(booking);
  } catch (err) {
    console.error("[jobs.queries] getScheduleJob failed:", err);
    return null;
  }
}

export type JobLineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  taxable: boolean;
};

export type JobPhoto = {
  id: string;
  url: string;
  capturedAt: string | null;
  caption?: string;
};

export type JobSignature = {
  url: string;
  signedAt: string | null;
};

export type JobDetail = ScheduleJob & {
  notes: string | null;
  lineItems: JobLineItem[];
  photos: JobPhoto[];
  signatures: {
    estimate: JobSignature | null;
    completion: JobSignature | null;
  };
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
  // QB invoice surface — read-only display in 2D; finalize itself is a future
  // FDACS WO. qboInvoiceFinalized is true when a QB invoice id is present.
  qboInvoiceId: string | null;
  qboInvoiceNumber: string | null;
  qboInvoiceFinalized: boolean;
  customer: ScheduleJob["customer"] & {
    email: string | null;
  };
};

function bookingToJobDetail(b: Booking): JobDetail | null {
  const base = bookingToScheduleJob(b);
  if (!base) return null;

  const lineItems: JobLineItem[] = (b.estimateLineItems ?? []).map((it) => ({
    id: it.id,
    description: it.description,
    qty: it.qty,
    unitPrice: it.unitPrice,
    totalPrice: it.qty * it.unitPrice,
    taxable: it.taxable,
  }));

  const photos: JobPhoto[] = (b.photos ?? []).map((p, idx) => ({
    id: `photo-${idx}`,
    url: p.url,
    capturedAt: tsToISO(p.capturedAt),
    caption: p.caption,
  }));

  const estimateSig = b.customerEstimateSignatureUrl
    ? {
        url: b.customerEstimateSignatureUrl,
        signedAt: tsToISO(b.customerEstimateSignedAt),
      }
    : null;
  const completionSig = b.customerCompletionSignatureUrl
    ? {
        url: b.customerCompletionSignatureUrl,
        signedAt: tsToISO(b.customerCompletionSignedAt),
      }
    : null;

  return {
    ...base,
    customer: {
      ...base.customer,
      email: b.email ?? b.customerEmail ?? null,
    },
    notes: b.notes ?? null,
    lineItems,
    photos,
    signatures: {
      estimate: estimateSig,
      completion: completionSig,
    },
    totals: {
      subtotal: b.estimateSubtotal ?? 0,
      tax: b.estimateTax ?? 0,
      total: b.estimateTotal ?? 0,
    },
    qboInvoiceId: b.invoiceId ?? null,
    qboInvoiceNumber: b.invoiceNumber ?? null,
    qboInvoiceFinalized: Boolean(b.invoiceId),
  };
}

export async function getJobDetail(id: string): Promise<JobDetail | null> {
  const db = getAdminDb();
  if (!db) return null;
  try {
    const snap = await db.collection("bookings").doc(id).get();
    if (!snap.exists) return null;
    const booking = { id: snap.id, ...(snap.data() as Omit<Booking, "id">) };
    const detail = bookingToJobDetail(booking);
    if (!detail) return null;

    // Bidirectional invoice link is asymmetric: the tech-app Mark Complete
    // flow writes booking.invoiceId, but invoices created via the legacy
    // admin "New Invoice" form only set invoice.bookingId — they never
    // write back to the booking. Fall back to a lookup by bookingId so the
    // field UI's Email-link button surfaces those invoices too.
    if (!detail.qboInvoiceId) {
      const invSnap = await db
        .collection("invoices")
        .where("bookingId", "==", id)
        .limit(5)
        .get();
      type InvoiceLite = {
        id: string;
        invoiceNumber?: string;
        deleted?: boolean;
        createdAt?: { toMillis?: () => number };
      };
      const live: InvoiceLite[] = invSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<InvoiceLite, "id">) }))
        .filter((d) => d.deleted !== true);
      if (live.length > 0) {
        live.sort((a, b) => {
          const at = a.createdAt?.toMillis?.() ?? 0;
          const bt = b.createdAt?.toMillis?.() ?? 0;
          return bt - at;
        });
        const inv = live[0];
        return {
          ...detail,
          qboInvoiceId: inv.id,
          qboInvoiceNumber: inv.invoiceNumber ?? null,
          qboInvoiceFinalized: true,
        };
      }
    }
    return detail;
  } catch (err) {
    console.error("[jobs.queries] getJobDetail failed:", err);
    return null;
  }
}

export type TodayJobs = {
  inProgress: ScheduleJob[];
  upcoming: ScheduleJob[];
};

/**
 * Today tab data: in-progress jobs (any date) + upcoming-today jobs (today,
 * not yet started/completed/cancelled). Bookings status mapping:
 *   - in-progress: status === "in_progress"
 *   - upcoming   : scheduledDate === today AND status NOT IN
 *                  ("in_progress", "completed", "cancelled", "new-lead")
 */
export async function getTodayJobs(date: string): Promise<TodayJobs> {
  const db = getAdminDb();
  if (!db) return { inProgress: [], upcoming: [] };

  try {
    const [inProgressSnap, todayJobs] = await Promise.all([
      db.collection("bookings").where("status", "==", "in_progress").get(),
      getScheduleJobs({ startDate: date, endDate: date }),
    ]);

    const inProgressBookings: Booking[] = inProgressSnap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }),
    );
    const inProgress = hydrateJobs(inProgressBookings);

    const inProgressIds = new Set(inProgress.map((j) => j.id));
    const upcoming = todayJobs.filter((j) => {
      if (inProgressIds.has(j.id)) return false;
      if (
        j.status === "in_progress" ||
        j.status === "completed" ||
        j.status === "cancelled" ||
        j.status === "new-lead"
      ) {
        return false;
      }
      return true;
    });

    return { inProgress, upcoming };
  } catch (err) {
    console.error("[jobs.queries] getTodayJobs failed:", err);
    return { inProgress: [], upcoming: [] };
  }
}
