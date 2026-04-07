import type { Metadata } from "next";
import RVContent from "./RVContent";

export const metadata: Metadata = {
  title: "RV Services",
  description:
    "Mobile RV oil changes, generator service, roof inspection, brake and tire service for all RV classes. We come to your RV park or storage facility.",
  openGraph: {
    title: "RV Services | Coastal Mobile Lube & Tire",
    description:
      "Mobile RV oil changes, generator service, roof inspection, brake and tire service for all RV classes. We come to your RV park or storage facility.",
    url: "https://coastalmobilelube.com/rv",
    type: "website",
  },
  alternates: { canonical: "https://coastalmobilelube.com/rv" },
};

export default function RVPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    provider: { "@type": "LocalBusiness", name: "Coastal Mobile Lube & Tire" },
    serviceType: "RV Maintenance",
    areaServed: "Tampa Bay, FL",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RVContent />
    </>
  );
}
