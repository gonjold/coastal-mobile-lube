import type { Metadata } from "next";
import RVContent from "./RVContent";

export const metadata: Metadata = {
  title: "Mobile RV Service | Coastal Mobile Lube",
  description:
    "Class A, B, C, fifth wheels, travel trailers. Oil, tires, brakes, generators, and pre-trip inspections at your RV park, campground, or driveway.",
  openGraph: {
    title: "Mobile RV Service | Coastal Mobile Lube",
    description:
      "Class A, B, C, fifth wheels, travel trailers. Oil, tires, brakes, generators, and pre-trip inspections at your RV park, campground, or driveway.",
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
