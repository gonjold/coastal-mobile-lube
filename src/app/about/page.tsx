import type { Metadata } from "next";
import WaveDivider from "@/components/WaveDivider";

export const metadata: Metadata = {
  title: "About Coastal Mobile | Coastal Mobile Lube & Tire",
  description:
    "30 years of dealership expertise brought directly to your driveway, parking lot, or marina in Tampa, FL.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy py-16 md:py-20 px-6 text-center">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            About Coastal Mobile
          </h1>
          <p className="text-white/80 text-lg">
            30 years of dealership expertise, brought directly to you.
          </p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" />
      <section className="section">
        <div className="section-narrow">
          <p className="text-text-mid leading-relaxed">
            Coastal Mobile Lube & Tire was founded on a simple idea:
            dealership-quality service should not require a dealership visit. Our
            team brings three decades of franchise fixed operations leadership to
            your driveway, parking lot, or marina. Full story coming soon.
          </p>
        </div>
      </section>
    </>
  );
}
