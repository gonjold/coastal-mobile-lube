"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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

const SEND_INVOICE_ENDPOINT =
  "https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceWithQBPayment";

// Pay Now post-completion panel. Reads invoices/{booking.invoiceId} via
// onSnapshot. Three states:
// 1. invoice.status === 'draft' or no qbPaymentLink yet:
//    Show "Send invoice + generate Pay Now link" CTA. One-tap fires
//    sendInvoiceWithQBPayment Cloud Function (idempotent on qbInvoiceId
//    server-side, plus a client submittingRef guard for double-tap).
// 2. invoice.qbPaymentLink populated and not paid:
//    Show "Send payment link via SMS" CTA. Tap opens iOS Messages
//    with prefilled body via openSmsForInvoice.
// 3. invoice.paidDate set:
//    Show paid status, no button.
export default function JobCompletedPayNow({ booking }: Props) {
  const invoiceId = booking.invoiceId;
  const [invoice, setInvoice] = useState<InvoiceLite | null>(null);
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);

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

  async function handleSendInvoice() {
    if (sendingRef.current) return;
    if (!invoice) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    setSentMessage(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const body = {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName,
        customerEmail: booking.customerEmail || booking.email || "",
        customerPhone,
        customerAddress: booking.address || "",
        customerId: "",
        lineItems: [],
        subtotal: 0,
        tax: 0,
        convenienceFee: 0,
        total: 0,
        vehicle: "",
        dueDate: "",
      };
      const res = await fetch(SEND_INVOICE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Send failed (${res.status}): ${text || "unknown"}`);
      }
      setSentMessage("Invoice sent. Payment link will appear in a moment.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
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
          <>
            <p className="text-sm text-slate-600">
              Send the invoice email and generate a customer payment link.
            </p>
            <button
              onClick={handleSendInvoice}
              disabled={sending}
              className="w-full min-h-[48px] rounded-lg bg-[#0B2040] px-4 py-3 text-base font-semibold text-white shadow disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send invoice + generate Pay Now link"}
            </button>
            {sentMessage && (
              <div className="rounded bg-emerald-50 p-2 text-sm text-emerald-700">
                {sentMessage}
              </div>
            )}
          </>
        )}
        {invoice.qbPaymentLink && (
          <>
            <p className="text-sm text-slate-600">
              {customerPhone
                ? `Send the Pay Now link to ${customerPhone} via SMS.`
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
