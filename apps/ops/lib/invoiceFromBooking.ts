import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { getNextInvoiceNumber } from "./invoiceNumber";
import type { Booking } from "./types/booking";

const TAX_RATE = 0.075;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Builds and writes an invoice draft Firestore doc from a completed booking.
// Field shape aligns with the existing /admin/invoicing schema (invoiceNumber,
// lineItems[serviceName, quantity, unitPrice, lineTotal, taxable], subtotal,
// taxAmount, total, invoiceDate, dueDate, status, notes) and adds FDACS audit
// surfaces (estimateConsent, reAuthEvents, both customer signatures, source).
export async function createInvoiceDraftFromBooking(
  booking: Booking,
  completionSignatureUrl: string
): Promise<{ invoiceId: string; invoiceNumber: string }> {
  const invoiceNumber = await getNextInvoiceNumber();

  const sourceLines = booking.estimateLineItems || [];
  const lineItems = sourceLines.map((line) => ({
    serviceName: line.description,
    quantity: line.qty,
    unitPrice: line.unitPrice,
    lineTotal: round2(line.qty * line.unitPrice),
    taxable: !!line.taxable,
    partsCondition: line.partsCondition ?? null,
    addedDuringWork: line.addedDuringWork ?? false,
    reAuthEventId: line.reAuthEventId ?? null,
  }));

  const subtotal = round2(lineItems.reduce((s, l) => s + l.lineTotal, 0));
  const taxableSubtotal = round2(
    lineItems.filter((l) => l.taxable).reduce((s, l) => s + l.lineTotal, 0)
  );
  // Local tax/total are placeholders only — QB Automated Sales Tax recalculates
  // at sync time (WO-FDACS-E). Admin display uses qbTotalAmount when present.
  const taxAmount = round2(taxableSubtotal * TAX_RATE);
  const total = round2(subtotal + taxAmount);

  const today = new Date();
  const due = new Date();
  due.setDate(due.getDate() + 30);

  const customerName = booking.customerName || booking.name || "";
  const customerPhone = booking.customerPhone || booking.phone || "";
  const customerEmail = booking.customerEmail || booking.email || "";

  const data = {
    invoiceNumber,
    bookingId: booking.id,
    customerName,
    customerPhone,
    customerEmail,
    lineItems,
    subtotal,
    taxAmount,
    total,
    status: "draft" as const,
    notes: "",
    invoiceDate: toISODate(today),
    dueDate: toISODate(due),

    // FDACS audit-trail surfaces:
    source: "tech_completion" as const,
    vehicleInfo: booking.vehicleInfo || null,
    customerComplaint: booking.customerComplaint ?? null,
    photos: (booking.photos || []).map((p) => p.url),
    customerEstimateSignatureUrl: booking.customerEstimateSignatureUrl ?? null,
    customerEstimateSignedAt: booking.customerEstimateSignedAt ?? null,
    customerCompletionSignatureUrl: completionSignatureUrl,
    customerCompletionSignedAt: serverTimestamp(),
    // customerSignatureUrl is the existing single-signature column read by the
    // admin invoice panel; keep populated with the completion signature so
    // existing UI keeps working before D3 ships the dual-signature display.
    customerSignatureUrl: completionSignatureUrl,
    estimateConsent: booking.estimateConsent ?? null,
    reAuthEvents: booking.reAuthEvents ?? [],
    techCheckInAt: booking.techCheckInAt ?? null,
    jobCompletedAt: serverTimestamp(),
    assignedTechId: booking.assignedTechId ?? null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // A3d STEP 2: atomic bidirectional link. Pre-generate the invoice doc id
  // so we can write invoices/{id} and bookings/{bookingId}.invoiceId in a
  // single writeBatch. Caller (WorkInProgress.handleCompleteConfirm) no
  // longer needs to set invoiceId separately - the back-link is committed
  // here. Caller still owns the status/completion fields on the booking.
  const invoiceRef = doc(collection(db, "invoices"));
  const bookingRef = doc(db, "bookings", booking.id);

  const batch = writeBatch(db);
  batch.set(invoiceRef, data);
  batch.update(bookingRef, {
    invoiceId: invoiceRef.id,
    invoiceNumber,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  return { invoiceId: invoiceRef.id, invoiceNumber };
}
