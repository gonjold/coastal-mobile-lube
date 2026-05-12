/* Canonical Invoice shape, lifted from apps/marketing/src/app/admin/invoicing/page.tsx
 * Includes all FDACS Phase B/C fields and QB-authoritative totals. The ad-hoc
 * stripped-down shape that used to live in apps/marketing/src/app/admin/page.tsx
 * has been removed; both apps now import this type. */

export interface InvoiceLineItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** Sent to QB as TaxCodeRef "TAX"/"NON". Missing → false (safe default). */
  taxable: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  notes: string;
  invoiceDate: string;
  dueDate: string;
  paidDate?: string;
  paidAmount?: number;
  division?: string;
  jobReference?: string;
  vehicle?: string;
  qbInvoiceId?: string;
  qbDocNumber?: string;
  qbPaymentLink?: string;
  /** QB-authoritative totals after Automated Sales Tax computes. Take precedence
   * over local subtotal/taxAmount/total when displaying. */
  qbTotalAmount?: number;
  qbTaxAmount?: number;
  qbSubtotal?: number;
  /** QB finalize lifecycle marker read by the dashboard. */
  qboFinalizeStatus?: string;
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
  isTest?: boolean;
  deleted?: boolean;
  deletedAt?: { toDate: () => Date };
  deletedBy?: string;

  /* FDACS Phase B — copied from parent booking at invoice creation. */
  bookingId?: string | null;
  vehicleInfo?: {
    year?: string | number | null;
    make?: string | null;
    model?: string | null;
    trim?: string | null;
    vin?: string | null;
    licenseTag?: string | null;
    odometerIn?: number | null;
    odometerOut?: number | null;
  } | null;
  customerComplaint?: string | null;
  photos?: string[];
  customerSignatureUrl?: string | null;
  techCheckInAt?: { toDate: () => Date } | null;
  jobCompletedAt?: { toDate: () => Date } | null;
  assignedTechId?: string | null;

  /* FDACS Phase C — invoice draft auto-created at job completion.
   * 'tech_completion' invoices are auto-generated from the tech app's
   * Mark Complete flow; 'manual' (or unset) come from /admin/invoicing. */
  source?: "tech_completion" | "manual" | null;
  customerEstimateSignatureUrl?: string | null;
  customerEstimateSignedAt?: { toDate: () => Date } | null;
  customerCompletionSignatureUrl?: string | null;
  customerCompletionSignedAt?: { toDate: () => Date } | null;
  estimateConsent?: {
    choice: "authorize_up_to" | "contact_above" | "no_contact" | "simple_under_150";
    authorizeUpTo?: number | null;
    contactAbove?: number | null;
    authorizedOtherPerson?: { name: string; relationship: string; phone: string } | null;
  } | null;
  reAuthEvents?: Array<{
    id: string;
    timestamp: { toDate: () => Date };
    method: "in_person_signature" | "phone";
    customerName: string;
    signatureUrl?: string;
    note?: string;
    lineItemIds: string[];
  }>;
}
