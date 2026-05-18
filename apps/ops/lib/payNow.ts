import type { Invoice } from "@coastal/shared-types";

interface PayNowCustomer {
  name?: string | null;
  phone?: string | null;
}

interface PayNowFields {
  invoiceNumber: Invoice["invoiceNumber"];
  qbPaymentLink: NonNullable<Invoice["qbPaymentLink"]>;
}

// Builds the SMS body and opens iOS Messages via the sms: URL scheme.
// Returns true if the link was opened; false when customer phone is
// missing, qbPaymentLink is empty, or the call runs server-side. The
// caller is responsible for upstream Pay Now idempotency (a single
// generation of qbPaymentLink per booking); openSmsForInvoice itself
// is safe to call multiple times because it only navigates.
export function openSmsForInvoice(
  invoice: PayNowFields,
  customer: PayNowCustomer
): boolean {
  if (typeof window === "undefined") return false;
  if (!customer.phone) return false;
  if (!invoice.qbPaymentLink) return false;

  const firstName = (customer.name ?? "").trim().split(/\s+/)[0] || "there";
  const body = `Hi ${firstName}, your Coastal Mobile Lube invoice #${invoice.invoiceNumber} is ready. Pay now: ${invoice.qbPaymentLink}`;
  const url = `sms:${customer.phone}?body=${encodeURIComponent(body)}`;
  window.location.href = url;
  return true;
}
