import { getCloverConfig } from './oauth';
import { CloverApiError } from './errors';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /**
   * Override token (e.g., for first-time onboarding before token is in env).
   */
  token?: string;
}

export async function cloverRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const config = getCloverConfig();
  const token = options.token || config.accessToken;
  if (!token)
    throw new CloverApiError(401, 'No Clover access token available');

  // TODO Phase 3: auto-refresh token if tokenExpiresAt is past.
  // For now, surface 401s so the caller can refresh manually.

  let url = `${config.baseUrl}${path}`;
  if (options.query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) params.set(k, String(v));
    }
    if (params.toString()) url += '?' + params.toString();
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new CloverApiError(
      res.status,
      `Clover API ${options.method || 'GET'} ${path} -> ${res.status}`,
      body,
    );
  }
  return res.json() as Promise<T>;
}

/** Verify connection to Clover sandbox by fetching merchant info. */
export async function getMerchantInfo() {
  const config = getCloverConfig();
  if (!config.merchantId)
    throw new CloverApiError(400, 'No merchant ID configured');
  return cloverRequest(`/v3/merchants/${config.merchantId}`);
}
