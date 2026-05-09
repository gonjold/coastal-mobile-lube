import { NotImplementedError } from './errors';

/**
 * REST Pay Display API — drives Clover Flex/Mini from our server.
 * Phase 3 Stream 3A implements the full body.
 */

export interface ChargePayload {
  /** Cents. */
  amount: number;
  invoiceId: string;
  /** Our reference for idempotency. */
  externalId?: string;
}

export interface ChargeResult {
  success: boolean;
  cloverPaymentId?: string;
  last4?: string;
  cardBrand?: string;
  errorMessage?: string;
}

export async function pingDevice(): Promise<{
  online: boolean;
  deviceId?: string;
}> {
  throw new NotImplementedError(
    'Phase 3: REST Pay Display ping not yet implemented',
  );
}

export async function chargeOnDevice(
  _payload: ChargePayload,
): Promise<ChargeResult> {
  throw new NotImplementedError(
    'Phase 3: REST Pay Display charge not yet implemented',
  );
}

export async function refundOnDevice(
  _cloverPaymentId: string,
  _amount?: number,
): Promise<{ success: boolean }> {
  throw new NotImplementedError(
    'Phase 3: REST Pay Display refund not yet implemented',
  );
}
