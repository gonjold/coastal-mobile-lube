"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Check, Clock, MapPin, Wrench, Shield, Award, Tag } from "lucide-react";
import Button from "@/components/Button";
import { cloudinaryUrl, images } from "@/lib/cloudinary";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
    pricing: "$89.95",
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
      "Dockside and boat ramp service for outboard and inboard engines. Seasonal maintenance and winterization across the South Shore.",
    pricing: "$129.95",
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
  "w-full text-sm rounded-[10px] px-3 py-2.5 outline-none border border-white/10 bg-white/[0.08] text-white placeholder:text-white/40 focus:border-white/25 transition-colors";

export default function Home() {
  const [bookingTab, setBookingTab] = useState<TabKey>("automotive");
  const [servicesTab, setServicesTab] = useState<TabKey>("automotive");
  const [selectedService, setSelectedService] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [zipValue, setZipValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [contactPreference, setContactPreference] = useState<"call" | "text" | "email">("call");
  const [preferredDate, setPreferredDate] = useState("");
  const [datesFlexible, setDatesFlexible] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const currentService = servicesData[servicesTab];

  async function handleQuoteSubmit() {
    setQuoteError("");
    if (!selectedService) {
      setQuoteError("Please select a service.");
      return;
    }
    const strippedPhone = phoneValue.replace(/\D/g, "");
    if (strippedPhone.length < 10) {
      setQuoteError("Please enter a valid phone number.");
      return;
    }
    setQuoteSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        name: nameValue.trim(),
        service: selectedService,
        serviceCategory: bookingTab,
        zip: zipValue,
        phone: strippedPhone,
        email: emailValue.trim().toLowerCase(),
        contactPreference,
        preferredDate: preferredDate || "",
        datesFlexible,
        notes: notesValue,
        status: "pending",
        source: "homepage-widget",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setQuoteSubmitted(true);
    } catch {
      setQuoteError("Something went wrong. Please call us instead.");
    } finally {
      setQuoteSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[600px]" style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f2847 40%, #162d50 70%, #1a3a5f 100%)" }}>
        {/* Atmospheric glow layers */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(26,95,172,0.12) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 60% 5%, rgba(224,123,45,0.05) 0%, transparent 55%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 80% at 50% 100%, rgba(10,22,40,0.7) 0%, transparent 60%)" }} />

        {/* Oval badge watermark — massive brand stamp */}
        <img
          src={cloudinaryUrl(images.logo, { width: 900, quality: "auto" })}
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -top-[60px] w-[550px] md:w-[700px] h-auto pointer-events-none select-none opacity-[0.10] blur-[0.5px]"
          style={{ zIndex: 1 }}
        />

        {/* Subtle noise grain texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{ backgroundImage: "repeating-radial-gradient(circle at 17% 32%, rgba(255,255,255,0.12) 0px, transparent 1px), repeating-radial-gradient(circle at 62% 68%, rgba(255,255,255,0.1) 0px, transparent 1px), repeating-radial-gradient(circle at 84% 15%, rgba(255,255,255,0.08) 0px, transparent 1px)", backgroundSize: "3px 3px, 4px 4px, 5px 5px" }} />

        <div className="section-inner px-4 lg:px-6 pt-12 pb-12 md:pt-20 md:pb-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[11fr_9fr] gap-10 lg:gap-14 items-start">
            {/* Left Column */}
            <div className="lg:sticky lg:top-[100px] lg:self-start">
              <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
                Mobile automotive. Fleet. Marine.
              </p>
              <h1 className="text-[36px] md:text-[52px] font-extrabold leading-[1.06] text-white tracking-[-1.5px] mb-5" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)" }}>
                The shop that comes to{" "}
                <span className="relative">
                  <span className="text-[#E07B2D]">you.</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#E07B2D]/40" />
                </span>
              </h1>
              <p className="text-[17px] leading-[1.7] text-white/60 max-w-[440px] mb-8">
                Mobile oil changes, tire service, fleet maintenance, and marine engine
                care. We come to your driveway, your parking lot, or your dock.
                No shop visit needed.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-0 sm:mb-8">
                <Button href="/book" variant="primary" size="lg" className="whitespace-nowrap shadow-[0_4px_24px_rgba(224,123,45,0.35)]">
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

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-7 border-t border-white/[0.08]">
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

            {/* Booking Widget — frosted glass */}
            <div
              className="rounded-[16px] p-7 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
                backdropFilter: "blur(24px) saturate(1.2)",
                WebkitBackdropFilter: "blur(24px) saturate(1.2)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.35), 0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Subtle top edge highlight */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              {quoteSubmitted ? (
                <div className="flex flex-col items-center text-center py-6 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <h2 className="text-[19px] font-bold text-white mb-2">
                    We&apos;ll call you back within 2 hours
                  </h2>
                  <a
                    href="tel:8137225823"
                    className="text-[#E07B2D] font-semibold hover:underline"
                  >
                    Call now: 813-722-LUBE
                  </a>
                </div>
              ) : (
                <div className="relative z-10">
                  <h2 className="text-[19px] font-bold text-white mb-1">
                    Get a quick quote
                  </h2>
                  <p className="text-[13px] text-white/45 mb-5">
                    Tell us what you need. We will get back to you fast.
                  </p>

                  <div className="flex rounded-[10px] p-1 bg-white/[0.06] mb-5 border border-white/[0.06]">
                    {bookingTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => { setBookingTab(tab.key); setSelectedService(""); }}
                        className={`flex-1 text-[13px] font-semibold py-2 rounded-[8px] transition-all ${
                          bookingTab === tab.key
                            ? "bg-white/[0.14] text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                            : "text-white/45 hover:text-white/65"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5">
                        Service Needed
                      </label>
                      <select
                        className={inputClasses}
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                      >
                        <option value="">Select a service</option>
                        {bookingServices[bookingTab].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="Your name"
                        className={inputClasses}
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5">
                          Zip Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 33601"
                          className={inputClasses}
                          value={zipValue}
                          onChange={(e) => setZipValue(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5">
                          Phone
                        </label>
                        <input
                          type="tel"
                          placeholder="(555) 555-5555"
                          className={inputClasses}
                          value={phoneValue}
                          onChange={(e) => setPhoneValue(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="you@email.com"
                        className={inputClasses}
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5">
                        Best Way to Reach You
                      </label>
                      <div className="flex rounded-[10px] p-1 bg-white/[0.06] border border-white/[0.06]">
                        {(["call", "text", "email"] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setContactPreference(method)}
                            className={`flex-1 text-[13px] font-semibold py-2 rounded-[8px] transition-all ${
                              contactPreference === method
                                ? "bg-white/[0.14] text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                                : "text-white/45 hover:text-white/65"
                            }`}
                          >
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })()}
                        className={inputClasses}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors ${datesFlexible ? "bg-[#E07B2D] border-[#E07B2D]" : "border-[#ddd]"}`}>
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
                      <label className="block text-[11px] uppercase font-semibold text-white/50 tracking-[0.5px] mb-1.5">
                        Notes (optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Vehicle year/make/model, tire size, special requests, etc."
                        className={`${inputClasses} resize-none`}
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleQuoteSubmit}
                      disabled={quoteSubmitting}
                      className="w-full font-semibold text-white rounded-[var(--radius-button)] py-3.5 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors disabled:opacity-60 shadow-[0_4px_16px_rgba(224,123,45,0.3)]"
                    >
                      {quoteSubmitting ? "Submitting..." : "Get My Quote"}
                    </button>

                    {quoteError && (
                      <p className="text-center text-[13px] text-red-500 font-medium">
                        {quoteError}
                      </p>
                    )}

                    <p className="text-center text-[12px] text-white/45">
                      or call{" "}
                      <a href="tel:8137225823" className="font-medium text-[#E07B2D]">
                        813-722-LUBE
                      </a>{" "}
                      for immediate help
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom gradient fade into services */}
        <div className="absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #0f2847)" }} />
      </section>

      {/* ── Navy-to-light transition ── */}
      <div style={{ background: "linear-gradient(to bottom, #0f2847, #F0EDE6)", height: "80px" }} />

      {/* ── Services ── */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #F0EDE6 0%, #F4EEE3 50%, #F0EDE6 100%)" }}>
        <div className="section-inner px-4 lg:px-6 pt-10 pb-14 md:pt-14">
          <div className="text-center mb-10">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Services
            </p>
            <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#0B2040] mb-3">
              What we handle on-site
            </h2>
            <p className="text-[15px] text-[#555] mx-auto max-w-[480px]">
              Everything your vehicle, fleet, or boat needs. Brought directly to
              your location by a factory-trained technician.
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-10">
            {serviceTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setServicesTab(tab.key)}
                className={`text-[14px] font-semibold px-5 py-2.5 rounded-full transition-all ${
                  servicesTab === tab.key
                    ? "bg-[#0B2040] text-white shadow-[0_2px_12px_rgba(11,32,64,0.25)]"
                    : "bg-[#F0EDE6] text-[#666] hover:bg-[#E8E4DC] hover:text-[#444]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="bg-white rounded-[14px] p-7 shadow-[0_2px_20px_rgba(11,32,64,0.06)] border border-[#f0ede6]">
              <h3 className="text-[22px] font-bold text-[#0B2040] mb-3">
                {currentService.title}
              </h3>
              <p className="text-[15px] text-[#555] leading-[1.7] mb-5">
                {currentService.description}
              </p>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-[12px] text-[#888] uppercase tracking-wide">
                  {currentService.pricingLabel}
                </span>
                <span className="text-[30px] font-extrabold text-[#0B2040]">
                  {currentService.pricing}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {currentService.items.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 text-[13px] text-[#444] bg-[#FAFBFC] border border-[#f0ede6] rounded-[10px] px-3.5 py-[10px] hover:border-[#E07B2D]/30 hover:bg-[#FFF9F4] transition-colors"
                  >
                    <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(11,32,64,0.1)]">
              <img
                src={cloudinaryUrl(currentService.image, { width: 800, height: 600 })}
                alt={currentService.title}
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
                <Link
                  href="/book"
                  className="text-[13px] font-semibold text-white px-5 py-2.5 rounded-[8px] bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors shadow-[0_2px_8px_rgba(224,123,45,0.3)]"
                >
                  Get Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hull stripe separator ── */}
      <div className="h-[3px]" style={{ background: "linear-gradient(to right, #1A5FAC, #E07B2D, #D9A441, #1A5FAC)" }} />

      {/* ── Services-to-HowItWorks transition ── */}
      <div style={{ background: "linear-gradient(to bottom, #F0EDE6, #FFFFFF)", height: "48px" }} />

      {/* ── How It Works ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8F6F1 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-12 md:py-16">
          <div className="text-center mb-12">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              How It Works
            </p>
            <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#0B2040]">
              Three steps. That&apos;s it.
            </h2>
          </div>

          <div className="relative max-w-[900px] mx-auto">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[60px] h-[2px]" style={{ left: "calc(16.67% + 40px)", right: "calc(16.67% + 40px)", background: "linear-gradient(to right, #E07B2D, #D9A441, #0D8A8F)" }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
              {[
                {
                  num: "1",
                  title: "Book online or call",
                  desc: "Pick your service, enter your zip, and choose a time. Or just call us at 813-722-LUBE.",
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
                    className="relative flex items-center justify-center w-[72px] h-[72px] rounded-[18px] text-white text-xl font-bold mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    style={{ background: step.gradient }}
                  >
                    {step.icon}
                    <span className="absolute -top-2 -right-2 w-[26px] h-[26px] rounded-full bg-white text-[#0B2040] text-[12px] font-bold flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] leading-[1.7] text-[#555] max-w-[260px]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HowItWorks-to-Stats transition ── */}
      <div style={{ background: "linear-gradient(to bottom, #F8F6F1, #0F2847)", height: "60px" }} />

      {/* ── Stats Bar ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
        {/* Top edge accent */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(217,164,65,0.3), transparent)" }} />
        {/* Bottom edge accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(217,164,65,0.3), transparent)" }} />
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(224,123,45,0.06) 0%, transparent 70%)" }} />

        <div className="section-inner px-6 py-12 md:py-14 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "30+", label: "Years in fixed ops" },
              { value: "<1hr", label: "Most services completed" },
              { value: "100%", label: "Mobile. Always." },
              { value: "$0", label: "Surprise fees. Ever." },
            ].map((stat, i) => (
              <div key={stat.label} className={`relative ${i < 3 ? "md:after:content-[''] md:after:absolute md:after:right-0 md:after:top-1/2 md:after:-translate-y-1/2 md:after:h-[40px] md:after:w-px md:after:bg-white/10" : ""}`}>
                <p className="text-[36px] md:text-[42px] font-extrabold text-[#E07B2D] mb-1 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[13px] text-white/50 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats-to-Reviews transition ── */}
      <div style={{ background: "linear-gradient(to bottom, #132E54, #F4EEE3)", height: "60px" }} />

      {/* ── Reviews ── */}
      <section className="overflow-hidden" style={{ background: "linear-gradient(180deg, #F4EEE3 0%, #FBF5EB 40%, #F4EEE3 100%)" }}>
        <div className="section-inner px-4 lg:px-6 pt-10 md:pt-14 pb-4">
          <div className="text-center mb-10">
            <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[1.5px] mb-3">
              Reviews
            </p>
            <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#0F2847]">
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
            className="flex gap-5 w-max"
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
                  className="w-[350px] flex-shrink-0 bg-white rounded-[14px] p-6 flex flex-col shadow-[0_2px_16px_rgba(139,115,85,0.08)] border border-[#EDE8DF]"
                >
                  <div className="text-[#D9A441] text-[16px] mb-3 tracking-wide">
                    {"★★★★★"}
                  </div>
                  <p className="text-[14px] leading-[1.7] text-[#2C2C2C] flex-1 mb-4">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#F0EDE6]">
                    <span className="text-[13px] font-bold text-[#0F2847]">
                      {review.name} <span className="font-normal text-[#999]">{review.city}</span>
                    </span>
                    <span className="text-[11px] text-[#aaa] font-medium">Google Review</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section-inner px-4 lg:px-6 pb-10 md:pb-14">
          <div className="text-center mt-8">
            <p className="text-[13px] text-[#8B7355] mb-2">Reviews from customers across the South Shore</p>
            <a href="#" className="text-[13px] font-semibold text-[#E07B2D] hover:underline">
              Leave us a review on Google &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── Hull stripe separator ── */}
      <div className="h-[3px]" style={{ background: "linear-gradient(to right, #1A5FAC, #E07B2D, #D9A441, #1A5FAC)" }} />

      {/* ── Reviews-to-Trust transition ── */}
      <div style={{ background: "linear-gradient(to bottom, #F4EEE3, #F8F6F1)", height: "40px" }} />

      {/* ── Trust Bar (inline) ── */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #F8F6F1 0%, #FFFFFF 50%, #F8F6F1 100%)" }}>
        <div className="section-inner px-4 lg:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
            {[
              { icon: Shield, text: "Fully Licensed & Insured", color: "#1A5FAC" },
              { icon: Wrench, text: "ASE-Certified Technicians", color: "#0D8A8F" },
              { icon: Award, text: "12-Month Service Warranty", color: "#D9A441" },
              { icon: Tag, text: "Transparent Pricing, No Surprises", color: "#E07B2D" },
            ].map((item, i) => (
              <div
                key={item.text}
                className={`flex flex-col items-center gap-3 text-center justify-center ${
                  i < 3 ? "md:border-r md:border-[#eee]" : ""
                } md:px-6`}
              >
                <div
                  className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center"
                  style={{ background: `${item.color}10` }}
                >
                  <item.icon size={26} className="shrink-0" style={{ color: item.color }} strokeWidth={1.5} />
                </div>
                <span className="text-[13px] font-semibold text-[#0F2847]">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust-to-CTA transition ── */}
      <div style={{ background: "linear-gradient(to bottom, #F8F6F1, #0F2847)", height: "60px" }} />

      {/* ── CTA ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A1C38 0%, #0F2847 40%, #132E54 100%)" }}>
        {/* Atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(224,123,45,0.10) 0%, transparent 60%)" }} />

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
            <Button href="/book" variant="primary" size="lg" className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]">
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
