"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Phone, Clock, MapPin, Wrench, Shield, Tag, ChevronRight, ChevronDown } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import Button from "@/components/Button";
import type { Service, ServiceCategory } from "@/lib/services";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cld, images } from "@/lib/cloudinary";
import { HERO_DEFAULTS, type HeroCopy } from "@/lib/hero";

/* ── Homepage category configs per division ── */

interface CategoryConfig {
  displayName: string;
  description: string;
  firestoreCategories: string[]; // matched against service.category for min price
  ctaLabel?: string;
  ctaAction?: "fleet-quote";
  image?: { key: keyof typeof images; alt: string };
}

const DIVISION_CATEGORIES: Record<TabKey, CategoryConfig[]> = {
  automotive: [
    { displayName: "Oil Changes", description: "Conventional, synthetic blend, full synthetic, and diesel oil changes. Factory-grade service at your location.", firestoreCategories: ["Oil Changes"], image: { key: "vanVacuumExtraction", alt: "Vacuum extraction equipment" } },
    { displayName: "Tires & Wheels", description: "Tire rotation, flat repair, mount and balance, TPMS service, and new tire installation.", firestoreCategories: ["Tire/Wheel"], image: { key: "vanTireEquipment", alt: "Snap-on tire changer" } },
    { displayName: "Brakes", description: "Front and rear brake pads, full brake jobs, and brake fluid flush.", firestoreCategories: ["Brakes"], image: { key: "vanTireBay", alt: "Tire bay equipment" } },
    { displayName: "Basic Maintenance", description: "Wiper blades, air filters, cabin filters, batteries, coolant flush, belts, and more.", firestoreCategories: ["Basic Maintenance"], image: { key: "vanEquipmentWide", alt: "Mobile shop equipment" } },
    { displayName: "A/C & Heating", description: "A/C diagnostic, EVAC and recharge, and heating system service.", firestoreCategories: ["HVAC"], image: { key: "vanEquipmentSquare", alt: "Mobile shop interior" } },
  ],
  fleet: [
    { displayName: "Custom Fleet Maintenance Programs", description: "Scheduled maintenance for your entire fleet. Volume pricing available.", firestoreCategories: ["Preventive Maintenance Tiers"], ctaLabel: "Request Fleet Quote", ctaAction: "fleet-quote" },
  ],
  marine: [
    { displayName: "Oil Service", description: "Outboard and inboard engine oil changes, filter replacement, and lower unit service.", firestoreCategories: ["Marine Oil Service"] },
    { displayName: "Engine Service", description: "Fuel system service, diesel maintenance, and comprehensive engine diagnostics.", firestoreCategories: ["Marine Fuel/Fluid Services", "Marine Diesel Services"] },
    { displayName: "Electrical & Maintenance", description: "Battery service, wiring, lighting, belts, hoses, and marine system diagnostics.", firestoreCategories: ["Marine Basic Maintenance"] },
    { displayName: "Winterization", description: "Complete winterization service to protect your boat during the off-season.", firestoreCategories: ["Marine Basic Maintenance"] },
  ],
  rv: [
    { displayName: "Oil & Lube", description: "Full synthetic and diesel oil changes for motorhomes and tow vehicles.", firestoreCategories: ["Oil Changes"] },
    { displayName: "Tires & Wheels", description: "Tire rotation, flat repair, mount and balance, and TPMS service for RVs.", firestoreCategories: ["Tire/Wheel"] },
    { displayName: "Brakes", description: "Brake pads, rotors, and brake system service for all RV types.", firestoreCategories: ["Brakes"] },
    { displayName: "Maintenance", description: "Generator service, roof inspections, slide-out care, filters, and more.", firestoreCategories: ["Basic Maintenance"] },
  ],
};

const DIVISION_KEY_MAP: Record<TabKey, string> = {
  automotive: "auto",
  fleet: "fleet",
  marine: "marine",
  rv: "rv",
};

const DIVISION_LINKS: Record<TabKey, { href: string; label: string }> = {
  automotive: { href: "/services", label: "View all Automotive services" },
  fleet: { href: "/fleet", label: "View all Fleet services" },
  marine: { href: "/marine", label: "View all Marine services" },
  rv: { href: "/rv", label: "View all RV services" },
};

type TabKey = "automotive" | "fleet" | "marine" | "rv";

const TAB_TO_DIVISION: Record<TabKey, string> = {
  automotive: "Automotive",
  fleet: "Fleet",
  marine: "Marine",
  rv: "RV",
};

const serviceTabs: { key: TabKey; label: string }[] = [
  { key: "automotive", label: "Automotive" },
  { key: "fleet", label: "Fleet & Commercial" },
  { key: "marine", label: "Marine" },
  { key: "rv", label: "RV" },
];

const HERO_MOBILE_SUBHEADLINE = "Mobile service for cars, boats, RVs, and fleets. We come to wherever your vehicle lives.";

function formatHeroPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function PageClient({
  heroCopy = HERO_DEFAULTS,
  services = [],
  serviceCategories = [],
}: {
  heroCopy?: HeroCopy;
  services?: Service[];
  serviceCategories?: ServiceCategory[];
}) {
  const { openBooking } = useBooking();
  const [servicesTab, setServicesTab] = useState<TabKey>("automotive");
  const [expandedService, setExpandedService] = useState<string | null>(null);

  // Sentence-per-line split for the H1. Edge: abbreviations like "Mr. Smith" mis-split — acceptable for marketing copy.
  const headlineSentences = (heroCopy.headline ?? "").split(/(?<=[.!?])\s+/).filter(Boolean);

  /* ── Hero quote form state ── */
  const [hqFirst, setHqFirst] = useState("");
  const [hqLast, setHqLast] = useState("");
  const [hqPhone, setHqPhone] = useState("");
  const [hqEmail, setHqEmail] = useState("");
  const [hqCity, setHqCity] = useState("");
  const [hqService, setHqService] = useState("");
  const [hqSubmitting, setHqSubmitting] = useState(false);
  const [hqMsg, setHqMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleHeroQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!hqFirst.trim() || !hqPhone.trim() || hqSubmitting) return;
    setHqSubmitting(true);
    try {
      await addDoc(collection(db, "quickQuotes"), {
        firstName: hqFirst.trim(),
        lastName: hqLast.trim(),
        phone: hqPhone.replace(/\D/g, ""),
        email: hqEmail.trim(),
        city: hqCity.trim(),
        service: hqService,
        source: "hero-quote-form",
        createdAt: serverTimestamp(),
      });
      setHqMsg({ type: "success", text: "Got it! We'll be in touch soon." });
      setTimeout(() => {
        setHqMsg(null);
        setHqFirst(""); setHqLast(""); setHqPhone(""); setHqEmail(""); setHqCity(""); setHqService("");
      }, 3000);
    } catch {
      setHqMsg({ type: "error", text: "Something went wrong. Call 813-722-LUBE." });
      setTimeout(() => setHqMsg(null), 3000);
    } finally {
      setHqSubmitting(false);
    }
  }

  // Pre-fetched server-side via getServices/getServiceCategories (ISR 300s).
  // Eliminates the FOUC flash from default → real categories on cold cache.
  const allServices = services;
  const allFirestoreCategories = serviceCategories;

  /* Build categories dynamically from Firestore serviceCategories for ALL divisions */
  const effectiveCategories = useMemo((): Record<TabKey, CategoryConfig[]> => {
    const result = {} as Record<TabKey, CategoryConfig[]>;

    for (const tabKey of Object.keys(DIVISION_KEY_MAP) as TabKey[]) {
      const divKey = DIVISION_KEY_MAP[tabKey];
      const cats = allFirestoreCategories
        .filter((c) => c.division === divKey && !/labor\s*rate/i.test(c.name) && (c.showOnHomepage !== false))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      if (cats.length === 0) {
        result[tabKey] = DIVISION_CATEGORIES[tabKey];
        continue;
      }

      result[tabKey] = cats.map((c) => {
        const hardcoded = DIVISION_CATEGORIES[tabKey]?.find((d) => d.firestoreCategories.includes(c.name));
        return {
          displayName: c.tabLabel || c.name,
          description: c.description || hardcoded?.description || `${c.name} services.`,
          firestoreCategories: [c.name],
          ...(hardcoded?.ctaAction ? { ctaAction: hardcoded.ctaAction, ctaLabel: hardcoded.ctaLabel } : {}),
        };
      });
    }

    return result;
  }, [allFirestoreCategories]);

  /* Compute per-category min prices from Firestore services,
     falling back to the category's startingAt value when no per-service prices exist */
  const categoryPrices = useMemo(() => {
    const prices: Record<string, Record<string, number | null>> = {};
    for (const [tabKey, categories] of Object.entries(effectiveCategories) as [TabKey, CategoryConfig[]][]) {
      prices[tabKey] = {};
      const divKey = DIVISION_KEY_MAP[tabKey];
      const divServices = allServices.filter((s) => s.division === divKey);
      for (const cat of categories) {
        const validPrices = divServices
          .filter((s) => cat.firestoreCategories.includes(s.category) && s.price > 0)
          .map((s) => s.price);
        if (validPrices.length > 0) {
          prices[tabKey][cat.displayName] = Math.min(...validPrices);
        } else {
          // Fallback: use startingAt from the Firestore category
          const fsCat = allFirestoreCategories.find(
            (c) => c.division === divKey && cat.firestoreCategories.includes(c.name)
          );
          prices[tabKey][cat.displayName] = fsCat && fsCat.startingAt > 0 ? fsCat.startingAt : null;
        }
      }
    }
    return prices;
  }, [allServices, allFirestoreCategories, effectiveCategories]);

  const currentCategories = effectiveCategories[servicesTab] ?? DIVISION_CATEGORIES[servicesTab];
  const currentPrices = categoryPrices[servicesTab] ?? {};
  const currentLink = DIVISION_LINKS[servicesTab];

  const divisionIcons: Record<TabKey, typeof Wrench> = {
    automotive: Wrench,
    fleet: MapPin,
    marine: Shield,
    rv: Tag,
  };

  return (
    <>
      {/* ── Hero ── */}
      <section
        id="hero-section"
        className="relative overflow-clip -mt-14 pt-14 lg:-mt-16 lg:pt-16"
        style={{ backgroundColor: "#0B2040" }}
      >
        {/* Hero background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none select-none"
          style={{ backgroundImage: `url('${cld(images.heroHome, 'hero')}')` }}
        />
        {/* Navy gradient overlay (left → right fade) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(11,32,64,0.85) 0%, rgba(11,32,64,0.55) 50%, rgba(11,32,64,0.35) 100%)",
          }}
        />
        {/* Mobile-only contrast bump over busy background photo */}
        <div className="absolute inset-0 bg-black/15 lg:hidden pointer-events-none" />
        <div className="section-inner px-4 lg:px-12 relative z-10">

          {/* ══ MOBILE HERO ══ */}
          <div className="lg:hidden text-center px-4 pt-6 pb-7">
            <div className="flex flex-col items-center gap-[5px] mb-3">
              <p className="text-[10px] uppercase font-extrabold text-white tracking-[4px] [text-wrap:balance]">{heroCopy.eyebrowLine1}</p>
              <p className="text-[11px] uppercase font-semibold text-[#D9A441] tracking-[2px] opacity-90">{heroCopy.eyebrowLine2}</p>
            </div>
            <h1 className="text-[28px] font-extrabold leading-[1.06] text-white tracking-[-0.8px] mb-3">
              {headlineSentences.map((sentence, i) => (
                <span key={i} className="block [text-wrap:balance]">{sentence}</span>
              ))}
            </h1>
            <p className="text-[15px] leading-[1.55] text-white/[0.68] max-w-[320px] mx-auto mb-3 [text-wrap:balance]">{HERO_MOBILE_SUBHEADLINE}</p>
            <p className="text-[13px] leading-[1.4] font-bold text-[#E07B2D] mb-4">24-hour emergency service in the Apollo Beach area.</p>
            {/* CTAs stacked */}
            <div className="flex flex-col gap-[10px] max-w-[300px] mx-auto">
              <button onClick={openBooking} className="w-full min-h-[48px] bg-[#E07B2D] text-white px-7 py-3.5 rounded-[8px] font-semibold shadow-[0_2px_12px_rgba(224,123,45,0.35)]">Book Service</button>
              <a href="tel:8137225823" className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.18] text-white px-7 py-3.5 rounded-[8px] font-semibold">
                <Phone size={16} />
                Call 813-722-LUBE
              </a>
            </div>
            {/* Trust cards */}
            <div className="flex gap-2 mt-5">
              <div className="flex-1 flex flex-col items-center justify-center gap-[5px] p-[12px_6px_10px] rounded-[12px] bg-white/[0.04] border border-white/[0.1]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span className="text-white/60 text-[10.5px]">Factory-trained team</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-[5px] p-[12px_6px_10px] rounded-[12px] bg-white/[0.04] border border-white/[0.1]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                <span className="text-white/60 text-[10.5px]">Licensed and insured</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-[5px] p-[12px_6px_10px] rounded-[12px] bg-white/[0.04] border border-white/[0.1]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9A441" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span className="text-white/60 text-[10.5px]">24-hr emergency · Apollo Beach</span>
              </div>
            </div>
          </div>

          {/* ══ DESKTOP HERO ══ */}
          <div className="hidden lg:flex items-center gap-12 pt-10 pb-10">
            {/* Left column — copy */}
            <div className="flex-1 pt-4">
              <div className="flex flex-col items-start gap-[5px] mb-6 text-left">
                <p className="text-[13px] uppercase font-extrabold text-white tracking-[4px] [text-wrap:balance]">{heroCopy.eyebrowLine1}</p>
                <p className="text-[12px] uppercase font-semibold text-[#D9A441] tracking-[2.5px] opacity-90">{heroCopy.eyebrowLine2}</p>
              </div>
              <h1 className="text-[42px] font-extrabold leading-[1.04] text-white tracking-[-1px] mb-5 text-left">
                {headlineSentences.map((sentence, i) => (
                  <span key={i} className="block [text-wrap:balance]">{sentence}</span>
                ))}
              </h1>
              <p className="text-[19px] leading-[1.55] text-white/[0.68] max-w-[520px] mb-4 text-left [text-wrap:balance]">{heroCopy.subheadline}</p>
              <p className="text-[15px] leading-[1.4] font-bold text-[#E07B2D] mb-7 text-left">24-hour emergency service in the Apollo Beach area.</p>
              {/* CTA row */}
              <div className="flex justify-start gap-3 mb-7">
                <button onClick={openBooking} className="bg-[#E07B2D] text-white px-7 py-3.5 rounded-[8px] font-semibold shadow-[0_2px_12px_rgba(224,123,45,0.35)]">Book Service</button>
                <a href="tel:8137225823" className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.18] text-white px-7 py-3.5 rounded-[8px] font-semibold">
                  <Phone size={16} />
                  Call 813-722-LUBE
                </a>
              </div>
              {/* Trust capsule */}
              <div className="flex justify-start mt-7">
                <div className="inline-flex items-center rounded-full bg-white/[0.05] border border-white/[0.08] py-2 px-1.5">
                  <div className="flex items-center gap-[5px] px-[14px] py-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    <span className="text-white/55 text-[12.5px] font-semibold">Factory-trained team</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-[5px] px-[14px] py-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                    <span className="text-white/55 text-[12.5px] font-semibold">Licensed and insured</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-[5px] px-[14px] py-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9A441" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span className="text-white/55 text-[12.5px] font-semibold">24-hr emergency · Apollo Beach</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column — frosted glass quote form */}
            <div
              className="w-[420px] shrink-0 rounded-[16px] border border-white/[0.1] p-[30px_26px]"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(24px) saturate(1.6)",
                WebkitBackdropFilter: "blur(24px) saturate(1.6)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div className="text-center mb-5">
                <h3 className="text-white text-[18px] font-bold">Connect with us</h3>
                <p className="text-white/45 text-[13px] mt-1">Tell us what you need. We get back to you fast.</p>
              </div>
              {hqMsg ? (
                <p className={`text-center text-[15px] font-semibold py-6 ${hqMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>{hqMsg.text}</p>
              ) : (
                <form onSubmit={handleHeroQuote} className="flex flex-col gap-[10px]">
                  <div className="flex gap-2">
                    <input type="text" placeholder="First name" value={hqFirst} onChange={(e) => setHqFirst(e.target.value)} className="flex-1 min-w-0 bg-white/[0.08] border border-white/[0.15] rounded-[8px] text-white text-[14px] p-[10px_12px] placeholder-white/40 outline-none" />
                    <input type="text" placeholder="Last name" value={hqLast} onChange={(e) => setHqLast(e.target.value)} className="flex-1 min-w-0 bg-white/[0.08] border border-white/[0.15] rounded-[8px] text-white text-[14px] p-[10px_12px] placeholder-white/40 outline-none" />
                  </div>
                  <input type="tel" placeholder="Phone" value={hqPhone} onChange={(e) => setHqPhone(formatHeroPhone(e.target.value))} className="bg-white/[0.08] border border-white/[0.15] rounded-[8px] text-white text-[14px] p-[10px_12px] placeholder-white/40 outline-none" />
                  <input type="email" placeholder="Email" value={hqEmail} onChange={(e) => setHqEmail(e.target.value)} className="bg-white/[0.08] border border-white/[0.15] rounded-[8px] text-white text-[14px] p-[10px_12px] placeholder-white/40 outline-none" />
                  <input type="text" placeholder="City" value={hqCity} onChange={(e) => setHqCity(e.target.value)} className="bg-white/[0.08] border border-white/[0.15] rounded-[8px] text-white text-[14px] p-[10px_12px] placeholder-white/40 outline-none" />
                  <div className="relative">
                    <select value={hqService} onChange={(e) => setHqService(e.target.value)} className="w-full bg-white/[0.08] border border-white/[0.15] rounded-[8px] text-white text-[14px] p-[10px_12px] appearance-none pr-8 outline-none">
                      <option value="" className="text-black">Service needed</option>
                      {["Oil change", "Tires", "Brakes", "Marine service", "RV service", "Fleet service", "Other"].map((s) => (
                        <option key={s} value={s} className="text-black">{s}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                  <button type="submit" disabled={hqSubmitting} className="w-full bg-[#E07B2D] text-white rounded-[8px] py-[13px] font-semibold mt-1 disabled:opacity-50">
                    {hqSubmitting ? "Sending..." : "Send Quote Request"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 bg-[#F7F8FA] py-8 md:py-14">
        <div className="section-inner px-4 lg:px-6">
          <div className="text-center mb-6 md:mb-10">
            <p className="text-[11px] md:text-[12px] uppercase font-bold text-[#1A5FAC] tracking-[2.5px] mb-2">
              HOW IT WORKS
            </p>
            <h2 className="text-[22px] md:text-[30px] font-extrabold text-[#0B2040]">
              Three steps. That&apos;s the whole thing.
            </h2>
          </div>

          {(() => {
            const steps = [
              {
                num: "1",
                title: "Book in 60 seconds",
                desc: "Pick your service, enter your vehicle, choose a time. Or call and we book it for you.",
                iconPath: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></>,
              },
              {
                num: "2",
                title: "We come to your location",
                desc: "Our van shows up at your home, office, marina, storage lot, or job site. On time. Fully equipped. Ready to work.",
                iconPath: <><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
              },
              {
                num: "3",
                title: "You never left your day.",
                desc: "Most jobs done in under an hour. Digital invoice in your inbox. Your vehicle never moved. Neither did you.",
                iconPath: <><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></>,
              },
            ];
            return (
              <>
                {/* ── Desktop cards ── */}
                <div className="hidden lg:flex gap-5 max-w-[900px] mx-auto">
                  {steps.map((step) => (
                    <div key={step.num} className="flex-1 bg-white rounded-[16px] border border-[#E8E8E8] p-[32px_22px_28px] text-center">
                      <span className="block text-[#10B4B9] text-[20px] font-extrabold mb-3">{step.num}</span>
                      <div className="w-[52px] h-[52px] rounded-[14px] mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(to bottom right, #0F2847, #0B2040)" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          {step.iconPath}
                        </svg>
                      </div>
                      <h3 className="text-[#0B2040] text-[17px] font-bold mb-2">{step.title}</h3>
                      <p className="text-[#555555] text-[14px] leading-[1.55]">{step.desc}</p>
                    </div>
                  ))}
                </div>

                {/* ── Mobile steps (icon + numbered text) ── */}
                <div className="lg:hidden max-w-[500px] mx-auto flex flex-col gap-6">
                  {steps.map((step) => (
                    <div key={step.num} className="flex items-start gap-4">
                      <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-[#0A1628] to-[#1a3a5c] flex items-center justify-center shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          {step.iconPath}
                        </svg>
                      </div>
                      <div className="flex flex-col flex-1">
                        <p className="text-[16px] mb-1 leading-snug">
                          <span className="text-[#0891B2] font-bold mr-1.5">{step.num}.</span>
                          <span className="text-[#0A1628] font-bold">{step.title}</span>
                        </p>
                        <p className="text-gray-500 text-sm leading-[1.5] m-0">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ── The Coastal Difference ── */}
      <section className="py-16 md:py-20 bg-[#FFFDF8]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#E07B2D] uppercase mb-3">The Coastal Difference</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B2040] tracking-tight">Three things every other mobile mechanic doesn&apos;t have.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Vacuum extraction */}
            <div className="bg-white border border-[#E2DBCE] rounded-[12px] p-6">
              <p className="text-[11px] font-semibold tracking-widest text-[#E07B2D] uppercase mb-2">OIL SERVICE</p>
              <h3 className="text-[18px] font-bold text-[#0B2040] mb-3">Vacuum extraction. No mess.</h3>
              <p className="text-[14px] text-[#555] leading-[1.65]">We pull oil through the dipstick tube using the same vacuum extraction system high-end dealerships use. No drain plug, no crawling underneath, no drips on your driveway, your marina dock, or your fleet yard. Faster than conventional drain. Cleaner every time.</p>
            </div>
            {/* Card 2: Factory-trained team */}
            <div className="bg-white border border-[#E2DBCE] rounded-[12px] p-6">
              <p className="text-[11px] font-semibold tracking-widest text-[#E07B2D] uppercase mb-2">FACTORY-TRAINED</p>
              <h3 className="text-[18px] font-bold text-[#0B2040] mb-3">Every tech, trained by Jason.</h3>
              <p className="text-[14px] text-[#555] leading-[1.65]">Coastal isn&apos;t an app. It isn&apos;t a gig-worker network. It&apos;s a local team, hired and personally trained by Jason Binder to the same standards he set running dealership service departments for 30 years. Same vacuum extraction. Same parts. Same standards. Whichever van shows up.</p>
            </div>
            {/* Card 3: Multi-vertical */}
            <div className="bg-white border border-[#E2DBCE] rounded-[12px] p-6">
              <p className="text-[11px] font-semibold tracking-widest text-[#E07B2D] uppercase mb-2">ONE PROVIDER</p>
              <h3 className="text-[18px] font-bold text-[#0B2040] mb-3">Cars, boats, RVs, fleets. One call.</h3>
              <p className="text-[14px] text-[#555] leading-[1.65]">Most mobile mechanics handle one or two verticals. We cover all four. Your daily driver, your weekend boat, your RV, and your work fleet, all serviced by the same local team. One vendor. One invoice. One number to call.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="relative bg-[#F0EDE6]">
        <div className="section-inner px-4 lg:px-6 pt-8 pb-10 md:pt-14 md:pb-14">
          <div className="text-center mb-6 md:mb-10">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-2 md:mb-3">
              Services
            </p>
            <h2 className="text-[24px] md:text-[34px] font-extrabold text-[#0B2040] mb-2 md:mb-3">
              Everything we handle on-site
            </h2>
            <p className="hidden md:block text-[15px] text-[#555] mx-auto max-w-[480px]">
              Factory-grade work for cars, trucks, boats, RVs, and commercial fleets. Brought directly to your location by a local team trained on dealership standards.
            </p>
          </div>

          {/* Division pills — scrollable on mobile, centered on desktop */}
          <div className="flex md:justify-center gap-2 mb-6 md:mb-10 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible scrollbar-hide">
            {serviceTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setServicesTab(tab.key); setExpandedService(null); }}
                className={`text-[13px] md:text-[14px] font-semibold px-4 md:px-5 py-2 md:py-2.5 rounded-full transition-all whitespace-nowrap flex-shrink-0 ${
                  servicesTab === tab.key
                    ? "bg-[#0B2040] text-white shadow-[0_2px_12px_rgba(11,32,64,0.25)]"
                    : "bg-white md:bg-[#F0EDE6] text-[#666] hover:bg-[#E8E4DC] hover:text-[#444]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Mobile: category accordion ── */}
          <div className="lg:hidden flex flex-col gap-2">
            {currentCategories.map((cat) => {
              const key = `${servicesTab}-${cat.displayName}`;
              const isExpanded = expandedService === key;
              const price = currentPrices[cat.displayName];
              const Icon = divisionIcons[servicesTab];
              return (
                <div key={key} className="bg-white rounded-[12px] border border-[#f0ede6] overflow-hidden">
                  <button
                    onClick={() => setExpandedService(isExpanded ? null : key)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "#E07B2D10" }}>
                      <Icon size={16} className="text-[#E07B2D]" />
                    </div>
                    <span className="flex-1 text-[14px] font-semibold text-[#0B2040]">{cat.displayName}</span>
                    {price != null && (
                      <span className="text-[12px] font-bold text-[#E07B2D] mr-1">${price.toFixed(2)}</span>
                    )}
                    {isExpanded
                      ? <ChevronDown size={16} className="text-[#999] shrink-0" />
                      : <ChevronRight size={16} className="text-[#999] shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-0 border-t border-[#f0ede6]">
                      <p className="text-[13px] text-[#555] leading-[1.6] py-2">{cat.description}</p>
                      {price != null ? (
                        <p className="text-[12px] text-[#888] mb-2">
                          Starting at{" "}
                          <span className="font-bold text-[#0B2040]">${price.toFixed(2)}</span>
                        </p>
                      ) : !cat.ctaAction && (
                        <p className="text-[12px] text-[#888] mb-2">Call for pricing</p>
                      )}
                      <button
                        onClick={() => openBooking({
                          division: TAB_TO_DIVISION[servicesTab],
                          categoryId: cat.firestoreCategories[0],
                        })}
                        className="w-full text-[13px] font-semibold text-white py-2.5 rounded-[8px] bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors mt-1"
                      >
                        {cat.ctaLabel ?? "Book This Service"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <Link
              href={currentLink.href}
              className="inline-block mt-2 text-[14px] font-semibold text-[#E07B2D] hover:underline text-center"
            >
              View All Services &rarr;
            </Link>
          </div>

          {/* ── Desktop: category cards grid ── */}
          <div className="hidden lg:block">
            <div
              className={`grid gap-4 ${servicesTab === "fleet" ? "max-w-xl mx-auto" : ""}`}
              style={servicesTab !== "fleet" ? { gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" } : undefined}
            >
              {currentCategories.map((cat) => {
                const price = currentPrices[cat.displayName];
                return (
                  <div
                    key={cat.displayName}
                    className="bg-white rounded-[14px] shadow-[0_2px_20px_rgba(11,32,64,0.06)] border border-[#f0ede6] flex flex-col overflow-hidden"
                  >
                    {cat.image && (
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f0ede6]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cld(images[cat.image.key], 'card43')}
                          alt={cat.image.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-[18px] font-bold text-[#0B2040] mb-1">
                      {cat.displayName}
                    </h3>
                    {price != null ? (
                      <p className="text-[14px] font-semibold text-[#E07B2D] mb-2">
                        Starting at ${price.toFixed(2)}
                      </p>
                    ) : !cat.ctaAction ? (
                      <p className="text-[14px] font-semibold text-[#E07B2D] mb-2">
                        Call for pricing
                      </p>
                    ) : null}
                    <p className="text-[14px] text-[#555] leading-[1.6] mb-4 flex-1 line-clamp-2">
                      {cat.description}
                    </p>
                    <button
                      onClick={() => openBooking({
                        division: TAB_TO_DIVISION[servicesTab],
                        categoryId: cat.firestoreCategories[0],
                      })}
                      className="text-[13px] font-semibold text-[#E07B2D] border border-[#E07B2D] rounded-[8px] px-4 py-2 hover:bg-[#FFF9F4] hover:shadow-[0_2px_8px_rgba(224,123,45,0.12)] transition-all self-start"
                    >
                      {cat.ctaLabel ?? "Book This Service"}
                    </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* "View All" link below cards */}
            <div className="text-center mt-6">
              <Link
                href={currentLink.href}
                className="text-[14px] font-semibold text-[#E07B2D] hover:underline"
              >
                {currentLink.label} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who's Behind It — Founder Credentials ── */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-center">

            {/* Left column — text (second on mobile, first on desktop) */}
            <div className="order-2 md:order-1">
              <p className="text-[#E07B2D] text-sm uppercase tracking-widest font-semibold mb-4">
                Who&apos;s behind it
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0B2040] mb-6 leading-tight">
                Jason Binder. Thirty years. One standard.
              </h2>
              <p className="text-[#0B2040]/80 text-base md:text-lg leading-relaxed mb-8">
                Jason ran service departments at dealerships for three decades before starting Coastal. He hires every tech personally and trains them to the same standards he set inside the shop. The name on the truck is his.
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#0B2040]/70">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E07B2D]"></span>
                  Licensed and insured
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E07B2D]"></span>
                  ASE-certified team
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E07B2D]"></span>
                  Factory-trained on every major brand
                </span>
              </div>
            </div>

            {/* Right column — Jason headshot (first on mobile, second on desktop) */}
            <div className="order-1 md:order-2 flex flex-col items-center md:items-start md:pl-8">
              <div className="w-44 h-44 md:w-48 md:h-48 rounded-full overflow-hidden ring-4 ring-[#E07B2D]/20 shadow-lg mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/dgcdcqjrz/image/upload/f_auto,q_auto,w_400,h_400,c_fill,g_face/v1776880422/JBinderHS_aalfk5.png"
                  alt="Jason Binder, owner of Coastal Mobile Lube & Tire"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center md:text-left">
                <p className="text-[#0B2040] text-lg font-bold">Jason Binder</p>
                <p className="text-[#0B2040]/60 text-sm mt-1">Owner · Coastal Mobile</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Hull stripe separator ── */}
      <div className="h-[3px]" style={{ background: "linear-gradient(to right, #1A5FAC, #E07B2D, #D9A441, #1A5FAC)" }} />


      {/* ── Trust & Stats Band ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
        {/* Top edge accent */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(217,164,65,0.3), transparent)" }} />
        {/* Bottom edge accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(217,164,65,0.3), transparent)" }} />

        <div className="section-inner px-4 md:px-6 pt-14 md:pt-20 pb-7 md:pb-10 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 text-center">
            {[
              { Icon: Shield, stat: "30+", descriptor: "Years in dealership service. Licensed and insured." },
              { Icon: Clock, stat: "<1hr", descriptor: "Most services, start to finish." },
              { Icon: Clock, stat: "24/7", descriptor: "Emergency service in Apollo Beach." },
              { Icon: Tag, stat: "$0", descriptor: "Hidden fees. Flat pricing, always." },
            ].map(({ Icon, stat, descriptor }) => (
              <div key={stat} className="flex flex-col items-center">
                <Icon size={28} strokeWidth={1.5} className="text-[#E07B2D]/70 mb-4" />
                <p className="text-[44px] md:text-[56px] font-extrabold text-[#E07B2D] tracking-tight leading-none mb-2">{stat}</p>
                <p className="text-[13px] md:text-[15px] text-white/90 font-medium">{descriptor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── CTA — hidden on mobile and tablet, sticky bottom bar handles it ── */}
      <section className="hidden lg:block relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A1C38 0%, #0F2847 40%, #132E54 100%)" }}>

        {/* Badge watermark echo */}
        <BrandLogo
          variant="primary"
          alt=""
          width={200}
          height={80}
          className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[200px] h-auto pointer-events-none select-none opacity-[0.04]"
        />

        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(to right, transparent, #D9A441, transparent)" }} />

        <div className="section-inner px-4 lg:px-6 pt-7 md:pt-10 pb-14 md:pb-20 text-center relative z-10">
          <p className="text-[13px] uppercase font-bold text-[#D9A441] tracking-[1.5px] mb-3">
            Ready when you are
          </p>
          <h2 className="text-[32px] md:text-[42px] font-extrabold text-white mb-4" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            Skip the shop. Keep your day.
          </h2>
          <p className="text-[16px] text-white/65 mb-10 mx-auto max-w-[460px]">
            Most appointments available within the week. Booking takes under a minute.
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
