import type { Metadata } from "next";
import FleetContent from "./FleetContent";

export const metadata: Metadata = {
  title: "Fleet Services",
  description:
    "Scheduled fleet maintenance for businesses in Tampa Bay. Custom plans, on-site service, detailed reporting. Keep your fleet running.",
  openGraph: {
    title: "Fleet Services | Coastal Mobile Lube & Tire",
    description:
      "Scheduled fleet maintenance for businesses in Tampa Bay. Custom plans, on-site service, detailed reporting. Keep your fleet running.",
    url: "https://coastalmobilelube.com/fleet",
    type: "website",
  },
  alternates: { canonical: "https://coastalmobilelube.com/fleet" },
};

export default function FleetPage() {
  return <FleetContent />;
}
