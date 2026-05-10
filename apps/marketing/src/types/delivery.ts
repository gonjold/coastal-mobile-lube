/** Audit log entry for invoice delivery attempts. */
export interface InvoiceDelivery {
  id: string;
  invoiceId: string;
  qboInvoiceId?: string;
  provider: 'qbo' | 'nodemailer';
  /** Recipient email address. */
  recipient: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  errorMessage?: string;
  /** e.g. "550 5.1.1 user does not exist". */
  bounceReason?: string;
  attemptedAt: string;
  resolvedAt?: string;
}
