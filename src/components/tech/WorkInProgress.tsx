"use client";

import { useEffect, useRef, useState } from "react";
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Booking } from "@/app/admin/shared";
import AddLineItemModal, { NewLineItem } from "./AddLineItemModal";
import PhotoCapture from "./PhotoCapture";
import ReAuthModal from "./ReAuthModal";
import MarkCompleteModal from "./MarkCompleteModal";
import { createInvoiceDraftFromBooking } from "@/lib/invoiceFromBooking";

const TAX_RATE = 0.075;

type LineItem = NonNullable<Booking["estimateLineItems"]>[number];
type ConsentChoice = NonNullable<Booking["estimateConsent"]>["choice"];
type ReAuthEvent = NonNullable<Booking["reAuthEvents"]>[number];

interface Props {
  booking: Booking;
}

interface PendingChange {
  newLines: LineItem[];
  triggerLine: LineItem;
  triggerLineId: string;
  newTotal: number;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return `$${round2(n).toFixed(2)}`;
}

function computeTotalsFromLines(lines: LineItem[]) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const taxableSubtotal = lines
    .filter((l) => l.taxable)
    .reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const tax = taxableSubtotal * TAX_RATE;
  const total = subtotal + tax;
  return { subtotal, taxableSubtotal, tax, total };
}

function computeThreshold(
  consent: Booking["estimateConsent"],
  estimateTotalAtSign: number
): number {
  if (!consent) return Infinity;
  switch (consent.choice) {
    case "simple_under_150":
      return 150;
    case "authorize_up_to":
      return consent.authorizeUpTo ?? estimateTotalAtSign;
    case "contact_above":
      return consent.contactAbove ?? 0;
    case "no_contact":
      return estimateTotalAtSign;
    default:
      return Infinity;
  }
}

export default function WorkInProgress({ booking }: Props) {
  const lines = booking.estimateLineItems ?? [];
  const consent = booking.estimateConsent;
  const consentChoice: ConsentChoice | null = consent?.choice ?? null;
  const estimateTotalAtSign = booking.estimateTotal ?? 0;
  const threshold = computeThreshold(consent, estimateTotalAtSign);
  const customerName = booking.customerName || booking.name || "Customer";

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Odometer Out — local state, auto-save on blur, reverts on failure
  const odoSavedRef = useRef<string>(
    booking.vehicleInfo?.odometerOut != null
      ? String(booking.vehicleInfo.odometerOut)
      : ""
  );
  const [odoLocal, setOdoLocal] = useState<string>(odoSavedRef.current);

  useEffect(() => {
    const incoming =
      booking.vehicleInfo?.odometerOut != null
        ? String(booking.vehicleInfo.odometerOut)
        : "";
    if (incoming !== odoSavedRef.current) {
      odoSavedRef.current = incoming;
      // Only sync visible value if user isn't mid-edit
      setOdoLocal((prev) => (prev === odoSavedRef.current ? prev : incoming));
    }
  }, [booking.vehicleInfo?.odometerOut]);

  const odometerIn =
    booking.vehicleInfo?.odometerIn ?? booking.odometerIn ?? null;

  async function persistLines(
    newLines: LineItem[],
    eventToAppend?: ReAuthEvent
  ) {
    const totals = computeTotalsFromLines(newLines);
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        estimateLineItems: newLines.map((l) => ({
          id: l.id,
          description: l.description,
          qty: l.qty,
          unitPrice: l.unitPrice,
          taxable: l.taxable,
          partsCondition: l.partsCondition ?? null,
          sourceServiceId: l.sourceServiceId ?? null,
          ...(l.addedDuringWork ? { addedDuringWork: true } : {}),
          ...(l.reAuthEventId ? { reAuthEventId: l.reAuthEventId } : {}),
        })),
        estimateSubtotal: round2(totals.subtotal),
        estimateTaxableSubtotal: round2(totals.taxableSubtotal),
        estimateTax: round2(totals.tax),
        estimateTotal: round2(totals.total),
        updatedAt: serverTimestamp(),
        ...(eventToAppend ? { reAuthEvents: arrayUnion(eventToAppend) } : {}),
      };
      await updateDoc(doc(db, "bookings", booking.id), payload);
    } catch (e) {
      console.error("WorkInProgress persist failed", e);
      setError(e instanceof Error ? e.message : "Save failed");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  function handleAdd(line: NewLineItem) {
    const newLine: LineItem = {
      id: newId(),
      description: line.description,
      qty: line.qty,
      unitPrice: line.unitPrice,
      taxable: line.taxable,
      partsCondition: null,
      sourceServiceId: line.sourceServiceId,
      addedDuringWork: true,
    };
    const newLines = [...lines, newLine];
    const totals = computeTotalsFromLines(newLines);
    setShowAddModal(false);

    if (totals.total > threshold) {
      setPendingChange({
        newLines,
        triggerLine: newLine,
        triggerLineId: newLine.id,
        newTotal: totals.total,
      });
    } else {
      void persistLines(newLines);
    }
  }

  async function handleSaveEdit(updated: LineItem) {
    const newLines = lines.map((l) => (l.id === updated.id ? updated : l));
    const totals = computeTotalsFromLines(newLines);
    setEditingLineId(null);

    if (totals.total > threshold) {
      setPendingChange({
        newLines,
        triggerLine: updated,
        triggerLineId: updated.id,
        newTotal: totals.total,
      });
    } else {
      await persistLines(newLines);
    }
  }

  async function handleRemove(lineId: string) {
    if (!confirm("Remove this line item?")) return;
    const newLines = lines.filter((l) => l.id !== lineId);
    setEditingLineId(null);
    await persistLines(newLines);
  }

  async function handleReAuthConfirm(eventInfo: {
    method: "in_person_signature" | "phone";
    signatureUrl?: string;
    note?: string;
  }) {
    if (!pendingChange) return;
    const eventId = newId();
    const reAuthEvent: ReAuthEvent = {
      id: eventId,
      timestamp: Timestamp.now(),
      method: eventInfo.method,
      customerName,
      ...(eventInfo.signatureUrl ? { signatureUrl: eventInfo.signatureUrl } : {}),
      ...(eventInfo.note ? { note: eventInfo.note } : {}),
      lineItemIds: [pendingChange.triggerLineId],
    };
    const stamped = pendingChange.newLines.map((l) =>
      l.id === pendingChange.triggerLineId
        ? { ...l, reAuthEventId: eventId }
        : l
    );
    try {
      await persistLines(stamped, reAuthEvent);
      setPendingChange(null);
    } catch {
      // error already surfaced — leave modal open for retry
    }
  }

  async function commitOdometerOut() {
    const trimmed = odoLocal.replace(/[^\d]/g, "");
    setOdoLocal(trimmed);
    if (trimmed === odoSavedRef.current) return;
    const previous = odoSavedRef.current;
    odoSavedRef.current = trimmed;
    try {
      const value =
        trimmed === ""
          ? null
          : Math.max(0, Math.min(9_999_999, parseInt(trimmed, 10)));
      await updateDoc(doc(db, "bookings", booking.id), {
        "vehicleInfo.odometerOut": value,
        odometerOut: value,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Odometer out save failed", e);
      odoSavedRef.current = previous;
      setOdoLocal(previous);
      setError(e instanceof Error ? e.message : "Failed to save odometer");
    }
  }

  const odoOutNum = odoLocal === "" ? null : parseInt(odoLocal, 10);
  const showOdoWarning =
    odoOutNum != null && odometerIn != null && odoOutNum < odometerIn;

  // Gate Mark Complete on a persisted Odometer Out (FS 559.911 invoice
  // requirement). We read from the persisted ref (not local state) so an
  // unblurred typed value doesn't enable the button.
  const odometerOutPersisted = booking.vehicleInfo?.odometerOut ?? booking.odometerOut ?? null;
  const canMarkComplete = odometerOutPersisted != null;

  async function handleCompleteConfirm({
    completionSignatureUrl,
  }: {
    completionSignatureUrl: string;
  }) {
    // Invoice creation must succeed before we flip booking status; that way
    // a failed sync doesn't leave the booking in 'completed' without an
    // invoice. Signature is already in Storage at this point — orphan PNG
    // is harmless.
    const { invoiceId, invoiceNumber } = await createInvoiceDraftFromBooking(
      booking,
      completionSignatureUrl
    );
    await updateDoc(doc(db, "bookings", booking.id), {
      status: "completed",
      customerCompletionSignatureUrl: completionSignatureUrl,
      customerCompletionSignedAt: serverTimestamp(),
      jobCompletedAt: serverTimestamp(),
      invoiceId,
      invoiceNumber,
      updatedAt: serverTimestamp(),
    });
    // onSnapshot in the page re-renders into <JobCompleted>; modal unmounts.
  }

  const photos = booking.photos ?? [];
  const liveTotals = computeTotalsFromLines(lines);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Line Items
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-2 py-1 text-sm font-semibold text-[#E07B2D]"
          >
            + Add line item
          </button>
        </div>
        {lines.length === 0 && (
          <div className="text-sm text-slate-500">No line items yet.</div>
        )}
        <div className="space-y-2">
          {lines.map((l) => (
            <div
              key={l.id}
              className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0"
            >
              <div className="flex-1">
                <div className="text-sm text-[#0B2040]">
                  {l.description}
                  {l.addedDuringWork && (
                    <span className="ml-2 rounded bg-orange-50 px-1.5 py-0.5 text-xs text-orange-700">
                      Added mid-job
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {l.qty} × {fmt(l.unitPrice)}
                  {l.taxable ? " · taxable" : ""}
                </div>
              </div>
              <div className="text-sm text-slate-700">
                {fmt(l.qty * l.unitPrice)}
              </div>
              <button
                onClick={() => setEditingLineId(l.id)}
                className="px-2 py-1 text-xs text-slate-500 underline"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{fmt(liveTotals.subtotal)}</span>
          </div>
          {liveTotals.taxableSubtotal > 0 && (
            <div className="flex justify-between">
              <span>Tax (7.5%)</span>
              <span>{fmt(liveTotals.tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-[#0B2040]">
            <span>Total</span>
            <span>{fmt(liveTotals.total)}</span>
          </div>
          {threshold !== Infinity && (
            <div className="text-xs text-slate-500">
              Authorization threshold: {fmt(threshold)}
              {liveTotals.total > threshold && (
                <span className="ml-2 text-orange-700">— re-auth on file</span>
              )}
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Photos
        </h2>
        <PhotoCapture bookingId={booking.id} photos={photos} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Odometer Out
        </h2>
        {odometerIn != null && (
          <div className="mb-2 text-xs text-slate-500">
            Odometer In: {odometerIn.toLocaleString()} mi
          </div>
        )}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={odoLocal}
          onChange={(e) => setOdoLocal(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={commitOdometerOut}
          placeholder="Mileage at job completion"
          className="w-full rounded border border-slate-300 px-3 py-3 text-base"
        />
        {showOdoWarning && (
          <p className="mt-2 text-sm text-orange-700">
            Odometer Out is below Odometer In.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <button
          onClick={() => setShowCompleteModal(true)}
          disabled={!canMarkComplete}
          className="w-full min-h-[48px] rounded-lg bg-[#E07B2D] px-4 py-3 text-base font-semibold text-white shadow disabled:bg-slate-300 disabled:shadow-none"
        >
          Mark Complete
        </button>
        {!canMarkComplete && (
          <div className="mt-2 text-xs text-slate-500">
            Odometer Out is required to mark this job complete.
          </div>
        )}
      </section>

      {showAddModal && (
        <AddLineItemModal
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingLineId &&
        (() => {
          const line = lines.find((l) => l.id === editingLineId);
          if (!line) return null;
          return (
            <EditLineItemModal
              line={line}
              onSave={handleSaveEdit}
              onRemove={() => handleRemove(line.id)}
              onClose={() => setEditingLineId(null)}
            />
          );
        })()}

      {pendingChange && consentChoice && (
        <ReAuthModal
          bookingId={booking.id}
          customerName={customerName}
          consentChoice={consentChoice}
          threshold={threshold}
          pendingNewTotal={pendingChange.newTotal}
          pendingLineDescription={pendingChange.triggerLine.description}
          onConfirm={handleReAuthConfirm}
          onCancel={() => setPendingChange(null)}
        />
      )}

      {showCompleteModal && (
        <MarkCompleteModal
          booking={booking}
          onConfirm={handleCompleteConfirm}
          onCancel={() => setShowCompleteModal(false)}
        />
      )}

      {busy && (
        <div className="fixed bottom-4 right-4 rounded bg-black/70 px-3 py-1 text-xs text-white">
          Saving…
        </div>
      )}
    </div>
  );
}

function EditLineItemModal({
  line,
  onSave,
  onRemove,
  onClose,
}: {
  line: LineItem;
  onSave: (updated: LineItem) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(line.description);
  const [qty, setQty] = useState(String(line.qty));
  const [unitPrice, setUnitPrice] = useState(String(line.unitPrice));
  const [taxable, setTaxable] = useState(line.taxable);

  const qtyNum = parseInt(qty, 10);
  const priceNum = parseFloat(unitPrice);
  const valid =
    description.trim().length > 0 &&
    !isNaN(qtyNum) &&
    qtyNum >= 1 &&
    qtyNum <= 99 &&
    !isNaN(priceNum) &&
    priceNum >= 0;

  function handleSave() {
    if (!valid) return;
    onSave({
      ...line,
      description: description.trim(),
      qty: qtyNum,
      unitPrice: priceNum,
      taxable,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-bold text-[#0B2040]">Edit Line Item</h2>
        <button
          onClick={onClose}
          className="min-h-[48px] min-w-[48px] rounded text-2xl text-slate-500 hover:text-slate-700"
          aria-label="Close"
        >
          ×
        </button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-3 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Qty
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-3 text-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Unit Price
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-3 text-base"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-base">
          <input
            type="checkbox"
            checked={taxable}
            onChange={(e) => setTaxable(e.target.checked)}
            className="h-5 w-5"
          />
          Taxable
        </label>
        <button
          onClick={onRemove}
          className="inline-flex items-center px-2 py-3 text-sm text-red-600 underline"
        >
          Remove this line item
        </button>
      </div>
      <div className="border-t border-slate-200 bg-white p-3">
        <button
          onClick={handleSave}
          disabled={!valid}
          className="w-full min-h-[48px] rounded-lg bg-[#E07B2D] px-4 py-4 text-base font-semibold text-white shadow disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
