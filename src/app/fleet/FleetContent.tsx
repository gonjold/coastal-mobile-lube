"use client";

import { useState } from "react";
import { Phone, ChevronDown } from "lucide-react";
import Button from "@/components/Button";
import TrustBar from "@/components/TrustBar";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const vehicleTypes = [
  {
    title: "Company Cars & Sedans",
    description:
      "Employee vehicles, sales rep cars, executive fleet. Oil changes, tire rotations, brake checks, and routine maintenance on a schedule that works for your team.",
  },
  {
    title: "Vans & SUVs",
    description:
      "Service vans, delivery vehicles, passenger shuttles. We handle fleets of any mix with consistent service quality and reporting.",
  },
  {
    title: "Box Trucks & Heavy-Duty",
    description:
      "Straight trucks, flatbeds, utility vehicles, and commercial equipment. DOT-ready inspections and maintenance programs built for uptime.",
  },
];

const processSteps = [
  {
    num: "1",
    title: "Consultation",
    desc: "We learn your fleet size, vehicle mix, and maintenance needs. No commitment.",
    bg: "#0B2040",
  },
  {
    num: "2",
    title: "Custom plan",
    desc: "We build a maintenance schedule and pricing structure that fits your budget and your vehicles.",
    bg: "#0B2040",
  },
  {
    num: "3",
    title: "Scheduled visits",
    desc: "Our van shows up on schedule at your location. Your team keeps working.",
    bg: "#0B2040",
  },
  {
    num: "4",
    title: "Reporting",
    desc: "You get service records, maintenance history, and upcoming service alerts for every vehicle.",
    bg: "#E07B2D",
  },
];

const valueProps = [
  {
    title: "Zero downtime",
    desc: "Your vehicles stay in service. We work around your schedule, not the other way around.",
  },
  {
    title: "One point of contact",
    desc: "No chasing multiple shops or service writers. One call, one team, one invoice.",
  },
  {
    title: "Volume pricing",
    desc: "Multi-vehicle discounts that scale with your fleet size. The more vehicles, the better your rate.",
  },
  {
    title: "Service records",
    desc: "Digital maintenance history for every vehicle. Know exactly what was done and when.",
  },
  {
    title: "Flexible scheduling",
    desc: "Weekly, bi-weekly, monthly, or on-demand. We match your cadence.",
  },
  {
    title: "All vehicle types",
    desc: "Sedans to box trucks. Gas, diesel, hybrid. One provider covers your entire fleet.",
  },
];

const fleetServices = [
  { name: "Synthetic Oil Changes", note: "scheduled by mileage or interval" },
  {
    name: "Tire Rotation & Balance",
    note: "extend tire life across your fleet",
  },
  {
    name: "Tire Sales & Installation",
    note: "we source and install on-site",
  },
  {
    name: "Brake Inspection & Service",
    note: "catch problems before they cost you",
  },
  {
    name: "Battery Testing & Replacement",
    note: "no surprise dead batteries",
  },
  {
    name: "Fluid Service & Top-Off",
    note: "coolant, brake, transmission, power steering",
  },
  { name: "Filter Replacement", note: "engine air and cabin filters" },
  {
    name: "DOT Inspections",
    note: "keep your commercial vehicles compliant",
  },
  {
    name: "Wiper Blades & Lights",
    note: "small items that add up across a fleet",
  },
  {
    name: "Emergency Mobile Service",
    note: "breakdowns happen, we respond fast",
  },
];

const faqItems = [
  {
    q: "What size fleet do you work with?",
    a: "We work with fleets from 3 vehicles to 50+. Whether you have a handful of company cars or a full commercial operation, we build a program that fits.",
  },
  {
    q: "How does fleet pricing work?",
    a: "We offer volume discounts based on fleet size and service frequency. The more vehicles and the more regular the schedule, the better your per-vehicle rate. Contact us for a custom quote.",
  },
  {
    q: "Can you handle box trucks and heavy-duty vehicles?",
    a: "Yes. We service light-duty company cars through heavy-duty box trucks, flatbeds, and utility vehicles. If it has an engine and tires, we likely cover it.",
  },
  {
    q: "Do you provide service records for each vehicle?",
    a: "Yes. Every service is documented with the vehicle, date, mileage, services performed, and any notes. You get digital records you can pull up anytime.",
  },
  {
    q: "What if a vehicle breaks down outside the maintenance schedule?",
    a: "Call us. We offer emergency mobile service for fleet customers. We will get to your vehicle as quickly as possible to minimize downtime.",
  },
  {
    q: "Do you service diesel vehicles?",
    a: "Yes. We handle both gas and diesel vehicles including diesel oil changes with the appropriate filters and oil specifications.",
  },
];

export default function FleetContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Section 1: Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0A1C38 0%, #0B2040 40%, #0F2847 70%, #132E54 100%)" }}>
        {/* Atmospheric glow layers */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(26,95,172,0.12) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 80% 30%, rgba(224,123,45,0.06) 0%, transparent 60%)" }} />
        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="section-inner px-4 lg:px-6 pt-10 pb-6 md:pt-14 md:pb-10 relative z-10">
          <div>
            <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
              Fleet & Commercial
            </p>
            <h1 className="text-[30px] md:text-[42px] font-[800] leading-[1.08] text-white tracking-[-1px] mb-5">
              Keep your fleet on the road
            </h1>
            <p className="text-[16px] leading-[1.7] text-white/60 mb-8 max-w-[520px]">
              Scheduled mobile maintenance for company vehicles, box trucks,
              vans, and commercial fleets. We come to your yard, your lot, or
              your job site. No vehicle downtime, no shop visits.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="#fleet-quote" variant="primary" size="lg" className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]">
                Get Fleet Quote
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
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #0F2847)" }} />
      </section>

      <TrustBar />

      {/* Navy-to-light transition */}
      <div style={{ background: "linear-gradient(to bottom, #0F2847 0%, #1a3a5e 30%, #3a6a8e 60%, #FAFBFC 100%)", height: "60px" }} />

      {/* Section 2: What We Cover */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Vehicle Types
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            Light-duty to heavy-duty
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vehicleTypes.map((type) => (
              <div
                key={type.title}
                className="bg-white border border-[#f0ede6] rounded-[14px] shadow-[0_2px_20px_rgba(11,32,64,0.06)] p-6 border-t-[3px] border-t-[#0B2040] hover:shadow-[0_4px_28px_rgba(11,32,64,0.1)] hover:translate-y-[-2px] transition-all duration-300"
              >
                <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
                  {type.title}
                </h3>
                <p className="text-[14px] text-[#444] leading-[1.7]">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Light-to-warm transition */}
      <div style={{ background: "linear-gradient(to bottom, #FAFBFC, #FFFFFF)", height: "40px" }} />

      {/* Section 3: How Fleet Service Works */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8F6F1 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-12 md:py-16">
          <div className="text-center mb-12">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              The Process
            </p>
            <h2 className="text-[28px] font-extrabold text-[#0B2040]">
              Built around your operation
            </h2>
          </div>
          <div className="relative max-w-[1000px] mx-auto">
            {/* Gradient connecting line */}
            <div
              className="hidden md:block absolute top-[36px] h-[2px]"
              style={{
                left: "calc(12.5% + 36px)",
                right: "calc(12.5% + 36px)",
                background: "linear-gradient(to right, #0B2040, #E07B2D)",
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
              {processSteps.map((step) => (
                <div
                  key={step.num}
                  className="flex flex-col items-center text-center relative z-10"
                >
                  <div
                    className="relative flex items-center justify-center w-[72px] h-[72px] rounded-[18px] text-white text-xl font-bold mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    style={{ background: step.bg === "#E07B2D" ? "linear-gradient(135deg, #E07B2D, #CC6A1F)" : "linear-gradient(135deg, #0B2040, #132E54)" }}
                  >
                    <span className="absolute -top-2 -right-2 w-[26px] h-[26px] rounded-full bg-white text-[#0B2040] text-[12px] font-bold flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] leading-[1.7] text-[#555] max-w-[280px]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Warm-to-dark transition */}
      <div style={{ background: "linear-gradient(to bottom, #F8F6F1 0%, #0F2847 100%)", height: "80px" }} />

      {/* Section 4: Why Fleets Choose Us */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(224,123,45,0.05) 0%, transparent 70%)" }} />

        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
          <h2 className="text-[28px] font-extrabold text-white mb-8">
            Why fleet managers choose Coastal Mobile
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

      {/* Section 5: Fleet Services List */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Services
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            What we handle for fleets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fleetServices.map((service) => (
              <div
                key={service.name}
                className="flex items-start gap-2.5 bg-white border border-[#f0ede6] rounded-[10px] px-[14px] py-[14px] shadow-[0_1px_8px_rgba(11,32,64,0.04)] hover:border-[#E07B2D]/30 hover:bg-[#FFF9F4] transition-colors"
              >
                <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D] mt-[7px]" />
                <div>
                  <span className="text-[14px] font-semibold text-[#0B2040]">
                    {service.name}
                  </span>
                  <span className="text-[14px] text-[#888]">
                    {" "}
                    - {service.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Light-to-dark transition */}
      <div style={{ background: "linear-gradient(to bottom, #FAFBFC 0%, #3a6a8e 50%, #0F2847 100%)", height: "80px" }} />

      {/* Section 6: Fleet Quote Form */}
      <FleetQuoteForm />

      {/* Dark-to-light transition */}
      <div style={{ background: "linear-gradient(to bottom, #132E54 0%, #1a3a5e 30%, #3a6a8e 60%, #FAFBFC 100%)", height: "60px" }} />

      {/* Section 7: Fleet FAQs */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="max-w-[700px] mx-auto">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Common Questions
            </p>
            <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
              Fleet Service FAQs
            </h2>
            <div>
              {faqItems.map((faq, i) => (
                <div key={i} className="border-b border-[#eee]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="text-[15px] font-semibold text-[#0B2040]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[#888] transition-transform ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <p className="text-[14px] text-[#444] leading-[1.7] pb-4">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

/* ─── Fleet Quote Form Component ─────────────────────────────── */

const fleetInputBase =
  "w-full text-[15px] rounded-[10px] px-3.5 py-3 outline-none border border-white/[0.15] bg-white/[0.07] text-white placeholder:text-white/40 focus:border-[#E07B2D]/70 focus:bg-white/[0.10] transition-colors";

const fleetLabelClass =
  "block text-[12px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5";

function FleetQuoteForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPreference, setContactPreference] = useState<"call" | "text" | "email">("call");
  const [preferredDate, setPreferredDate] = useState("");
  const [datesFlexible, setDatesFlexible] = useState(false);
  const [fleetSize, setFleetSize] = useState("");
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
        fleetSize,
        notes,
        service: "Fleet Consultation",
        serviceCategory: "fleet",
        status: "pending",
        source: "fleet-page",
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
    <section id="fleet-quote" className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(26,95,172,0.08) 0%, transparent 70%)" }} />

      <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-[800] text-white mb-3">
            Get a fleet quote
          </h2>
          <p className="text-[15px] text-white/60 mx-auto max-w-[520px]">
            Tell us about your fleet and we will put together a custom maintenance plan within 48 hours.
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
          {/* Top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          {submitted ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <p className="text-[16px] font-semibold text-white mb-2">
                We will call you within 48 hours to discuss your fleet program.
              </p>
              <a href="tel:8137225823" className="text-[#E07B2D] font-semibold hover:underline">
                Call now: 813-722-LUBE
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <label className={fleetLabelClass}>Your Name</label>
                <input
                  type="text"
                  placeholder="First and last name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })); }}
                  className={`${fleetInputBase} ${errors.name ? "border-red-500" : ""}`}
                />
              </div>
              <div>
                <label className={fleetLabelClass}>Phone</label>
                <input
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: false })); }}
                  className={`${fleetInputBase} ${errors.phone ? "border-red-500" : ""}`}
                />
              </div>
              <div>
                <label className={fleetLabelClass}>Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fleetInputBase}
                />
              </div>
              <div>
                <label className={fleetLabelClass}>Best Way to Reach You</label>
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
                <label className={fleetLabelClass}>Preferred Date</label>
                <input
                  type="date"
                  min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })()}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className={fleetInputBase}
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
                <label className={fleetLabelClass}>Fleet Size</label>
                <select
                  value={fleetSize}
                  onChange={(e) => setFleetSize(e.target.value)}
                  className={fleetInputBase}
                >
                  <option value="">Select fleet size</option>
                  <option value="1-5 vehicles">1-5 vehicles</option>
                  <option value="6-15 vehicles">6-15 vehicles</option>
                  <option value="16-50 vehicles">16-50 vehicles</option>
                  <option value="50+ vehicles">50+ vehicles</option>
                </select>
              </div>
              <div>
                <label className={fleetLabelClass}>Tell us about your fleet</label>
                <textarea
                  rows={3}
                  placeholder="Vehicle types, current maintenance schedule, locations, anything that helps us build your plan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${fleetInputBase} resize-none`}
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[16px] hover:bg-[#cc6a1f] transition-colors disabled:opacity-60 shadow-[0_4px_24px_rgba(224,123,45,0.35)]"
              >
                {submitting ? "Submitting..." : "Get Fleet Quote"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
