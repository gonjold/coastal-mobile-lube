/**
 * Clover API response types. NOT shared types — those live in /types/clover.
 * These mirror raw Clover API responses for typing the internal HTTP client
 * only.
 */

export interface CloverOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: 'Bearer';
  /** Seconds until expiry. */
  expires_in?: number;
  merchant_id?: string;
}

export interface CloverMerchant {
  id: string;
  name: string;
  defaultCurrency: string;
  address?: {
    address1?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export interface CloverPaymentResponse {
  id: string;
  /** Cents. */
  amount: number;
  tipAmount?: number;
  taxAmount?: number;
  result?: 'SUCCESS' | 'FAIL';
  cardTransaction?: {
    last4?: string;
    /** 'VISA' | 'MC' | etc. */
    cardType?: string;
    type?: 'AUTH' | 'CAPTURE' | 'SALE' | 'VOID' | 'REFUND';
  };
  createdTime?: number;
  modifiedTime?: number;
}

export interface CloverHostedCheckoutSession {
  href: string;
  checkoutSessionId: string;
  /** Unix milliseconds. */
  expirationTime: number;
}

export interface CloverWebhookEvent {
  appId: string;
  merchants: Record<
    string,
    Array<{ objectId: string; type: string; ts: number }>
  >;
}

export type CloverEnvironment = 'sandbox' | 'production';

export interface CloverConfig {
  appId: string;
  appSecret: string;
  environment: CloverEnvironment;
  baseUrl: string;
  merchantId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  webhookSecret?: string;
  deviceId?: string;
  remoteAppId?: string;
}
