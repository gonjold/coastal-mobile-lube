"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, ChevronDown } from "lucide-react";
import Button from "@/components/Button";
import { useBooking } from "@/contexts/BookingContext";
import { useServices } from "@/hooks/useServices";
import { groupByCategory } from "@/lib/serviceHelpers";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

const rvFaqItems = [
  {
    q: "What types of RVs do you service?",
    a: "Class A, B, C motorhomes, fifth wheels, travel trailers, toy haulers, and pop-ups.",
  },
  {
    q: "Do you come to RV parks and campgrounds?",
    a: "Yes, we service RVs at parks, campgrounds, storage facilities, and your driveway.",
  },
  {
    q: "How do I prepare my RV for service?",
    a: "Make sure the area around the service point is accessible, have your keys ready, and let us know about any specific concerns.",
  },
  {
    q: "Do you service trailer brakes and tires?",
    a: "Yes, we handle all trailer maintenance including brakes, tires, bearings, and lights.",
  },
];

/* ─── Reusable: 2-col service grid ─── */
function ServiceGrid({ items, onItemClick }: { items: { name: string; price: string }[]; onItemClick?: (item: { name: string; price: string }) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => (
        <button
          type="button"
          key={item.name}
          onClick={() => onItemClick?.(item)}
          className="flex items-center justify-between bg-white border border-[#f0ede6] rounded-[10px] px-5 py-4 shadow-[0_1px_6px_rgba(11,32,64,0.04)] cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(224,123,45,0.12)] hover:border-[#E07B2D]/30 hover:-translate-y-[1px] text-left"
        >
          <span className="text-[15px] font-medium text-[#0B2040]">{item.name}</span>
          <span className="text-[15px] font-bold text-[#E07B2D] whitespace-nowrap ml-4">{item.price}</span>
        </button>
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
  const { openBooking } = useBooking();
  const { services, categories: firestoreCategories, loading } = useServices({ division: "rv", activeOnly: true });
  const rvPriority = ["oil", "tire", "wheel"];
  const grouped = groupByCategory(services)
    .filter((g) => !/labor\s*rate/i.test(g.category))
    .sort((a, b) => {
      const aIdx = rvPriority.findIndex((p) => a.category.toLowerCase().includes(p));
      const bIdx = rvPriority.findIndex((p) => b.category.toLowerCase().includes(p));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

  const categories = grouped.map((g) => ({
    id: g.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: g.category,
    startingAt: `$${Math.min(...g.services.map((s) => s.price)).toFixed(2)}`,
  }));

  const [activeCategory, setActiveCategory] = useState("");
  const pillBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!loading && grouped.length === 0) {
    return (
      <div className="text-center py-32 text-[#888]">
        <p className="text-lg font-semibold">RV services coming soon</p>
        <p className="mt-2">Call 813-722-LUBE for a custom RV service quote today.</p>
      </div>
    );
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
              <Button variant="primary" size="lg" className="whitespace-nowrap shadow-[0_4px_24px_rgba(224,123,45,0.35)]" onClick={openBooking}>
                Book Service
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
                onClick={() => setActiveCategory(cat.id)}
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

      {grouped.filter((g) => g.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === activeCategory).map((group, idx) => {
        const catId = group.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const startingAt = `$${Math.min(...group.services.map((s) => s.price)).toFixed(2)}`;
        const description = firestoreCategories.find(
          (c) => c.name === group.category
        )?.description || "";

        return (
          <CategorySection
            key={catId}
            id={catId}
            title={group.category}
            startingAt={startingAt}
            description={description}
            even={idx % 2 === 0}
          >
            <ServiceGrid
              items={group.services.map((s) => ({
                name: s.displayName || s.name,
                price: s.priceLabel && s.priceLabel.startsWith("$")
                  ? s.priceLabel
                  : s.price > 0
                    ? `$${s.price.toFixed(2)}`
                    : "Call for price",
              }))}
              onItemClick={(item) => {
                const svc = group.services.find((s) => (s.displayName || s.name) === item.name);
                openBooking({
                  division: "RV",
                  categoryId: group.category,
                  serviceId: svc?.id,
                });
              }}
            />
          </CategorySection>
        );
      })}


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


      {/* ─── CTA: Ready to Book? ─── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 text-center relative z-10">
          <h2 className="text-[28px] font-[800] text-white mb-3">
            Ready to book?
          </h2>
          <p className="text-[15px] text-white/60 mb-8 mx-auto max-w-[520px]">
            Schedule your RV service online or give us a call. We come to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" size="lg" className="whitespace-nowrap shadow-[0_4px_24px_rgba(224,123,45,0.35)]" onClick={openBooking}>
              Book RV Service
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
      </section>

      {/* ─── Trust Badges ─── */}
      <section className="bg-white border-y border-[#e8e4dc]/60">
        <div className="section-inner px-4 lg:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Fully Licensed", sub: "& Insured" },
              { label: "ASE-Certified", sub: "Technicians" },
              { label: "12-Month Warranty", sub: "On Every Job" },
              { label: "Transparent Pricing", sub: "No Hidden Fees" },
            ].map((badge) => (
              <div key={badge.label}>
                <p className="text-[15px] font-bold text-[#0B2040]">{badge.label}</p>
                <p className="text-[13px] text-[#666]">{badge.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <RVFaq />

      {/* ─── RV Quote Form ─── */}
      <RVQuoteForm />
    </>
  );
}

/* ─── RV FAQ Component ──────────────────────────────────── */

function RVFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative bg-[#FAFBFC]">
      <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
        <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="max-w-[740px] mx-auto flex flex-col gap-3">
          {rvFaqItems.map((faq, i) => (
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
  );
}

/* ─── RV Quote Form Component ────────────────────────────── */

const rvInputBase =
  "w-full text-[15px] rounded-[10px] px-3.5 py-3 outline-none border border-white/[0.15] bg-white/[0.07] text-white placeholder:text-white/40 focus:border-[#E07B2D]/70 focus:bg-white/[0.10] transition-colors";

const rvLabelClass =
  "block text-[12px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5";

function RVQuoteForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPreference, setContactPreference] = useState<"call" | "text" | "email">("call");
  const [preferredDate, setPreferredDate] = useState("");
  const [datesFlexible, setDatesFlexible] = useState(false);
  const [rvType, setRvType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: boolean; lastName?: boolean; phone?: boolean }>({});

  async function handleSubmit() {
    const newErrors: { firstName?: boolean; lastName?: boolean; phone?: boolean } = {};
    if (!firstName.trim()) newErrors.firstName = true;
    if (!lastName.trim()) newErrors.lastName = true;
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
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
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={rvLabelClass}>First name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: false })); }}
                    className={`${rvInputBase} ${errors.firstName ? "border-red-500" : ""}`}
                  />
                </div>
                <div className="flex-1">
                  <label className={rvLabelClass}>Last name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: false })); }}
                    className={`${rvInputBase} ${errors.lastName ? "border-red-500" : ""}`}
                  />
                </div>
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
