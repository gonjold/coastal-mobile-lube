import { NotImplementedError } from './errors';

/**
 * Clover Go integration — Bluetooth reader paired with Jason's phone.
 * Server-side flow: webhook listens for completed Go transactions on the
 * merchant account, matches to invoice by amount/timestamp/customer,
 * records via QBO.
 *
 * Phase 3 Stream 3A implements the full body.
 */

export interface GoTransactionEvent {
  cloverPaymentId: string;
  merchantId: string;
  amount: number;
  cardBrand?: string;
  last4?: string;
  timestamp: string;
}

export async function reconcileGoTransaction(
  _event: GoTransactionEvent,
  _invoiceId?: string,
): Promise<{ success: boolean; matched: boolean }> {
  throw new NotImplementedError(
    'Phase 3: Clover Go reconciliation not yet implemented',
  );
}

export async function listRecentGoTransactions(
  _sinceMs: number,
): Promise<GoTransactionEvent[]> {
  throw new NotImplementedError(
    'Phase 3: Clover Go transaction listing not yet implemented',
  );
}
