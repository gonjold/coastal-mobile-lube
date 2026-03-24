import type { Metadata } from "next";
import FleetContent from "./FleetContent";

export const metadata: Metadata = {
  title:
    "Fleet & Commercial Mobile Service | Tampa FL | Coastal Mobile Lube & Tire",
  description:
    "Mobile fleet maintenance for company vehicles, box trucks, vans, and commercial fleets in Tampa. Scheduled programs, volume pricing, and zero vehicle downtime. Call 813-722-LUBE.",
};

export default function FleetPage() {
  return <FleetContent />;
}
