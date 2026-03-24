import type { Metadata } from "next";
import MarineContent from "./MarineContent";

export const metadata: Metadata = {
  title: "Marine Engine Service | Coastal Mobile Lube & Tire | Tampa",
  description:
    "Dockside and boat ramp engine service across Tampa Bay. Outboard and inboard oil changes, lower unit service, impeller replacement, and seasonal maintenance packages.",
};

export default function MarinePage() {
  return <MarineContent />;
}
