import type { Metadata } from "next";
import WaveDivider from "@/components/WaveDivider";

export const metadata: Metadata = {
  title: "Our Services | Coastal Mobile Lube & Tire",
  description:
    "Professional mobile automotive maintenance including oil changes, tire services, and routine maintenance delivered to your door in Tampa, FL.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="bg-navy py-20 md:py-24 px-6 text-center">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Our Services
          </h1>
          <p className="text-[#CBD5E1] text-lg">
            Professional mobile automotive maintenance, delivered to your door.
          </p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" />
      <section className="section pt-12">
        <div className="section-narrow">
          <p className="text-text-mid leading-relaxed">
            From synthetic oil changes to tire rotations, brake inspections to
            fluid top-offs, we handle the maintenance your vehicle needs without
            the trip to the shop. Full service details and pricing coming soon.
          </p>
        </div>
      </section>
    </>
  );
}
