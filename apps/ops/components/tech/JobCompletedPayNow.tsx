"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatPhone } from "@/lib/format";
import { openSmsForInvoice } from "@/lib/payNow";
import type { Booking } from "@/lib/types/booking";

interface Props {
  booking: Booking;
}

interface InvoiceLite {
  id: string;
  invoiceNumber: string;
  status?: string;
  qbPaymentLink?: string;
  paidDate?: string | null;
  customerName?: string;
  customerPhone?: string;
}

// Post-completion panel for the tech. Reads invoices/{booking.invoiceId} via
// onSnapshot. A2A3-U3: techs no longer auto-send invoices. The invoice is
// created in draft at Mark Complete; the owner reviews and sends from the
// office app. The tech panel reflects that handoff and only surfaces the SMS
// Pay Now shortcut once the owner has sent the invoice (qbPaymentLink set).
//
// States:
// 1. Draft (no qbPaymentLink): show review-handoff notice.
// 2. qbPaymentLink populated, not paid: show "Send payment link via SMS".
// 3. paidDate set: show paid status.
export default function JobCompletedPayNow({ booking }: Props) {
  const invoiceId = booking.invoiceId;
  const [invoice, setInvoice] = useState<InvoiceLite | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    const unsub = onSnapshot(doc(db, "invoices", invoiceId), (snap) => {
      if (!snap.exists()) {
        setInvoice(null);
        return;
      }
      const d = snap.data() as Record<string, unknown>;
      setInvoice({
        id: snap.id,
        invoiceNumber: (d.invoiceNumber as string) || "",
        status: d.status as string | undefined,
        qbPaymentLink: d.qbPaymentLink as string | undefined,
        paidDate: (d.paidDate as string | null | undefined) ?? null,
        customerName: d.customerName as string | undefined,
        customerPhone: d.customerPhone as string | undefined,
      });
    });
    return unsub;
  }, [invoiceId]);

  if (!invoiceId) return null;
  if (!invoice) {
    return (
      <Section title="Invoice">
        <div className="text-sm text-slate-500">Loading invoice…</div>
      </Section>
    );
  }

  const customerName = invoice.customerName || booking.customerName || booking.name || "Customer";
  const customerPhone = invoice.customerPhone || booking.customerPhone || booking.phone || "";

  if (invoice.paidDate) {
    return (
      <Section title="Invoice">
        <div className="text-base font-semibold text-[#0B2040]">
          #{invoice.invoiceNumber}
        </div>
        <div className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-800">
          Paid {invoice.paidDate}
        </div>
      </Section>
    );
  }

  function handleSendSms() {
    if (!invoice || !invoice.qbPaymentLink) return;
    const opened = openSmsForInvoice(
      { invoiceNumber: invoice.invoiceNumber, qbPaymentLink: invoice.qbPaymentLink },
      { name: customerName, phone: customerPhone },
    );
    if (!opened) {
      setError(
        !customerPhone
          ? "Customer phone is missing; cannot send SMS."
          : "Could not open Messages.",
      );
    }
  }

  const canSms = !!invoice.qbPaymentLink && !!customerPhone;

  return (
    <Section title="Invoice">
      <div className="text-base font-semibold text-[#0B2040]">
        #{invoice.invoiceNumber}
      </div>
      <div className="mt-2 space-y-3">
        {!invoice.qbPaymentLink && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            Draft created. The owner will review and send this invoice.
          </div>
        )}
        {invoice.qbPaymentLink && (
          <>
            <p className="text-sm text-slate-600">
              {customerPhone
                ? `Send the Pay Now link to ${formatPhone(customerPhone)} via SMS.`
                : "Customer phone is missing; ask Jason to update the booking before sending."}
            </p>
            <button
              onClick={handleSendSms}
              disabled={!canSms}
              className="w-full min-h-[48px] rounded-lg bg-[#E07B2D] px-4 py-3 text-base font-semibold text-white shadow disabled:opacity-50"
            >
              Send payment link via SMS
            </button>
          </>
        )}
        {error && (
          <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>
        )}
      </div>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  );
}
