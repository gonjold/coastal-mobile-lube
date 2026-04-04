"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Phone, ChevronDown, ArrowRight } from "lucide-react";
import Button from "@/components/Button";

/* ─── Category definitions ─── */
const categories = [
  { id: "oil-changes", label: "Oil Changes", startingAt: "$89.95" },
  { id: "tires-wheels", label: "Tires & Wheels", startingAt: "$39.95" },
  { id: "brakes", label: "Brakes", startingAt: "$320" },
  { id: "fluid-services", label: "Fluid Services", startingAt: "$79.95" },
  { id: "diesel-services", label: "Diesel Services", startingAt: "$49.95" },
  { id: "maintenance", label: "Maintenance", startingAt: "$34.95" },
];

/* ─── Oil change tier cards ─── */
const oilTiers = [
  { name: "Synthetic Blend", price: "$89.95", note: "Up to 5 qts", tag: null },
  { name: "Full Synthetic", price: "$119.95", note: "Up to 5 qts", tag: "Most popular" },
  { name: "Diesel", price: "$219.95", note: null, tag: null },
];

const oilBundles = [
  {
    oilType: "Synthetic Blend",
    basic: "$119.95",
    better: "$139.95",
    best: "$179.95",
  },
  {
    oilType: "Full Synthetic",
    basic: "$149.95",
    better: "$169.95",
    best: "$209.95",
  },
  {
    oilType: "Diesel",
    basic: "$259.95",
    better: "$269.95",
    best: "$309.95",
  },
];

/* ─── Tire & wheel services ─── */
const tireServices = [
  { name: "Tire Rotation", price: "$39.95" },
  { name: "Mount & Balance (single)", price: "$49.95" },
  { name: "Mount & Balance (4 tires)", price: "$159.95" },
  { name: "Rotate & Balance", price: "$89.95" },
  { name: "Tire Patch", price: "$69.95" },
  { name: "Road Force Balance", price: "$199.95" },
  { name: "TPMS/Valve Stem", price: "$69.95" },
];

/* ─── Brake services ─── */
const brakeServices = [
  { name: "Front + Rear Brake Job", price: "$320", note: "Pads + resurfacing rotors" },
  { name: "Transit Front + Rear", price: "$450", note: null },
  { name: "Dually Front", price: "$450", note: null },
  { name: "Dually Rear", price: "$720", note: null },
];

/* ─── Fluid services ─── */
const fluidServices = [
  { name: "Battery Service", price: "$79.95" },
  { name: "Throttle Body Service", price: "$129.95" },
  { name: "Power Steering Flush", price: "$219.95" },
  { name: "Brake Flush", price: "$239.95" },
  { name: "Fuel Induction Service", price: "$239.95" },
  { name: "Transfer Case Flush", price: "$249.95" },
  { name: "A/C Evaporator Service", price: "$259.95" },
  { name: "Coolant Flush", price: "$269.95" },
  { name: "Front Diff Flush", price: "$269.95" },
  { name: "Rear Diff Flush", price: "$269.95" },
  { name: "Stop Squeal", price: "$297.95" },
  { name: "Transmission Auto", price: "$419.95" },
  { name: "Transmission Manual", price: "$249.95" },
];

/* ─── Diesel services ─── */
const dieselServices = [
  { name: "Diesel MOA", price: "$49.95" },
  { name: "F250+ Front Diff Flush", price: "$299.95" },
  { name: "F250+ Rear Diff Flush", price: "$299.95" },
  { name: "Diesel Fuel Filters", price: "$399.95" },
  { name: "Diesel Injection Service", price: "$439.95" },
  { name: "Dual Coolant Flush", price: "$499.95" },
  { name: "F450-550 Rear Diff Flush", price: "$399.95" },
];

/* ─── Maintenance services ─── */
const maintenanceServices = [
  { name: "Rear Wiper Blade", price: "$34.95" },
  { name: "Front Wiper Blades", price: "$79.95" },
  { name: "Engine Air Filter", price: "$79.95" },
  { name: "Cabin Air Filter", price: "$99.95" },
  { name: "Cabin Air Filter w/ Frigi Fresh", price: "$129.95" },
  { name: "Diesel Air Filter", price: "$119.95" },
  { name: "Battery Replacement", price: "from $50" },
  { name: "Diesel Fuel Filters", price: "$399.95" },
];

/* ─── Reusable: 2-col service grid ─── */
function ServiceGrid({ items }: { items: { name: string; price: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between bg-white border border-[#f0ede6] rounded-[10px] px-5 py-4 shadow-[0_1px_6px_rgba(11,32,64,0.04)]"
        >
          <span className="text-[15px] font-medium text-[#0B2040]">{item.name}</span>
          <span className="text-[15px] font-bold text-[#E07B2D] whitespace-nowrap ml-4">{item.price}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Category section wrapper ─── */
function CategorySection({
  id,
  title,
  startingAt,
  description,
  children,
  even,
}: {
  id: string;
  title: string;
  startingAt: string;
  description: string;
  children: React.ReactNode;
  even: boolean;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[120px]"
      style={{ background: even ? "#FFFFFF" : "#FAFBFC" }}
    >
      <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
          <h2 className="text-[26px] font-extrabold text-[#0B2040]">{title}</h2>
          <span className="text-[14px] font-semibold text-[#E07B2D]">starting at {startingAt}</span>
        </div>
        <p className="text-[15px] text-[#555] leading-[1.65] mb-8 max-w-[600px]">{description}</p>
        {children}
      </div>
    </section>
  );
}

/* ================================================================
   Main component
   ================================================================ */
export default function ServicesContent() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [bundlesOpen, setBundlesOpen] = useState(false);
  const pillBarRef = useRef<HTMLDivElement>(null);

  /* Track active section on scroll */
  useEffect(() => {
    const ids = categories.map((c) => c.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    setActiveCategory(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #0A1C38 0%, #0B2040 40%, #0F2847 70%, #132E54 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(26,95,172,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 80% 30%, rgba(224,123,45,0.06) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="section-inner px-4 lg:px-6 pt-10 pb-6 md:pt-14 md:pb-10 relative z-10">
          <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
            Automotive Services
          </p>
          <h1 className="text-[30px] md:text-[42px] font-extrabold leading-[1.08] text-white tracking-[-1px] mb-5">
            What we handle on-site
          </h1>
          <p className="text-[16px] leading-[1.65] text-white/60 mb-8 max-w-[520px]">
            Factory-trained technicians come to your driveway, parking lot, or
            job site with everything needed to get the job done right.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              href="/book"
              variant="primary"
              size="lg"
              className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]"
            >
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

        <div
          className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, #0F2847)",
          }}
        />
      </section>

      {/* ─── Navy-to-light transition ─── */}
      <div
        style={{
          background:
            "linear-gradient(to bottom, #0F2847 0%, #1a3a5e 30%, #3a6a8e 60%, #FAFBFC 100%)",
          height: "60px",
        }}
      />

      {/* ─── Sticky Category Pill Navigation ─── */}
      <div
        ref={pillBarRef}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc]/60 shadow-[0_2px_12px_rgba(11,32,64,0.06)]"
      >
        <div className="section-inner px-4 lg:px-6">
          <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#0B2040] text-white shadow-[0_2px_8px_rgba(11,32,64,0.2)]"
                    : "bg-[#FAFBFC] text-[#666] hover:bg-[#f0ede6] hover:text-[#0B2040]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================
         OIL CHANGES
         ================================================================ */}
      <CategorySection
        id="oil-changes"
        title="Oil Changes"
        startingAt="$89.95"
        description="Factory-grade oil change performed at your location. Vacuum extraction, OEM-spec filters, no drain plug risk."
        even={false}
      >
        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {oilTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-[12px] p-6 shadow-[0_2px_12px_rgba(11,32,64,0.06)] ${
                tier.tag
                  ? "border-2 border-[#E07B2D]"
                  : "border border-[#f0ede6]"
              }`}
            >
              {tier.tag && (
                <span className="absolute -top-3 left-5 bg-[#E07B2D] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  {tier.tag}
                </span>
              )}
              <h3 className="text-[18px] font-bold text-[#0B2040] mb-1">
                {tier.name}
              </h3>
              {tier.note && (
                <p className="text-[13px] text-[#888] mb-3">{tier.note}</p>
              )}
              {!tier.note && <div className="mb-3" />}
              <p className="text-[28px] font-extrabold text-[#E07B2D]">
                {tier.price}
              </p>
            </div>
          ))}
        </div>

        {/* Bundle callout */}
        <div className="bg-[#FFF8F0] border border-[#f0dcc4] rounded-[10px] px-5 py-4 mb-6">
          <p className="text-[14px] text-[#0B2040] font-semibold">
            Bundle and save
          </p>
          <p className="text-[13px] text-[#555] mt-1">
            Add tire rotation + multi-point inspection with our Basic, Better,
            or Best packages starting at $119.95
          </p>
        </div>

        {/* Expandable bundles */}
        <button
          onClick={() => setBundlesOpen(!bundlesOpen)}
          className="flex items-center gap-2 text-[14px] font-semibold text-[#0B2040] hover:text-[#E07B2D] transition-colors"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${bundlesOpen ? "rotate-180" : ""}`}
          />
          View all oil change packages
        </button>

        {bundlesOpen && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b-2 border-[#e8e4dc]">
                  <th className="text-[13px] font-bold text-[#0B2040] py-3 pr-4">
                    Oil Type
                  </th>
                  <th className="text-[13px] font-bold text-[#0B2040] py-3 px-4">
                    Basic
                  </th>
                  <th className="text-[13px] font-bold text-[#0B2040] py-3 px-4">
                    Better
                  </th>
                  <th className="text-[13px] font-bold text-[#0B2040] py-3 pl-4">
                    Best
                  </th>
                </tr>
              </thead>
              <tbody>
                {oilBundles.map((row) => (
                  <tr key={row.oilType} className="border-b border-[#f0ede6]">
                    <td className="text-[14px] font-medium text-[#0B2040] py-3 pr-4">
                      {row.oilType}
                    </td>
                    <td className="text-[14px] font-semibold text-[#E07B2D] py-3 px-4">
                      {row.basic}
                    </td>
                    <td className="text-[14px] font-semibold text-[#E07B2D] py-3 px-4">
                      {row.better}
                    </td>
                    <td className="text-[14px] font-semibold text-[#E07B2D] py-3 pl-4">
                      {row.best}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-[12px] text-[#888]">
              <p>Basic = oil change + tire rotation</p>
              <p>Better = Basic + MOA additive</p>
              <p>Best = Better + fuel additives</p>
            </div>
          </div>
        )}
      </CategorySection>

      {/* ================================================================
         TIRES & WHEELS
         ================================================================ */}
      <CategorySection
        id="tires-wheels"
        title="Tires & Wheels"
        startingAt="$39.95"
        description="Rotation, mount and balance, patching, and more. All on-site."
        even={true}
      >
        <ServiceGrid items={tireServices} />
        <p className="text-[13px] text-[#888] mt-4">
          Oversized/aftermarket tires add $50 per tire for mount and balance,
          $59.95 for rotation.
        </p>
      </CategorySection>

      {/* ================================================================
         BRAKES
         ================================================================ */}
      <CategorySection
        id="brakes"
        title="Brakes"
        startingAt="$320"
        description="Includes pads and resurfacing rotors. On-site brake service for standard vehicles, transit vans, and duallys."
        even={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {brakeServices.map((svc) => (
            <div
              key={svc.name}
              className="bg-white border border-[#f0ede6] rounded-[12px] px-6 py-5 shadow-[0_2px_12px_rgba(11,32,64,0.05)]"
            >
              <h3 className="text-[16px] font-bold text-[#0B2040] mb-1">
                {svc.name}
              </h3>
              {svc.note && (
                <p className="text-[13px] text-[#888] mb-2">{svc.note}</p>
              )}
              <p className="text-[24px] font-extrabold text-[#E07B2D]">
                {svc.price}
              </p>
            </div>
          ))}
        </div>
      </CategorySection>

      {/* ================================================================
         FLUID SERVICES
         ================================================================ */}
      <CategorySection
        id="fluid-services"
        title="Fluid Services"
        startingAt="$79.95"
        description="Wynns professional fluid services for all vehicle systems."
        even={true}
      >
        <ServiceGrid items={fluidServices} />
      </CategorySection>

      {/* ================================================================
         DIESEL SERVICES
         ================================================================ */}
      <CategorySection
        id="diesel-services"
        title="Diesel Services"
        startingAt="$49.95"
        description="Specialized diesel maintenance and fluid services."
        even={false}
      >
        <ServiceGrid items={dieselServices} />
      </CategorySection>

      {/* ================================================================
         MAINTENANCE
         ================================================================ */}
      <CategorySection
        id="maintenance"
        title="Maintenance"
        startingAt="$34.95"
        description="Filters, wipers, batteries, and basic maintenance items."
        even={true}
      >
        <ServiceGrid items={maintenanceServices} />
      </CategorySection>

      {/* ─── Transition to bottom CTA ─── */}
      <div
        style={{
          background:
            "linear-gradient(to bottom, #FFFFFF 0%, #3a6a8e 50%, #0F2847 100%)",
          height: "80px",
        }}
      />

      {/* ─── Bottom CTA ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(224,123,45,0.05) 0%, transparent 70%)",
          }}
        />
        <div className="section-inner px-4 lg:px-6 py-12 md:py-16 text-center relative z-10">
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-white mb-4">
            Ready to book?
          </h2>
          <p className="text-[15px] text-white/60 mb-8 max-w-[440px] mx-auto">
            Pick a time that works for you. We come to your location with
            everything we need.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              href="/book"
              variant="primary"
              size="lg"
              className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]"
            >
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

      {/* ─── Other Services Teaser ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #132E54 0%, #0F2847 50%, #0B2040 100%)",
        }}
      >
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="rounded-[14px] p-7 hover:translate-y-[-2px] transition-all duration-300"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
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
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
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
