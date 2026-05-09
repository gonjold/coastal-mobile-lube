import { NotImplementedError } from './errors';

/**
 * Hosted Checkout — Clover-hosted pay-by-link page for unattended job
 * payments. Phase 3 Stream 3B implements the full body.
 */

export interface CreateCheckoutPayload {
  /** Cents. */
  amount: number;
  invoiceId: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
  expiresAt: string;
}

export async function createCheckoutSession(
  _payload: CreateCheckoutPayload,
): Promise<CheckoutSession> {
  throw new NotImplementedError(
    'Phase 3: Hosted Checkout session creation not yet implemented',
  );
}
