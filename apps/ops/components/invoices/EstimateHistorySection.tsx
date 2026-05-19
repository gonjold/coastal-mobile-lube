"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Card } from "@coastal/shared-ui";
import { db } from "@/lib/firebase";
import type { Booking } from "@/lib/types/booking";

interface Props {
  bookingId: string;
}

function fmt(n: number): string {
  return `$${(Math.round(n * 100) / 100).toFixed(2)}`;
}

function formatTimestamp(ts: { toDate: () => Date } | null | undefined): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as string);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// A3d STEP 6: read-only display of the parent booking's estimate state
// on the invoice detail page. Shown when invoice.source === 'tech_completion'
// so the admin can see the FDACS-signed estimate that produced the invoice
// without leaving the page. Estimate is frozen at acceptance; the invoice
// is editable post-completion. Stitches the two surfaces per GOALS §Mission
// intent ("edit the invoice that came from his estimate").
export default function EstimateHistorySection({ bookingId }: Props) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "bookings", bookingId));
        if (cancelled) return;
        if (!snap.exists()) {
          setError("Parent booking not found.");
          setLoading(false);
          return;
        }
        setBooking({ id: snap.id, ...snap.data() } as Booking);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load booking");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <Card className="p-5 gap-2 border-dashed">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Estimate (history)</h2>
        <div className="text-sm text-muted-foreground">Loading parent booking…</div>
      </Card>
    );
  }
  if (error || !booking) {
    return (
      <Card className="p-5 gap-2 border-dashed">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Estimate (history)</h2>
        <div className="text-sm text-amber-700">{error || "Parent booking unavailable."}</div>
      </Card>
    );
  }

  const lines = booking.estimateLineItems || [];
  const consent = booking.estimateConsent;
  const signedAt = booking.customerEstimateSignedAt;

  return (
    <Card className="p-5 gap-3 border-dashed">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Estimate (history)</h2>
        <span className="text-xs text-muted-foreground">
          {signedAt ? `Signed ${formatTimestamp(signedAt)}` : "Not signed"}
        </span>
      </div>

      {lines.length > 0 ? (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="py-2">Description</th>
              <th className="py-2 text-right w-16">Qty</th>
              <th className="py-2 text-right w-24">Rate</th>
              <th className="py-2 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="py-2">
                  {l.description}
                  {l.addedDuringWork && (
                    <span className="ml-2 rounded bg-orange-50 px-1.5 py-0.5 text-xs text-orange-700">Added mid-job</span>
                  )}
                </td>
                <td className="py-2 text-right">{l.qty}</td>
                <td className="py-2 text-right">{fmt(l.unitPrice)}</td>
                <td className="py-2 text-right">{fmt(l.qty * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-sm text-muted-foreground">No line items on parent estimate.</div>
      )}

      <dl className="text-sm space-y-1 mt-2 pt-2 border-t border-border">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{fmt(booking.estimateSubtotal ?? 0)}</dd></div>
        {(booking.estimateTaxableSubtotal ?? 0) > 0 && (
          <div className="flex justify-between text-muted-foreground"><dt>Tax (7.5%)</dt><dd>{fmt(booking.estimateTax ?? 0)}</dd></div>
        )}
        <div className="flex justify-between font-semibold"><dt>Estimate total</dt><dd>{fmt(booking.estimateTotal ?? 0)}</dd></div>
      </dl>

      {consent && (
        <div className="rounded bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="font-semibold uppercase tracking-wide">Consent on file</div>
          <div className="mt-1 text-foreground">
            {consent.choice === "simple_under_150" && "Customer authorized this work."}
            {consent.choice === "authorize_up_to" && `Authorized up to ${fmt(consent.authorizeUpTo ?? 0)}.`}
            {consent.choice === "contact_above" && `Contact required above ${fmt(consent.contactAbove ?? 0)}.`}
            {consent.choice === "no_contact" && "Customer declined contact regarding additional repairs."}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Estimate is historical and frozen at customer acceptance. Edit invoice fields above to revise the bill.
      </p>
    </Card>
  );
}
