"use client";

import { useRef, useState } from "react";
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import SignaturePad, { SignaturePadHandle } from "./SignaturePad";
import { formatPhone } from "@/lib/format";
import type { Booking } from "@/lib/types/booking";

interface Props {
  booking: Booking;
  onConfirm: (data: { completionSignatureUrl: string }) => Promise<void>;
  onCancel: () => void;
}

function fmt(n: number): string {
  return `$${(Math.round(n * 100) / 100).toFixed(2)}`;
}

export default function MarkCompleteModal({ booking, onConfirm, onCancel }: Props) {
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sigPadRef = useRef<SignaturePadHandle | null>(null);
  const submittingRef = useRef(false);

  const lineItems = booking.estimateLineItems || [];
  const subtotal = lineItems.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const photoCount = (booking.photos || []).length;
  const reAuthCount = (booking.reAuthEvents || []).length;
  const customerName = booking.customerName || booking.name || "Customer";
  const customerPhone = booking.customerPhone || booking.phone || "";
  const v = booking.vehicleInfo;
  const fallbackVehicle = [
    booking.vehicleYear,
    booking.vehicleMake,
    booking.vehicleModel,
    booking.vehicleTrim,
  ]
    .filter(Boolean)
    .join(" ");
  const vehicleDisplay =
    [v?.year, v?.make, v?.model, v?.trim].filter(Boolean).join(" ") ||
    fallbackVehicle ||
    "Vehicle pending";
  const odoIn = v?.odometerIn ?? booking.odometerIn ?? null;
  const odoOut = v?.odometerOut ?? booking.odometerOut ?? null;

  async function handleConfirm() {
    if (submittingRef.current) return;
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setError("Customer signature is required to mark this job complete.");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const dataUrl = sigPadRef.current.toDataURL();
      const ts = Date.now();
      const path = `signatures/${booking.id}/completion-${ts}.png`;
      const fileRef = storageRef(storage, path);
      await uploadString(fileRef, dataUrl, "data_url", {
        contentType: "image/png",
      });
      const url = await getDownloadURL(fileRef);
      await onConfirm({ completionSignatureUrl: url });
      // Parent unmounts on status flip; if it doesn't, allow retry.
    } catch (err) {
      console.error("Mark complete failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to complete job. Try again.";
      setError(msg);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-bold text-[#0B2040]">Mark job complete</h2>
        <button
          onClick={onCancel}
          disabled={submitting}
          className="min-h-[48px] min-w-[48px] rounded text-2xl text-slate-500 hover:text-slate-700 disabled:opacity-50"
          aria-label="Cancel"
        >
          ×
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Final review
          </h3>
          <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <div>
              <strong className="text-[#0B2040]">{customerName}</strong>
              {customerPhone ? ` · ${formatPhone(customerPhone)}` : ""}
            </div>
            <div>{vehicleDisplay}</div>
            {(v?.vin || booking.vin) && (
              <div className="font-mono text-xs">VIN: {v?.vin || booking.vin}</div>
            )}
            <div>
              Odometer: {odoIn != null ? `${odoIn.toLocaleString()} mi` : "—"} →{" "}
              {odoOut != null ? `${odoOut.toLocaleString()} mi` : "—"}
            </div>
            <div>
              {lineItems.length} line item{lineItems.length === 1 ? "" : "s"} ·{" "}
              {fmt(subtotal)} subtotal
            </div>
            <div>
              {photoCount === 0
                ? "No photos captured"
                : `${photoCount} photo${photoCount === 1 ? "" : "s"} captured`}
            </div>
            {reAuthCount > 0 && (
              <div>
                {reAuthCount} re-authorization{reAuthCount === 1 ? "" : "s"} on file
              </div>
            )}
          </div>
        </section>

        {booking.customerEstimateSignatureUrl && (
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Original estimate signature
            </h3>
            <img
              src={booking.customerEstimateSignatureUrl}
              alt="Customer estimate signature"
              className="w-full rounded border border-slate-200 bg-white"
              style={{ maxHeight: 80, objectFit: "contain" }}
            />
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Customer signature
          </h3>
          <p className="mb-2 text-sm text-slate-600">
            Customer signs below to acknowledge the work was completed as described.
          </p>
          <SignaturePad ref={sigPadRef} onChange={setSignatureEmpty} />
          <button
            onClick={() => {
              sigPadRef.current?.clear();
              setSignatureEmpty(true);
            }}
            disabled={submitting}
            className="mt-1 inline-flex items-center px-2 py-3 text-sm text-slate-500 underline disabled:opacity-50"
          >
            Clear
          </button>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white p-3 space-y-2">
        <button
          onClick={handleConfirm}
          disabled={submitting || signatureEmpty}
          className="w-full min-h-[48px] rounded-lg bg-[#E07B2D] px-4 py-4 text-base font-semibold text-white shadow disabled:opacity-50"
        >
          {submitting ? "Completing…" : "Confirm Complete"}
        </button>
        <button
          onClick={onCancel}
          disabled={submitting}
          className="w-full min-h-[48px] rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 disabled:opacity-50"
        >
          Cancel
        </button>
      </footer>
    </div>
  );
}
