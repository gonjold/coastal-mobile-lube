"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import Button from "@/components/Button";
import TrustBar from "@/components/TrustBar";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const packages = [
  {
    name: "Outboard",
    price: "Starting at $149.95",
    description: "Dockside oil change service for outboard engines",
    highlight: false,
    includes: [
      "Small (4-cyl and under): $149.95",
      "V6 / V8: $199.95",
      "Oil and filter change",
      "Multi-point engine inspection",
    ],
  },
  {
    name: "Inboard",
    price: "Starting at $229.95",
    description: "Full oil change service for inboard engines",
    highlight: true,
    includes: [
      "Small block: $229.95",
      "Large block: $279.95",
      "Oil and filter change",
      "Multi-point engine inspection",
    ],
  },
  {
    name: "Diesel Marine",
    price: "$349.95",
    description: "Oil change service for all diesel marine engines",
    highlight: false,
    includes: [
      "All diesel marine engines",
      "Oil and filter change",
      "Multi-point engine inspection",
    ],
  },
];

const addOnServices = [
  {
    name: "Lower Unit Service",
    price: "$149.95",
    description: "Gear oil change and seal inspection",
  },
  {
    name: "Impeller Replacement",
    price: "$249.95",
    description: "Raw water pump maintenance",
  },
  {
    name: "Generator Service",
    price: "$129.95",
    description: "Oil change for onboard generators",
  },
  {
    name: "Trailer Tire Mount and Balance",
    price: "$49.95/tire",
    description: "Single tire mount and balance",
  },
  {
    name: "Bearing Repack",
    price: "From $179.95",
    description: "Trailer wheel bearing service",
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
      <section className="bg-[#0B2040]">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-10 pb-4 md:pt-14 md:pb-8">
          <div>
            <p className="text-[13px] uppercase font-bold text-[#6BA3E0] tracking-[1.5px] mb-3">
              Marine Services
            </p>
            <h1 className="text-[30px] md:text-[42px] font-[800] leading-[1.08] text-white tracking-[-1px] mb-5">
              Dockside service for your boat
            </h1>
            <p className="text-[16px] leading-[1.7] text-white/70 mb-8">
              We service outboard and inboard engines right at the marina or
              boat ramp. No hauling, no waiting. Factory-grade parts, certified
              technicians, and a 12-month service warranty on every job.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="#marine-quote" variant="primary" size="lg" className="whitespace-nowrap">
                Get Marine Quote
              </Button>
              <a
                href="tel:8137225823"
                className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-white bg-transparent border border-white/30 rounded-[var(--radius-button)] hover:border-white/50 transition-all whitespace-nowrap"
              >
                <Phone size={16} />
                Call 813-722-LUBE
              </a>
            </div>
          </div>
        </div>
      </section>

      <TrustBar />

      {/* Section 2: Service Packages */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Engine Services
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            Marine oil change services
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
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <span className="inline-flex items-center gap-2 text-[14px] text-[#444] font-medium bg-white border border-[#e8e8e8] rounded-[8px] px-4 py-2.5">
              <span className="w-2 h-2 rounded-full bg-[#E07B2D] shrink-0" />
              $49.95 travel charge applies
            </span>
            <span className="inline-flex items-center gap-2 text-[14px] text-[#444] font-medium bg-white border border-[#e8e8e8] rounded-[8px] px-4 py-2.5">
              <span className="w-2 h-2 rounded-full bg-[#E07B2D] shrink-0" />
              +$75 for twin engines
            </span>
          </div>
        </div>
      </section>

      {/* Section 3: Add-On Services */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Add-Ons
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            Additional marine services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addOnServices.map((service) => (
              <div
                key={service.name}
                className="flex items-start gap-2.5 bg-white border border-[#e8e8e8] rounded-[10px] px-[14px] py-[14px]"
              >
                <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D] mt-[7px]" />
                <div>
                  <span className="text-[15px] font-semibold text-[#0B2040]">
                    {service.name}
                  </span>
                  <span className="text-[14px] font-semibold text-[#E07B2D] ml-2">
                    {service.price}
                  </span>
                  <br />
                  <span className="text-[14px] text-[#666]">
                    {service.description}
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

      {/* Section 5: Marine Quote Form */}
      <MarineQuoteForm />

    </>
  );
}

/* ─── Marine Quote Form Component ────────────────────────────── */

const marineInputBase =
  "w-full text-[15px] rounded-[10px] px-3.5 py-3 outline-none border-2 border-[#eee] bg-white focus:border-[#E07B2D] transition-colors";

const marineLabelClass =
  "block text-[12px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5";

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
    <section id="marine-quote" className="bg-[#0B2040]">
      <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-[800] text-white mb-3">
            Get a marine service quote
          </h2>
          <p className="text-[15px] text-white/70 mx-auto max-w-[520px]">
            Tell us about your boat and we will put together a service plan.
          </p>
        </div>

        <div className="bg-white rounded-[12px] p-8 max-w-[560px] mx-auto">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <p className="text-[16px] font-semibold text-[#0B2040] mb-2">
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
                          : "border-[#eee] text-[#444] hover:border-[#ddd]"
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
                <span className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors ${datesFlexible ? "bg-[#E07B2D] border-[#E07B2D]" : "border-[#ddd]"}`}>
                  {datesFlexible && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </span>
                <span className="text-[14px] text-[#888]">My dates are flexible</span>
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
                className="w-full py-4 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[16px] hover:bg-[#cc6a1f] transition-colors disabled:opacity-60"
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
