import type { Metadata } from "next";
import MarineContent from "./MarineContent";

export const metadata: Metadata = {
  title: "Marine Engine Service at Your Marina | Coastal Mobile Lube",
  description:
    "Outboard, inboard, and sterndrive service at the marina, slip, or dry storage across Tampa Bay. No hauling. Factory-grade parts, factory-trained team.",
  openGraph: {
    title: "Marine Engine Service at Your Marina | Coastal Mobile Lube",
    description:
      "Outboard, inboard, and sterndrive service at the marina, slip, or dry storage across Tampa Bay. No hauling. Factory-grade parts, factory-trained team.",
    url: "https://coastalmobilelube.com/marine",
    type: "website",
  },
  alternates: { canonical: "https://coastalmobilelube.com/marine" },
};

export default function MarinePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    provider: { "@type": "LocalBusiness", name: "Coastal Mobile Lube & Tire" },
    serviceType: "Marine Maintenance",
    areaServed: "Tampa Bay, FL",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarineContent />
    </>
  );
}
