import type { Metadata } from "next";
import RVContent from "./RVContent";

export const metadata: Metadata = {
  title: "RV Mobile Service | Coastal Mobile Lube & Tire | Apollo Beach",
  description:
    "Mobile oil changes, tire service, and maintenance for RVs at your park, campsite, or storage lot. Serving Apollo Beach and the South Shore. Call 813-722-LUBE.",
};

export default function RVPage() {
  return <RVContent />;
}
