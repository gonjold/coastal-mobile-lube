import type { Metadata } from "next";
import ServicesContent from "./ServicesContent";

export const metadata: Metadata = {
  title:
    "Mobile Auto Services in Apollo Beach | Oil Change, Tires, Brakes | Coastal Mobile",
  description:
    "Professional mobile oil changes, tire sales and installation, brake service, and routine maintenance in Apollo Beach and the South Shore. Factory-trained techs come to your home or office. Call 813-722-LUBE.",
};

export default function ServicesPage() {
  return <ServicesContent />;
}
