"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useServices, type Service } from "@/hooks/useServices";
import { groupByCategory } from "@/lib/serviceHelpers";

/* ─── Types ───────────────────────────────────────────────── */

type Division = "Automotive" | "Marine" | "RV & Trailer" | "Fleet";
type DivisionKey = "auto" | "marine" | "rv" | "fleet";

interface SubService {
  id: string;
  name: string;
  price: number | null;
  category: string;
}

interface CategoryGroup {
  category: string;
  services: SubService[];
  hasSubServices: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Constants ───────────────────────────────────────────── */

const DIVISIONS: Division[] = ["Automotive", "Marine", "RV & Trailer", "Fleet"];

const DIVISION_KEY_MAP: Record<Division, DivisionKey> = {
  Automotive: "auto",
  Marine: "marine",
  "RV & Trailer": "rv",
  Fleet: "fleet",
};

const YEARS = Array.from({ length: 40 }, (_, i) => 2027 - i);

const TIME_SLOTS = [
  { value: "morning", label: "Morning (7-10am)" },
  { value: "midday", label: "Midday (10am-1pm)" },
  { value: "afternoon", label: "Afternoon (1-4pm)" },
  { value: "late", label: "Late (4-6pm)" },
];

/* ─── Fallback service data ───────────────────────────────── */

const FALLBACK: Record<DivisionKey, { category: string; services: { name: string; price: number | null }[] }[]> = {
  auto: [
    { category: "Oil Change", services: [{ name: "Synthetic Blend", price: 79.95 }, { name: "Full Synthetic", price: 99.95 }, { name: "High Mileage Synthetic", price: 109.95 }, { name: "Diesel Oil Change", price: 129.95 }] },
    { category: "Tires", services: [{ name: "Mount and Balance Single", price: 35 }, { name: "Mount and Balance 4 Tires", price: 120 }, { name: "Tire Rotation", price: 29.95 }, { name: "Flat Repair", price: 25 }] },
    { category: "Brakes", services: [{ name: "Front Brake Job", price: 249.95 }, { name: "Rear Brake Job", price: 249.95 }, { name: "Front and Rear Brake Job", price: 449.95 }] },
    { category: "Maintenance", services: [{ name: "Coolant Flush", price: 129.95 }, { name: "Transmission Flush", price: 179.95 }, { name: "Power Steering Flush", price: 99.95 }] },
    { category: "A/C & Heating", services: [{ name: "EVAC and Recharge", price: 179.95 }, { name: "Cabin Air Filter", price: 39.95 }] },
    { category: "Electrical", services: [{ name: "Battery Replacement", price: 149.95 }, { name: "Battery Service", price: 39.95 }] },
    { category: "Something Else", services: [] },
  ],
  marine: [
    { category: "Oil Change", services: [{ name: "Inboard Oil Change", price: 149.95 }, { name: "Outboard Oil Change", price: 99.95 }, { name: "Stern Drive Oil Change", price: 129.95 }] },
    { category: "Engine Service", services: [{ name: "Impeller Replacement", price: 199.95 }, { name: "Fuel Filter", price: 79.95 }] },
    { category: "Winterization", services: [{ name: "Winterization", price: 249.95 }, { name: "De-Winterization", price: 199.95 }] },
    { category: "Something Else", services: [] },
  ],
  rv: [
    { category: "Oil Change", services: [{ name: "RV Oil Change", price: 129.95 }, { name: "Generator Oil Change", price: 89.95 }] },
    { category: "Tires", services: [{ name: "Mount and Balance", price: 45 }, { name: "Tire Rotation", price: 39.95 }] },
    { category: "Maintenance", services: [{ name: "Generator Service", price: 149.95 }, { name: "Generator Tune-Up", price: 99.95 }] },
    { category: "Something Else", services: [] },
  ],
  fleet: [
    { category: "Oil Change", services: [{ name: "Fleet Synthetic Blend", price: null }, { name: "Fleet Full Synthetic", price: null }] },
    { category: "Tires", services: [{ name: "Mount and Balance", price: null }, { name: "Tire Rotation", price: null }] },
    { category: "Brakes", services: [{ name: "Front Brake Job", price: null }, { name: "Rear Brake Job", price: null }] },
    { category: "Maintenance", services: [{ name: "Fluid Flush", price: null }, { name: "Filter Service", price: null }] },
    { category: "Something Else", services: [] },
  ],
};

/* ─── SVG Icons ───────────────────────────────────────────── */

function IconOilChange() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3c-1.5 4-5 6-5 10a5 5 0 0010 0c0-4-3.5-6-5-10z" />
      <path d="M11 16a2 2 0 004 0" />
    </svg>
  );
}

function IconTires() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="13" r="9" />
      <circle cx="13" cy="13" r="3" />
      <line x1="13" y1="4" x2="13" y2="10" />
      <line x1="13" y1="16" x2="13" y2="22" />
      <line x1="4" y1="13" x2="10" y2="13" />
      <line x1="16" y1="13" x2="22" y2="13" />
    </svg>
  );
}

function IconBrakes() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="13" r="9" />
      <circle cx="13" cy="13" r="5" />
      <circle cx="13" cy="13" r="2" />
    </svg>
  );
}

function IconMaintenance() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 3.5l2.5 2.5-8.5 8.5-4-4L15 2z" />
      <path d="M6.5 10.5L3 22l11.5-3.5" />
      <path d="M14.5 18.5l4-4" />
    </svg>
  );
}

function IconSnowflake() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="13" y1="3" x2="13" y2="23" />
      <line x1="4" y1="8" x2="22" y2="18" />
      <line x1="4" y1="18" x2="22" y2="8" />
      <line x1="10" y1="4.5" x2="13" y2="7" />
      <line x1="16" y1="4.5" x2="13" y2="7" />
      <line x1="10" y1="21.5" x2="13" y2="19" />
      <line x1="16" y1="21.5" x2="13" y2="19" />
    </svg>
  );
}

function IconLightning() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 9 14 13 14 11 23 17 12 13 12 15 3" />
    </svg>
  );
}

function IconClipboardPlus() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="5" width="14" height="18" rx="2" />
      <path d="M10 3h6v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V3z" />
      <line x1="13" y1="12" x2="13" y2="18" />
      <line x1="10" y1="15" x2="16" y2="15" />
    </svg>
  );
}

function getCategoryIcon(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes("oil")) return <IconOilChange />;
  if (lower.includes("tire") || lower.includes("wheel")) return <IconTires />;
  if (lower.includes("brake")) return <IconBrakes />;
  if (lower.includes("maintenance") || lower.includes("engine") || lower.includes("generator")) return <IconMaintenance />;
  if (lower.includes("a/c") || lower.includes("heating") || lower.includes("hvac") || lower.includes("winter")) return <IconSnowflake />;
  if (lower.includes("electric") || lower.includes("battery")) return <IconLightning />;
  if (lower.includes("else") || lower.includes("other") || lower.includes("roof")) return <IconClipboardPlus />;
  return <IconMaintenance />;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function BookingWizardModal({ isOpen, onClose }: Props) {
  /* ── Wizard state ── */
  const [step, setStep] = useState(1);
  const [division, setDivision] = useState<Division>("Automotive");

  /* ── Step 1: Services ── */
  const [selectedServices, setSelectedServices] = useState<SubService[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Step 2: Vehicle ── */
  const [vinOrHull, setVinOrHull] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinDecoded, setVinDecoded] = useState(false);
  const vinAbortRef = useRef<AbortController | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  /* ── Step 3: Details ── */
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");

  /* ── Submit ── */
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* ── Firestore services ── */
  const divKey = DIVISION_KEY_MAP[division];
  const { services: allServices, loading: servicesLoading } = useServices({ activeOnly: true });

  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Build category groups ── */
  const categoryGroups: CategoryGroup[] = (() => {
    const divServices = allServices.filter((s) => s.division === divKey);
    if (divServices.length > 0) {
      const grouped = groupByCategory(divServices);
      const groups: CategoryGroup[] = grouped
        .filter((g) => !/labor\s*rate/i.test(g.category))
        .map((g) => ({
          category: g.category,
          services: g.services.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            category: g.category,
          })),
          hasSubServices: g.services.length > 0,
        }));
      const hasOther = groups.some((g) => /else|other/i.test(g.category));
      if (!hasOther) {
        groups.push({ category: "Something Else", services: [], hasSubServices: false });
      }
      return groups;
    }
    // Fallback
    const fb = FALLBACK[divKey] || [];
    return fb.map((g) => ({
      category: g.category,
      services: g.services.map((s, i) => ({
        id: `${g.category}-${i}`,
        name: s.name,
        price: s.price,
        category: g.category,
      })),
      hasSubServices: g.services.length > 0,
    }));
  })();

  /* ── All services flat (for search) ── */
  const allFlat = categoryGroups.flatMap((g) => g.services);

  /* ── Computed ── */
  const selectedTotal = selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const hasNullPriced = selectedServices.some((s) => s.price == null) || (otherSelected && otherText.trim().length > 0);
  const isMarine = division === "Marine";

  /* ── Reset on division change ── */
  function handleDivisionChange(d: Division) {
    setDivision(d);
    setSelectedServices([]);
    setExpandedCategory(null);
    setOtherSelected(false);
    setOtherText("");
    setVinOrHull("");
    setVehicleYear("");
    setVehicleMake("");
    setVehicleModel("");
    setVinDecoded(false);
  }

  /* ── Service toggle ── */
  function toggleService(svc: SubService) {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === svc.id);
      if (exists) return prev.filter((s) => s.id !== svc.id);
      return [...prev, svc];
    });
  }

  function isServiceSelected(id: string) {
    return selectedServices.some((s) => s.id === id);
  }

  function countForCategory(category: string) {
    return selectedServices.filter((s) => s.category === category).length;
  }

  /* ── Category card click ── */
  function handleCategoryClick(group: CategoryGroup) {
    const isOther = /else|other/i.test(group.category);
    if (isOther) {
      setOtherSelected((prev) => !prev);
      setExpandedCategory(null);
      return;
    }
    if (!group.hasSubServices) {
      // Toggle the whole category as a selection
      const catSvc: SubService = { id: `cat-${group.category}`, name: group.category, price: null, category: group.category };
      const exists = selectedServices.find((s) => s.id === catSvc.id);
      if (exists) {
        setSelectedServices((prev) => prev.filter((s) => s.id !== catSvc.id));
      } else {
        setSelectedServices((prev) => [...prev, catSvc]);
      }
      return;
    }
    setExpandedCategory(expandedCategory === group.category ? null : group.category);
  }

  /* ── Starting price for category ── */
  function getStartingPrice(group: CategoryGroup): string | null {
    const prices = group.services.filter((s) => s.price != null).map((s) => s.price as number);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    return min % 1 === 0 ? `$${min}` : `$${min.toFixed(2)}`;
  }

  /* ── VIN auto-decode ── */
  useEffect(() => {
    vinAbortRef.current?.abort();
    setVinDecoded(false);
    const cleaned = vinOrHull.replace(/\s/g, "");
    if (isMarine || cleaned.length !== 17) {
      setVinDecoding(false);
      return;
    }
    const ac = new AbortController();
    vinAbortRef.current = ac;
    setVinDecoding(true);
    fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${cleaned}?format=json`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data: { Results?: { VariableId: number; Value: string | null }[] }) => {
        if (ac.signal.aborted) return;
        const results = data.Results ?? [];
        const get = (id: number) => results.find((r) => r.VariableId === id)?.Value?.trim() || "";
        const y = get(29);
        const m = get(26);
        const mo = get(28);
        if (y) setVehicleYear(y);
        if (m) setVehicleMake(m);
        if (mo) setVehicleModel(mo);
        if (y || m || mo) setVinDecoded(true);
      })
      .catch(() => {})
      .finally(() => { if (!ac.signal.aborted) setVinDecoding(false); });
    return () => ac.abort();
  }, [vinOrHull, isMarine]);

  /* ── VIN barcode scanner ── */
  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      }
    } catch {}
    scannerRef.current = null;
  }, []);

  const closeScanner = useCallback(() => {
    stopScanner();
    setScannerOpen(false);
    setScannerError("");
  }, [stopScanner]);

  useEffect(() => {
    if (!scannerOpen) return;
    const divId = "wizard-vin-scanner";
    const el = document.getElementById(divId);
    if (!el) return;

    const scanner = new Html5Qrcode(divId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 280, height: 100 } },
      (decoded) => {
        const cleaned = decoded.replace(/\s/g, "").toUpperCase();
        setVinOrHull(cleaned);
        closeScanner();
      },
      () => {},
    ).catch(() => {
      setScannerError("Camera not available");
      setTimeout(() => closeScanner(), 1500);
    });

    return () => { stopScanner(); };
  }, [scannerOpen, closeScanner, stopScanner]);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  /* ── Can advance? ── */
  function canNext(): boolean {
    if (step === 1) return selectedServices.length > 0 || (otherSelected && otherText.trim().length > 0);
    if (step === 2) return true; // Vehicle info is optional
    if (step === 3) return customerName.trim().length > 0 && customerPhone.trim().length > 0;
    return true;
  }

  /* ── Submit ── */
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      await addDoc(collection(db, "bookings"), {
        division: divKey,
        selectedServices: selectedServices.map((s) => ({ id: s.id, name: s.name, price: s.price, category: s.category })),
        otherDescription: otherSelected ? otherText.trim() : "",
        vinOrHull: vinOrHull.trim(),
        vehicleYear: vehicleYear.trim(),
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\D/g, ""),
        customerEmail: customerEmail.trim().toLowerCase(),
        preferredDate,
        preferredTime,
        notes: notes.trim(),
        source: "booking-wizard-v4",
        status: "new",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        resetAll();
      }, 3000);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setStep(1);
    setDivision("Automotive");
    setSelectedServices([]);
    setExpandedCategory(null);
    setOtherSelected(false);
    setOtherText("");
    setVinOrHull("");
    setVehicleYear("");
    setVehicleMake("");
    setVehicleModel("");
    setVinDecoded(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setPreferredDate("");
    setPreferredTime("");
    setNotes("");
    setSubmitting(false);
    setSubmitted(false);
    setSubmitError("");
    setSearchOpen(false);
    setSearchQuery("");
    setScannerOpen(false);
  }

  /* ── Scroll to top on step change ── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  /* ── Render guard ── */
  if (!isOpen) return null;

  /* ── Step labels ── */
  const steps = ["Services", "Vehicle", "Details", "Review"];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(11,36,71,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="wizard-modal-card"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 640,
          maxHeight: "94vh",
          borderRadius: 20,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(11,36,71,0.3)",
        }}
      >
        {/* ── Header ── */}
        <div style={{ background: "#0B2447", padding: "18px 24px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ color: "#fff", fontSize: 19, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                Book Your Service
              </h2>
              <p style={{ color: "#94A3B8", fontSize: 11, margin: "4px 0 0", lineHeight: 1.4 }}>
                We come to you. You never leave your day.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: "none",
                background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "14px 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", maxWidth: 380, margin: "0 auto" }}>
            {steps.map((label, i) => {
              const stepNum = i + 1;
              const isCompleted = step > stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 40 }}>
                    <div
                      style={{
                        width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                        background: isCompleted ? "#22c55e" : isCurrent ? "#0B2447" : "#E2E8F0",
                        color: isCompleted || isCurrent ? "#fff" : "#94A3B8",
                      }}
                    >
                      {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="11 4 5.5 10 3 7.5" />
                        </svg>
                      ) : stepNum}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: isCurrent ? "#0B2447" : "#94A3B8", marginTop: 3 }}>{label}</span>
                  </div>
                  {i < 3 && (
                    <div style={{ flex: 1, height: 2, background: isCompleted ? "#22c55e" : "#E2E8F0", margin: "0 4px", marginBottom: 16 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* ═══ STEP 1: Services ═══ */}
          {step === 1 && (
            <div>
              {/* Division Pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {DIVISIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDivisionChange(d)}
                    style={{
                      padding: "7px 18px", borderRadius: 9999, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 600,
                      background: division === d ? "#0B2447" : "#F1F5F9",
                      color: division === d ? "#fff" : "#64748B",
                      transition: "all 0.15s",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Category Cards Grid */}
              {servicesLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 32, height: 32, border: "3px solid #E2E8F0", borderTopColor: "#0B2447", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="wizard-card-grid">
                    {categoryGroups.map((group) => {
                      const isOther = /else|other/i.test(group.category);
                      const isExpanded = expandedCategory === group.category;
                      const count = countForCategory(group.category);
                      const startPrice = getStartingPrice(group);
                      const hasSelections = count > 0 || (isOther && otherSelected);
                      const isNoSubToggled = !group.hasSubServices && !isOther && selectedServices.some((s) => s.id === `cat-${group.category}`);

                      return (
                        <button
                          key={group.category}
                          type="button"
                          onClick={() => handleCategoryClick(group)}
                          style={{
                            position: "relative",
                            background: "#fff",
                            border: `2px solid ${isExpanded ? "#0B2447" : hasSelections ? "#22c55e" : "#E2E8F0"}`,
                            borderRadius: 12,
                            padding: "14px 8px 10px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                            textAlign: "center",
                            transition: "all 0.15s",
                          }}
                        >
                          {/* Badge */}
                          {count > 0 && (
                            <span style={{
                              position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                              background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 700,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {count}
                            </span>
                          )}
                          {/* Checkmark for direct-toggle cards */}
                          {(isNoSubToggled || (isOther && otherSelected)) && (
                            <span style={{
                              position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                              background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 700,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 3 5 9 3 7" />
                              </svg>
                            </span>
                          )}
                          <span style={{ color: isExpanded ? "#0B2447" : hasSelections ? "#22c55e" : "#64748B" }}>
                            {getCategoryIcon(group.category)}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#0B2447", lineHeight: 1.2 }}>{group.category}</span>
                          {startPrice && (
                            <span style={{ fontSize: 11, color: "#F97316", fontWeight: 600 }}>From {startPrice}</span>
                          )}
                          {/* Arrow indicator */}
                          {isExpanded && (
                            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)" }}>
                              <svg width="16" height="8" viewBox="0 0 16 8"><polygon points="0,0 16,0 8,8" fill="#0B2447" /></svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Detail Panel */}
                  {expandedCategory && (() => {
                    const group = categoryGroups.find((g) => g.category === expandedCategory);
                    if (!group || !group.hasSubServices) return null;
                    return (
                      <div
                        style={{
                          marginTop: 16, background: "#FAFBFF", border: "2px solid #0B2447", borderRadius: 12,
                          padding: 16, animation: "fadeIn 0.2s ease-out",
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0B2447", marginBottom: 2 }}>{group.category}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>Select the services you need</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {group.services.map((svc) => {
                            const checked = isServiceSelected(svc.id);
                            return (
                              <label
                                key={svc.id}
                                style={{
                                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
                                  background: checked ? "#EEF2FF" : "transparent", cursor: "pointer", transition: "background 0.15s",
                                }}
                              >
                                <span
                                  style={{
                                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                    border: checked ? "none" : "2px solid #CBD5E1",
                                    background: checked ? "#0B2447" : "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                  onClick={(e) => { e.preventDefault(); toggleService(svc); }}
                                >
                                  {checked && (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="9 3 5 9 3 7" />
                                    </svg>
                                  )}
                                </span>
                                <span style={{ flex: 1, fontSize: 14, color: "#0B2447" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>{svc.name}</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#0B2447", whiteSpace: "nowrap" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>
                                  {svc.price != null ? (svc.price % 1 === 0 ? `$${svc.price}` : `$${svc.price.toFixed(2)}`) : "Quote"}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* "Something Else" text input */}
                  {otherSelected && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#0B2447", display: "block", marginBottom: 6 }}>
                        What do you need?
                      </label>
                      <textarea
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        placeholder="Describe the service you're looking for..."
                        rows={3}
                        style={{
                          width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 10,
                          fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit",
                        }}
                      />
                    </div>
                  )}

                  {/* Browse all services link */}
                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer", color: "#F97316",
                        fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="6" cy="6" r="4.5" /><line x1="9.2" y1="9.2" x2="12.5" y2="12.5" />
                      </svg>
                      Browse all {division} services
                    </button>
                  </div>

                  {/* Selection Summary */}
                  {(selectedServices.length > 0 || (otherSelected && otherText.trim())) && (
                    <div style={{
                      marginTop: 16, background: "#F0F4FF", border: "1px solid #D4DEFF", borderRadius: 10,
                      padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0B2447" }}>
                        {selectedServices.length + (otherSelected && otherText.trim() ? 1 : 0)} service(s) selected
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#F97316" }}>
                        {selectedTotal > 0 ? `$${selectedTotal.toFixed(2)}${hasNullPriced ? "+" : ""}` : "Quote"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ STEP 2: Vehicle ═══ */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0B2447", margin: "0 0 16px" }}>
                {isMarine ? "Vessel Information" : "Vehicle Information"}
              </h3>

              {isMarine ? (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
                    Hull Identification Number (HIN)
                  </label>
                  <input
                    type="text"
                    value={vinOrHull}
                    onChange={(e) => setVinOrHull(e.target.value.toUpperCase())}
                    placeholder="Enter HIN"
                    style={{
                      width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                    }}
                  />
                </div>
              ) : (
                <>
                  {/* VIN input + scan */}
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>VIN</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={vinOrHull}
                      onChange={(e) => setVinOrHull(e.target.value.toUpperCase().slice(0, 17))}
                      placeholder="Enter 17-character VIN"
                      maxLength={17}
                      style={{
                        flex: 1, padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                        fontSize: 14, outline: "none", fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      style={{
                        padding: "10px 16px", background: "#0B2447", color: "#fff", border: "none", borderRadius: 10,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, flexShrink: 0,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="1" y="1" width="4" height="4" /><rect x="11" y="1" width="4" height="4" />
                        <rect x="1" y="11" width="4" height="4" /><line x1="8" y1="1" x2="8" y2="6" />
                        <line x1="11" y1="8" x2="15" y2="8" /><line x1="8" y1="11" x2="8" y2="15" /><line x1="1" y1="8" x2="6" y2="8" />
                      </svg>
                      Scan
                    </button>
                  </div>

                  {/* Scanner */}
                  {scannerOpen && (
                    <div style={{ marginBottom: 12, background: "#000", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                      <div id="wizard-vin-scanner" style={{ width: "100%", minHeight: 200 }} />
                      {scannerError && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>
                          {scannerError}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={closeScanner}
                        style={{
                          position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%",
                          background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                          <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Decoding state */}
                  {vinDecoding && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748B", marginBottom: 12 }}>
                      <div style={{ width: 16, height: 16, border: "2px solid #E2E8F0", borderTopColor: "#0B2447", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Decoding VIN...
                    </div>
                  )}
                  {vinDecoded && !vinDecoding && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#22c55e", fontWeight: 600, marginBottom: 12 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="11 4 5.5 10 3 7.5" />
                      </svg>
                      VIN decoded successfully
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                    <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>or enter manually</span>
                    <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                  </div>

                  {/* Year / Make / Model */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Year</label>
                      <select
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value)}
                        style={{
                          width: "100%", padding: "12px 10px", border: "1px solid #E2E8F0", borderRadius: 10,
                          fontSize: 14, outline: "none", background: "#fff", fontFamily: "inherit",
                        }}
                      >
                        <option value="">Year</option>
                        {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Make</label>
                      <input
                        type="text"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        placeholder="Make"
                        style={{
                          width: "100%", padding: "12px 10px", border: "1px solid #E2E8F0", borderRadius: 10,
                          fontSize: 14, outline: "none", fontFamily: "inherit",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Model</label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Model"
                        style={{
                          width: "100%", padding: "12px 10px", border: "1px solid #E2E8F0", borderRadius: 10,
                          fontSize: 14, outline: "none", fontFamily: "inherit",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ STEP 3: Your Details ═══ */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0B2447", margin: "0 0 16px" }}>Your Details</h3>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your full name"
                  style={{
                    width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                    fontSize: 14, outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Phone *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(555) 555-5555"
                    style={{
                      width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Preferred Date</label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    style={{
                      width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Preferred Time</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    style={{
                      width: "100%", padding: "12px 10px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", fontFamily: "inherit",
                    }}
                  >
                    <option value="">Select time</option>
                    {TIME_SLOTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Anything else we should know?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, location details, etc."
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                    fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Review ═══ */}
          {step === 4 && !submitted && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0B2447", margin: "0 0 16px" }}>Review Your Booking</h3>

              {/* Services card */}
              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0B2447" }}>Services</span>
                  <button type="button" onClick={() => setStep(1)} style={{ fontSize: 12, fontWeight: 600, color: "#F97316", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                </div>
                {selectedServices.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: 13, color: "#334155" }}>{s.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0B2447" }}>
                      {s.price != null ? (s.price % 1 === 0 ? `$${s.price}` : `$${s.price.toFixed(2)}`) : "Quote"}
                    </span>
                  </div>
                ))}
                {otherSelected && otherText.trim() && (
                  <div style={{ padding: "4px 0", fontSize: 13, color: "#334155" }}>Other: {otherText}</div>
                )}
              </div>

              {/* Vehicle card */}
              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0B2447" }}>{isMarine ? "Vessel" : "Vehicle"}</span>
                  <button type="button" onClick={() => setStep(2)} style={{ fontSize: 12, fontWeight: 600, color: "#F97316", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                </div>
                {(vehicleYear || vehicleMake || vehicleModel) && (
                  <div style={{ fontSize: 13, color: "#334155", marginBottom: 4 }}>
                    {[vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ")}
                  </div>
                )}
                {vinOrHull && (
                  <div style={{ fontSize: 13, color: "#64748B" }}>{isMarine ? "HIN" : "VIN"}: {vinOrHull}</div>
                )}
                {!vehicleYear && !vehicleMake && !vehicleModel && !vinOrHull && (
                  <div style={{ fontSize: 13, color: "#94A3B8" }}>Not provided</div>
                )}
              </div>

              {/* Contact & Schedule card */}
              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0B2447" }}>Contact & Schedule</span>
                  <button type="button" onClick={() => setStep(3)} style={{ fontSize: 12, fontWeight: 600, color: "#F97316", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                </div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.8 }}>
                  <div>{customerName}</div>
                  <div>{customerPhone}</div>
                  {customerEmail && <div>{customerEmail}</div>}
                  {preferredDate && <div>Date: {preferredDate}</div>}
                  {preferredTime && <div>Time: {TIME_SLOTS.find((t) => t.value === preferredTime)?.label}</div>}
                  {notes && <div style={{ marginTop: 6, color: "#64748B" }}>Notes: {notes}</div>}
                </div>
              </div>

              {/* Estimated Total */}
              <div style={{ background: "#F0F4FF", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0B2447" }}>Estimated Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#F97316" }}>
                  {selectedTotal > 0 ? `$${selectedTotal.toFixed(2)}${hasNullPriced ? "+" : ""}` : "Quote on-site"}
                </span>
              </div>
              {hasNullPriced && (
                <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 6 }}>
                  Some services will be quoted on-site
                </div>
              )}

              {submitError && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* ═══ Confirmation ═══ */}
          {submitted && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "#22c55e", margin: "0 auto 16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0B2447", margin: "0 0 8px" }}>You&apos;re all set!</h3>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
                We will reach out within 2 hours to confirm your appointment.
              </p>
            </div>
          )}
        </div>

        {/* ── Bottom Navigation ── */}
        {!submitted && (
          <div style={{
            borderTop: "1px solid #E2E8F0", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
          }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: "1px solid #CBD5E1",
                  background: "#fff", color: "#334155", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Back
              </button>
            ) : <div />}

            <button
              type="button"
              disabled={!canNext() || submitting}
              onClick={() => {
                if (step < 4) setStep(step + 1);
                else handleSubmit();
              }}
              style={{
                padding: "10px 28px", borderRadius: 10, border: "none",
                background: !canNext() || submitting ? "#CBD5E1" : step === 4 ? "#F97316" : "#0B2447",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: !canNext() || submitting ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {submitting ? "Submitting..." : step === 4 ? (division === "Fleet" ? "Request a Quote" : "Submit Booking") : "Next"}
            </button>
          </div>
        )}
      </div>

      {/* ── Search Overlay ── */}
      {searchOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setSearchOpen(false)} />
          <div style={{
            position: "relative", width: "100%", maxWidth: 480, maxHeight: "80vh", background: "#fff",
            borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          }}>
            {/* Search header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #E2E8F0" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="7" cy="7" r="5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                autoFocus
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: "inherit" }}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 18 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
                </svg>
              </button>
            </div>
            {/* Search body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {allFlat
                .filter((s) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((svc) => {
                  const checked = isServiceSelected(svc.id);
                  return (
                    <label
                      key={svc.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                        cursor: "pointer", background: checked ? "#EEF2FF" : "transparent",
                      }}
                    >
                      <span
                        style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: checked ? "none" : "2px solid #CBD5E1",
                          background: checked ? "#0B2447" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        onClick={(e) => { e.preventDefault(); toggleService(svc); }}
                      >
                        {checked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 3 5 9 3 7" />
                          </svg>
                        )}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, color: "#0B2447" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>{svc.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>
                        {svc.price != null ? (svc.price % 1 === 0 ? `$${svc.price}` : `$${svc.price.toFixed(2)}`) : "Quote"}
                      </span>
                    </label>
                  );
                })}
            </div>
            {/* Done button */}
            <div style={{ borderTop: "1px solid #E2E8F0", padding: "12px 16px" }}>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
                  background: "#0B2447", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global styles ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 639px) {
          .wizard-modal-card {
            max-width: 100% !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            height: 100vh;
          }
        }
        @media (max-width: 479px) {
          .wizard-card-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
