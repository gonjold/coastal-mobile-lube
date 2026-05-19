"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@coastal/shared-ui";
import { auth } from "@/lib/firebase";
import type { Invoice } from "@coastal/shared-types";

const SEND_INVOICE_ENDPOINT =
  "https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceEmail";

interface Props {
  invoice: Invoice & { id: string };
  onClose: () => void;
  onSent: (sentDateISO: string) => void;
}

export default function SendInvoiceModal({ invoice, onClose, onSent }: Props) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !sending) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, sending]);

  const customerEmail = invoice.customerEmail || "";
  const canSend = !!customerEmail && !sending;

  async function handleSend() {
    if (sendingRef.current) return;
    if (!canSend) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const body = {
        invoiceId: invoice.id,
        customerEmail,
        customerName: invoice.customerName || "",
        customerPhone: invoice.customerPhone || "",
        customerAddress: "",
        invoiceNumber: invoice.invoiceNumber,
        lineItems: invoice.lineItems ?? [],
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        notes: invoice.notes ?? "",
        vehicle: invoice.vehicle ?? "",
        invoiceDate: invoice.invoiceDate ?? "",
        dueDate: invoice.dueDate ?? "",
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
      const sentDateISO = new Date().toISOString().slice(0, 10);
      toast.success(`Invoice sent to ${customerEmail}`);
      onSent(sentDateISO);
      // Auto-close after a short delay so user sees the toast
      setTimeout(onClose, 250);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={() => {
        if (!sending) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-lg bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Send invoice</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Invoice #{invoice.invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Recipient</span>
            </div>
            <div className="mt-1 text-foreground">
              {customerEmail || (
                <span className="text-amber-700">
                  No customer email on file. Add one before sending.
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              info@coastalmobilelube.com receives a BCC for the audit trail.
            </p>
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="font-semibold">Send failed</div>
              <div className="mt-1">{error}</div>
              <div className="mt-2 text-xs">Close this dialog and retry, or check the Netlify function logs.</div>
            </div>
          )}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!canSend}>
            {sending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              "Send invoice"
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
}
