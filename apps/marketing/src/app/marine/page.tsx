import type { Metadata } from "next";
import { getServices, getServiceCategories } from "@/lib/firebase-admin";
import MarineContent from "./MarineContent";

export const revalidate = 300;

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

export default async function MarinePage() {
  const [allServices, allCategories] = await Promise.all([
    getServices(),
    getServiceCategories(),
  ]);
  const services = allServices.filter((s) => s.division === "marine");
  const serviceCategories = allCategories.filter((c) => c.division === "marine");

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
      <MarineContent services={services} serviceCategories={serviceCategories} />
    </>
  );
}
