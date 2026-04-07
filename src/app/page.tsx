"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Phone, Check, Clock, MapPin, Wrench, Shield, Award, Tag } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import Button from "@/components/Button";
import { cloudinaryUrl, images } from "@/lib/cloudinary";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useServices, type Service } from "@/hooks/useServices";

const fallbackServicesData: Record<string, { title: string; description: string; pricing: string; pricingLabel: string; items: string[]; image: string }> = {
  automotive: {
    title: "Automotive Services",
    description: "Factory-grade oil changes, tire rotations, brake checks, and preventive maintenance - all performed at your home or office.",
    pricing: "$89.95",
    pricingLabel: "Starting at",
    items: ["Synthetic Oil Change", "Tire Rotation & Balance", "Brake Inspection"],
    image: images.drivewayService,
  },
  fleet: {
    title: "Fleet & Commercial",
    description: "Scheduled maintenance programs for company vehicles, box trucks, and commercial fleets. Volume pricing and custom plans available.",
    pricing: "Custom quotes",
    pricingLabel: "",
    items: ["Scheduled Fleet Maintenance", "Company Vehicle Programs", "Emergency Mobile Service"],
    image: images.commercialService,
  },
  marine: {
    title: "Marine Services",
    description: "Dockside and boat ramp service for outboard and inboard engines. Seasonal maintenance and winterization across the South Shore.",
    pricing: "$149.95",
    pricingLabel: "Starting at",
    items: ["Outboard Oil Change", "Inboard Engine Service", "Lower Unit Service"],
    image: images.marinaBoatsAlt,
  },
  rv: {
    title: "RV & Trailer Services",
    description: "On-site maintenance for motorhomes, travel trailers, and fifth wheels. Generator service, roof inspections, and slide-out care wherever you're parked.",
    pricing: "$129.95",
    pricingLabel: "Starting at",
    items: ["Generator Service & Inspection", "Roof Seal & Leak Inspection", "RV Oil & Filter Change", "Slide-Out Lubrication & Maintenance"],
    image: images.drivewayServiceAlt,
  },
};

type TabKey = "automotive" | "fleet" | "marine" | "rv";

const serviceTabs: { key: TabKey; label: string }[] = [
  { key: "automotive", label: "Automotive" },
  { key: "fleet", label: "Fleet & Commercial" },
  { key: "marine", label: "Marine" },
  { key: "rv", label: "RV & Trailer" },
];

const quickQuoteServices = [
  "Oil Change",
  "Tires",
  "Brakes",
  "Maintenance",
  "A/C & Heating",
  "Marine Service",
  "RV Service",
  "Fleet Service",
  "Something Else",
];

export default function Home() {
  const { openBooking } = useBooking();
  const [servicesTab, setServicesTab] = useState<TabKey>("automotive");

  /* Quick Quote state */
  const [qqName, setQqName] = useState("");
  const [qqPhone, setQqPhone] = useState("");
  const [qqService, setQqService] = useState("");
  const [qqSubmitting, setQqSubmitting] = useState(false);
  const [qqSubmitted, setQqSubmitted] = useState(false);
  const [qqError, setQqError] = useState("");

  const { services: allServices } = useServices({ activeOnly: true });

  /* Derive services tab data from Firestore */
  const servicesData = useMemo(() => {
    if (allServices.length === 0) return fallbackServicesData;
    const autoPrices = allServices.filter((s) => s.division === "auto").map((s) => s.price);
    const marinePrices = allServices.filter((s) => s.division === "marine").map((s) => s.price);
    return {
      automotive: {
        ...fallbackServicesData.automotive,
        pricing: autoPrices.length > 0 ? `$${Math.min(...autoPrices).toFixed(2)}` : "$89.95",
        items: allServices.filter((s) => s.division === "auto" && s.showOnPricing).map((s) => s.name).slice(0, 8),
      },
      fleet: {
        ...fallbackServicesData.fleet,
        items: allServices.filter((s) => s.division === "fleet" && s.showOnPricing).map((s) => s.name).slice(0, 8),
      },
      marine: {
        ...fallbackServicesData.marine,
        pricing: marinePrices.length > 0 ? `$${Math.min(...marinePrices).toFixed(2)}` : "$149.95",
        items: allServices.filter((s) => s.division === "marine" && s.showOnPricing).map((s) => s.name).slice(0, 8),
      },
      rv: {
        ...fallbackServicesData.rv,
        items: allServices.filter((s) => s.division === "rv" && s.showOnPricing).map((s) => s.name).slice(0, 8),
      },
    };
  }, [allServices]);

  const currentService = servicesData[servicesTab];

  async function handleQuickQuote() {
    setQqError("");
    if (!qqService) {
      setQqError("Please select a service.");
      return;
    }
    const strippedPhone = qqPhone.replace(/\D/g, "");
    if (strippedPhone.length < 10) {
      setQqError("Please enter a valid phone number.");
      return;
    }
    setQqSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        customerName: qqName.trim(),
        customerPhone: strippedPhone,
        serviceCategory: qqService,
        source: "quick-quote",
        status: "new",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setQqSubmitted(true);
    } catch {
      setQqError("Something went wrong. Please call us instead.");
    } finally {
      setQqSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-clip min-h-[600px]" style={{ background: "linear-gradient(180deg, #0A1628 0%, #0B2040 50%, #0F2847 100%)" }}>

        {/* Oval badge watermark - massive brand stamp */}
        <img
          src={cloudinaryUrl(images.logo, { width: 900, quality: "auto" })}
          alt=""
          aria-hidden="true"
          className="absolute left-[15%] top-[55%] -translate-y-1/2 w-[800px] h-auto opacity-[0.04] z-0 pointer-events-none select-none"
        />

        <div className="section-inner px-4 lg:px-6 pt-16 pb-16 md:pt-24 md:pb-20 relative z-10">
          <div className="max-w-[660px] mx-auto text-center">
            <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
              Mobile automotive. Fleet. Marine. RV & Trailer.
            </p>
            <h1 className="text-[36px] md:text-[52px] font-extrabold leading-[1.06] text-white tracking-[-1.5px] mb-5" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)" }}>
              The shop that comes to{" "}
              <span className="relative">
                <span className="text-[#E07B2D]">you.</span>
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#E07B2D]/40" />
              </span>
            </h1>
            <p className="text-[17px] leading-[1.7] text-white/60 max-w-[540px] mx-auto mb-8">
              Mobile oil changes, tire service, fleet maintenance, marine engine care, and RV service. We come to your driveway, your parking lot, or your dock.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
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

            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-7 border-t border-white/[0.08]">
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

      {/* ── Quick Quote Strip ── */}
      <section className="bg-[#F8FAFC]">
        <div className="section-inner px-4 lg:px-6 py-12 md:py-14">
          <div className="text-center mb-8">
            <h2 className="text-[24px] font-bold text-[#0B2040] mb-2">
              Get a Quick Quote
            </h2>
            <p className="text-[15px] text-[#555]">
              Not sure what you need? Tell us and we&apos;ll call you back within the hour.
            </p>
          </div>

          {qqSubmitted ? (
            <p className="text-center text-[17px] font-semibold text-[#22c55e]">
              Got it! We&apos;ll call you shortly.
            </p>
          ) : (
            <div className="max-w-[800px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full text-sm rounded-[10px] px-4 py-3 outline-none border border-[#ddd] bg-white text-[#333] placeholder:text-[#999] focus:border-[#E07B2D] transition-colors"
                  value={qqName}
                  onChange={(e) => setQqName(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  className="w-full text-sm rounded-[10px] px-4 py-3 outline-none border border-[#ddd] bg-white text-[#333] placeholder:text-[#999] focus:border-[#E07B2D] transition-colors"
                  value={qqPhone}
                  onChange={(e) => setQqPhone(e.target.value)}
                />
                <div className="relative">
                  <select
                    className="w-full text-sm rounded-[10px] px-4 py-3 outline-none border border-[#ddd] bg-white text-[#333] appearance-none pr-10 focus:border-[#E07B2D] transition-colors"
                    value={qqService}
                    onChange={(e) => setQqService(e.target.value)}
                  >
                    <option value="">What do you need?</option>
                    {quickQuoteServices.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#999]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
                <button
                  onClick={handleQuickQuote}
                  disabled={qqSubmitting}
                  className="whitespace-nowrap font-semibold text-white rounded-[10px] px-6 py-3 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors disabled:opacity-60 shadow-[0_4px_16px_rgba(224,123,45,0.3)]"
                >
                  {qqSubmitting ? "Sending..." : "Get My Quote"}
                </button>
              </div>
              {qqError && (
                <p className="text-center text-[13px] text-red-500 font-medium mt-3">
                  {qqError}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="section-inner px-4 lg:px-6 py-14 md:py-20">
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
                  title: "You never left your day.",
                  desc: "No waiting rooms. No ride to the shop. No disruption.",
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

      {/* ── Services ── */}
      <section className="relative bg-[#F0EDE6]">
        <div className="section-inner px-4 lg:px-6 pt-10 pb-14 md:pt-14">
          <div className="text-center mb-10">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Services
            </p>
            <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#0B2040] mb-3">
              What we handle on-site
            </h2>
            <p className="text-[15px] text-[#555] mx-auto max-w-[480px]">
              Everything your vehicle, fleet, boat, or RV needs. Brought directly to
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
              {servicesTab === "rv" && (
                <Link
                  href="/rv"
                  className="inline-block mt-5 text-[14px] font-semibold text-[#E07B2D] hover:underline"
                >
                  View All RV &amp; Trailer Services &rarr;
                </Link>
              )}
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
                <button
                  onClick={openBooking}
                  className="text-[13px] font-semibold text-white px-5 py-2.5 rounded-[8px] bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors shadow-[0_2px_8px_rgba(224,123,45,0.3)]"
                >
                  Get Quote
                </button>
              </div>
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


      {/* ── Reviews ── */}
      <section className="overflow-hidden bg-[#F4EEE3]">
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
                      {review.name} <span className="font-normal text-[#999]">- {review.city}</span>
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


      {/* ── CTA ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A1C38 0%, #0F2847 40%, #132E54 100%)" }}>

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
