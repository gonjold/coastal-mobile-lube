import type { Metadata } from "next";
import WaveDivider from "@/components/WaveDivider";

export const metadata: Metadata = {
  title: "Service Areas | Coastal Mobile Lube & Tire",
  description:
    "Serving Tampa, Brandon, Riverview, Wesley Chapel, Plant City, Temple Terrace, Lutz, Land O' Lakes, and surrounding Hillsborough County communities.",
};

export default function ServiceAreasPage() {
  return (
    <>
      <section className="bg-navy py-20 md:py-24 px-6 text-center">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Service Areas
          </h1>
          <p className="text-[#CBD5E1] text-lg">
            Serving Tampa and surrounding communities.
          </p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" />
      <section className="section pt-12">
        <div className="section-narrow">
          <p className="text-text-mid leading-relaxed">
            We currently serve Tampa, Brandon, Riverview, Wesley Chapel, Plant
            City, Temple Terrace, Lutz, Land O&apos; Lakes, and surrounding
            Hillsborough County communities. Detailed service area information
            and scheduling by location coming soon.
          </p>
        </div>
      </section>
    </>
  );
}
