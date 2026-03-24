import type { Metadata } from "next";
import WaveDivider from "@/components/WaveDivider";

export const metadata: Metadata = {
  title: "Book Your Service | Coastal Mobile Lube & Tire",
  description:
    "Schedule your mobile oil change, tire service, or marine maintenance appointment in Tampa, FL.",
};

export default function BookPage() {
  return (
    <>
      <section className="bg-navy py-20 md:py-24 px-6 text-center">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Book Your Service
          </h1>
          <p className="text-[#CBD5E1] text-lg">
            Schedule your mobile service appointment.
          </p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" />
      <section className="section pt-12">
        <div className="section-narrow">
          <p className="text-text-mid leading-relaxed">
            Our online booking system is coming soon. In the meantime, call
            813-722-LUBE to schedule your service. We will confirm your
            appointment, arrive at your location on time, and get the job done
            while you go about your day.
          </p>
        </div>
      </section>
    </>
  );
}
