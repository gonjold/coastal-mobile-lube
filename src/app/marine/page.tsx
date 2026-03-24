import type { Metadata } from "next";
import WaveDivider from "@/components/WaveDivider";

export const metadata: Metadata = {
  title: "Marine Services | Coastal Mobile Lube & Tire",
  description:
    "Dockside and boat ramp engine service for outboard and inboard engines across Tampa, FL.",
};

export default function MarinePage() {
  return (
    <>
      <section className="bg-navy py-20 md:py-24 px-6 text-center">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Marine Services
          </h1>
          <p className="text-[#CBD5E1] text-lg">
            Dockside and boat ramp engine service across Tampa.
          </p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" />
      <section className="section pt-12">
        <div className="section-narrow">
          <p className="text-text-mid leading-relaxed">
            We service outboard and inboard engines right at the marina or boat
            ramp. Oil changes, lower unit service, and seasonal maintenance
            packages built for Tampa boaters. Full marine service menu coming
            soon.
          </p>
        </div>
      </section>
    </>
  );
}
