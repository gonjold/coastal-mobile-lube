// apps/ops/app/sw.ts
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, ExpirationPlugin, CacheFirst, NetworkOnly } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,        // Q5: wait, prompt user via UpdateToast
  clientsClaim: false,       // Q5: pair with skipWaiting:false
  navigationPreload: true,
  runtimeCaching: [
    // --- AUTH: never cache ---
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/auth/'),
      handler: new NetworkOnly(),
    },
    // --- ADMIN/FIELD API: never cache (mutations route through mutate() outbox) ---
    {
      matcher: ({ url }) =>
        url.pathname.startsWith('/api/admin/') ||
        url.pathname.startsWith('/api/field/'),
      handler: new NetworkOnly(),
    },
    // --- Cloudinary images: CacheFirst, 30d, max 200 entries (Q6) ---
    {
      matcher: ({ url }) => url.hostname === 'res.cloudinary.com',
      handler: new CacheFirst({
        cacheName: 'cloudinary-images',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // --- App shell + static + everything else: Serwist defaults ---
    ...defaultCache,
  ],
});

// Q5: handle SKIP_WAITING message from UpdateToast
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

serwist.addEventListeners();
