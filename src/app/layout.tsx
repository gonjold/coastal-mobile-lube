import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookingProvider } from "@/contexts/BookingContext";
import StickyBottomBar from "@/components/StickyBottomBar";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

const BASE_URL = "https://coastalmobilelube.com";
const OG_IMAGE =
  "https://res.cloudinary.com/dgcdcqjrz/image/upload/w_1200,h_630,c_fill,q_auto:good,f_jpg/v1774318456/hero-van-driveway_nag1pq.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:
      "Coastal Mobile Lube & Tire | Mobile Auto, Marine & RV Service | Tampa Bay",
    template: "%s | Coastal Mobile Lube & Tire",
  },
  description:
    "Factory-trained mobile mechanics serving Tampa Bay. Oil changes, brakes, tires, marine engine service, and RV maintenance at your location. Call 813-722-LUBE.",
  alternates: { canonical: BASE_URL },
  openGraph: {
    title:
      "Coastal Mobile Lube & Tire | Mobile Auto, Marine & RV Service | Tampa Bay",
    description:
      "Factory-trained mobile mechanics serving Tampa Bay. Oil changes, brakes, tires, marine engine service, and RV maintenance at your location. Call 813-722-LUBE.",
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
        <BookingProvider>
          <Header />
          <main className="flex-1 pb-20 lg:pb-0">{children}</main>
          <Footer />
          <StickyBottomBar />
        </BookingProvider>
      </body>
    </html>
  );
}
