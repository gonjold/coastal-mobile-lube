// apps/ops/app/manifest.ts
//
// All URL fields are RELATIVE per C3. Ops site is reachable on both
// coastal-ops.netlify.app and app.coastalmobilelube.com — never bake either domain in.
//
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Coastal Mobile Lube Ops',
    short_name: 'Coastal Ops',
    description: 'Operations console for Coastal Mobile Lube & Tire',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBF9F5',
    theme_color: '#0B2040',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
