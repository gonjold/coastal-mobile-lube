import type { Metadata } from "next";
import FleetContent from "./FleetContent";

export const metadata: Metadata = {
  title: "Fleet Mobile Maintenance | Coastal Mobile Lube",
  description:
    "Scheduled mobile maintenance for company vehicles, vans, and commercial fleets. One vendor, one invoice, zero downtime. Apollo Beach and South Shore.",
  openGraph: {
    title: "Fleet Mobile Maintenance | Coastal Mobile Lube",
    description:
      "Scheduled mobile maintenance for company vehicles, vans, and commercial fleets. One vendor, one invoice, zero downtime. Apollo Beach and South Shore.",
    url: "https://coastalmobilelube.com/fleet",
    type: "website",
  },
  alternates: { canonical: "https://coastalmobilelube.com/fleet" },
};

export default function FleetPage() {
  return <FleetContent />;
}
