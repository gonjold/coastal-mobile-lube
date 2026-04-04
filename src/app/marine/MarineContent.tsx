"use client";

import { useState, useEffect, useRef } from "react";
import { Phone } from "lucide-react";
import Button from "@/components/Button";
import TrustBar from "@/components/TrustBar";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/* ─── Category definitions ─── */
const categories = [
  { id: "oil-service", label: "Oil Service", startingAt: "$129.95" },
  { id: "fuel-fluid", label: "Fuel & Fluid", startingAt: "$29.95" },
  { id: "diesel", label: "Diesel", startingAt: "$29.95" },
  { id: "maintenance", label: "Maintenance", startingAt: "$29.95" },
  { id: "trailer-tire", label: "Trailer & Tire", startingAt: "$29.95" },
  { id: "brakes", label: "Brakes", startingAt: "$129.95" },
];

/* ─── Marine oil service tier cards ─── */
const oilTiers = [
  { name: "Generator", price: "$129.95", note: "Onboard generators" },
  { name: "Outboard Small", price: "$149.95", note: "Up to 6 qts", tag: null },
  { name: "Outboard V6/V8", price: "$199.95", note: null, tag: null },
  { name: "Inboard Small Block", price: "$229.95", note: null, tag: "Most common" },
  { name: "Inboard Big Block", price: "$279.95", note: null, tag: null },
  { name: "Diesel Marine", price: "$349.95", note: "All diesel marine engines", tag: null },
];

const oilAddOns = [
  { name: "Pre-Trip Inspection", price: "$59.95" },
  { name: "Sea Trial / Ramp Run Support", price: "$149.95" },
];

/* ─── Fuel & fluid services ─── */
const fuelFluidServices = [
  { name: "Fuel Stabilizer Additive", price: "$29.95" },
  { name: "MOA / Oil Additive", price: "$29.95" },
  { name: "Battery Terminal Service", price: "$39.95" },
  { name: "Water-in-Fuel Check", price: "$39.95" },
  { name: "Fuel System Treatment", price: "$49.95" },
  { name: "Battery Test / Charging Check", price: "$59.95" },
  { name: "Corrosion Guard Treatment", price: "$69.95" },
  { name: "Prop Removal and Reinstall", price: "$79.95" },
  { name: "Water Separating Fuel Filter", price: "$89.95" },
  { name: "Engine Fuel Filter", price: "$129.95" },
  { name: "Lower Unit Gear Lube", price: "$149.95" },
  { name: "Throttle Body / Intake Service", price: "$149.95" },
  { name: "Stern Drive Gear Lube", price: "$179.95" },
  { name: "Racor Dual Filter Set", price: "$199.95" },
  { name: "Twin Lower Unit Gear Lube", price: "$279.95" },
  { name: "Cooling System Descale / Flush", price: "$299.95" },
];

/* ─── Diesel services ─── */
const dieselServices = [
  { name: "DEF Top-Off / Handling", price: "$29.95" },
  { name: "Diesel MOA", price: "$49.95" },
  { name: "Diesel Fuel Filter Service", price: "$249.95" },
  { name: "Primary / Secondary Diesel Filters", price: "$329.95" },
  { name: "Diesel Injection Service", price: "$449.95" },
  { name: "Dual Coolant Flush (Diesel)", price: "$499.95" },
];

/* ─── Maintenance services ─── */
const maintenanceServices = [
  { name: "Trailer Light Check", price: "$29.95" },
  { name: "Grease Steering / Pivot Points", price: "$39.95" },
  { name: "Trailer Hub Temp / Bearing Check", price: "$39.95" },
  { name: "Bilge / Safety Inspection", price: "$59.95" },
  { name: "Battery Replacement (labor)", price: "$75.00" },
  { name: "Engine Air Filter / Flame Arrestor", price: "$79.95" },
  { name: "Dual Battery Replacement (labor)", price: "$125.00" },
  { name: "Spark Plug Replacement", price: "from $199.95" },
  { name: "Impeller Service", price: "$249.95" },
];

/* ─── Trailer & tire services ─── */
const trailerTireServices = [
  { name: "Replace Valve Stem / TPMS", price: "$29.95" },
  { name: "Trailer Tire Rotation", price: "$39.95" },
  { name: "Spare Tire Mount", price: "$39.95" },
  { name: "Trailer Tire M&B (single)", price: "$49.95" },
  { name: "Trailer Alignment Check", price: "$49.95" },
  { name: "Trailer Tire Patch", price: "$69.95" },
  { name: "Hub Service", price: "$129.95" },
  { name: "Trailer Tire M&B (4 tires)", price: "$159.95" },
  { name: "Wheel Bearing Repack", price: "from $179.95" },
  { name: "Aftermarket / Oversized Trailer", price: "+$50/tire" },
];

/* ─── Brake services ─── */
const brakeServices = [
  { name: "Trailer Brake Adjustment", price: "$129.95" },
  { name: "Surge Brake Inspection / Service", price: "$199.95" },
  { name: "Trailer Brake Service", price: "$249.95" },
  { name: "Tandem Trailer Brake Service", price: "from $399.95" },
];

const locations = [
  "Apollo Beach",
  "Ruskin",
  "Gibsonton",
  "Palmetto",
  "Ellenton",
  "Riverview",
  "Sun City",
  "Sun City Center",
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
export default function MarineContent() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
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
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0A1C38 0%, #0B2040 40%, #0F2847 70%, #132E54 100%)" }}>

        <div className="section-inner px-4 lg:px-6 pt-10 pb-6 md:pt-14 md:pb-10 relative z-10">
          <div>
            <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
              Marine Services
            </p>
            <h1 className="text-[30px] md:text-[42px] font-[800] leading-[1.08] text-white tracking-[-1px] mb-5">
              Dockside service for your boat
            </h1>
            <p className="text-[16px] leading-[1.7] text-white/60 mb-8 max-w-[520px]">
              We service outboard and inboard engines right at the marina or
              boat ramp. No hauling, no waiting. Factory-grade parts, certified
              technicians, and a 12-month service warranty on every job.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="#marine-quote" variant="primary" size="lg" className="whitespace-nowrap shadow-[0_4px_24px_rgba(224,123,45,0.35)]">
                Get Marine Quote
              </Button>
              <a
                href="tel:8137225823"
                className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-white bg-white/[0.06] border border-white/20 rounded-[var(--radius-button)] hover:bg-white/[0.12] hover:border-white/35 transition-all whitespace-nowrap backdrop-blur-sm"
              >
                <Phone size={16} />
                Call 813-722-LUBE
              </a>
            </div>
          </div>
        </div>

      </section>

      <TrustBar />

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
         MARINE OIL SERVICE
         ================================================================ */}
      <CategorySection
        id="oil-service"
        title="Marine Oil Service"
        startingAt="$129.95"
        description="Dockside oil change for outboard, inboard, and diesel marine engines. Vacuum extraction, OEM-spec filters, multi-point inspection included."
        even={false}
      >
        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

        {/* Notes */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <span className="inline-flex items-center gap-2 text-[14px] text-[#444] font-medium bg-[#FFF9F4] border border-[#E07B2D]/20 rounded-[8px] px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-[#E07B2D] shrink-0" />
            $49.95 travel charge applies
          </span>
          <span className="inline-flex items-center gap-2 text-[14px] text-[#444] font-medium bg-[#FFF9F4] border border-[#E07B2D]/20 rounded-[8px] px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-[#E07B2D] shrink-0" />
            +$75 twin engine surcharge
          </span>
        </div>

        {/* Add-on services */}
        <ServiceGrid items={oilAddOns} />
      </CategorySection>

      {/* ================================================================
         FUEL & FLUID SERVICES
         ================================================================ */}
      <CategorySection
        id="fuel-fluid"
        title="Marine Fuel & Fluid Services"
        startingAt="$29.95"
        description="Filters, gear lube, cooling system service, corrosion protection, and fuel system maintenance."
        even={true}
      >
        <ServiceGrid items={fuelFluidServices} />
      </CategorySection>

      {/* ================================================================
         DIESEL SERVICES
         ================================================================ */}
      <CategorySection
        id="diesel"
        title="Marine Diesel Services"
        startingAt="$29.95"
        description="Specialized diesel maintenance for marine engines including filters, injection service, and cooling."
        even={false}
      >
        <ServiceGrid items={dieselServices} />
      </CategorySection>

      {/* ================================================================
         MAINTENANCE
         ================================================================ */}
      <CategorySection
        id="maintenance"
        title="Marine Maintenance"
        startingAt="$29.95"
        description="Batteries, spark plugs, impellers, filters, inspections, and general upkeep."
        even={true}
      >
        <ServiceGrid items={maintenanceServices} />
      </CategorySection>

      {/* ================================================================
         TRAILER & TIRE
         ================================================================ */}
      <CategorySection
        id="trailer-tire"
        title="Marine Trailer & Tire"
        startingAt="$29.95"
        description="Mount and balance, bearing repack, hub service, and trailer tire maintenance."
        even={false}
      >
        <ServiceGrid items={trailerTireServices} />
      </CategorySection>

      {/* ================================================================
         BRAKES
         ================================================================ */}
      <CategorySection
        id="brakes"
        title="Marine Brakes"
        startingAt="$129.95"
        description="Trailer brake adjustment, service, and surge brake inspection."
        even={true}
      >
        <ServiceGrid items={brakeServices} />
      </CategorySection>


      {/* ─── Where We Service ─── */}
      <section className="relative overflow-hidden bg-[#F7F8FA]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 text-center relative z-10">
          <h2 className="text-[28px] font-[800] text-[#0B2040] mb-3">
            Where we service boats
          </h2>
          <p className="text-[15px] text-[#666] mb-8 mx-auto max-w-[560px]">
            We come to you at marinas, boat ramps, dry storage, and private
            docks across Apollo Beach and the South Shore.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {locations.map((loc, i) => (
              <span key={loc} className="text-[15px] text-[#0B2040] font-medium">
                {loc}
                {i < locations.length - 1 && (
                  <span className="ml-2 text-[#ccc]">&bull;</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Marine Quote Form ─── */}
      <MarineQuoteForm />
    </>
  );
}

/* ─── Marine Quote Form Component ────────────────────────────── */

const marineInputBase =
  "w-full text-[15px] rounded-[10px] px-3.5 py-3 outline-none border border-white/[0.15] bg-white/[0.07] text-white placeholder:text-white/40 focus:border-[#E07B2D]/70 focus:bg-white/[0.10] transition-colors";

const marineLabelClass =
  "block text-[12px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5";

function MarineQuoteForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPreference, setContactPreference] = useState<"call" | "text" | "email">("call");
  const [preferredDate, setPreferredDate] = useState("");
  const [datesFlexible, setDatesFlexible] = useState(false);
  const [engineType, setEngineType] = useState("");
  const [engineCount, setEngineCount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({});

  async function handleSubmit() {
    const newErrors: { name?: boolean; phone?: boolean } = {};
    if (!name.trim()) newErrors.name = true;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) newErrors.phone = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        name: name.trim(),
        phone: digits,
        email: email.trim().toLowerCase(),
        contactPreference,
        preferredDate: preferredDate || "",
        datesFlexible,
        engineType,
        engineCount,
        notes,
        service: "Marine Service Quote",
        serviceCategory: "marine",
        status: "pending",
        source: "marine-page",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch {
      // allow retry
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="marine-quote" className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
      <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-[800] text-white mb-3">
            Get a marine service quote
          </h2>
          <p className="text-[15px] text-white/60 mx-auto max-w-[520px]">
            Tell us about your boat and we will put together a service plan.
          </p>
        </div>

        <div
          className="rounded-[16px] p-8 max-w-[560px] mx-auto relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
            backdropFilter: "blur(24px) saturate(1.2)",
            WebkitBackdropFilter: "blur(24px) saturate(1.2)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.35), 0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          {submitted ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <p className="text-[16px] font-semibold text-white mb-2">
                We will call you within 24 hours to discuss your marine service.
              </p>
              <a href="tel:8137225823" className="text-[#E07B2D] font-semibold hover:underline">
                Call now: 813-722-LUBE
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <label className={marineLabelClass}>Your Name</label>
                <input
                  type="text"
                  placeholder="First and last name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })); }}
                  className={`${marineInputBase} ${errors.name ? "border-red-500" : ""}`}
                />
              </div>
              <div>
                <label className={marineLabelClass}>Phone</label>
                <input
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: false })); }}
                  className={`${marineInputBase} ${errors.phone ? "border-red-500" : ""}`}
                />
              </div>
              <div>
                <label className={marineLabelClass}>Email</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={marineInputBase}
                />
              </div>
              <div>
                <label className={marineLabelClass}>Best Way to Reach You</label>
                <div className="flex gap-2">
                  {(["call", "text", "email"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setContactPreference(method)}
                      className={`flex-1 py-3 rounded-[10px] text-[14px] font-semibold border-2 transition-all cursor-pointer ${
                        contactPreference === method
                          ? "bg-[#E07B2D] text-white border-[#E07B2D]"
                          : "border-white/[0.15] text-white/70 hover:border-white/30"
                      }`}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={marineLabelClass}>Preferred Date</label>
                <input
                  type="date"
                  min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })()}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className={marineInputBase}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors ${datesFlexible ? "bg-[#E07B2D] border-[#E07B2D]" : "border-white/30"}`}>
                  {datesFlexible && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </span>
                <span className="text-[14px] text-white/50">My dates are flexible</span>
                <input
                  type="checkbox"
                  checked={datesFlexible}
                  onChange={(e) => setDatesFlexible(e.target.checked)}
                  className="sr-only"
                />
              </label>
              <div>
                <label className={marineLabelClass}>Engine Type</label>
                <select
                  value={engineType}
                  onChange={(e) => setEngineType(e.target.value)}
                  className={marineInputBase}
                >
                  <option value="">Select engine type</option>
                  <option value="Outboard">Outboard</option>
                  <option value="Inboard">Inboard</option>
                  <option value="Sterndrive">Sterndrive</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>
              <div>
                <label className={marineLabelClass}>Number of Engines</label>
                <select
                  value={engineCount}
                  onChange={(e) => setEngineCount(e.target.value)}
                  className={marineInputBase}
                >
                  <option value="">Select number of engines</option>
                  <option value="Single">Single</option>
                  <option value="Twin">Twin</option>
                  <option value="Triple+">Triple+</option>
                </select>
              </div>
              <div>
                <label className={marineLabelClass}>What do you need?</label>
                <textarea
                  rows={3}
                  placeholder="Engine make/model, service needed, marina or location, anything that helps..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${marineInputBase} resize-none`}
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[16px] hover:bg-[#cc6a1f] transition-colors disabled:opacity-60 shadow-[0_4px_24px_rgba(224,123,45,0.35)]"
              >
                {submitting ? "Submitting..." : "Get Marine Quote"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
