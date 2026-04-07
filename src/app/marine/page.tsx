import type { Metadata } from "next";
import MarineContent from "./MarineContent";

export const metadata: Metadata = {
  title: "Marine Services",
  description:
    "Dockside boat engine service, diesel maintenance, and trailer tire service. We come to your marina or boat ramp.",
  openGraph: {
    title: "Marine Services | Coastal Mobile Lube & Tire",
    description:
      "Dockside boat engine service, diesel maintenance, and trailer tire service. We come to your marina or boat ramp.",
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
