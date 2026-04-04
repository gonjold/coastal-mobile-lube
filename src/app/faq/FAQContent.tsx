"use client";

import { useState } from "react";
import { ChevronDown, Phone, HelpCircle } from "lucide-react";
import Link from "next/link";

const faqItems = [
  {
    q: "How does mobile service work?",
    a: "We come to you. Whether you are at home, at the office, or at a job site, our fully equipped service vehicle arrives at your location with everything needed to handle the job on the spot. No waiting rooms, no dropping off your car. Just book a time, and we show up ready to work.",
  },
  {
    q: "What areas do you serve?",
    a: "We are based in Apollo Beach and serve the entire South Shore area. That includes Ruskin, Sun City Center, Sun City, Riverview, Gibsonton, Balm, Wimauma, Parrish, Palmetto, Ellenton, and Fish Hawk. If you are not sure whether we cover your area, give us a call.",
  },
  {
    q: "How do I book a service?",
    a: "You can book online through our website, call us at 813-722-LUBE (813-722-5823), or send a text to the same number. We will confirm your appointment and give you a time window that works for your schedule.",
  },
  {
    q: "What is included in an oil change?",
    a: "Our standard oil change starts at $89.95 and includes synthetic blend oil, a new oil filter, and a multi-point vehicle inspection. We check your tires, fluids, belts, and battery so you know exactly where your vehicle stands. Full synthetic and diesel options are also available.",
  },
  {
    q: "Do you service fleets?",
    a: "Yes. We have a dedicated fleet program for businesses with company vehicles, work trucks, and commercial fleets. Fleet services are quote-based, and we can set up recurring maintenance schedules to keep your vehicles on the road with zero downtime.",
  },
  {
    q: "Do you service boats?",
    a: "Yes. Our marine division handles outboard, inboard, and diesel marine engines. We come directly to your dock or marina for oil changes, fluid services, and seasonal maintenance. No need to haul your boat to a shop.",
  },
  {
    q: "Do you service RVs?",
    a: "Yes. We handle RVs the same way we handle automotive and diesel vehicles. Oil changes, fluid services, tire work, and general maintenance can all be done on-site at your home or RV park.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Zelle, Venmo, cash, and check. Payment is collected at the time of service.",
  },
  {
    q: "Are you licensed and insured?",
    a: "Yes. Coastal Mobile Lube and Tire is fully licensed and insured. Our technicians are ASE-certified, so you can trust that the work is done right every time.",
  },
  {
    q: "What is vacuum extraction?",
    a: "Instead of removing your drain plug and crawling under the vehicle, we use a vacuum extraction system to pull the oil out through the dipstick tube. It is cleaner, faster, and leaves no mess on your driveway. No drips, no spills.",
  },
  {
    q: "What are your hours?",
    a: "We are available Monday through Friday, 8AM to 5PM. We are closed on Saturday and Sunday.",
  },
  {
    q: "How long does a service take?",
    a: "Most services are completed in under an hour. A standard oil change typically takes 20 to 30 minutes. We will give you an estimated time when you book so you know what to expect.",
  },
  {
    q: "Do you work in the rain?",
    a: "Yes. We work rain or shine. Our service vehicle has covered equipment, so we can handle most jobs regardless of the weather. If conditions are truly unsafe, we will reach out to reschedule.",
  },
];

export default function FAQContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #0A1C38 0%, #0B2040 40%, #0F2847 70%, #132E54 100%)",
        }}
      >

        <div className="section-inner px-4 lg:px-6 pt-10 pb-6 md:pt-14 md:pb-10 relative z-10">
          <div className="max-w-[680px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-[#D9A441] text-[12px] font-bold tracking-[2.5px] uppercase mb-4">
              <HelpCircle size={16} />
              Common Questions
            </div>
            <h1 className="text-[30px] md:text-[42px] font-[800] leading-[1.08] text-white tracking-[-1px] mb-5">
              Frequently Asked Questions
            </h1>
            <p className="text-[16px] leading-[1.7] text-white/60 max-w-[520px] mx-auto">
              Everything you need to know about how mobile service works, what we
              cover, and how to get started.
            </p>
          </div>
        </div>

      </section>

      {/* All FAQ Items — single continuous list */}
      <section className="relative bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="max-w-[740px] mx-auto flex flex-col gap-3">
            {faqItems.map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-[#E8E8E8] rounded-[14px] shadow-[0_2px_20px_rgba(11,32,64,0.06)] hover:shadow-[0_4px_28px_rgba(11,32,64,0.1)] transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <span className="text-[16px] font-bold text-[#0B2040]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 transition-transform duration-200 ${
                      openIndex === i
                        ? "rotate-180 text-[#E07B2D]"
                        : "text-[#E07B2D]/60"
                    }`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-6 pb-5">
                    <div className="border-t border-[#E8E8E8] pt-4">
                      <p className="text-[15px] text-[#444] leading-[1.7] pr-8">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)",
        }}
      >
        <div className="section-inner px-4 lg:px-6 py-12 md:py-16 text-center relative z-10">
          <h2 className="text-[28px] font-extrabold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-[15px] text-white/60 mb-8 max-w-[480px] mx-auto">
            Give us a call and we will be happy to help. Or book your service
            online in under two minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="tel:8137225823"
              className="inline-flex items-center gap-2 bg-[#E07B2D] hover:bg-[#CC6A1F] text-white font-bold text-lg px-8 py-4 rounded-lg transition-colors shadow-[0_4px_24px_rgba(224,123,45,0.35)]"
            >
              <Phone size={20} />
              813-722-LUBE
            </a>
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-white bg-white/[0.06] border border-white/20 rounded-lg hover:bg-white/[0.12] hover:border-white/35 transition-all backdrop-blur-sm"
            >
              Book Service Online
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
