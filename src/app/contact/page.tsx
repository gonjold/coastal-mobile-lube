import type { Metadata } from "next";
import WaveDivider from "@/components/WaveDivider";

export const metadata: Metadata = {
  title: "Contact Us | Coastal Mobile Lube & Tire",
  description:
    "Get in touch with Coastal Mobile Lube & Tire for quotes, questions, or fleet service inquiries in Tampa, FL.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy py-16 md:py-20 px-6 text-center">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Contact Us
          </h1>
          <p className="text-white/80 text-lg">
            Get in touch with the Coastal Mobile team.
          </p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" />
      <section className="section">
        <div className="section-narrow">
          <p className="text-text-mid leading-relaxed">
            Have a question, need a quote, or want to discuss fleet services? Our
            contact form is coming soon. For now, the fastest way to reach us is
            by calling 813-722-LUBE or texting that same number.
          </p>
        </div>
      </section>
    </>
  );
}
