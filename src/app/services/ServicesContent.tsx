"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, ChevronDown, ArrowRight } from "lucide-react";
import Button from "@/components/Button";
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
    price: "$89",
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
    priceLabel: 'Starting at $75 / Rotation from $29',
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
    priceLabel: "Inspection included with any service / Brake pads from $199",
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
    priceLabel: "Testing free with any service / Replacement from $149",
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
    priceLabel: "From",
    price: "$29 per filter",
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
    a: "We serve Tampa, Brandon, Riverview, Wesley Chapel, Plant City, Temple Terrace, Lutz, Land O' Lakes, and surrounding Hillsborough County communities.",
  },
  {
    q: "How much does a mobile oil change cost?",
    a: "Synthetic oil changes start at $89, which includes the oil, filter, and multi-point fluid check. Pricing may vary based on your vehicle's oil capacity and filter requirements. We always confirm the price before we start.",
  },
];

export default function ServicesContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 pt-10 pb-4 md:pt-14 md:pb-8">
          <div className="max-w-[700px]">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Automotive Services
            </p>
            <h1 className="text-[30px] md:text-[42px] font-extrabold leading-[1.08] text-[#0B2040] tracking-[-1px] mb-5">
              Mobile maintenance at your door
            </h1>
            <p className="text-[16px] leading-[1.65] text-[#666] max-w-[700px] mb-8">
              From synthetic oil changes to tire sales and installation, we
              handle everything your vehicle needs without the trip to the shop.
              Factory-trained technicians, professional equipment, and
              transparent pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="/book" variant="primary" size="lg">
                Get a Quote
              </Button>
              <a
                href="tel:8137225823"
                className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-[#0B2040] bg-white border-2 border-[#ddd] rounded-[var(--radius-button)] hover:border-[#bbb] transition-all"
              >
                <Phone size={16} />
                Call 813-722-LUBE
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="flex flex-col gap-6">
            {serviceCards.map((card) => (
              <div
                key={card.name}
                className="bg-white border border-[#e8e8e8] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
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

      {/* Not Sure CTA */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 text-center">
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-3">
            Not sure what you need?
          </h2>
          <p className="text-[15px] text-[#888] mb-8 mx-auto max-w-[480px]">
            Tell us what is going on with your vehicle and we will figure out
            the rest. No diagnostic fee, no commitment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/book" variant="primary" size="lg">
              Get a Quote
            </Button>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-[#0B2040] bg-white border-2 border-[#ddd] rounded-[var(--radius-button)] hover:border-[#bbb] transition-all"
            >
              <Phone size={16} />
              Call 813-722-LUBE
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="bg-[#FAFBFC]">
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

      {/* Other Services Teaser */}
      <section className="bg-[#0B2040]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/[0.08] border border-white/[0.12] rounded-[12px] p-7 hover:bg-white/[0.12] transition-colors">
              <h3 className="text-[20px] font-bold text-white mb-2">
                Fleet & Commercial
              </h3>
              <p className="text-[14px] text-white/70 leading-[1.7] mb-4">
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
            <div className="bg-white/[0.08] border border-white/[0.12] rounded-[12px] p-7 hover:bg-white/[0.12] transition-colors">
              <h3 className="text-[20px] font-bold text-white mb-2">
                Marine
              </h3>
              <p className="text-[14px] text-white/70 leading-[1.7] mb-4">
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
