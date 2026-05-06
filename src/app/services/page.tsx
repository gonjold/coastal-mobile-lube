import type { Metadata } from "next";
import { getServices, getServiceCategories } from "@/lib/firebase-admin";
import ServicesContent from "./ServicesContent";

export const revalidate = 300;

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

export default async function ServicesPage() {
  const [allServices, allCategories] = await Promise.all([
    getServices(),
    getServiceCategories(),
  ]);
  const services = allServices.filter((s) => s.division === "auto");
  const serviceCategories = allCategories.filter((c) => c.division === "auto");

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
      <ServicesContent services={services} serviceCategories={serviceCategories} />
    </>
  );
}
