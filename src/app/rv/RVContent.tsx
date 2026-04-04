"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import Button from "@/components/Button";
import TrustBar from "@/components/TrustBar";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const rvServices = [
  {
    name: "Synthetic Blend Oil Change",
    price: "$89.95",
    description: "Oil and filter change with multi-point inspection",
  },
  {
    name: "Full Synthetic Oil Change",
    price: "$119.95",
    description: "Premium full synthetic oil and filter change",
  },
  {
    name: "Diesel Oil Change",
    price: "$219.95",
    description: "Diesel-rated oil and filter for Class A and diesel pushers",
  },
  {
    name: "Tire Rotation",
    price: "$39.95",
    description: "Rotate all accessible tires for even wear",
  },
  {
    name: "Mount and Balance (4 Tires)",
    price: "$159.95",
    description: "Full tire mount and balance service",
  },
  {
    name: "Front and Rear Brakes",
    price: "$320",
    description: "Complete brake pad replacement, front and rear",
  },
];

const additionalServices = [
  { name: "Brake Flush", price: "$239.95" },
  { name: "Coolant Flush", price: "$269.95" },
  { name: "Transmission Flush", price: "$419.95" },
  { name: "HVAC Recharge", price: "$299.99" },
  { name: "Cabin Air Filter", price: "$99.95" },
  { name: "Battery Service", price: "$50-$100 labor" },
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

export default function RVContent() {
  return (
    <>
      {/* Section 1: Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0A1C38 0%, #0B2040 40%, #0F2847 70%, #132E54 100%)" }}>
        {/* Atmospheric glow layers */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(26,95,172,0.12) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 80% 30%, rgba(224,123,45,0.06) 0%, transparent 60%)" }} />
        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-10 pb-6 md:pt-14 md:pb-10 relative z-10">
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

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #0F2847)" }} />
      </section>

      <TrustBar />

      {/* Navy-to-light transition */}
      <div style={{ background: "linear-gradient(to bottom, #0F2847 0%, #1a3a5e 30%, #3a6a8e 60%, #FAFBFC 100%)", height: "60px" }} />

      {/* Section 2: RV Services with Pricing */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            RV Maintenance
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            Services and pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rvServices.map((svc, i) => (
              <div
                key={svc.name}
                className={`bg-white border border-[#f0ede6] rounded-[14px] p-7 shadow-[0_2px_20px_rgba(11,32,64,0.06)] hover:shadow-[0_4px_28px_rgba(11,32,64,0.1)] hover:translate-y-[-2px] transition-all duration-300 ${
                  i === 2 ? "border-t-[3px] border-t-[#E07B2D]" : ""
                }`}
              >
                <h3 className="text-[18px] font-bold text-[#0B2040] mb-1">
                  {svc.name}
                </h3>
                <p className="text-[16px] font-semibold text-[#E07B2D] mb-2">
                  {svc.price}
                </p>
                <p className="text-[14px] text-[#444] leading-[1.7]">
                  {svc.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Light transition */}
      <div style={{ background: "linear-gradient(to bottom, #FAFBFC, #FFFFFF)", height: "40px" }} />

      {/* Section 3: Additional Services */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8F6F1 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Also Available
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            Additional RV services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {additionalServices.map((service) => (
              <div
                key={service.name}
                className="flex items-start gap-2.5 bg-white border border-[#f0ede6] rounded-[10px] px-[14px] py-[14px] shadow-[0_1px_8px_rgba(11,32,64,0.04)] hover:border-[#E07B2D]/30 hover:bg-[#FFF9F4] transition-colors"
              >
                <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D] mt-[7px]" />
                <div>
                  <span className="text-[15px] font-semibold text-[#0B2040]">
                    {service.name}
                  </span>
                  <span className="text-[14px] font-semibold text-[#E07B2D] ml-2">
                    {service.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warm-to-dark transition */}
      <div style={{ background: "linear-gradient(to bottom, #F8F6F1 0%, #0F2847 100%)", height: "80px" }} />

      {/* Section 4: Why RV Owners Choose Us */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(224,123,45,0.05) 0%, transparent 70%)" }} />

        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
          <h2 className="text-[28px] font-extrabold text-white mb-8">
            Why RV owners choose Coastal Mobile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="border-l-[3px] border-l-[#E07B2D] pl-4"
              >
                <h3 className="text-[16px] font-bold text-white mb-1">
                  {prop.title}
                </h3>
                <p className="text-[14px] text-white/60 leading-[1.7]">
                  {prop.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark-to-light transition */}
      <div style={{ background: "linear-gradient(to bottom, #132E54 0%, #1a3a5e 30%, #3a6a8e 60%, #FAFBFC 100%)", height: "60px" }} />

      {/* Section 5: Service Area */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)" }}>
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

      {/* Light-to-dark transition */}
      <div style={{ background: "linear-gradient(to bottom, #FAFBFC 0%, #3a6a8e 50%, #0F2847 100%)", height: "80px" }} />

      {/* Section 6: RV Quote Form */}
      <RVQuoteForm />
    </>
  );
}

/* --- RV Quote Form Component ----------------------------------------- */

const rvInputBase =
  "w-full text-[15px] rounded-[10px] px-3.5 py-3 outline-none border-2 border-[#eee] bg-white focus:border-[#E07B2D] transition-colors";

const rvLabelClass =
  "block text-[12px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5";

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
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(26,95,172,0.08) 0%, transparent 70%)" }} />

      <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-[800] text-white mb-3">
            Get an RV service quote
          </h2>
          <p className="text-[15px] text-white/60 mx-auto max-w-[520px]">
            Tell us about your RV and we will get back to you within 24 hours.
          </p>
        </div>

        <div className="bg-white rounded-[14px] p-8 max-w-[560px] mx-auto shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <p className="text-[16px] font-semibold text-[#0B2040] mb-2">
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
                          : "border-[#eee] text-[#444] hover:border-[#ddd]"
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
                className="w-full py-4 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[16px] hover:bg-[#cc6a1f] transition-colors disabled:opacity-60"
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
