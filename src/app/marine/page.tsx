import type { Metadata } from "next";
import MarineContent from "./MarineContent";

export const metadata: Metadata = {
  title: "Marine Engine Service | Coastal Mobile Lube & Tire | Apollo Beach",
  description:
    "Dockside and boat ramp engine service in Apollo Beach and the South Shore. Outboard and inboard oil changes, lower unit service, impeller replacement, and seasonal maintenance packages.",
};

export default function MarinePage() {
  return <MarineContent />;
}
