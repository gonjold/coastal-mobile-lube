"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Check } from "lucide-react";
import Button from "@/components/Button";
import { cloudinaryUrl, images } from "@/lib/cloudinary";

const bookingServices = {
  automotive: [
    "Synthetic Oil Change",
    "Tire Rotation & Balance",
    "Tire Sales & Install",
    "Brake Inspection",
    "Fluid Top-Off",
    "Battery Service",
    "Filter Replacement",
    "Wiper Blades",
    "Other (describe below)",
  ],
  fleet: [
    "Scheduled Fleet Maintenance",
    "Company Vehicle Programs",
    "Box Truck & Heavy-Duty",
    "DOT Inspections",
    "Emergency Mobile Service",
    "Custom Fleet Plans",
    "Volume Pricing",
    "Multi-Vehicle Discounts",
    "Other (describe below)",
  ],
  marine: [
    "Outboard Oil Change",
    "Inboard Engine Service",
    "Lower Unit Service",
    "Seasonal Winterization",
    "Boat Ramp Service",
    "Dock-Side Maintenance",
    "Fuel System Service",
    "Cooling System Flush",
    "Other (describe below)",
  ],
};

const servicesData = {
  automotive: {
    title: "Automotive Services",
    description:
      "Factory-grade oil changes, tire rotations, brake checks, and preventive maintenance - all performed at your home or office.",
    pricing: "$49",
    pricingLabel: "Starting at",
    items: [
      "Synthetic Oil Change",
      "Tire Rotation & Balance",
      "Tire Sales & Installation",
      "Brake Inspection",
      "Fluid Top-Off",
      "Battery Service",
      "Filter Replacement",
      "Wiper Blades",
    ],
    image: images.drivewayService,
  },
  fleet: {
    title: "Fleet & Commercial",
    description:
      "Scheduled maintenance programs for company vehicles, box trucks, and commercial fleets. Volume pricing and custom plans available.",
    pricing: "Custom",
    pricingLabel: "Fleet pricing",
    items: [
      "Scheduled Fleet Maintenance",
      "Company Vehicle Programs",
      "Box Truck & Heavy-Duty",
      "DOT Inspections",
      "Emergency Mobile Service",
      "Custom Fleet Plans",
      "Volume Pricing",
      "Multi-Vehicle Discounts",
    ],
    image: images.commercialService,
  },
  marine: {
    title: "Marine Services",
    description:
      "Dockside and boat ramp service for outboard and inboard engines. Seasonal maintenance and winterization across Tampa.",
    pricing: "$89",
    pricingLabel: "Starting at",
    items: [
      "Outboard Oil Change",
      "Inboard Engine Service",
      "Lower Unit Service",
      "Seasonal Winterization",
      "Boat Ramp Service",
      "Dock-Side Maintenance",
      "Fuel System Service",
      "Cooling System Flush",
    ],
    image: images.marinaBoatsAlt,
  },
};

type TabKey = "automotive" | "fleet" | "marine";

const bookingTabs: { key: TabKey; label: string }[] = [
  { key: "automotive", label: "Automotive" },
  { key: "fleet", label: "Fleet" },
  { key: "marine", label: "Marine" },
];

const serviceTabs: { key: TabKey; label: string }[] = [
  { key: "automotive", label: "Automotive" },
  { key: "fleet", label: "Fleet & Commercial" },
  { key: "marine", label: "Marine" },
];

const inputClasses =
  "w-full text-sm rounded-[10px] px-3 py-2.5 outline-none border-2 border-[#eee] bg-[#fafafa] focus:border-[#1A5FAC] transition-colors";

export default function Home() {
  const [bookingTab, setBookingTab] = useState<TabKey>("automotive");
  const [servicesTab, setServicesTab] = useState<TabKey>("automotive");

  const currentService = servicesData[servicesTab];

  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 pt-12 pb-12 md:pt-20 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-12 items-start">
            {/* Left Column */}
            <div>
              <h1 className="text-[34px] md:text-[50px] font-extrabold leading-[1.06] text-[#0B2040] tracking-[-1.5px] mb-5">
                The shop comes to <span className="text-[#E07B2D]">you.</span>
              </h1>
              <p className="text-[17px] leading-[1.65] text-[#666] max-w-[460px] mb-8">
                Mobile oil changes, tire sales and service, and marine engine
                maintenance. At your driveway, your parking lot, or your marina.
                Tampa and surrounding areas.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button href="/book" variant="primary" size="lg">
                  Book Online
                </Button>
                <a
                  href="tel:8137225823"
                  className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-[#0B2040] bg-white border-2 border-[#ddd] rounded-[var(--radius-button)] hover:border-[#bbb] transition-all"
                >
                  <Phone size={16} />
                  Call 813-722-LUBE
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-7 border-t border-[#eee]">
                {["Factory-trained techs", "Licensed & insured", "Same-week availability"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center shrink-0 w-[22px] h-[22px] rounded-[6px] bg-[#EBF4FF]">
                      <Check size={13} className="text-[#1A5FAC]" />
                    </div>
                    <span className="text-sm text-[#555] font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Widget */}
            <div className="bg-white border border-[#e4e4e4] rounded-[16px] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              <h2 className="text-[19px] font-bold text-[#0B2040] mb-1">
                Get a quick quote
              </h2>
              <p className="text-[13px] text-[#999] mb-5">
                Tell us what you need. We will get back to you fast.
              </p>

              <div className="flex rounded-lg p-1 bg-[#f5f5f5] mb-5">
                {bookingTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBookingTab(tab.key)}
                    className={`flex-1 text-[13px] font-semibold py-2 rounded-md transition-all ${
                      bookingTab === tab.key
                        ? "bg-white text-[#0B2040] shadow-sm"
                        : "text-[#999]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#999] tracking-[0.5px] mb-1.5">
                    Service Needed
                  </label>
                  <select className={inputClasses}>
                    <option value="">Select a service</option>
                    {bookingServices[bookingTab].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-semibold text-[#999] tracking-[0.5px] mb-1.5">
                      Zip Code
                    </label>
                    <input type="text" placeholder="e.g. 33601" className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-semibold text-[#999] tracking-[0.5px] mb-1.5">
                      Phone
                    </label>
                    <input type="tel" placeholder="(555) 555-5555" className={inputClasses} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#999] tracking-[0.5px] mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Vehicle year/make/model, tire size, special requests, etc."
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                <button className="w-full font-semibold text-white rounded-[var(--radius-button)] py-3.5 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors">
                  Get My Quote
                </button>

                <p className="text-center text-[12px] text-[#999]">
                  or call{" "}
                  <a href="tel:8137225823" className="font-medium text-[#1A5FAC]">
                    813-722-LUBE
                  </a>{" "}
                  for immediate help
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 pt-12 pb-16 md:pt-16">
          <div className="text-center mb-10">
            <p className="text-[12px] uppercase font-bold text-[#1A5FAC] tracking-[2px] mb-3">
              Services
            </p>
            <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#0B2040] mb-3">
              What we handle on-site
            </h2>
            <p className="text-[15px] text-[#888] mx-auto max-w-[480px]">
              Everything your vehicle, fleet, or boat needs. Brought directly to
              your location by a factory-trained technician.
            </p>
          </div>

          <div className="flex justify-center gap-6 mb-10 border-b border-[#eee]">
            {serviceTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setServicesTab(tab.key)}
                className={`text-[14px] font-semibold pb-3 -mb-px transition-colors ${
                  servicesTab === tab.key
                    ? "text-[#0B2040] border-b-2 border-[#0B2040]"
                    : "text-[#999] border-b-2 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h3 className="text-[22px] font-bold text-[#0B2040] mb-3">
                {currentService.title}
              </h3>
              <p className="text-[15px] text-[#666] leading-relaxed mb-5">
                {currentService.description}
              </p>
              <div className="mb-6">
                <span className="text-[12px] text-[#999]">
                  {currentService.pricingLabel}
                </span>
                <span className="text-[28px] font-extrabold text-[#0B2040] ml-2">
                  {currentService.pricing}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {currentService.items.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[13px] text-[#555] bg-white border border-[#f0f0f0] rounded-lg px-3 py-[9px]"
                  >
                    <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-[14px] overflow-hidden">
              <img
                src={cloudinaryUrl(currentService.image, { width: 800, height: 600 })}
                alt={currentService.title}
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-4 bg-white/85 backdrop-blur-[10px]">
                <span className="text-[14px] font-semibold text-[#0B2040]">
                  Ready to book?
                </span>
                <Link
                  href="/book"
                  className="text-[13px] font-semibold text-white px-4 py-2 rounded-md bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
                >
                  Get Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 py-12 md:py-16">
          <div className="text-center mb-12">
            <p className="text-[12px] uppercase font-bold text-[#1A5FAC] tracking-[2px] mb-3">
              How It Works
            </p>
            <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#0B2040]">
              Three steps. That&apos;s it.
            </h2>
          </div>

          <div className="relative">
            <div
              className="hidden md:block absolute top-[30px] h-[2px] bg-[#eee]"
              style={{ left: "calc(16.67% + 30px)", right: "calc(16.67% + 30px)" }}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
              {[
                {
                  num: "1",
                  title: "Book online or call",
                  desc: "Pick your service, enter your zip, and choose a time. Or just call us at 813-722-LUBE.",
                  bg: "#0B2040",
                },
                {
                  num: "2",
                  title: "We show up",
                  desc: "Our fully equipped van arrives at your location, on time, ready to work.",
                  bg: "#0B2040",
                },
                {
                  num: "3",
                  title: "Done. Go.",
                  desc: "No waiting rooms. No ride to the shop. You never left your day.",
                  bg: "#E07B2D",
                },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className="flex items-center justify-center w-[60px] h-[60px] rounded-[14px] text-white text-xl font-bold mb-5"
                    style={{ background: step.bg }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#666] max-w-[280px]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#0B2040] py-11 px-6">
        <div className="section-inner">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "30+", label: "Years in fixed ops" },
              { value: "<1hr", label: "Most services completed" },
              { value: "100%", label: "Mobile. Always." },
              { value: "$0", label: "Surprise fees. Ever." },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[32px] font-extrabold text-[#E07B2D] mb-1">
                  {stat.value}
                </p>
                <p className="text-[12px] text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-12 md:py-16 text-center">
          <p className="text-[12px] uppercase font-bold text-[#1A5FAC] tracking-[2px] mb-3">
            Ready?
          </p>
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#0B2040] mb-3">
            Skip the shop.
          </h2>
          <p className="text-[15px] text-[#999] mb-8 mx-auto max-w-[460px]">
            Book your mobile service today. Most appointments available within
            the week.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/book" variant="primary" size="lg">
              Book Online
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

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex lg:hidden items-center gap-3 px-4 py-3 bg-white border-t border-[#eee] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-[100]">
        <a
          href="tel:8137225823"
          className="inline-flex items-center justify-center w-12 h-12 shrink-0 text-[#0B2040] border-2 border-[#e8e8e8] rounded-[10px]"
          aria-label="Call 813-722-LUBE"
        >
          <Phone size={20} />
        </a>
        <Link
          href="/book"
          className="flex-1 inline-flex items-center justify-center font-semibold text-white rounded-[var(--radius-button)] py-3.5 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
        >
          Book Online
        </Link>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
