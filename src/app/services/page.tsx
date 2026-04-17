import type { Metadata } from "next";
import ServicesContent from "./ServicesContent";

export const metadata: Metadata = {
  title: "Mobile Oil Change, Tires & Brakes | Coastal Mobile Lube",
  description:
    "Mobile vacuum-extraction oil changes, tire mount and balance, brake service, and full automotive maintenance across Apollo Beach and the South Shore. We come to your home or office.",
  openGraph: {
    title: "Mobile Oil Change, Tires & Brakes | Coastal Mobile Lube",
    description:
      "Mobile vacuum-extraction oil changes, tire mount and balance, brake service, and full automotive maintenance across Apollo Beach and the South Shore. We come to your home or office.",
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
