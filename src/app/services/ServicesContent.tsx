"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, ChevronDown, ArrowRight } from "lucide-react";
import Button from "@/components/Button";
import TrustBar from "@/components/TrustBar";
import { cloudinaryUrl, images } from "@/lib/cloudinary";

const serviceCards = [
  {
    name: "Synthetic Oil Change",
    image: cloudinaryUrl(images.oilChangeService, { width: 800, height: 600 }),
    description:
      "We perform full synthetic oil changes using factory-recommended oil and filters right in your driveway or parking lot. Our vacuum extraction system means no drain plug removal, no mess, and no risk of cross-threading. Most oil changes take about 30 minutes.",
    details: [
      "Full synthetic or conventional options",
      "OEM-spec oil filter included",
      "Vacuum extraction system (no drain plug)",
      "Multi-point fluid level check",
      "Topped off washer fluid",
      "Used oil recycled responsibly",
    ],
    priceLabel: "Starting at",
    price: "$89.95",
  },
  {
    name: "Tire Sales, Installation & Rotation",
    image: cloudinaryUrl(images.tireService, { width: 800, height: 600 }),
    description:
      "Need new tires? We source tires from major brands and install them on-site. No trip to the tire shop, no sitting in a waiting room. We also handle rotations, balancing, and pressure checks as part of routine maintenance.",
    details: [
      "Tires sourced from major brands",
      "Mobile installation at your location",
      "Tire rotation and balancing",
      "TPMS sensor service",
      "Pressure check and adjustment",
      "Seasonal tire swap available",
    ],
    priceLabel: 'Rotation from $39.95 / Mount & balance from $159.95',
    price: null,
  },
  {
    name: "Brake Inspection & Service",
    image: cloudinaryUrl(images.drivewayServiceAlt, { width: 800, height: 600 }),
    description:
      "Squealing, grinding, or just overdue? We inspect your brake pads, rotors, and fluid levels on-site and give you a straight answer on what needs attention. No upselling, no shop pressure. If the work can be done mobile, we handle it right there.",
    details: [
      "Visual brake pad and rotor inspection",
      "Brake fluid level and condition check",
      "Caliper and hardware inspection",
      "Honest assessment with no upsell",
      "Mobile brake pad replacement available",
      "Written report on brake condition",
    ],
    priceLabel: "Inspection included with any service / Brakes starting at $320",
    price: null,
  },
  {
    name: "Battery Testing & Replacement",
    image: cloudinaryUrl(images.oilChangeServiceAlt, { width: 800, height: 600 }),
    description:
      "We test your battery and charging system on the spot. If you need a replacement, we carry common sizes on the van and can install a new battery the same visit. No jump start runaround, no tow to a shop.",
    details: [
      "Load test and voltage check",
      "Charging system diagnosis",
      "Terminal cleaning and treatment",
      "Common battery sizes in stock",
      "Old battery recycled",
      "Same-visit replacement when possible",
    ],
    priceLabel: "Testing free with any service / Installation from $50",
    price: null,
  },
  {
    name: "Fluid Top-Off & Inspection",
    image: cloudinaryUrl(images.vanInteriorEquipment, { width: 800, height: 600 }),
    description:
      "Every visit includes a multi-point fluid check. We top off washer fluid, check coolant, brake fluid, power steering, and transmission levels. If something looks off, we tell you before it becomes a problem.",
    details: [
      "Washer fluid topped off",
      "Coolant level and condition check",
      "Brake fluid inspection",
      "Power steering fluid check",
      "Transmission fluid level check",
      "Visual leak inspection",
    ],
    priceLabel: "Included with every service visit",
    price: null,
  },
  {
    name: "Air & Cabin Filter Replacement",
    image: null,
    description:
      "Clogged filters hurt fuel economy and air quality inside your vehicle. We carry common air and cabin filters on the van and swap them in minutes. Clean air for your engine and your lungs.",
    details: [
      "Engine air filter replacement",
      "Cabin air filter replacement",
      "Common sizes stocked on van",
      "Filter condition assessment",
      "Improved fuel efficiency",
      "Cleaner cabin air quality",
    ],
    priceLabel: "Starting at",
    price: "$99.95",
  },
  {
    name: "Wiper Blade Replacement",
    image: null,
    description:
      "Florida rain does not wait. We carry popular wiper blade sizes and install them in minutes during any service visit. Simple, cheap, and one less thing on your list.",
    details: [
      "Major brand wiper blades",
      "Most common sizes in stock",
      "Installed in minutes",
      "Rear wiper available",
      "Streak-free guarantee",
    ],
    priceLabel: "From",
    price: "$19 per blade",
  },
];

const faqItems = [
  {
    q: "How does mobile oil change service work?",
    a: "You book online or call us, pick a time, and give us your address. Our van shows up fully equipped with oil, filters, and tools. We perform the oil change in your driveway, parking lot, or wherever your vehicle is parked. Most oil changes take about 30 minutes. You do not need to be present for the entire service.",
  },
  {
    q: "What kind of oil do you use?",
    a: "We use full synthetic oil from major brands that meets or exceeds your vehicle manufacturer's specifications. We also offer conventional oil for older vehicles that do not require synthetic. The oil filter is always OEM-spec or equivalent.",
  },
  {
    q: "Can you really install tires on-site?",
    a: "Yes. We source tires from major distributors, bring them to your location, and mount and balance them on-site. We carry the same equipment that tire shops use. No trip to the shop needed.",
  },
  {
    q: "What if my vehicle needs something you cannot do on-site?",
    a: "We will tell you honestly. Some repairs require a lift or specialized shop equipment. In those cases, we will give you a clear recommendation on what needs to be done and where to go. We do not waste your time or money.",
  },
  {
    q: "Do I need to be home during the service?",
    a: "Not necessarily. As long as we can access your vehicle and you have communicated any gate codes or parking details, we can handle the service while you are at work, inside, or away. We will send you a summary when we are done.",
  },
  {
    q: "What areas do you serve?",
    a: "We are based in Apollo Beach and serve the South Shore, including Ruskin, Sun City Center, Sun City, Riverview, Gibsonton, Fish Hawk, Palmetto, Ellenton, Parrish, Balm, and Wimauma.",
  },
  {
    q: "How much does a mobile oil change cost?",
    a: "Synthetic oil changes start at $89.95, which includes the oil, filter, and multi-point fluid check. Pricing may vary based on your vehicle's oil capacity and filter requirements. We always confirm the price before we start.",
  },
];

export default function ServicesContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0A1C38 0%, #0B2040 40%, #0F2847 70%, #132E54 100%)" }}>
        {/* Atmospheric glow layers */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(26,95,172,0.12) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 80% 30%, rgba(224,123,45,0.06) 0%, transparent 60%)" }} />
        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="section-inner px-4 lg:px-6 pt-10 pb-6 md:pt-14 md:pb-10 relative z-10">
          <div>
            <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
              Automotive Services
            </p>
            <h1 className="text-[30px] md:text-[42px] font-extrabold leading-[1.08] text-white tracking-[-1px] mb-5">
              Mobile maintenance at your door
            </h1>
            <p className="text-[16px] leading-[1.65] text-white/60 mb-8 max-w-[520px]">
              From synthetic oil changes to tire sales and installation, we
              handle everything your vehicle needs without the trip to the shop.
              Factory-trained technicians, professional equipment, and
              transparent pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="/book" variant="primary" size="lg" className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]">
                Book Now
              </Button>
              <a
                href="tel:8137225823"
                className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-white bg-white/[0.06] border border-white/20 rounded-[var(--radius-button)] hover:bg-white/[0.12] hover:border-white/35 transition-all backdrop-blur-sm"
              >
                <Phone size={16} />
                Call 813-722-LUBE
              </a>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #0F2847)" }} />
      </section>

      <TrustBar />

      {/* Navy-to-light transition */}
      <div style={{ background: "linear-gradient(to bottom, #0F2847 0%, #1a3a5e 30%, #3a6a8e 60%, #FAFBFC 100%)", height: "60px" }} />

      {/* Service Cards */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="flex flex-col gap-6">
            {serviceCards.map((card) => (
              <div
                key={card.name}
                className="bg-white border border-[#f0ede6] rounded-[14px] shadow-[0_2px_20px_rgba(11,32,64,0.06)] overflow-hidden hover:shadow-[0_4px_28px_rgba(11,32,64,0.1)] transition-shadow duration-300"
              >
                <div
                  className={`grid grid-cols-1 ${card.image ? "lg:grid-cols-[1fr_340px]" : ""} gap-0`}
                >
                  {/* Content */}
                  <div className="p-6 md:p-8">
                    <h2 className="text-[22px] font-bold text-[#0B2040] mb-3">
                      {card.name}
                    </h2>
                    <p className="text-[15px] text-[#444] leading-[1.7] mb-5">
                      {card.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                      {card.details.map((detail) => (
                        <div
                          key={detail}
                          className="flex items-start gap-2 text-[13px] text-[#555]"
                        >
                          <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D] mt-[6px]" />
                          {detail}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div>
                        {card.price ? (
                          <>
                            <span className="text-[12px] text-[#888]">
                              {card.priceLabel}
                            </span>
                            <span className="text-[28px] font-extrabold text-[#0B2040] ml-2">
                              {card.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-[14px] font-semibold text-[#555]">
                            {card.priceLabel}
                          </span>
                        )}
                      </div>
                      <Link
                        href="/book"
                        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#E07B2D] hover:text-[#CC6A1F] transition-colors"
                      >
                        Book This Service
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>

                  {/* Image */}
                  {card.image && (
                    <div className="hidden lg:block">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA-to-light transition */}
      <div style={{ background: "linear-gradient(to bottom, #FAFBFC, #FFFFFF)", height: "40px" }} />

      {/* Not Sure CTA */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8F6F1 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 text-center relative z-10">
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-3">
            Not sure what you need?
          </h2>
          <p className="text-[15px] text-[#555] mb-8 mx-auto max-w-[480px]">
            Tell us what is going on with your vehicle and we will figure out
            the rest. No diagnostic fee, no commitment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/book" variant="primary" size="lg" className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]">
              Get a Quote
            </Button>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-[#0B2040] bg-white border border-[#e8e4dc] rounded-[var(--radius-button)] hover:border-[#ccc] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all"
            >
              <Phone size={16} />
              Call 813-722-LUBE
            </a>
          </div>
        </div>
      </section>

      {/* CTA-to-FAQ transition */}
      <div style={{ background: "linear-gradient(to bottom, #F8F6F1, #FAFBFC)", height: "40px" }} />

      {/* FAQ Accordion */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="max-w-[700px] mx-auto">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Common Questions
            </p>
            <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
              Automotive Service FAQs
            </h2>
            <div>
              {faqItems.map((faq, i) => (
                <div key={i} className="border-b border-[#eee]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="text-[15px] font-semibold text-[#0B2040]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[#888] transition-transform ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <p className="text-[14px] text-[#444] leading-[1.7] pb-4">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ-to-dark transition */}
      <div style={{ background: "linear-gradient(to bottom, #FAFBFC 0%, #3a6a8e 50%, #0F2847 100%)", height: "80px" }} />

      {/* Other Services Teaser */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(224,123,45,0.05) 0%, transparent 70%)" }} />

        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="rounded-[14px] p-7 hover:translate-y-[-2px] transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              <h3 className="text-[20px] font-bold text-white mb-2">
                Fleet & Commercial
              </h3>
              <p className="text-[14px] text-white/60 leading-[1.7] mb-4">
                From company cars to box trucks. Scheduled maintenance programs
                built around your fleet.
              </p>
              <Link
                href="/fleet"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#E07B2D] hover:text-[#f09450] transition-colors"
              >
                Learn about fleet services
                <ArrowRight size={15} />
              </Link>
            </div>
            <div
              className="rounded-[14px] p-7 hover:translate-y-[-2px] transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              <h3 className="text-[20px] font-bold text-white mb-2">
                Marine
              </h3>
              <p className="text-[14px] text-white/60 leading-[1.7] mb-4">
                Outboard and inboard engine service at the marina or boat ramp.
              </p>
              <Link
                href="/marine"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#E07B2D] hover:text-[#f09450] transition-colors"
              >
                Learn about marine services
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
