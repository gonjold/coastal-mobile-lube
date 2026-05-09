/** Clover payment record mirrored to Firestore for reconciliation. */
export interface CloverPayment {
  /** Firestore doc id. */
  id: string;
  /** Clover's transaction id. */
  cloverPaymentId: string;
  cloverMerchantId: string;
  /** Coastal invoice id. */
  invoiceId: string;
  /** QBO TxnId once recorded. */
  qboInvoiceId?: string;
  /** QBO Payment entity id once created. */
  qboPaymentId?: string;
  /** Amount in cents. */
  amount: number;
  last4?: string;
  /** e.g. 'VISA' | 'MASTERCARD'. */
  cardBrand?: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  source: 'rest_pay_display' | 'hosted_checkout' | 'go_app' | 'manual';
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}
