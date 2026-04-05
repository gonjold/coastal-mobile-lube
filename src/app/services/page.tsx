import type { Metadata } from "next";
import ServicesContent from "./ServicesContent";

export const metadata: Metadata = {
  title: "Automotive Services",
  description:
    "Mobile oil changes, brake service, tire mounting, HVAC, and full automotive maintenance. We come to your home or office in Tampa Bay.",
  openGraph: {
    title: "Automotive Services | Coastal Mobile Lube & Tire",
    description:
      "Mobile oil changes, brake service, tire mounting, HVAC, and full automotive maintenance. We come to your home or office in Tampa Bay.",
    url: "https://coastalmobilelube.com/services",
    type: "website",
  },
  alternates: { canonical: "https://coastalmobilelube.com/services" },
};

export default function ServicesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    provider: { "@type": "LocalBusiness", name: "Coastal Mobile Lube & Tire" },
    serviceType: "Automotive Maintenance",
    areaServed: "Tampa Bay, FL",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServicesContent />
    </>
  );
}
