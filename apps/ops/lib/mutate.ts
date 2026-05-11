import { enqueue, flushQueue } from './outbox';

/**
 * mutate() wraps a Request. If online, fetches directly. If offline (or fetch throws),
 * enqueues to IndexedDB and returns a 202 Response so the caller can treat queued and
 * delivered identically at the call site. A3 will retrofit existing mutation paths.
 */
export async function mutate(req: Request, blob?: Blob): Promise<Response> {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await fetch(req.clone(), { credentials: 'include' });
      if (res.status >= 500) {
        await enqueue(req, blob);
        return new Response(JSON.stringify({ queued: true, reason: '5xx' }), {
          status: 202,
          headers: { 'content-type': 'application/json' },
        });
      }
      return res;
    } catch {
      // Network error — fall through to enqueue
    }
  }

  await enqueue(req, blob);
  return new Response(JSON.stringify({ queued: true, reason: 'offline' }), {
    status: 202,
    headers: { 'content-type': 'application/json' },
  });
}

export { flushQueue };
