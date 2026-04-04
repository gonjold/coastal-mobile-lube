"use client";

import { useState, useEffect, useRef } from "react";
import { Phone } from "lucide-react";
import Button from "@/components/Button";
import TrustBar from "@/components/TrustBar";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/* ─── Category definitions ─── */
const categories = [
  { id: "oil-service", label: "Oil Service", startingAt: "$89.95" },
  { id: "fluid-services", label: "Fluid Services", startingAt: "$129.95" },
  { id: "diesel", label: "Diesel", startingAt: "$49.95" },
  { id: "tire-wheel", label: "Tire & Wheel", startingAt: "$39.95" },
  { id: "hvac-electrical", label: "HVAC & Electrical", startingAt: "$50" },
  { id: "brakes", label: "Brakes", startingAt: "$320" },
];

/* ─── RV oil service tier cards ─── */
const oilTiers = [
  { name: "Synthetic Blend", price: "$89.95", note: "Up to 5 qts", tag: null },
  { name: "Full Synthetic", price: "$119.95", note: "Up to 5 qts", tag: "Most common" as const },
  { name: "Diesel Oil Change", price: "$219.95", note: "Class A and diesel pushers", tag: null },
];

const oilAddOns = [
  { name: "Semi Syn per qt over 5", price: "$7.00" },
  { name: "Full Syn per qt over 5", price: "$12.00" },
];

/* ─── Fluid services ─── */
const fluidServices = [
  { name: "Throttle Body Service", price: "$129.95" },
  { name: "Power Steering Flush", price: "$219.95" },
  { name: "Brake Flush", price: "$239.95" },
  { name: "Fuel Induction Service", price: "$239.95" },
  { name: "Transfer Case Flush", price: "$249.95" },
  { name: "Coolant Flush", price: "$269.95" },
  { name: "Transmission Flush", price: "$419.95" },
];

/* ─── Diesel services ─── */
const dieselServices = [
  { name: "Diesel MOA", price: "$49.95" },
  { name: "Diesel Air Filter", price: "$119.95" },
  { name: "Diesel Fuel Filters", price: "$399.95" },
  { name: "Diesel Injection Service", price: "$439.95" },
  { name: "Dual Coolant Flush (Diesel)", price: "$499.95" },
];

/* ─── Tire & wheel services ─── */
const tireWheelServices = [
  { name: "Tire Rotation", price: "$39.95" },
  { name: "Tire Rotation Oversized", price: "$59.95" },
  { name: "Tire Patch", price: "$69.95" },
  { name: "Mount and Balance (4 Tires)", price: "$159.95" },
  { name: "Aftermarket/Oversized M&B", price: "+$50/tire" },
];

/* ─── HVAC & electrical ─── */
const hvacElectricalServices = [
  { name: "Battery Replacement", price: "from $50" },
  { name: "Cabin Air Filter", price: "$99.95" },
  { name: "HVAC Recharge", price: "$299.99" },
];

/* ─── Brake services ─── */
const brakeServices = [
  { name: "Front and Rear Brakes", price: "$320" },
];

const valueProps = [
  {
    title: "We come to you",
    desc: "RV parks, campsites, storage lots, driveways. Wherever your rig is parked, that is where we work.",
  },
  {
    title: "No towing, no driving",
    desc: "Your RV stays put. No navigating tight roads or burning fuel to get to a shop.",
  },
  {
    title: "Gas and diesel",
    desc: "Class A, Class B, Class C, fifth wheels, travel trailers with generators. We handle it all.",
  },
  {
    title: "Same quality, your location",
    desc: "Factory-grade parts, certified technicians, and a 12-month service warranty on every job.",
  },
  {
    title: "Seasonal prep",
    desc: "Getting ready for a trip or putting your RV in storage? We handle pre-trip and winterization services.",
  },
  {
    title: "RV park partnerships",
    desc: "We work with park managers to offer scheduled service days for residents. One call covers the whole park.",
  },
];

const locations = [
  "Apollo Beach",
  "Ruskin",
  "Sun City",
  "Sun City Center",
  "Riverview",
  "Gibsonton",
  "Balm",
  "Wimauma",
  "Parrish",
  "Palmetto",
  "Ellenton",
  "Fish Hawk",
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
export default function RVContent() {
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
              RV Services
            </p>
            <h1 className="text-[30px] md:text-[42px] font-[800] leading-[1.08] text-white tracking-[-1px] mb-5">
              Mobile service for your RV
            </h1>
            <p className="text-[16px] leading-[1.7] text-white/60 mb-8 max-w-[520px]">
              We come to your RV park, your campsite, or your storage lot. Oil
              changes, tire service, brakes, and full maintenance for every
              class of RV. No shop visits, no towing, no hassle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="#rv-quote" variant="primary" size="lg" className="whitespace-nowrap shadow-[0_4px_24px_rgba(224,123,45,0.35)]">
                Get RV Quote
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
        className="sticky top-0 z-40 bg-white border-b border-[#e8e4dc]/60 shadow-[0_2px_12px_rgba(11,32,64,0.06)]"
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
         RV OIL SERVICE
         ================================================================ */}
      <CategorySection
        id="oil-service"
        title="RV Oil Service"
        startingAt="$89.95"
        description="Full oil and filter change with multi-point inspection. Gas and diesel engines, all RV classes. Larger engines that take more than 5 quarts are no problem."
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
            Generator oil service also available
          </span>
          <span className="inline-flex items-center gap-2 text-[14px] text-[#444] font-medium bg-[#FFF9F4] border border-[#E07B2D]/20 rounded-[8px] px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-[#E07B2D] shrink-0" />
            Extra quart charges for larger engines
          </span>
        </div>

        {/* Add-on services */}
        <ServiceGrid items={oilAddOns} />
      </CategorySection>

      {/* ================================================================
         FLUID SERVICES
         ================================================================ */}
      <CategorySection
        id="fluid-services"
        title="RV Fluid Services"
        startingAt="$129.95"
        description="Professional fluid exchange and treatment services for all RV systems. Transmission, coolant, brake, power steering, and fuel system maintenance."
        even={true}
      >
        <ServiceGrid items={fluidServices} />
      </CategorySection>

      {/* ================================================================
         DIESEL SERVICES
         ================================================================ */}
      <CategorySection
        id="diesel"
        title="RV Diesel Services"
        startingAt="$49.95"
        description="Specialized diesel maintenance for Class A motorhomes, diesel pushers, and diesel-powered RVs. Injection service, fuel filters, and cooling system maintenance."
        even={false}
      >
        <ServiceGrid items={dieselServices} />
      </CategorySection>

      {/* ================================================================
         TIRE & WHEEL
         ================================================================ */}
      <CategorySection
        id="tire-wheel"
        title="RV Tire & Wheel"
        startingAt="$39.95"
        description="Tire rotation, mount and balance, and tire repair for all RV classes. Oversized and aftermarket tire service available."
        even={true}
      >
        <ServiceGrid items={tireWheelServices} />
      </CategorySection>

      {/* ================================================================
         HVAC & ELECTRICAL
         ================================================================ */}
      <CategorySection
        id="hvac-electrical"
        title="HVAC & Electrical"
        startingAt="from $50"
        description="Air conditioning recharge, battery replacement, and cabin air filter service. Keep your RV comfortable on the road and in camp."
        even={false}
      >
        <ServiceGrid items={hvacElectricalServices} />
      </CategorySection>

      {/* ================================================================
         BRAKES
         ================================================================ */}
      <CategorySection
        id="brakes"
        title="RV Brakes"
        startingAt="$320"
        description="Complete brake pad replacement with rotor resurfacing. Front and rear service for motorhomes and tow vehicles."
        even={true}
      >
        <ServiceGrid items={brakeServices} />
      </CategorySection>


      {/* ─── Why RV Owners Choose Us ─── */}
      <section className="relative overflow-hidden bg-[#F7F8FA]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            Why RV owners choose Coastal Mobile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="border-l-[3px] border-l-[#E07B2D] pl-4"
              >
                <h3 className="text-[16px] font-bold text-[#0B2040] mb-1">
                  {prop.title}
                </h3>
                <p className="text-[14px] text-[#666] leading-[1.7]">
                  {prop.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── Service Area ─── */}
      <section className="relative bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 text-center">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Service Area
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-3">
            Apollo Beach and South Shore
          </h2>
          <p className="text-[15px] text-[#555] mb-8 mx-auto max-w-[560px]">
            We service RVs across Apollo Beach and the greater South Shore area.
            RV parks, campgrounds, storage facilities, and private driveways.
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


      {/* ─── RV Quote Form ─── */}
      <RVQuoteForm />
    </>
  );
}

/* ─── RV Quote Form Component ────────────────────────────── */

const rvInputBase =
  "w-full text-[15px] rounded-[10px] px-3.5 py-3 outline-none border border-white/[0.15] bg-white/[0.07] text-white placeholder:text-white/40 focus:border-[#E07B2D]/70 focus:bg-white/[0.10] transition-colors";

const rvLabelClass =
  "block text-[12px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5";

function RVQuoteForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPreference, setContactPreference] = useState<"call" | "text" | "email">("call");
  const [preferredDate, setPreferredDate] = useState("");
  const [datesFlexible, setDatesFlexible] = useState(false);
  const [rvType, setRvType] = useState("");
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
        rvType,
        notes,
        service: "RV Service Quote",
        serviceCategory: "rv",
        status: "pending",
        source: "rv-page",
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
    <section id="rv-quote" className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
      <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-[800] text-white mb-3">
            Get an RV service quote
          </h2>
          <p className="text-[15px] text-white/60 mx-auto max-w-[520px]">
            Tell us about your RV and we will get back to you within 24 hours.
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
                We will call you within 24 hours to discuss your RV service.
              </p>
              <a href="tel:8137225823" className="text-[#E07B2D] font-semibold hover:underline">
                Call now: 813-722-LUBE
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <label className={rvLabelClass}>Your Name</label>
                <input
                  type="text"
                  placeholder="First and last name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })); }}
                  className={`${rvInputBase} ${errors.name ? "border-red-500" : ""}`}
                />
              </div>
              <div>
                <label className={rvLabelClass}>Phone</label>
                <input
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: false })); }}
                  className={`${rvInputBase} ${errors.phone ? "border-red-500" : ""}`}
                />
              </div>
              <div>
                <label className={rvLabelClass}>Email</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={rvInputBase}
                />
              </div>
              <div>
                <label className={rvLabelClass}>Best Way to Reach You</label>
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
                <label className={rvLabelClass}>Preferred Date</label>
                <input
                  type="date"
                  min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })()}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className={rvInputBase}
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
                <label className={rvLabelClass}>RV Type</label>
                <select
                  value={rvType}
                  onChange={(e) => setRvType(e.target.value)}
                  className={rvInputBase}
                >
                  <option value="">Select RV type</option>
                  <option value="Class A">Class A Motorhome</option>
                  <option value="Class B">Class B Camper Van</option>
                  <option value="Class C">Class C Motorhome</option>
                  <option value="Fifth Wheel">Fifth Wheel</option>
                  <option value="Travel Trailer">Travel Trailer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={rvLabelClass}>Tell us about your RV</label>
                <textarea
                  rows={3}
                  placeholder="Year, make, model, engine type (gas or diesel), location where your RV is parked, services needed..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${rvInputBase} resize-none`}
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[16px] hover:bg-[#cc6a1f] transition-colors disabled:opacity-60 shadow-[0_4px_24px_rgba(224,123,45,0.35)]"
              >
                {submitting ? "Submitting..." : "Get RV Quote"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
