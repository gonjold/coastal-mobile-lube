import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Coastal Mobile Lube & Tire",
  description:
    "Answers to common questions about mobile oil change, tire, and marine service in Tampa, FL.",
};

export default function FAQPage() {
  return (
    <>
      <section className="bg-navy py-20 md:py-24 px-6 text-center">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-[#CBD5E1] text-lg">
            Answers to common questions about mobile service.
          </p>
        </div>
      </section>
      <section className="section pt-12">
        <div className="section-narrow">
          <p className="text-text-mid leading-relaxed">
            Have questions about how mobile service works, what we can handle
            on-site, or how to book? Our full FAQ section with detailed answers
            is coming soon. In the meantime, call us at{" "}
            <a href="tel:8137225823" className="text-orange font-bold hover:underline">813-722-LUBE</a>{" "}
            and we are happy to help.
          </p>
        </div>
      </section>
    </>
  );
}
