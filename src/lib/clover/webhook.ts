import { NotImplementedError } from './errors';

/**
 * Webhook signature verification using HMAC-SHA256.
 * Phase 3 implements full verification + event routing.
 */

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: string;
}

export function verifyWebhookSignature(
  _rawBody: string,
  _signatureHeader: string,
): WebhookVerificationResult {
  throw new NotImplementedError(
    'Phase 3: Webhook signature verification not yet implemented',
  );
}
