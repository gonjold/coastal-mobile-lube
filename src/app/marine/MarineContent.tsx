"use client";

import Link from "next/link";
import { Phone, ArrowRight } from "lucide-react";
import Button from "@/components/Button";
import { cloudinaryUrl, images } from "@/lib/cloudinary";

const packages = [
  {
    name: "Dock Ready",
    price: "Starting at $149",
    description: "Quick dockside service for single-engine boats",
    highlight: false,
    includes: [
      "Engine oil and filter change",
      "Lower unit gear oil check",
      "Battery test",
      "Visual hull and anode inspection",
      "Safety systems check",
    ],
  },
  {
    name: "Captain\u2019s Choice",
    price: "Starting at $399",
    description: "Complete annual service per engine",
    highlight: true,
    includes: [
      "Full oil and filter change",
      "Lower unit gear oil change with pressure test",
      "Impeller replacement",
      "Spark plugs",
      "Fuel filter and water separator",
      "Anode inspection and replacement",
      "Battery service",
      "Steering cable lubrication",
    ],
  },
  {
    name: "Season Opener",
    price: "Starting at $249",
    description: "Get your boat ready for the water",
    highlight: false,
    includes: [
      "Fuel system flush and stabilizer",
      "Oil and filter change",
      "Battery charge and test",
      "Impeller inspection",
      "Lower unit oil change",
      "Full systems check",
    ],
  },
];

const individualServices = [
  {
    name: "Outboard Oil Change",
    description: "Routine maintenance for any outboard",
  },
  {
    name: "Inboard Engine Service",
    description: "Oil, filters, and fluid check",
  },
  {
    name: "Lower Unit Service",
    description: "Gear oil change and seal inspection",
  },
  {
    name: "Impeller Replacement",
    description: "Raw water pump maintenance",
  },
  {
    name: "Fuel System Service",
    description: "Filter, water separator, stabilizer",
  },
  {
    name: "Anode and Zinc Replacement",
    description: "Saltwater corrosion protection",
  },
  {
    name: "Battery Service",
    description: "Testing, charging, and replacement",
  },
  {
    name: "Winterization and Storage Prep",
    description: "Seasonal protection package",
  },
];

const locations = [
  "Tampa",
  "Apollo Beach",
  "Ruskin",
  "Davis Islands",
  "Westshore",
  "Gandy",
  "Courtney Campbell",
  "Bayshore",
];

export default function MarineContent() {
  return (
    <>
      {/* Section 1: Hero */}
      <section className="bg-white">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-10 pb-4 md:pt-14 md:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
                Marine Services
              </p>
              <h1 className="text-[30px] md:text-[42px] font-[800] leading-[1.08] text-[#0B2040] tracking-[-1px] mb-5">
                Dockside service for your boat
              </h1>
              <p className="text-[16px] leading-[1.7] text-[#444] max-w-[480px] mb-8">
                We service outboard and inboard engines right at the marina or
                boat ramp. No hauling, no waiting. Factory-grade parts, certified
                technicians, and a 12-month service warranty on every job.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button href="/contact" variant="primary" size="lg">
                  Request Marine Quote
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
            <div>
              <img
                src={cloudinaryUrl(images.marinaBoatsAlt, { width: 800 })}
                alt="Marina boats dockside service"
                className="w-full h-auto rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Service Packages */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Packages
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            Marine service packages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`bg-white border border-[#e8e8e8] rounded-[12px] p-7 ${
                  pkg.highlight ? "border-t-[3px] border-t-[#E07B2D]" : ""
                }`}
              >
                <h3 className="text-[20px] font-bold text-[#0B2040] mb-1">
                  {pkg.name}
                </h3>
                <p className="text-[16px] font-semibold text-[#E07B2D] mb-2">
                  {pkg.price}
                </p>
                <p className="text-[14px] text-[#444] leading-[1.7] mb-4">
                  {pkg.description}
                </p>
                <ul className="flex flex-col gap-2">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D] mt-[7px]" />
                      <span className="text-[14px] text-[#444]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Individual Services */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            A La Carte
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            Individual marine services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {individualServices.map((service) => (
              <div
                key={service.name}
                className="flex items-start gap-2.5 bg-white border border-[#e8e8e8] rounded-[10px] px-[14px] py-[14px]"
              >
                <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D] mt-[7px]" />
                <div>
                  <span className="text-[15px] font-semibold text-[#0B2040]">
                    {service.name}
                  </span>
                  <span className="text-[14px] text-[#666]">
                    {" "}
                    &mdash; {service.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Where We Service */}
      <section className="bg-[#0B2040]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 text-center">
          <h2 className="text-[28px] font-[800] text-white mb-3">
            Where we service boats
          </h2>
          <p className="text-[15px] text-white/70 mb-8 mx-auto max-w-[560px]">
            We come to you at marinas, boat ramps, dry storage, and private
            docks across Tampa Bay and Hillsborough County.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {locations.map((loc, i) => (
              <span key={loc} className="text-[15px] text-white/90 font-medium">
                {loc}
                {i < locations.length - 1 && (
                  <span className="ml-2 text-white/40">&bull;</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: CTA */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 text-center">
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-3">
            Ready to get your boat serviced?
          </h2>
          <p className="text-[15px] text-[#888] mb-8 mx-auto max-w-[480px]">
            Tell us about your vessel and we will put together a custom service
            plan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/contact" variant="primary" size="lg">
              Request Marine Quote
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

      {/* Section 6: Cross-links */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 hover:shadow-md transition-shadow border-t-[3px] border-t-[#E07B2D]">
              <h3 className="text-[20px] font-bold text-[#0B2040] mb-2">
                Looking for automotive service?
              </h3>
              <p className="text-[14px] text-[#444] leading-[1.7] mb-4">
                Personal vehicle maintenance at your home or office.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#E07B2D] hover:text-[#CC6A1F] transition-colors"
              >
                View automotive services
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 hover:shadow-md transition-shadow border-t-[3px] border-t-[#0B2040]">
              <h3 className="text-[20px] font-bold text-[#0B2040] mb-2">
                Need fleet maintenance?
              </h3>
              <p className="text-[14px] text-[#444] leading-[1.7] mb-4">
                Scheduled maintenance programs for company vehicles and
                commercial fleets.
              </p>
              <Link
                href="/fleet"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#E07B2D] hover:text-[#CC6A1F] transition-colors"
              >
                View fleet services
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
