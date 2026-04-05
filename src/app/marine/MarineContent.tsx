"use client";

import { useState, useEffect, useRef } from "react";
import { Phone } from "lucide-react";
import Button from "@/components/Button";
import TrustBar from "@/components/TrustBar";
import { useServices } from "@/hooks/useServices";
import { groupByCategory } from "@/lib/serviceHelpers";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
  const { services, categories: firestoreCategories, loading } = useServices({ division: "marine", activeOnly: true });
  const grouped = groupByCategory(services);

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
  }, [categories]);

  function scrollTo(id: string) {
    setActiveCategory(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="text-center py-32 text-[#888]">
        <p className="text-lg font-semibold">Services loading...</p>
        <p className="mt-2">Please check back shortly or call 813-722-LUBE.</p>
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

      {/* ─── Dynamic Service Sections ─── */}
      {grouped.map((group, idx) => {
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
                name: s.name,
                price: s.priceLabel
                  ? `${s.priceLabel} $${s.price.toFixed(2)}`
                  : `$${s.price % 1 === 0 ? `${s.price}` : s.price.toFixed(2)}`,
              }))}
            />
          </CategorySection>
        );
      })}


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
