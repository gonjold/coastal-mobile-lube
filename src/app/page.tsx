"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Phone, Check, Clock, MapPin, Wrench, Shield, Award, Tag, ChevronRight, ChevronDown } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import Button from "@/components/Button";
import { cloudinaryUrl, images } from "@/lib/cloudinary";
import { useServices } from "@/hooks/useServices";

/* ── Homepage category configs per division ── */

interface CategoryConfig {
  displayName: string;
  description: string;
  firestoreCategories: string[]; // matched against service.category for min price
  ctaLabel?: string;
  ctaAction?: "fleet-quote";
}

const DIVISION_CATEGORIES: Record<TabKey, CategoryConfig[]> = {
  automotive: [
    { displayName: "Oil Changes", description: "Conventional, synthetic blend, full synthetic, and diesel oil changes. Factory-grade service at your location.", firestoreCategories: ["Oil Changes"] },
    { displayName: "Tires & Wheels", description: "Tire rotation, flat repair, mount and balance, TPMS service, and new tire installation.", firestoreCategories: ["Tire/Wheel"] },
    { displayName: "Brakes", description: "Front and rear brake pads, full brake jobs, and brake fluid flush.", firestoreCategories: ["Brakes"] },
    { displayName: "Basic Maintenance", description: "Wiper blades, air filters, cabin filters, batteries, coolant flush, belts, and more.", firestoreCategories: ["Basic Maintenance"] },
    { displayName: "A/C & Heating", description: "A/C diagnostic, EVAC and recharge, and heating system service.", firestoreCategories: ["HVAC"] },
  ],
  fleet: [
    { displayName: "Custom Fleet Maintenance Programs", description: "Scheduled maintenance for your entire fleet. Volume pricing available.", firestoreCategories: ["Preventive Maintenance Tiers"], ctaLabel: "Request Fleet Quote", ctaAction: "fleet-quote" },
  ],
  marine: [
    { displayName: "Oil Service", description: "Outboard and inboard engine oil changes, filter replacement, and lower unit service.", firestoreCategories: ["Marine Oil Service"] },
    { displayName: "Engine Service", description: "Fuel system service, diesel maintenance, and comprehensive engine diagnostics.", firestoreCategories: ["Marine Fuel/Fluid Services", "Marine Diesel Services"] },
    { displayName: "Electrical & Maintenance", description: "Battery service, wiring, lighting, belts, hoses, and marine system diagnostics.", firestoreCategories: ["Marine Basic Maintenance"] },
    { displayName: "Winterization", description: "Complete winterization service to protect your boat during the off-season.", firestoreCategories: ["Marine Basic Maintenance"] },
  ],
  rv: [
    { displayName: "Oil & Lube", description: "Full synthetic and diesel oil changes for motorhomes and tow vehicles.", firestoreCategories: ["Oil Changes"] },
    { displayName: "Tires & Wheels", description: "Tire rotation, flat repair, mount and balance, and TPMS service for RVs.", firestoreCategories: ["Tire/Wheel"] },
    { displayName: "Brakes", description: "Brake pads, rotors, and brake system service for all RV types.", firestoreCategories: ["Brakes"] },
    { displayName: "Maintenance", description: "Generator service, roof inspections, slide-out care, filters, and more.", firestoreCategories: ["Basic Maintenance"] },
  ],
};

const DIVISION_KEY_MAP: Record<TabKey, string> = {
  automotive: "auto",
  fleet: "fleet",
  marine: "marine",
  rv: "rv",
};

const DIVISION_LINKS: Record<TabKey, { href: string; label: string }> = {
  automotive: { href: "/services", label: "View all Automotive services" },
  fleet: { href: "/fleet", label: "View all Fleet services" },
  marine: { href: "/marine", label: "View all Marine services" },
  rv: { href: "/rv", label: "View all RV services" },
};

type TabKey = "automotive" | "fleet" | "marine" | "rv";

const TAB_TO_DIVISION: Record<TabKey, string> = {
  automotive: "Automotive",
  fleet: "Fleet",
  marine: "Marine",
  rv: "RV",
};

const serviceTabs: { key: TabKey; label: string }[] = [
  { key: "automotive", label: "Automotive" },
  { key: "fleet", label: "Fleet & Commercial" },
  { key: "marine", label: "Marine" },
  { key: "rv", label: "RV" },
];

export default function Home() {
  const { openBooking } = useBooking();
  const [servicesTab, setServicesTab] = useState<TabKey>("automotive");
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const { services: allServices } = useServices({ activeOnly: true });

  /* Compute per-category min prices from Firestore services */
  const categoryPrices = useMemo(() => {
    const prices: Record<string, Record<string, number | null>> = {};
    for (const [tabKey, categories] of Object.entries(DIVISION_CATEGORIES) as [TabKey, CategoryConfig[]][]) {
      prices[tabKey] = {};
      const divKey = DIVISION_KEY_MAP[tabKey];
      const divServices = allServices.filter((s) => s.division === divKey);
      for (const cat of categories) {
        const validPrices = divServices
          .filter((s) => cat.firestoreCategories.includes(s.category) && s.price > 0)
          .map((s) => s.price);
        prices[tabKey][cat.displayName] = validPrices.length > 0 ? Math.min(...validPrices) : null;
      }
    }
    return prices;
  }, [allServices]);

  const currentCategories = DIVISION_CATEGORIES[servicesTab];
  const currentPrices = categoryPrices[servicesTab] ?? {};
  const currentLink = DIVISION_LINKS[servicesTab];

  const divisionIcons: Record<TabKey, typeof Wrench> = {
    automotive: Wrench,
    fleet: MapPin,
    marine: Shield,
    rv: Tag,
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-clip md:min-h-[600px]" style={{ background: "linear-gradient(180deg, #0A1628 0%, #0B2040 50%, #0F2847 100%)" }}>

        {/* Oval badge watermark - massive brand stamp */}
        <img
          src={cloudinaryUrl(images.logo, { width: 900, quality: "auto" })}
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-auto opacity-[0.04] z-0 pointer-events-none select-none"
        />

        <div className="section-inner px-4 lg:px-6 pt-10 pb-10 md:pt-24 md:pb-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-3 md:mb-4 flex flex-col items-center gap-[5px]">
              <p className="text-[11px] md:text-[12px] uppercase font-bold text-[#F97316] tracking-[3px]">
                Mobile Service
              </p>
              <p className="text-[13px] md:text-[14px] font-normal text-white/70">
                Cars. Trucks. RVs. Boats. Your entire fleet.
              </p>
            </div>
            <h1 className="text-[30px] md:text-[52px] font-extrabold leading-[1.06] text-white tracking-[-1.5px] mb-3 md:mb-5" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)" }}>
              The shop that comes to{" "}
              <span className="relative">
                <span className="text-[#E07B2D]">you.</span>
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#E07B2D]/40" />
              </span>
            </h1>
            {/* Mobile subtext — short */}
            <p className="md:hidden text-[15px] leading-[1.6] text-white/60 max-w-[620px] mx-auto mb-6">
              We come to your driveway, parking lot, or dock. No shop visit needed.
            </p>
            {/* Desktop subtext — full */}
            <p className="hidden md:block text-[17px] leading-[1.7] text-white/60 max-w-[620px] mx-auto mb-8">
              Mobile oil changes, tire service, fleet maintenance, marine engine care, and RV service. We come to your driveway, your parking lot, or your dock.
            </p>

            {/* Hero CTA buttons — desktop only, mobile uses sticky bottom bar */}
            <div className="hidden md:flex flex-col sm:flex-row justify-center gap-3 mb-8">
              <Button variant="primary" size="lg" className="whitespace-nowrap shadow-[0_4px_24px_rgba(224,123,45,0.35)]" onClick={openBooking}>
                Book Service
              </Button>
              <a
                href="tel:8137225823"
                className="inline-flex items-center justify-center gap-2 px-[24px] py-[14px] font-semibold text-white bg-white/[0.06] border border-white/20 rounded-[var(--radius-button)] hover:bg-white/[0.12] hover:border-white/35 transition-all whitespace-nowrap backdrop-blur-sm"
              >
                <Phone size={16} />
                Call 813-722-LUBE
              </a>
            </div>

            <div className="hidden md:flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-7 border-t border-white/[0.08]">
              {["Factory-trained techs", "Licensed & insured", "Same-day availability"].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center shrink-0 w-[22px] h-[22px] rounded-full bg-[#0D8A8F]/15 shadow-[0_0_8px_rgba(13,138,143,0.15)]" style={{ border: "1px solid rgba(13,138,143,0.2)" }}>
                    <Check size={12} className="text-[#0D8A8F] drop-shadow-[0_0_2px_rgba(13,138,143,0.4)]" />
                  </div>
                  <span className="text-sm text-white/50 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ── How It Works ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="section-inner px-4 lg:px-6 py-8 md:py-20">
          <div className="text-center mb-6 md:mb-12">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-2 md:mb-3">
              How It Works
            </p>
            <h2 className="text-[24px] md:text-[34px] font-extrabold text-[#0B2040]">
              Three steps. That&apos;s it.
            </h2>
          </div>

          <div className="relative max-w-[900px] mx-auto">
            {/* Connecting line — desktop only */}
            <div className="hidden md:block absolute top-[60px] h-[2px]" style={{ left: "calc(16.67% + 40px)", right: "calc(16.67% + 40px)", background: "linear-gradient(to right, #E07B2D, #D9A441, #0D8A8F)" }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                {
                  num: "1",
                  title: "Book in 60 seconds",
                  desc: "Pick your service, choose a time. Or just call us.",
                  icon: <Clock size={22} className="text-[#E07B2D]" />,
                  gradient: "linear-gradient(135deg, #0B2040, #132E54)",
                },
                {
                  num: "2",
                  title: "We show up",
                  desc: "Our fully equipped van arrives at your location, on time, ready to work.",
                  icon: <MapPin size={22} className="text-[#D9A441]" />,
                  gradient: "linear-gradient(135deg, #0F2847, #1A3A5E)",
                },
                {
                  num: "3",
                  title: "Done. Go.",
                  desc: "No waiting rooms. No ride to the shop. You never left your day.",
                  icon: <Wrench size={22} className="text-white" />,
                  gradient: "linear-gradient(135deg, #E07B2D, #CC6A1F)",
                },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className="relative flex items-center justify-center w-[56px] h-[56px] md:w-[72px] md:h-[72px] rounded-[14px] md:rounded-[18px] text-white text-xl font-bold mb-3 md:mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    style={{ background: step.gradient }}
                  >
                    <span className="absolute top-1.5 left-2 md:top-2 md:left-2.5 text-[16px] md:text-[20px] font-extrabold text-white/30 leading-none">
                      {step.num}
                    </span>
                    {step.icon}
                  </div>
                  <h3 className="text-[16px] md:text-[18px] font-bold text-[#0B2040] mb-1 md:mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.7] text-[#555] max-w-[260px]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="relative bg-[#F0EDE6]">
        <div className="section-inner px-4 lg:px-6 pt-8 pb-10 md:pt-14 md:pb-14">
          <div className="text-center mb-6 md:mb-10">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-2 md:mb-3">
              Services
            </p>
            <h2 className="text-[24px] md:text-[34px] font-extrabold text-[#0B2040] mb-2 md:mb-3">
              What we handle on-site
            </h2>
            <p className="hidden md:block text-[15px] text-[#555] mx-auto max-w-[480px]">
              Everything your vehicle, fleet, boat, or RV needs. Brought directly to
              your location by a factory-trained technician.
            </p>
          </div>

          {/* Division pills — scrollable on mobile, centered on desktop */}
          <div className="flex md:justify-center gap-2 mb-6 md:mb-10 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible scrollbar-hide">
            {serviceTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setServicesTab(tab.key); setExpandedService(null); }}
                className={`text-[13px] md:text-[14px] font-semibold px-4 md:px-5 py-2 md:py-2.5 rounded-full transition-all whitespace-nowrap flex-shrink-0 ${
                  servicesTab === tab.key
                    ? "bg-[#0B2040] text-white shadow-[0_2px_12px_rgba(11,32,64,0.25)]"
                    : "bg-white md:bg-[#F0EDE6] text-[#666] hover:bg-[#E8E4DC] hover:text-[#444]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Mobile: category accordion ── */}
          <div className="md:hidden flex flex-col gap-2">
            {currentCategories.map((cat) => {
              const key = `${servicesTab}-${cat.displayName}`;
              const isExpanded = expandedService === key;
              const price = currentPrices[cat.displayName];
              const Icon = divisionIcons[servicesTab];
              return (
                <div key={key} className="bg-white rounded-[12px] border border-[#f0ede6] overflow-hidden">
                  <button
                    onClick={() => setExpandedService(isExpanded ? null : key)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "#E07B2D10" }}>
                      <Icon size={16} className="text-[#E07B2D]" />
                    </div>
                    <span className="flex-1 text-[14px] font-semibold text-[#0B2040]">{cat.displayName}</span>
                    {price != null && (
                      <span className="text-[12px] font-bold text-[#E07B2D] mr-1">${price.toFixed(2)}</span>
                    )}
                    {isExpanded
                      ? <ChevronDown size={16} className="text-[#999] shrink-0" />
                      : <ChevronRight size={16} className="text-[#999] shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-0 border-t border-[#f0ede6]">
                      <p className="text-[13px] text-[#555] leading-[1.6] py-2">{cat.description}</p>
                      {price != null ? (
                        <p className="text-[12px] text-[#888] mb-2">
                          Starting at{" "}
                          <span className="font-bold text-[#0B2040]">${price.toFixed(2)}</span>
                        </p>
                      ) : !cat.ctaAction && (
                        <p className="text-[12px] text-[#888] mb-2">Call for pricing</p>
                      )}
                      <button
                        onClick={() => openBooking({
                          division: TAB_TO_DIVISION[servicesTab],
                          categoryId: cat.firestoreCategories[0],
                        })}
                        className="w-full text-[13px] font-semibold text-white py-2.5 rounded-[8px] bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors mt-1"
                      >
                        {cat.ctaLabel ?? "Book This Service"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <Link
              href={currentLink.href}
              className="inline-block mt-2 text-[14px] font-semibold text-[#E07B2D] hover:underline text-center"
            >
              View All Services &rarr;
            </Link>
          </div>

          {/* ── Desktop: category cards + optional image ── */}
          <div className={`hidden md:grid items-start gap-8 ${servicesTab === "automotive" ? "grid-cols-1 lg:grid-cols-5" : ""}`}>
            {/* Category cards grid */}
            <div className={`grid gap-4 ${
              servicesTab === "automotive"
                ? "lg:col-span-3 grid-cols-1 xl:grid-cols-2"
                : servicesTab === "fleet"
                  ? "grid-cols-1 max-w-xl mx-auto"
                  : "grid-cols-2 lg:grid-cols-3"
            }`}>
              {currentCategories.map((cat) => {
                const price = currentPrices[cat.displayName];
                return (
                  <div
                    key={cat.displayName}
                    className="bg-white rounded-[14px] p-5 shadow-[0_2px_20px_rgba(11,32,64,0.06)] border border-[#f0ede6] flex flex-col"
                  >
                    <h3 className="text-[18px] font-bold text-[#0B2040] mb-1">
                      {cat.displayName}
                    </h3>
                    {price != null ? (
                      <p className="text-[14px] font-semibold text-[#E07B2D] mb-2">
                        Starting at ${price.toFixed(2)}
                      </p>
                    ) : !cat.ctaAction ? (
                      <p className="text-[14px] font-semibold text-[#E07B2D] mb-2">
                        Call for pricing
                      </p>
                    ) : null}
                    <p className="text-[14px] text-[#555] leading-[1.6] mb-4 flex-1 line-clamp-2">
                      {cat.description}
                    </p>
                    <button
                      onClick={() => openBooking({
                        division: TAB_TO_DIVISION[servicesTab],
                        categoryId: cat.firestoreCategories[0],
                      })}
                      className="text-[13px] font-semibold text-[#E07B2D] border border-[#E07B2D] rounded-[8px] px-4 py-2 hover:bg-[#FFF9F4] hover:shadow-[0_2px_8px_rgba(224,123,45,0.12)] transition-all self-start"
                    >
                      {cat.ctaLabel ?? "Book This Service"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Service image — Automotive only */}
            {servicesTab === "automotive" && (
              <div className="hidden lg:block lg:col-span-2 relative rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(11,32,64,0.1)]">
                <img
                  src={cloudinaryUrl(images.drivewayService, { width: 800, height: 600 })}
                  alt="Mobile automotive service"
                  className="w-full h-auto"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-4"
                  style={{
                    background: "linear-gradient(to right, rgba(255,255,255,0.92), rgba(255,255,255,0.88))",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <span className="text-[14px] font-semibold text-[#0B2040]">
                    Ready to book?
                  </span>
                  <button
                    onClick={() => openBooking({ division: TAB_TO_DIVISION[servicesTab] })}
                    className="text-[13px] font-semibold text-white px-5 py-2.5 rounded-[8px] bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors shadow-[0_2px_8px_rgba(224,123,45,0.3)]"
                  >
                    Get Quote
                  </button>
                </div>
              </div>
            )}

            {/* "View All" link below cards — desktop */}
            <div className={`${servicesTab === "automotive" ? "lg:col-span-5" : ""} text-center mt-2`}>
              <Link
                href={currentLink.href}
                className="text-[14px] font-semibold text-[#E07B2D] hover:underline"
              >
                {currentLink.label} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hull stripe separator ── */}
      <div className="h-[3px]" style={{ background: "linear-gradient(to right, #1A5FAC, #E07B2D, #D9A441, #1A5FAC)" }} />


      {/* ── Stats Bar ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
        {/* Top edge accent */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(217,164,65,0.3), transparent)" }} />
        {/* Bottom edge accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(217,164,65,0.3), transparent)" }} />

        <div className="section-inner px-4 md:px-6 py-8 md:py-14 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            {[
              { value: "30+", label: "Years in fixed ops" },
              { value: "<1hr", label: "Most services completed" },
              { value: "100%", label: "Mobile. Always." },
              { value: "$0", label: "Surprise fees. Ever." },
            ].map((stat, i) => (
              <div key={stat.label} className={`relative ${i < 3 ? "md:after:content-[''] md:after:absolute md:after:right-0 md:after:top-1/2 md:after:-translate-y-1/2 md:after:h-[40px] md:after:w-px md:after:bg-white/10" : ""}`}>
                <p className="text-[28px] md:text-[42px] font-extrabold text-[#E07B2D] mb-0.5 md:mb-1 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[11px] md:text-[13px] text-white/50 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Reviews ── */}
      <section className="overflow-hidden bg-[#F4EEE3]">
        <div className="section-inner px-4 lg:px-6 pt-8 md:pt-14 pb-2 md:pb-4">
          <div className="text-center mb-6 md:mb-10">
            <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[1.5px] mb-2 md:mb-3">
              Reviews
            </p>
            <h2 className="text-[24px] md:text-[34px] font-extrabold text-[#0F2847]">
              What our customers say
            </h2>
          </div>
        </div>

        <style>{`
          @keyframes reviewScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>

        <div className="group">
          <div
            className="flex gap-3 md:gap-5 w-max"
            style={{ animation: "reviewScroll 35s linear infinite" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = "running"; }}
          >
            {[...Array(2)].map((_, setIdx) =>
              [
                { text: "Called Monday morning, Chase was at my house by noon. Oil change done in my driveway in 25 minutes. Why would I ever go back to a shop?", name: "Mike R.", city: "Apollo Beach" },
                { text: "We have 14 work vans and scheduling service used to be a nightmare. Now they come to our lot every month. Game changer for our fleet.", name: "Sarah T.", city: "Riverview" },
                { text: "Had my boat winterized right at the marina. No hauling, no waiting. Professional, fast, fair price.", name: "Dave K.", city: "Ruskin" },
                { text: "First time trying mobile service and I am never going back to sitting in a waiting room. Booked online, tech showed up on time, done.", name: "Lisa M.", city: "Sun City Center" },
                { text: "Got new tires mounted in my office parking lot during lunch. Did not miss a minute of work.", name: "James P.", city: "Gibsonton" },
                { text: "Honest pricing, no upselling. Exactly what they quoted is what I paid. Refreshing.", name: "Ana C.", city: "Riverview" },
              ].map((review) => (
                <div
                  key={`${setIdx}-${review.name}`}
                  className="w-[280px] md:w-[350px] flex-shrink-0 bg-white rounded-[14px] p-4 md:p-6 flex flex-col shadow-[0_2px_16px_rgba(139,115,85,0.08)] border border-[#EDE8DF]"
                >
                  <div className="text-[#D9A441] text-[14px] md:text-[16px] mb-2 md:mb-3 tracking-wide">
                    {"★★★★★"}
                  </div>
                  <p className="text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.7] text-[#2C2C2C] flex-1 mb-3 md:mb-4">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-[#F0EDE6]">
                    <span className="text-[12px] md:text-[13px] font-bold text-[#0F2847]">
                      {review.name} <span className="font-normal text-[#999]">- {review.city}</span>
                    </span>
                    <span className="text-[10px] md:text-[11px] text-[#aaa] font-medium">Google Review</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section-inner px-4 lg:px-6 pb-8 md:pb-14">
          <div className="text-center mt-6 md:mt-8">
            <p className="text-[13px] text-[#8B7355] mb-2">Reviews from customers across the South Shore</p>
            {/* TODO: Replace with real Google Business Profile review URL from Jason */}
            <a href="/contact" className="text-[13px] font-semibold text-[#E07B2D] hover:underline">
              Leave us a review on Google &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── Hull stripe separator ── */}
      <div className="h-[3px]" style={{ background: "linear-gradient(to right, #1A5FAC, #E07B2D, #D9A441, #1A5FAC)" }} />


      {/* ── Trust Bar (inline) ── */}
      <section className="relative bg-[#F8F6F1]">
        <div className="section-inner px-4 lg:px-6 py-6 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
            {[
              { icon: Shield, text: "Fully Licensed & Insured", color: "#1A5FAC" },
              { icon: Wrench, text: "ASE-Certified Technicians", color: "#0D8A8F" },
              { icon: Award, text: "12-Month Service Warranty", color: "#D9A441" },
              { icon: Tag, text: "Transparent Pricing, No Surprises", color: "#E07B2D" },
            ].map((item, i) => (
              <div
                key={item.text}
                className={`flex flex-col items-center gap-2 md:gap-3 text-center justify-center ${
                  i < 3 ? "md:border-r md:border-[#eee]" : ""
                } md:px-6`}
              >
                <div
                  className="w-[40px] h-[40px] md:w-[52px] md:h-[52px] rounded-[10px] md:rounded-[14px] flex items-center justify-center"
                  style={{ background: `${item.color}10` }}
                >
                  <item.icon size={20} className="shrink-0 md:hidden" style={{ color: item.color }} strokeWidth={1.5} />
                  <item.icon size={26} className="shrink-0 hidden md:block" style={{ color: item.color }} strokeWidth={1.5} />
                </div>
                <span className="text-[12px] md:text-[13px] font-semibold text-[#0F2847]">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── CTA — hidden on mobile, sticky bottom bar handles it ── */}
      <section className="hidden md:block relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A1C38 0%, #0F2847 40%, #132E54 100%)" }}>

        {/* Badge watermark echo */}
        <img
          src={cloudinaryUrl(images.logo, { width: 300, quality: "auto" })}
          alt=""
          aria-hidden="true"
          className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[200px] h-auto pointer-events-none select-none opacity-[0.04]"
        />

        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(to right, transparent, #D9A441, transparent)" }} />

        <div className="section-inner px-4 lg:px-6 py-14 md:py-20 text-center relative z-10">
          <p className="text-[13px] uppercase font-bold text-[#D9A441] tracking-[1.5px] mb-3">
            Ready?
          </p>
          <h2 className="text-[32px] md:text-[42px] font-extrabold text-white mb-4" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            Skip the shop.
          </h2>
          <p className="text-[16px] text-white/65 mb-10 mx-auto max-w-[460px]">
            Book your mobile service today. Most appointments available within
            the week.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="primary" size="lg" className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]" onClick={openBooking}>
              Book Service
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
      </section>
    </>
  );
}
