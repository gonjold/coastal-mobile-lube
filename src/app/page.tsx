"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Phone, Clock, MapPin, Wrench, Shield, Award, Tag, ChevronRight, ChevronDown } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import Button from "@/components/Button";
import { cloudinaryUrl, images } from "@/lib/cloudinary";
import { useServices } from "@/hooks/useServices";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

/* ── Homepage category configs per division ── */

interface CategoryConfig {
  displayName: string;
  description: string;
  firestoreCategories: string[]; // matched against service.category for min price
  ctaLabel?: string;
  ctaAction?: "fleet-quote";
}

const DIVISION_CATEGORIES: Record<TabKey, CategoryConfig[]> = {
  automotive: [
    { displayName: "Oil Changes", description: "Conventional, synthetic blend, full synthetic, and diesel oil changes. Factory-grade service at your location.", firestoreCategories: ["Oil Changes"] },
    { displayName: "Tires & Wheels", description: "Tire rotation, flat repair, mount and balance, TPMS service, and new tire installation.", firestoreCategories: ["Tire/Wheel"] },
    { displayName: "Brakes", description: "Front and rear brake pads, full brake jobs, and brake fluid flush.", firestoreCategories: ["Brakes"] },
    { displayName: "Basic Maintenance", description: "Wiper blades, air filters, cabin filters, batteries, coolant flush, belts, and more.", firestoreCategories: ["Basic Maintenance"] },
    { displayName: "A/C & Heating", description: "A/C diagnostic, EVAC and recharge, and heating system service.", firestoreCategories: ["HVAC"] },
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

const HERO_DEFAULTS = {
  eyebrowLine1: "Mobile Service",
  eyebrowLine2: "Oil, Brakes, Tires & More",
  headline: "We bring the shop.",
  subheadline: "Oil changes, tires, and brakes wherever you are. A master tech with 30 years of experience. Apollo Beach and the South Shore.",
};

function formatHeroPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function Home() {
  const { openBooking } = useBooking();
  const [servicesTab, setServicesTab] = useState<TabKey>("automotive");
  const [expandedService, setExpandedService] = useState<string | null>(null);

  /* ── Hero copy from Firestore ── */
  const [heroCopy, setHeroCopy] = useState(HERO_DEFAULTS);
  useEffect(() => {
    getDoc(doc(db, "siteConfig", "heroCopy"))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setHeroCopy({
            eyebrowLine1: d.eyebrowLine1 || HERO_DEFAULTS.eyebrowLine1,
            eyebrowLine2: d.eyebrowLine2 || HERO_DEFAULTS.eyebrowLine2,
            headline: d.headline || HERO_DEFAULTS.headline,
            subheadline: d.subheadline || HERO_DEFAULTS.subheadline,
          });
        }
      })
      .catch(() => {});
  }, []);

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

  const { services: allServices, categories: allFirestoreCategories } = useServices({ activeOnly: true });

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
        className="relative overflow-clip lg:bg-fixed lg:min-h-[calc(100vh+4rem)] -mt-14 pt-14 lg:-mt-16 lg:pt-16"
        style={{ background: "linear-gradient(135deg, #0F2847 0%, #0B2040 100%)" }}
      >
        {/* Logo watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ opacity: 0.06 }}>
          <div
            className="w-full h-full bg-no-repeat bg-center"
            style={{
              backgroundImage: `url('https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774315498/Coastal_Lube_logo_v1_zbx9qs.png')`,
              backgroundSize: "360px",
            }}
          />
        </div>

        <div className="section-inner px-4 lg:px-12 relative z-10">

          {/* ══ MOBILE HERO ══ */}
          <div className="lg:hidden text-center px-4 pt-6 pb-7">
            <div className="flex flex-col items-center gap-[5px] mb-3">
              <p className="text-[11px] uppercase font-extrabold text-white tracking-[4px]">{heroCopy.eyebrowLine1}</p>
              <p className="text-[11px] uppercase font-semibold text-[#D9A441] tracking-[2px] opacity-90">{heroCopy.eyebrowLine2}</p>
            </div>
            <h1 className="text-[34px] font-extrabold leading-[1.06] text-white tracking-[-0.8px] mb-3">{heroCopy.headline}</h1>
            <p className="text-[15px] leading-[1.55] text-white/[0.68] max-w-[320px] mx-auto mb-5">{heroCopy.subheadline}</p>
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
                <span className="text-[#10B4B9] text-[16px] font-extrabold">30+</span>
                <span className="text-white/60 text-[10.5px]">Years Experience</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-[5px] p-[12px_6px_10px] rounded-[12px] bg-white/[0.04] border border-white/[0.1]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                <span className="text-white/60 text-[10.5px]">Licensed &amp; Insured</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-[5px] p-[12px_6px_10px] rounded-[12px] bg-white/[0.04] border border-white/[0.1]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9A441" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="text-white/60 text-[10.5px]">Same-Day Available</span>
              </div>
            </div>
          </div>

          {/* ══ DESKTOP HERO ══ */}
          <div className="hidden lg:flex items-center gap-12 pt-10 pb-10">
            {/* Left column — copy */}
            <div className="flex-1 pt-4">
              <div className="flex flex-col items-start gap-[5px] mb-6 text-left">
                <p className="text-[13px] uppercase font-extrabold text-white tracking-[4px]">{heroCopy.eyebrowLine1}</p>
                <p className="text-[12px] uppercase font-semibold text-[#D9A441] tracking-[2.5px] opacity-90">{heroCopy.eyebrowLine2}</p>
              </div>
              <h1 className="text-[58px] font-extrabold leading-[1.04] text-white tracking-[-1px] mb-5 text-left">{heroCopy.headline}</h1>
              <p className="text-[19px] leading-[1.55] text-white/[0.68] max-w-[520px] mb-8 text-left">{heroCopy.subheadline}</p>
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
                    <span className="text-[#10B4B9] font-extrabold text-[13px]">30+</span>
                    <span className="text-white/55 text-[12.5px] font-semibold">yrs exp</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-[5px] px-[14px] py-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                    <span className="text-white/55 text-[12.5px] font-semibold">Licensed</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-[5px] px-[14px] py-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9A441" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span className="text-white/55 text-[12.5px] font-semibold">Same-day</span>
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

        {/* Desktop watermark bg-size override */}
        <style>{`
          @media (min-width: 1024px) {
            #hero-section > div:first-child > div { background-size: 600px !important; }
          }
        `}</style>
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 bg-[#F7F8FA] py-8 md:py-14">
        <div className="section-inner px-4 lg:px-6">
          <div className="text-center mb-6 md:mb-10">
            <p className="text-[11px] md:text-[12px] uppercase font-bold text-[#1A5FAC] tracking-[2.5px] mb-2">
              HOW IT WORKS
            </p>
            <h2 className="text-[22px] md:text-[30px] font-extrabold text-[#0B2040]">
              Three steps. Done.
            </h2>
          </div>

          {/* ── Desktop cards ── */}
          <div className="hidden lg:flex gap-5 max-w-[900px] mx-auto">
            {[
              {
                num: "1", title: "You book a time",
                desc: "Pick your service and a time that works. Takes about a minute.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>,
              },
              {
                num: "2", title: "We roll up ready",
                desc: "A fully equipped van arrives at your location. Your driveway, your office, the marina, the RV park.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
              },
              {
                num: "3", title: "You never left your day",
                desc: "We handle everything on-site. No waiting rooms, no second trips, no disruptions.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B4B9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>,
              },
            ].map((step) => (
              <div key={step.num} className="flex-1 bg-white rounded-[16px] border border-[#E8E8E8] p-[32px_22px_28px] text-center">
                <span className="block text-[#10B4B9] text-[20px] font-extrabold mb-3">{step.num}</span>
                <div className="w-[52px] h-[52px] rounded-[14px] mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(to bottom right, #0F2847, #0B2040)" }}>
                  {step.icon}
                </div>
                <h3 className="text-[#0B2040] text-[17px] font-bold mb-2">{step.title}</h3>
                <p className="text-[#555555] text-[14px] leading-[1.55]">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Mobile steps (icon + numbered text) ── */}
          <div className="lg:hidden max-w-[500px] mx-auto flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-[#0A1628] to-[#1a3a5c] flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>
              </div>
              <div className="flex flex-col flex-1">
                <p className="text-[16px] mb-1 leading-snug">
                  <span className="text-[#0891B2] font-bold mr-1.5">1.</span>
                  <span className="text-[#0A1628] font-bold">Book in 60 seconds</span>
                </p>
                <p className="text-gray-500 text-sm leading-[1.5] m-0">Pick your service, choose a time. Or just call us.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-[#0A1628] to-[#1a3a5c] flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <div className="flex flex-col flex-1">
                <p className="text-[16px] mb-1 leading-snug">
                  <span className="text-[#0891B2] font-bold mr-1.5">2.</span>
                  <span className="text-[#0A1628] font-bold">We show up</span>
                </p>
                <p className="text-gray-500 text-sm leading-[1.5] m-0">Our fully equipped van arrives at your location, on time, ready to work.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-[#0A1628] to-[#1a3a5c] flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
              </div>
              <div className="flex flex-col flex-1">
                <p className="text-[16px] mb-1 leading-snug">
                  <span className="text-[#0891B2] font-bold mr-1.5">3.</span>
                  <span className="text-[#0A1628] font-bold">Done. Go.</span>
                </p>
                <p className="text-gray-500 text-sm leading-[1.5] m-0">No waiting rooms. No ride to the shop. You never left your day.</p>
              </div>
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
              What we handle on-site
            </h2>
            <p className="hidden md:block text-[15px] text-[#555] mx-auto max-w-[480px]">
              Everything your vehicle, fleet, boat, or RV needs. Brought directly to
              your location by a factory-trained technician.
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
                    className="bg-white rounded-[14px] p-5 shadow-[0_2px_20px_rgba(11,32,64,0.06)] border border-[#f0ede6] flex flex-col"
                  >
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

      {/* ── Hull stripe separator ── */}
      <div className="h-[3px]" style={{ background: "linear-gradient(to right, #1A5FAC, #E07B2D, #D9A441, #1A5FAC)" }} />


      {/* ── Stats Bar ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
        {/* Top edge accent */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(217,164,65,0.3), transparent)" }} />
        {/* Bottom edge accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(217,164,65,0.3), transparent)" }} />

        <div className="section-inner px-4 md:px-6 py-8 md:py-14 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            {[
              { value: "30+", label: "Years in fixed ops" },
              { value: "<1hr", label: "Most services completed" },
              { value: "100%", label: "Mobile. Always." },
              { value: "$0", label: "Surprise fees. Ever." },
            ].map((stat, i) => (
              <div key={stat.label} className={`relative ${i < 3 ? "md:after:content-[''] md:after:absolute md:after:right-0 md:after:top-1/2 md:after:-translate-y-1/2 md:after:h-[40px] md:after:w-px md:after:bg-white/10" : ""}`}>
                <p className="text-[28px] md:text-[42px] font-extrabold text-[#E07B2D] mb-0.5 md:mb-1 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[11px] md:text-[13px] text-white/50 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Reviews ── */}
      <section className="overflow-hidden bg-[#F4EEE3]">
        <div className="section-inner px-4 lg:px-6 pt-8 md:pt-14 pb-2 md:pb-4">
          <div className="text-center mb-6 md:mb-10">
            <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[1.5px] mb-2 md:mb-3">
              Reviews
            </p>
            <h2 className="text-[24px] md:text-[34px] font-extrabold text-[#0F2847]">
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
            className="flex gap-3 md:gap-5 w-max"
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
                  className="w-[280px] md:w-[350px] flex-shrink-0 bg-white rounded-[14px] p-4 md:p-6 flex flex-col shadow-[0_2px_16px_rgba(139,115,85,0.08)] border border-[#EDE8DF]"
                >
                  <div className="text-[#D9A441] text-[14px] md:text-[16px] mb-2 md:mb-3 tracking-wide">
                    {"★★★★★"}
                  </div>
                  <p className="text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.7] text-[#2C2C2C] flex-1 mb-3 md:mb-4">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-[#F0EDE6]">
                    <span className="text-[12px] md:text-[13px] font-bold text-[#0F2847]">
                      {review.name} <span className="font-normal text-[#999]">- {review.city}</span>
                    </span>
                    <span className="text-[10px] md:text-[11px] text-[#aaa] font-medium">Google Review</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section-inner px-4 lg:px-6 pb-8 md:pb-14">
          <div className="text-center mt-6 md:mt-8">
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
        <div className="section-inner px-4 lg:px-6 py-6 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
            {[
              { icon: Shield, text: "Fully Licensed & Insured", color: "#1A5FAC" },
              { icon: Wrench, text: "ASE-Certified Technicians", color: "#0D8A8F" },
              { icon: Award, text: "12-Month Service Warranty", color: "#D9A441" },
              { icon: Tag, text: "Transparent Pricing, No Surprises", color: "#E07B2D" },
            ].map((item, i) => (
              <div
                key={item.text}
                className={`flex flex-col items-center gap-2 md:gap-3 text-center justify-center ${
                  i < 3 ? "md:border-r md:border-[#eee]" : ""
                } md:px-6`}
              >
                <div
                  className="w-[40px] h-[40px] md:w-[52px] md:h-[52px] rounded-[10px] md:rounded-[14px] flex items-center justify-center"
                  style={{ background: `${item.color}10` }}
                >
                  <item.icon size={20} className="shrink-0 md:hidden" style={{ color: item.color }} strokeWidth={1.5} />
                  <item.icon size={26} className="shrink-0 hidden md:block" style={{ color: item.color }} strokeWidth={1.5} />
                </div>
                <span className="text-[12px] md:text-[13px] font-semibold text-[#0F2847]">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── CTA — hidden on mobile and tablet, sticky bottom bar handles it ── */}
      <section className="hidden lg:block relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A1C38 0%, #0F2847 40%, #132E54 100%)" }}>

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
