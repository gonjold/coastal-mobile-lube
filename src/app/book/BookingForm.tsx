"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useServices } from "@/hooks/useServices";

/* ─── Types ────────────────────────────────────────────────── */

type Division = "Automotive" | "Fleet" | "Marine" | "RV & Trailer";
type DivisionKey = "auto" | "fleet" | "marine" | "rv";

interface ServiceItem {
  name: string;
  price: number | null;
  firestoreId?: string;
}

interface CategoryDef {
  id: string;
  label: string;
  services: ServiceItem[];
}

interface SelectedItem {
  key?: string;
  catId: string;
  label: string;
  isCategory: boolean;
  price: number | null;
}

/* ─── Constants ────────────────────────────────────────────── */

const DIVISIONS: Division[] = [
  "Automotive",
  "Marine",
  "RV & Trailer",
  "Fleet",
];

const DIVISION_KEYS: Record<Division, DivisionKey> = {
  Automotive: "auto",
  Fleet: "fleet",
  Marine: "marine",
  "RV & Trailer": "rv",
};

const currentYear = 2026;
const YEARS = Array.from({ length: 40 }, (_, i) => currentYear + 1 - i);

const FALLBACK_CATEGORIES: Record<Division, CategoryDef[]> = {
  Automotive: [
    {
      id: "oil",
      label: "Oil Change",
      services: [
        { name: "Synthetic Blend", price: 79.95 },
        { name: "Full Synthetic", price: 99.95 },
        { name: "High Mileage Synthetic", price: 109.95 },
        { name: "Diesel Oil Change", price: 129.95 },
      ],
    },
    {
      id: "tires",
      label: "Tires",
      services: [
        { name: "Mount and Balance Single", price: 35 },
        { name: "Mount and Balance 4 Tires", price: 120 },
        { name: "Tire Rotation", price: 29.95 },
        { name: "Flat Repair", price: 25 },
      ],
    },
    {
      id: "brakes",
      label: "Brakes",
      services: [
        { name: "Front Brake Job", price: 249.95 },
        { name: "Rear Brake Job", price: 249.95 },
        { name: "Front and Rear Brake Job", price: 449.95 },
      ],
    },
    {
      id: "battery",
      label: "Battery",
      services: [
        { name: "Battery Replacement", price: 149.95 },
        { name: "Battery Service", price: 39.95 },
      ],
    },
    {
      id: "maintenance",
      label: "Maintenance",
      services: [
        { name: "Coolant Flush", price: 129.95 },
        { name: "Transmission Flush", price: 179.95 },
        { name: "Power Steering Flush", price: 99.95 },
      ],
    },
    {
      id: "hvac",
      label: "HVAC",
      services: [
        { name: "EVAC and Recharge", price: 179.95 },
        { name: "Cabin Air Filter", price: 39.95 },
      ],
    },
    {
      id: "wipers",
      label: "Wipers",
      services: [
        { name: "Front Wiper Blades", price: 29.95 },
        { name: "Rear Wiper Blade", price: 19.95 },
      ],
    },
    { id: "other", label: "Other", services: [] },
  ],
  Fleet: [
    {
      id: "oil",
      label: "Oil Change",
      services: [
        { name: "Fleet Synthetic Blend", price: null },
        { name: "Fleet Full Synthetic", price: null },
      ],
    },
    {
      id: "tires",
      label: "Tire Service",
      services: [
        { name: "Mount and Balance", price: null },
        { name: "Tire Rotation", price: null },
      ],
    },
    {
      id: "battery",
      label: "Battery",
      services: [{ name: "Battery Replacement", price: null }],
    },
    {
      id: "brakes",
      label: "Brakes",
      services: [
        { name: "Front Brake Job", price: null },
        { name: "Rear Brake Job", price: null },
      ],
    },
    {
      id: "pm",
      label: "Preventive Maintenance",
      services: [
        { name: "Fluid Flush", price: null },
        { name: "Filter Service", price: null },
      ],
    },
    { id: "other", label: "Other", services: [] },
  ],
  Marine: [
    {
      id: "oil",
      label: "Oil Change",
      services: [
        { name: "Inboard Oil Change", price: 149.95 },
        { name: "Outboard Oil Change", price: 99.95 },
        { name: "Stern Drive Oil Change", price: 129.95 },
      ],
    },
    {
      id: "engine",
      label: "Engine Service",
      services: [
        { name: "Impeller Replacement", price: 199.95 },
        { name: "Fuel Filter", price: 79.95 },
      ],
    },
    {
      id: "winter",
      label: "Winterization",
      services: [
        { name: "Winterization", price: 249.95 },
        { name: "De-Winterization", price: 199.95 },
      ],
    },
    { id: "other", label: "Other", services: [] },
  ],
  "RV & Trailer": [
    {
      id: "oil",
      label: "Oil Change",
      services: [
        { name: "RV Oil Change", price: 129.95 },
        { name: "Generator Oil Change", price: 89.95 },
      ],
    },
    {
      id: "tires",
      label: "Tire Service",
      services: [
        { name: "Mount and Balance", price: 45 },
        { name: "Tire Rotation", price: 39.95 },
      ],
    },
    {
      id: "generator",
      label: "Generator",
      services: [
        { name: "Generator Service", price: 149.95 },
        { name: "Generator Tune-Up", price: 99.95 },
      ],
    },
    {
      id: "roof",
      label: "Roof / Exterior",
      services: [
        { name: "Roof Inspection", price: 79.95 },
        { name: "Sealant Application", price: 149.95 },
      ],
    },
    { id: "other", label: "Other", services: [] },
  ],
};

const VEHICLE_ID_LABELS: Record<
  Division,
  { label: string; placeholder: string; hint: string; showYMM: boolean }
> = {
  Automotive: {
    label: "VIN",
    placeholder: "Enter VIN",
    hint: "Found on driver's door jamb sticker",
    showYMM: true,
  },
  Fleet: {
    label: "VIN",
    placeholder: "Enter VIN",
    hint: "Found on driver's door jamb sticker",
    showYMM: true,
  },
  Marine: {
    label: "Hull #",
    placeholder: "Enter Hull #",
    hint: "Stamped on boat transom",
    showYMM: false,
  },
  "RV & Trailer": {
    label: "VIN",
    placeholder: "Enter VIN",
    hint: "Found on driver's door jamb sticker",
    showYMM: true,
  },
};

/* ─── Helpers ──────────────────────────────────────────────── */

function strip(phone: string) {
  return phone.replace(/\D/g, "");
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function BookingForm() {
  /* ── State ── */
  const [division, setDivision] = useState<Division>("Automotive");
  const [selectedCat, setSelectedCat] = useState<CategoryDef | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedItem[]>([]);
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherText, setOtherText] = useState("");

  const [vinOrHull, setVinOrHull] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vinDecoding, setVinDecoding] = useState(false);
  const vinAbortRef = useRef<AbortController | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [contactName, setContactName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactMethod, setContactMethod] = useState("Call");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ── Firestore ── */
  const {
    services: allServices,
    categories: firestoreCategories,
    loading: servicesLoading,
  } = useServices({ activeOnly: true });

  /* ── Derived ── */
  const categories = FALLBACK_CATEGORIES[division] || [];
  const vehicleId = VEHICLE_ID_LABELS[division];

  /* VIN auto-decode via NHTSA (free, no key) */
  useEffect(() => {
    vinAbortRef.current?.abort();
    const cleaned = vinOrHull.replace(/\s/g, "");
    if (division === "Marine" || cleaned.length !== 17) {
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
      })
      .catch(() => {/* leave fields editable on failure */})
      .finally(() => { if (!ac.signal.aborted) setVinDecoding(false); });
    return () => ac.abort();
  }, [vinOrHull, division]);

  /* VIN barcode scanner */
  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === 2 /* SCANNING */ || state === 3 /* PAUSED */) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      }
    } catch { /* already stopped */ }
    scannerRef.current = null;
  }, []);

  const closeScanner = useCallback(() => {
    stopScanner();
    setScannerOpen(false);
    setScannerError("");
  }, [stopScanner]);

  useEffect(() => {
    if (!scannerOpen) return;
    const divId = "vin-barcode-reader";
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
      () => {/* ignore per-frame scan errors */},
    ).catch(() => {
      setScannerError("Camera not available");
      setTimeout(() => closeScanner(), 1500);
    });

    return () => { stopScanner(); };
  }, [scannerOpen, closeScanner, stopScanner]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  function getServicesForCategory(cat: CategoryDef): ServiceItem[] {
    if (servicesLoading || !allServices.length) return cat.services;

    const divKey = DIVISION_KEYS[division];
    let matched = allServices.filter(
      (s) =>
        s.division === divKey &&
        s.category.toLowerCase() === cat.label.toLowerCase()
    );

    if (divKey === "rv" && matched.length === 0) {
      matched = allServices.filter(
        (s) =>
          (s.division === "auto" || s.division === "marine") &&
          s.category.toLowerCase() === cat.label.toLowerCase()
      );
    }

    if (matched.length > 0) {
      return matched.map((s) => ({
        name: s.name,
        price: s.price,
        firestoreId: s.id,
      }));
    }

    return cat.services;
  }

  function getStartingPrice(cat: CategoryDef): number | null {
    const divKey = DIVISION_KEYS[division];
    const fsCat = firestoreCategories.find(
      (c) =>
        c.division === divKey &&
        c.name.toLowerCase() === cat.label.toLowerCase()
    );
    if (fsCat && fsCat.startingAt > 0) return fsCat.startingAt;

    const services = getServicesForCategory(cat);
    const prices = services
      .filter((s) => s.price != null)
      .map((s) => s.price as number);
    return prices.length > 0 ? Math.min(...prices) : null;
  }

  /* ── Handlers ── */

  function handleCatClick(cat: CategoryDef) {
    if (cat.id === "other") {
      setOtherSelected((prev) => {
        if (prev) setOtherText("");
        return !prev;
      });
      setSelectedCat(cat);
      setExpandedCat(null);
      return;
    }

    if (selectedCat?.id === cat.id) {
      setExpandedCat(expandedCat === cat.id ? null : cat.id);
    } else {
      setSelectedCat(cat);
      setExpandedCat(null);
      const hasSpecifics = selectedServices.some(
        (s) => s.catId === cat.id && !s.isCategory
      );
      if (!hasSpecifics) {
        setSelectedServices((prev) => [
          ...prev.filter((s) => s.catId !== cat.id),
          { catId: cat.id, label: cat.label, isCategory: true, price: null },
        ]);
      }
    }
    if (errors.services) setErrors((p) => ({ ...p, services: "" }));
  }

  function handleServiceToggle(cat: CategoryDef, service: ServiceItem) {
    const key = `${cat.id}-${service.name}`;
    const exists = selectedServices.find((s) => s.key === key);

    if (exists) {
      const remaining = selectedServices.filter((s) => s.key !== key);
      const otherSpecifics = remaining.some(
        (s) => s.catId === cat.id && !s.isCategory
      );
      if (!otherSpecifics) {
        setSelectedServices([
          ...remaining,
          { catId: cat.id, label: cat.label, isCategory: true, price: null },
        ]);
      } else {
        setSelectedServices(remaining);
      }
    } else {
      setSelectedServices((prev) => [
        ...prev.filter((s) => !(s.catId === cat.id && s.isCategory)),
        {
          key,
          catId: cat.id,
          label: `${cat.label}: ${service.name}`,
          isCategory: false,
          price: service.price,
        },
      ]);
    }
  }

  function handleRemoveService(index: number) {
    setSelectedServices((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDivisionSwitch(d: Division) {
    setDivision(d);
    setSelectedCat(null);
    setExpandedCat(null);
    setSelectedServices([]);
    setOtherSelected(false);
    setOtherText("");
    setVinOrHull("");
    setVehicleYear("");
    setVehicleMake("");
    setVehicleModel("");
  }

  /* ── Computed ── */
  const totalServices =
    selectedServices.length + (otherSelected && otherText ? 1 : 0);
  const hasAnyPriced = selectedServices.some((s) => s.price != null);
  const totalPrice = selectedServices.reduce(
    (sum, s) => sum + (s.price || 0),
    0
  );

  /* ── Validation ── */
  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (totalServices === 0)
      e.services = "Please select at least one service";
    if (!contactName.trim()) e.name = "Name is required";
    return e;
  }

  /* ── Submit ── */
  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const serviceNames = selectedServices.map((s) => s.label);
      if (otherSelected && otherText) {
        serviceNames.push(`Other: ${otherText}`);
      }

      await addDoc(collection(db, "bookings"), {
        division: DIVISION_KEYS[division],
        services: serviceNames,
        service: serviceNames.join(", "),
        selectedServices: selectedServices.map((s) => ({
          catId: s.catId,
          label: s.label,
          isCategory: s.isCategory,
          price: s.price,
        })),
        otherDescription: otherText || "",
        subtotalEstimate: totalPrice,
        vinOrHull: vinOrHull.trim(),
        vehicleYear: vehicleYear.trim(),
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        name: contactName.trim(),
        zipCode: zipCode.trim(),
        phone: strip(phone),
        email: email.trim().toLowerCase(),
        contactPreference: contactMethod.toLowerCase(),
        preferredDate,
        notes: notes.trim() || "",
        status: "pending",
        source: "booking-page-v3",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ services: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setDivision("Automotive");
    setSelectedCat(null);
    setExpandedCat(null);
    setSelectedServices([]);
    setOtherSelected(false);
    setOtherText("");
    setVinOrHull("");
    setVehicleYear("");
    setVehicleMake("");
    setVehicleModel("");
    setContactName("");
    setZipCode("");
    setPhone("");
    setEmail("");
    setContactMethod("Call");
    setPreferredDate("");
    setNotes("");
    setSubmitted(false);
    setErrors({});
  }

  /* ── Reusable classes ── */
  const inp =
    "w-full px-4 py-3 rounded-lg border border-white/15 bg-white/[.06] text-white text-sm outline-none placeholder:text-white/30 focus:border-[#E8913A] transition-colors font-[family-name:inherit]";
  const lbl =
    "text-white/70 text-xs font-semibold uppercase tracking-[1px] block mb-1.5";

  /* ═══ RENDER ══════════════════════════════════════════════════ */

  /* ── Sidebar content (shared between desktop & mobile) ── */
  function renderSidebar() {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h3 className="text-[#E8913A] text-lg font-bold mb-4 mt-0">
          Your services
        </h3>

        {totalServices === 0 ? (
          <p className="text-white/40 text-sm">No services selected yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedServices.map((s, i) => (
              <div
                key={i}
                className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-white/[.04] border border-white/[.08]"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[13px] font-medium">
                    {s.label}
                  </div>
                  {s.price != null && (
                    <div className="text-[#E8913A] text-xs font-medium mt-0.5">
                      ${s.price.toFixed(2)}
                    </div>
                  )}
                  {s.isCategory && (
                    <div className="text-white/35 text-[11px] mt-0.5">
                      Price confirmed at booking
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveService(i)}
                  className="text-white/30 hover:text-white/60 text-base px-1 flex-shrink-0 transition-colors cursor-pointer"
                >
                  x
                </button>
              </div>
            ))}
            {otherSelected && otherText && (
              <div className="px-3 py-2.5 rounded-lg bg-white/[.04] border border-white/[.08]">
                <div className="text-white/50 text-[11px] font-semibold uppercase">
                  Other
                </div>
                <div className="text-white text-[13px] font-medium mt-0.5">
                  {otherText}
                </div>
              </div>
            )}
          </div>
        )}

        {totalServices > 0 && (
          <div className="border-t border-white/10 mt-4 pt-4">
            {hasAnyPriced ? (
              <>
                <div className="flex justify-between text-white font-bold text-[15px]">
                  <span>Estimated total</span>
                  <span className="text-[#E8913A]">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="text-white/35 text-[11px] mt-1">
                  Starting at pricing. Final quote confirmed by our team.
                </div>
              </>
            ) : (
              <div className="text-white/40 text-[13px]">
                We will confirm pricing when we reach out
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Confirmation screen ── */
  if (submitted) {
    return (
      <div className="bg-[#0B1929]">
        <div className="section-inner px-4 lg:px-6 py-16">
          <div className="max-w-[600px] mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center mx-auto mb-5">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-3">
                You&apos;re all set!
              </h1>
              <p className="text-white/60 text-[15px] mb-8 leading-relaxed">
                We will reach out within 2 hours to confirm your appointment.
                Need to make changes? Call{" "}
                <a
                  href="tel:8137225823"
                  className="text-[#E8913A] font-semibold hover:underline"
                >
                  813-722-LUBE
                </a>
                .
              </p>
              <div className="flex flex-col gap-3 max-w-[340px] mx-auto">
                <button
                  type="button"
                  onClick={reset}
                  className="w-full py-4 rounded-[10px] bg-[#E8913A] text-white font-bold text-[16px] hover:bg-[#d07e2f] transition-colors cursor-pointer"
                >
                  Book Another Service
                </button>
                <Link
                  href="/"
                  className="w-full py-4 rounded-[10px] border-2 border-white/20 text-white font-bold text-[16px] text-center hover:bg-white/10 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main booking flow ── */
  return (
    <>
      {/* ═══ Hero Banner ═══ */}
      <section className="bg-gradient-to-br from-[#0d2640] via-[#132f4f] to-[#0B1929]">
        <div className="section-inner px-4 lg:px-6 pt-8 pb-6">
          <div className="flex flex-wrap gap-2 mb-5">
            {DIVISIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDivisionSwitch(d)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                  division === d
                    ? "bg-[#E8913A] text-white"
                    : "bg-transparent border border-white/20 text-white hover:bg-white/10"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <h1 className="text-[28px] font-extrabold text-white tracking-tight">
            Book your service
          </h1>
          <p className="text-white/60 text-[15px] mt-1.5">
            Pick a service, choose a date, and we will confirm your appointment
            within 2 hours. Or call{" "}
            <a
              href="tel:8137225823"
              className="text-[#E8913A] font-semibold hover:underline"
            >
              813-722-LUBE
            </a>
            .
          </p>
        </div>
      </section>

      {/* ═══ Main Content ═══ */}
      <section className="bg-[#0B1929]">
        <div className="section-inner px-4 lg:px-6 py-6">
          <div className="max-w-[1100px] mx-auto lg:grid lg:grid-cols-[1fr_300px] lg:gap-6">
            {/* ─── Left Column ─── */}
            <div>
              {/* ── What do you need? ── */}
              <div className="mb-8">
                <h2 className="text-white text-xl font-bold mb-1">
                  What do you need?
                </h2>
                <p className="text-white/50 text-[13px] mb-4">
                  Select a category. Tap again to choose a specific service.
                </p>

                {errors.services && (
                  <p className="text-red-400 text-sm font-medium mb-3">
                    {errors.services}
                  </p>
                )}

                {/* Category cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {categories.map((cat) => {
                    const hasSidebarItems = selectedServices.some(
                      (s) => s.catId === cat.id
                    );
                    const isActive = selectedCat?.id === cat.id;
                    const isHighlighted =
                      isActive ||
                      hasSidebarItems ||
                      (cat.id === "other" && otherSelected);
                    const lowestPrice = getStartingPrice(cat);

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCatClick(cat)}
                        className={`w-full py-[18px] px-3 rounded-xl text-center transition-all cursor-pointer ${
                          isHighlighted
                            ? "border-2 border-[#E8913A] bg-[#E8913A]/10"
                            : "border border-white/[.12] bg-white/[0.06] hover:bg-white/[.10]"
                        }`}
                      >
                        <div className="text-white text-sm font-bold">
                          {cat.label}
                        </div>
                        {lowestPrice != null && (
                          <div className="text-white/40 text-[11px] mt-1">
                            Starting at ${lowestPrice.toFixed(2)}
                          </div>
                        )}
                        {cat.id === "other" && (
                          <div className="text-white/40 text-[11px] mt-1">
                            Describe what you need
                          </div>
                        )}
                        {cat.services.length > 0 && isActive && (
                          <div className="text-[#E8913A] text-[11px] mt-1.5 font-medium">
                            {expandedCat === cat.id
                              ? "Hide options"
                              : "See specific services"}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Drill-down panel */}
                {expandedCat &&
                  (() => {
                    const cat = categories.find((c) => c.id === expandedCat);
                    if (!cat || cat.services.length === 0) return null;
                    const services = getServicesForCategory(cat);
                    if (services.length === 0) return null;

                    return (
                      <div className="mt-3 bg-white/[0.06] rounded-xl border border-white/10 p-4">
                        <div className="text-white/50 text-xs font-semibold uppercase tracking-[1px] mb-2.5">
                          {cat.label}: choose specific service (optional)
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {services.map((s) => {
                            const isChecked = selectedServices.some(
                              (ss) => ss.key === `${cat.id}-${s.name}`
                            );
                            return (
                              <button
                                key={s.name}
                                type="button"
                                onClick={() => handleServiceToggle(cat, s)}
                                className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg w-full text-left transition-all cursor-pointer ${
                                  isChecked
                                    ? "border border-[#E8913A] bg-[#E8913A]/[.08]"
                                    : "border border-white/[.08] hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center ${
                                      isChecked
                                        ? "bg-[#E8913A] border-2 border-[#E8913A]"
                                        : "border-2 border-white/25"
                                    }`}
                                  >
                                    {isChecked && (
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-white text-sm font-medium">
                                    {s.name}
                                  </span>
                                </div>
                                {s.price != null && (
                                  <span className="text-white/50 text-[13px] font-medium">
                                    ${s.price.toFixed(2)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-white/35 text-[11px] mt-2.5 italic">
                          Not sure? Just leave the broad category and describe
                          it below.
                        </div>
                      </div>
                    );
                  })()}

                {/* Other text input */}
                {otherSelected && (
                  <div className="mt-3">
                    <label className={lbl}>What do you need?</label>
                    <input
                      type="text"
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Briefly describe the service you need"
                      className={inp}
                    />
                  </div>
                )}
              </div>

              {/* ── Your Details ── */}
              <div className="bg-white/[0.05] rounded-2xl border border-white/[.12] p-6">
                <h2 className="text-white text-xl font-bold mb-5">
                  Your details
                </h2>

                {/* Vehicle Information */}
                <div className="mb-5 pb-5 border-b border-white/[.08]">
                  <div className="text-white/50 text-xs font-semibold uppercase tracking-[1px] mb-3">
                    Vehicle Information
                  </div>

                  {/* VIN or Hull */}
                  <div className="mb-3">
                    <label className={lbl}>
                      {vehicleId.label} (optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={vinOrHull}
                        onChange={(e) => setVinOrHull(e.target.value)}
                        placeholder={vehicleId.placeholder}
                        className={`${inp} flex-1 !w-auto`}
                      />
                      {division !== "Marine" && (
                        <button
                          type="button"
                          onClick={() => { setScannerError(""); setScannerOpen(true); }}
                          className="px-4 py-3 rounded-lg border border-white/15 bg-white/[.06] text-white/50 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          Scan
                        </button>
                      )}
                    </div>
                    <div className="text-white/35 text-[11px] mt-1">
                      {vehicleId.hint}
                    </div>
                  </div>

                  {/* YMM fields (hidden for Marine) */}
                  {vehicleId.showYMM && (
                    <>
                      <div className="text-white/40 text-xs text-center my-2">
                        or enter vehicle details
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className={lbl}>Year</label>
                          <select
                            value={vehicleYear}
                            onChange={(e) => setVehicleYear(e.target.value)}
                            disabled={vinDecoding}
                            className={`${inp} !pr-9 appearance-none cursor-pointer ${vinDecoding ? "opacity-50" : ""}`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff80' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 14px center",
                            }}
                          >
                            <option value="" className="bg-[#0d2640]">
                              {vinDecoding ? "Decoding..." : "Year"}
                            </option>
                            {YEARS.map((y) => (
                              <option
                                key={y}
                                value={y}
                                className="bg-[#0d2640]"
                              >
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Make</label>
                          <input
                            type="text"
                            value={vehicleMake}
                            onChange={(e) => setVehicleMake(e.target.value)}
                            placeholder={vinDecoding ? "Decoding VIN..." : "e.g. Toyota"}
                            disabled={vinDecoding}
                            className={`${inp} ${vinDecoding ? "opacity-50" : ""}`}
                          />
                        </div>
                        <div>
                          <label className={lbl}>Model</label>
                          <input
                            type="text"
                            value={vehicleModel}
                            onChange={(e) => setVehicleModel(e.target.value)}
                            placeholder={vinDecoding ? "Decoding VIN..." : "e.g. Camry"}
                            disabled={vinDecoding}
                            className={`${inp} ${vinDecoding ? "opacity-50" : ""}`}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Contact fields */}
                <div className="flex flex-col gap-4">
                  {/* Name */}
                  <div>
                    <label className={lbl}>Your Name</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => {
                        setContactName(e.target.value);
                        if (errors.name)
                          setErrors((p) => ({ ...p, name: "" }));
                      }}
                      placeholder="Your name"
                      className={`${inp} ${errors.name ? "!border-red-500" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Zip + Phone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Zip Code</label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="e.g. 33601"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 555-5555"
                        className={inp}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className={lbl}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className={inp}
                    />
                  </div>

                  {/* Contact Method */}
                  <div>
                    <label className={lbl}>Best Way to Reach You</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Call", "Text", "Email"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setContactMethod(m)}
                          className={`py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                            contactMethod === m
                              ? "border-2 border-[#E8913A] bg-[#E8913A]/[.12] text-[#E8913A]"
                              : "border border-white/15 bg-white/[.04] text-white/60 hover:border-white/30"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Date */}
                  <div>
                    <label className={lbl}>Preferred Date</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className={`${inp} text-white/50`}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={lbl}>
                      Anything else we should know?
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tire size, special requests, access instructions, etc."
                      rows={3}
                      className={`${inp} resize-y`}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-[10px] bg-[#E8913A] text-white font-bold text-[16px] hover:bg-[#d07e2f] transition-all disabled:opacity-60 mt-2 cursor-pointer"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Submitting...
                      </span>
                    ) : division === "Fleet" ? (
                      "Request a Quote"
                    ) : (
                      "Book Now"
                    )}
                  </button>
                  <p className="text-white/40 text-xs text-center mt-2.5">
                    or call{" "}
                    <a
                      href="tel:8137225823"
                      className="text-[#E8913A] font-semibold hover:underline"
                    >
                      813-722-LUBE
                    </a>{" "}
                    for immediate help
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Right Column: Desktop Sticky Sidebar ─── */}
            <div className="hidden lg:block">
              <div className="sticky top-[100px]">{renderSidebar()}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Mobile: Services summary below form ═══ */}
      {totalServices > 0 && (
        <section className="lg:hidden bg-[#0B1929]">
          <div className="section-inner px-4 pb-8">{renderSidebar()}</div>
        </section>
      )}

      {/* ═══ VIN Barcode Scanner Overlay ═══ */}
      {scannerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-[400px] mx-4 rounded-2xl overflow-hidden bg-[#0d2640] border border-white/20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-semibold text-sm">Scan VIN Barcode</span>
              <button
                type="button"
                onClick={closeScanner}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div id="vin-barcode-reader" className="w-full" />
            {scannerError ? (
              <p className="text-red-400 text-sm text-center py-4">{scannerError}</p>
            ) : (
              <p className="text-white/40 text-xs text-center py-3">Point camera at the VIN barcode on the door jamb</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
