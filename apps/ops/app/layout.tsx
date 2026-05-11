import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
