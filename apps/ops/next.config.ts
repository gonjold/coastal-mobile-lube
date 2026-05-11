import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@coastal/shared-types', '@coastal/shared-ui'],
  // Firebase Auth signInWithPopup needs same-origin-allow-popups to call window.close on the popup.
  // Netlify _headers and netlify.toml [[headers]] only cover static assets, not the @netlify/plugin-nextjs
  // Lambda-served routes (e.g. /login). Setting via Next.js headers() applies to all responses.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
