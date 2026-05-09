import type { CloverConfig, CloverOAuthTokenResponse } from './types';
import { CloverOAuthError } from './errors';

export function getCloverConfig(): CloverConfig {
  const env = (process.env.CLOVER_ENVIRONMENT ||
    'sandbox') as CloverConfig['environment'];
  return {
    appId: process.env.CLOVER_APP_ID || '',
    appSecret: process.env.CLOVER_APP_SECRET || '',
    environment: env,
    baseUrl:
      process.env.CLOVER_API_BASE_URL ||
      (env === 'production'
        ? 'https://api.clover.com'
        : 'https://apisandbox.dev.clover.com'),
    merchantId: process.env.CLOVER_MERCHANT_ID,
    accessToken: process.env.CLOVER_ACCESS_TOKEN,
    refreshToken: process.env.CLOVER_REFRESH_TOKEN,
    tokenExpiresAt: process.env.CLOVER_TOKEN_EXPIRES_AT,
    webhookSecret: process.env.CLOVER_WEBHOOK_SECRET,
    deviceId: process.env.CLOVER_DEVICE_ID,
    remoteAppId: process.env.CLOVER_REMOTE_APP_ID,
  };
}

/**
 * Exchange OAuth authorization code for access token.
 * Called from /api/clover/oauth/callback after merchant grants access.
 */
export async function exchangeCodeForToken(
  code: string,
): Promise<CloverOAuthTokenResponse> {
  const config = getCloverConfig();
  if (!config.appId || !config.appSecret) {
    throw new CloverOAuthError('Clover app credentials not configured');
  }

  const url = `${config.baseUrl}/oauth/token?client_id=${config.appId}&client_secret=${config.appSecret}&code=${code}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new CloverOAuthError(
      `Token exchange failed: ${res.status} ${text}`,
    );
  }
  return res.json() as Promise<CloverOAuthTokenResponse>;
}

/** Refresh an expired access token. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<CloverOAuthTokenResponse> {
  const config = getCloverConfig();
  const url = `${config.baseUrl}/oauth/refresh`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.appId,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new CloverOAuthError(
      `Token refresh failed: ${res.status} ${text}`,
    );
  }
  return res.json() as Promise<CloverOAuthTokenResponse>;
}

/** Build the OAuth authorization URL for the merchant to grant access. */
export function buildAuthorizationUrl(
  redirectUri: string,
  state?: string,
): string {
  const config = getCloverConfig();
  const base =
    config.environment === 'production'
      ? 'https://www.clover.com/oauth/authorize'
      : 'https://sandbox.dev.clover.com/oauth/authorize';
  const params = new URLSearchParams({
    client_id: config.appId,
    response_type: 'code',
    redirect_uri: redirectUri,
  });
  if (state) params.set('state', state);
  return `${base}?${params.toString()}`;
}
