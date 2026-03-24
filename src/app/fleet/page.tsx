import type { Metadata } from "next";
import WaveDivider from "@/components/WaveDivider";

export const metadata: Metadata = {
  title: "Fleet & Commercial Services | Coastal Mobile Lube & Tire",
  description:
    "Keep your fleet on the road with scheduled mobile maintenance for company vehicles, box trucks, and utility fleets in Tampa, FL.",
};

export default function FleetPage() {
  return (
    <>
      <section className="bg-navy py-16 md:py-20 px-6 text-center">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Fleet & Commercial Services
          </h1>
          <p className="text-white/80 text-lg">
            Keep your fleet on the road with scheduled mobile maintenance.
          </p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" />
      <section className="section">
        <div className="section-narrow">
          <p className="text-text-mid leading-relaxed">
            Whether you run a handful of company cars or a yard full of box
            trucks and utility vehicles, we build maintenance programs that fit
            your operation. Dedicated fleet consultation and volume pricing
            details coming soon.
          </p>
        </div>
      </section>
    </>
  );
}
