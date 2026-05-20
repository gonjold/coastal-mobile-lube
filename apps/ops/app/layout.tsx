import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import '../styles/globals.css';

// A3f Phase 2: load Plus Jakarta + Inter to match marketing /admin
// typography. globals.css :root sets --font-heading / --font-body /
// --font-sans to the CSS variables these fonts expose.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Coastal Ops',
  description: 'Operations console for Coastal Mobile Lube & Tire.',
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Coastal Ops',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon-180.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B2040',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${inter.variable}`}
    >
      {/* A3f Phase 6A polish round 2: overflow-x-clip on <body> kills any
          residual horizontal scroll caused by an off-screen child without
          breaking position:sticky / fixed (overflow-x-hidden would). */}
      <body className="bg-background text-foreground antialiased overflow-x-clip">{children}</body>
    </html>
  );
}
