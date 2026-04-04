import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

const BASE_URL = "https://coastal-mobile-lube.netlify.app";
const OG_IMAGE =
  "https://res.cloudinary.com/dgcdcqjrz/image/upload/w_1200,h_630,c_fill,q_auto:good,f_jpg/v1774318456/hero-van-driveway_nag1pq.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:
      "Coastal Mobile Lube & Tire | Mobile Oil Change, Tire & Marine Service in Apollo Beach FL",
    template: "%s | Coastal Mobile Lube & Tire",
  },
  description:
    "Mobile oil change, tire service, and marine engine maintenance in Apollo Beach, FL. 30 years of dealership expertise brought to your driveway, parking lot, or marina. Call 813-722-LUBE.",
  openGraph: {
    title:
      "Coastal Mobile Lube & Tire | Mobile Oil Change, Tire & Marine Service",
    description:
      "Mobile oil change, tire service, and marine engine maintenance in Apollo Beach, FL. 30 years of dealership expertise brought to your driveway, parking lot, or marina.",
    url: BASE_URL,
    siteName: "Coastal Mobile Lube & Tire",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Coastal Mobile Lube & Tire service van",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Coastal Mobile Lube & Tire | Mobile Service in Apollo Beach FL",
    description:
      "Mobile oil change, tire service, and marine engine maintenance. 30 years of dealership expertise brought to your door. Call 813-722-LUBE.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Coastal Mobile Lube & Tire LLC",
        url: BASE_URL,
        logo: "https://res.cloudinary.com/dgcdcqjrz/image/upload/w_400,q_auto:good,f_png/v1774315498/Coastal_Lube_logo_v1_zbx9qs.png",
        telephone: "+1-813-722-5823",
        email: "Coastalmobilelube@gmail.com",
        sameAs: [],
      },
      {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/#localbusiness`,
        name: "Coastal Mobile Lube & Tire",
        image: OG_IMAGE,
        url: BASE_URL,
        telephone: "+1-813-722-5823",
        email: "Coastalmobilelube@gmail.com",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Apollo Beach",
          addressRegion: "FL",
          addressCountry: "US",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 27.7731,
          longitude: -82.4075,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "08:00",
            closes: "17:00",
          },
        ],
        priceRange: "$$",
        areaServed: [
          "Apollo Beach",
          "Riverview",
          "Ruskin",
          "Sun City Center",
          "Gibsonton",
          "Fish Hawk",
          "Palmetto",
          "Ellenton",
          "Parrish",
          "Wimauma",
          "Balm",
          "Sun City",
        ],
        description:
          "Mobile oil change, tire service, and marine engine maintenance in Apollo Beach and the South Shore. 30 years of dealership expertise brought to your driveway, parking lot, or marina.",
      },
      {
        "@type": "Service",
        "@id": `${BASE_URL}/#auto-service`,
        name: "Mobile Automotive Service",
        provider: { "@id": `${BASE_URL}/#localbusiness` },
        serviceType: "Mobile Auto Repair",
        description:
          "Oil changes, tire rotation, brake service, fluid flushes, and routine maintenance at your home or office.",
        areaServed: "Apollo Beach, FL and South Shore communities",
      },
      {
        "@type": "Service",
        "@id": `${BASE_URL}/#fleet-service`,
        name: "Fleet Maintenance Program",
        provider: { "@id": `${BASE_URL}/#localbusiness` },
        serviceType: "Fleet Vehicle Maintenance",
        description:
          "Scheduled mobile maintenance programs for commercial fleets. Preventive maintenance tiers for gas and diesel vehicles.",
        areaServed: "Apollo Beach, FL and South Shore communities",
      },
      {
        "@type": "Service",
        "@id": `${BASE_URL}/#marine-service`,
        name: "Marine Engine Service",
        provider: { "@id": `${BASE_URL}/#localbusiness` },
        serviceType: "Marine Engine Maintenance",
        description:
          "Dockside service for outboard, inboard, and diesel marine engines. Oil changes, lower unit service, impeller replacement, and seasonal maintenance.",
        areaServed: "Apollo Beach, FL and South Shore communities",
      },
    ],
  };

  return (
    <html lang="en" className={`${plusJakarta.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="min-h-screen flex flex-col"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <Header />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <Footer />

        {/* Mobile Sticky Bottom Bar — visible on all pages */}
        <div id="site-sticky-bar" className="fixed bottom-0 left-0 right-0 flex lg:hidden items-center gap-3 px-4 py-3 bg-white border-t border-[#eee] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-[100]">
          <a
            href="tel:8137225823"
            className="inline-flex items-center justify-center w-12 h-12 shrink-0 text-[#0B2040] border-2 border-[#e8e8e8] rounded-[10px]"
            aria-label="Call 813-722-LUBE"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </a>
          <Link
            href="/book"
            className="flex-1 inline-flex items-center justify-center font-semibold text-white rounded-[var(--radius-button)] py-3.5 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
          >
            Book Service
          </Link>
        </div>
      </body>
    </html>
  );
}
