"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, limit as firestoreLimit } from "firebase/firestore";
import { useServices, type Service } from "@/hooks/useServices";
import { groupByCategory } from "@/lib/serviceHelpers";
import SearchableSelect from "./SearchableSelect";

/* ─── Types ───────────────────────────────────────────────── */

type Division = "Automotive" | "Marine" | "RV" | "Fleet";
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

interface PreselectionData {
  division?: string;
  categoryId?: string;
  serviceId?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselect?: PreselectionData;
}

interface LookupBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  services: string;
  date: string;
  sortKey: number;
}

/* ─── Constants ───────────────────────────────────────────── */

const DIVISIONS: Division[] = ["Automotive", "Marine", "RV", "Fleet"];

const DIVISION_KEY_MAP: Record<Division, DivisionKey> = {
  Automotive: "auto",
  Marine: "marine",
  "RV": "rv",
  Fleet: "fleet",
};

const YEARS = Array.from({ length: 40 }, (_, i) => 2027 - i);
const YEAR_OPTIONS = YEARS.map(String);

const TIME_SLOTS = [
  { value: "morning", label: "Morning (7-10am)" },
  { value: "midday", label: "Midday (10am-1pm)" },
  { value: "afternoon", label: "Afternoon (1-4pm)" },
  { value: "late", label: "Late (4-6pm)" },
];

const POPULAR_MAKES = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Hyundai", "Kia",
  "BMW", "Mercedes-Benz", "Volkswagen", "Subaru", "Mazda", "Jeep", "Ram",
  "GMC", "Dodge", "Lexus", "Audi", "Acura", "Infiniti", "Buick", "Cadillac",
  "Chrysler", "Lincoln", "Tesla",
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
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3c-1.5 4-5 6-5 10a5 5 0 0010 0c0-4-3.5-6-5-10z" />
      <path d="M11 16a2 2 0 004 0" />
    </svg>
  );
}

function IconTires() {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="13" r="9" />
      <circle cx="13" cy="13" r="5" />
      <circle cx="13" cy="13" r="2" />
    </svg>
  );
}

function IconMaintenance() {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 3.5l2.5 2.5-8.5 8.5-4-4L15 2z" />
      <path d="M6.5 10.5L3 22l11.5-3.5" />
      <path d="M14.5 18.5l4-4" />
    </svg>
  );
}

function IconSnowflake() {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 9 14 13 14 11 23 17 12 13 12 15 3" />
    </svg>
  );
}

function IconClipboardPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

export default function BookingWizardModal({ isOpen, onClose, preselect }: Props) {
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

  /* ── YMM API state ── */
  const modelsCacheRef = useRef<Record<string, string[]>>({});
  const [currentModels, setCurrentModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  /* ── Unified YMM search (desktop) ── */
  const [isMobile, setIsMobile] = useState(false);
  const [ymmSearch, setYmmSearch] = useState("");
  const [ymmDropdownOpen, setYmmDropdownOpen] = useState(false);
  const [ymmFallback, setYmmFallback] = useState(false);
  const [showManualFields, setShowManualFields] = useState(false);
  const [, setModelsFetchKey] = useState(0);
  const ymmDropdownRef = useRef<HTMLDivElement>(null);
  const [prefetchLoading, setPrefetchLoading] = useState(false);
  const prefetchStartedRef = useRef(false);
  const allMakesRef = useRef<string[]>([]);

  /* ── Marine vessel description ── */
  const [vesselYear, setVesselYear] = useState("");
  const [vesselMake, setVesselMake] = useState("");
  const [vesselModel, setVesselModel] = useState("");

  /* ── Step 3: Details ── */
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");

  /* ── "Been here before?" lookup ── */
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState("");
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupResults, setLookupResults] = useState<LookupBooking[]>([]);

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
        .filter((g) => !(divKey === "marine" && /marine\s*brakes/i.test(g.category)))
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

  /* ── Apply preselection when modal opens ── */
  const preselectAppliedRef = useRef(false);
  useEffect(() => {
    if (!isOpen || !preselect || preselectAppliedRef.current) return;
    preselectAppliedRef.current = true;

    // Set division
    if (preselect.division) {
      const match = DIVISIONS.find(
        (d) => d.toLowerCase() === preselect.division!.toLowerCase()
      );
      if (match) setDivision(match);
    }

    // Expand category (will be matched once categoryGroups render)
    if (preselect.categoryId) {
      setExpandedCategory(preselect.categoryId);
    }

    // Pre-select a specific service
    if (preselect.serviceId) {
      const svc = allFlat.find((s) => s.id === preselect.serviceId);
      if (svc && !isServiceSelected(svc.id)) {
        setSelectedServices((prev) => [...prev, svc]);
      }
    }
  }, [isOpen, preselect, allFlat]);

  useEffect(() => {
    if (!isOpen) preselectAppliedRef.current = false;
  }, [isOpen]);

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
    setVesselYear("");
    setVesselMake("");
    setVesselModel("");
    setYmmSearch("");
    setYmmDropdownOpen(false);
    setShowManualFields(false);
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

  /* ── YMM handlers ── */
  function handleYearChange(val: string) {
    setVehicleYear(val);
    setVehicleMake("");
    setVehicleModel("");
  }

  function handleMakeChange(val: string) {
    setVehicleMake(val);
    setVehicleModel("");
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

  /* ── Pre-fetch models for top 25 popular makes + all NHTSA makes (triggered on first focus) ── */
  function handleSearchFocus() {
    if (!prefetchStartedRef.current) {
      prefetchStartedRef.current = true;
      setPrefetchLoading(true);
      const popularFetches = POPULAR_MAKES.map((make) =>
        fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`)
          .then((r) => r.json())
          .then((data: { Results?: { Model_Name?: string }[] }) => {
            const models = [...new Set(
              (data.Results || []).map((r) => r.Model_Name || "").filter((s) => s.length > 0)
            )].sort((a, b) => a.localeCompare(b));
            modelsCacheRef.current[make] = models;
          })
      );
      const allMakesFetch = fetch("https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json")
        .then((r) => r.json())
        .then((data: { Results?: { Make_Name?: string }[] }) => {
          allMakesRef.current = [...new Set(
            (data.Results || []).map((r) => r.Make_Name || "").filter((s) => s.length > 0)
          )].sort((a, b) => a.localeCompare(b));
        })
        .catch(() => {});
      Promise.allSettled([...popularFetches, allMakesFetch]).then(() => {
        setPrefetchLoading(false);
        setModelsFetchKey((k) => k + 1);
      });
    }
    if (ymmSearch.trim()) setYmmDropdownOpen(true);
  }

  /* ── Fetch models for selected make ── */
  useEffect(() => {
    if (!vehicleMake) {
      setCurrentModels([]);
      return;
    }
    if (modelsCacheRef.current[vehicleMake]) {
      setCurrentModels(modelsCacheRef.current[vehicleMake]);
      return;
    }
    setModelsLoading(true);
    fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(vehicleMake)}?format=json`)
      .then((r) => r.json())
      .then((data: { Results?: { Model_Name?: string }[] }) => {
        const models = [...new Set(
          (data.Results || [])
            .map((r) => r.Model_Name || "")
            .filter((s) => s.length > 0)
        )].sort((a, b) => a.localeCompare(b));
        modelsCacheRef.current[vehicleMake] = models;
        setCurrentModels(models);
      })
      .catch(() => {})
      .finally(() => setModelsLoading(false));
  }, [vehicleMake]);

  /* ── Responsive detection ── */
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Fetch models for make detected in unified search ── */
  useEffect(() => {
    if (isMobile || !ymmSearch.trim()) return;
    const trimmed = ymmSearch.trim();
    const yearMatch = trimmed.match(/^(198[89]|199\d|20[01]\d|202[0-7])(\s+|$)/);
    const rest = yearMatch ? trimmed.slice(yearMatch[0].length) : trimmed;
    if (!rest) return;

    const lowerRest = rest.toLowerCase();

    // Check all known makes (longest match, popular first)
    const allKnown = [...POPULAR_MAKES, ...Object.keys(modelsCacheRef.current), ...allMakesRef.current];
    const sortedMakes = [...new Set(allKnown)].sort((a, b) => b.length - a.length);
    const foundMake = sortedMakes.find(
      (m) => lowerRest.startsWith(m.toLowerCase()) && (lowerRest.length === m.length || lowerRest[m.length] === " ")
    );

    if (foundMake && !modelsCacheRef.current[foundMake]) {
      fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(foundMake)}?format=json`)
        .then((r) => r.json())
        .then((data: { Results?: { Model_Name?: string }[] }) => {
          const models = [...new Set(
            (data.Results || []).map((r) => r.Model_Name || "").filter((s) => s.length > 0)
          )].sort((a, b) => a.localeCompare(b));
          modelsCacheRef.current[foundMake] = models;
          setModelsFetchKey((k) => k + 1);
        })
        .catch(() => {});
      return;
    }

    // Non-popular make: debounce and try fetching from NHTSA
    if (!foundMake && lowerRest.length >= 2) {
      const timer = setTimeout(() => {
        fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(rest)}?format=json`)
          .then((r) => r.json())
          .then((data: { Results?: { Make_Name?: string; Model_Name?: string }[] }) => {
            const results = data.Results || [];
            const models = [...new Set(results.map((r) => r.Model_Name || "").filter((s) => s.length > 0))].sort((a, b) => a.localeCompare(b));
            if (models.length > 0) {
              const makeName = results[0]?.Make_Name || rest;
              modelsCacheRef.current[makeName] = models;
              setModelsFetchKey((k) => k + 1);
            }
          })
          .catch(() => {});
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ymmSearch, isMobile]);

  /* ── Close YMM dropdown on click outside ── */
  useEffect(() => {
    if (!ymmDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (ymmDropdownRef.current && !ymmDropdownRef.current.contains(e.target as Node)) {
        setYmmDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ymmDropdownOpen]);

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

  /* ── Unified search: compute suggestions ── */
  const hasVehicleSelected = !!(vehicleYear || vehicleMake || vehicleModel);

  function computeYmmSuggestions(): { year: string; make: string; model: string; display: string }[] {
    if (!ymmSearch.trim()) return [];
    const trimmed = ymmSearch.trim();
    let year = "";
    let rest = trimmed;

    const yearMatch = trimmed.match(/^(198[89]|199\d|20[01]\d|202[0-7])(\s+|$)/);
    if (yearMatch) {
      year = yearMatch[1];
      rest = trimmed.slice(yearMatch[0].length);
    }

    if (!rest && !year) return [];

    const lowerRest = rest.toLowerCase();
    const scored: { year: string; make: string; model: string; display: string; score: number }[] = [];
    const seen = new Set<string>();

    // Build flat model list from all cached makes
    const allCachedModels = Object.entries(modelsCacheRef.current).flatMap(([make, models]) =>
      models.map((model) => ({ make, model }))
    );
    const popularSet = new Set(POPULAR_MAKES.map((m) => m.toLowerCase()));

    function add(y: string, make: string, model: string, score: number) {
      const key = `${y}|${make.toLowerCase()}|${model.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      scored.push({ year: y, make, model, display: [y, make, model].filter(Boolean).join(" "), score });
    }

    if (lowerRest) {
      // Try exact make match at start of input (longest first)
      const allKnownMakes = [...new Set([...POPULAR_MAKES, ...Object.keys(modelsCacheRef.current), ...allMakesRef.current])];
      const sortedMakes = allKnownMakes.sort((a, b) => b.length - a.length);
      const foundMake = sortedMakes.find(
        (m) => lowerRest.startsWith(m.toLowerCase()) && (lowerRest.length === m.length || lowerRest[m.length] === " ")
      );

      if (foundMake) {
        const afterMake = rest.slice(foundMake.length).trim().toLowerCase();
        // Case-insensitive cache lookup
        const cacheKey = Object.keys(modelsCacheRef.current).find((k) => k.toLowerCase() === foundMake.toLowerCase());
        const models = cacheKey ? modelsCacheRef.current[cacheKey] : [];

        if (models.length > 0) {
          const filtered = afterMake ? models.filter((m) => m.toLowerCase().includes(afterMake)) : models;
          filtered.forEach((model) => {
            const ml = model.toLowerCase();
            let score = 30;
            if (afterMake) {
              if (ml === afterMake) score = 10;
              else if (ml.startsWith(afterMake)) score = 20;
            } else {
              score = 15;
            }
            add(year, cacheKey || foundMake, model, score);
          });
        } else {
          // Models not cached yet — show make-only for drill-down
          add(year, foundMake, "", 15);
        }
      }

      // Model-first search across all cached models (only popular makes)
      if (!foundMake || scored.length === 0) {
        allCachedModels.forEach(({ make, model }) => {
          if (!popularSet.has(make.toLowerCase())) return;
          const ml = model.toLowerCase();
          if (!ml.includes(lowerRest)) return;
          let score = 60;
          if (ml === lowerRest) score = 40;
          else if (ml.startsWith(lowerRest)) score = 50;
          score -= 5; // popular make bonus
          add(year, make, model, score);
        });
      }

      // Make-name substring search against popular + cached + ALL NHTSA makes (fallback)
      if (scored.length === 0) {
        const knownMakes = [...new Set([...POPULAR_MAKES, ...Object.keys(modelsCacheRef.current), ...allMakesRef.current])];
        const makeMatches = knownMakes.filter((m) => m.toLowerCase().includes(lowerRest));
        makeMatches.forEach((make) => {
          const ml = make.toLowerCase();
          let base = 70;
          if (ml === lowerRest) base = 40;
          else if (ml.startsWith(lowerRest)) base = 50;
          if (popularSet.has(ml)) base -= 5;

          const ck = Object.keys(modelsCacheRef.current).find((k) => k.toLowerCase() === ml);
          const models = ck ? modelsCacheRef.current[ck] : [];
          if (models.length > 0) {
            models.forEach((model) => add(year, ck || make, model, base));
          } else {
            add(year, make, "", base);
          }
        });
      }
    } else if (year) {
      // Year-only — show popular makes sorted by popularity order
      POPULAR_MAKES.forEach((pm, idx) => {
        const ck = Object.keys(modelsCacheRef.current).find((k) => k.toLowerCase() === pm.toLowerCase());
        add(year, ck || pm, "", idx);
      });
    }

    return scored
      .sort((a, b) => a.score - b.score || a.display.localeCompare(b.display))
      .map((s) => ({ year: s.year, make: s.make, model: s.model, display: s.display }));
  }

  function selectYmmSuggestion(s: { year: string; make: string; model: string }) {
    if (s.model) {
      setVehicleYear(s.year);
      setVehicleMake(s.make);
      setVehicleModel(s.model);
      setYmmSearch("");
      setYmmDropdownOpen(false);
    } else {
      // Make-only — continue searching with make filled, fetch models
      const newSearch = [s.year, s.make].filter(Boolean).join(" ") + " ";
      setYmmSearch(newSearch);
      setYmmDropdownOpen(true);
    }
  }

  function clearYmmSelection() {
    setVehicleYear("");
    setVehicleMake("");
    setVehicleModel("");
    setVinOrHull("");
    setVinDecoded(false);
    setYmmSearch("");
    setShowManualFields(false);
  }

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
        vesselYear: vesselYear.trim(),
        vesselMake: vesselMake.trim(),
        vesselModel: vesselModel.trim(),
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
    setVesselYear("");
    setVesselMake("");
    setVesselModel("");
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
    setYmmSearch("");
    setYmmDropdownOpen(false);
    setShowManualFields(false);
    setLookupOpen(false);
    setLookupPhone("");
    setLookupLoading(false);
    setLookupMsg("");
    setLookupDone(false);
    setLookupResults([]);
  }

  /* ── "Been here before?" lookup ── */
  async function handleLookup() {
    const digits = lookupPhone.replace(/\D/g, "");
    if (digits.length < 7) return;
    setLookupLoading(true);
    setLookupMsg("");
    setLookupResults([]);
    try {
      const q = query(
        collection(db, "bookings"),
        where("customerPhone", "==", digits),
        firestoreLimit(10),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const results: LookupBooking[] = snap.docs.map((doc) => {
          const d = doc.data();
          const svcs = (d.selectedServices || []).map((s: { name?: string }) => s.name || "").filter(Boolean).join(", ");
          const ts = d.createdAt?.toDate?.();
          return {
            id: doc.id,
            customerName: d.customerName || "",
            customerPhone: d.customerPhone || "",
            customerEmail: d.customerEmail || "",
            vehicleYear: d.vehicleYear || "",
            vehicleMake: d.vehicleMake || "",
            vehicleModel: d.vehicleModel || "",
            services: svcs,
            date: ts ? ts.toLocaleDateString() : "",
            sortKey: ts ? ts.getTime() : 0,
          };
        });
        results.sort((a, b) => b.sortKey - a.sortKey);
        setLookupResults(results);
      } else {
        setLookupMsg("No previous bookings found with that number. No worries, fill in your details below.");
      }
    } catch {
      setLookupMsg("Couldn\u2019t look up your info right now. Please fill in your details below.");
    } finally {
      setLookupLoading(false);
    }
  }

  function applyLookupBooking(b: LookupBooking) {
    if (b.vehicleYear) setVehicleYear(b.vehicleYear);
    if (b.vehicleMake) setVehicleMake(b.vehicleMake);
    if (b.vehicleModel) setVehicleModel(b.vehicleModel);
    if (b.customerName) setCustomerName(b.customerName);
    if (b.customerPhone) setCustomerPhone(b.customerPhone);
    if (b.customerEmail) setCustomerEmail(b.customerEmail);
    setLookupDone(true);
    setLookupResults([]);
    setLookupMsg("");
  }

  function renderLookupUI(prompt: string) {
    if (lookupDone) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        {!lookupOpen ? (
          <button
            type="button"
            onClick={() => setLookupOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 500, color: "#F97316" }}
          >
            {prompt}
          </button>
        ) : (
          <div style={{ background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="tel"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                placeholder="Enter the phone number you used last time"
                style={{
                  flex: 1, padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8,
                  fontSize: 13, outline: "none", fontFamily: "inherit", background: "#FFFFFF", color: "#1E293B",
                }}
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupLoading}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: "1px solid #F97316",
                  background: "transparent", color: "#F97316", fontSize: 13, fontWeight: 600,
                  cursor: lookupLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                }}
              >
                {lookupLoading ? "Looking..." : "Look me up"}
              </button>
            </div>
            {lookupMsg && (
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>{lookupMsg}</div>
            )}
            {lookupResults.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Select a previous booking:
                </div>
                {lookupResults.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => applyLookupBooking(b)}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "10px 12px",
                      background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8,
                      cursor: "pointer", marginBottom: 6, transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#F97316"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0"; }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0B2447" }}>
                      {[b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") || "No vehicle info"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {b.services || "No services listed"}
                    </div>
                    {b.date && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{b.date}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
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
          maxWidth: 960,
          maxHeight: "94vh",
          borderRadius: 20,
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* ── Header ── */}
        <div className="wizard-modal-header" style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", padding: "18px 24px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ color: "#0B2447", fontSize: 19, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                Book Your Service
              </h2>
              <p style={{ color: "#64748B", fontSize: 11, margin: "4px 0 0", lineHeight: 1.4 }}>
                We come to you. You never leave your day.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: "none",
                background: "transparent", color: "#94A3B8", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#475569"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div style={{ background: "transparent", borderBottom: "1px solid #E2E8F0", padding: "14px 24px", flexShrink: 0 }}>
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
                        background: isCompleted ? "#16A34A" : isCurrent ? "#F97316" : "#E2E8F0",
                        color: isCompleted || isCurrent ? "#fff" : "#94A3B8",
                      }}
                    >
                      {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="11 4 5.5 10 3 7.5" />
                        </svg>
                      ) : stepNum}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: isCurrent || isCompleted ? "#0B2447" : "#94A3B8", marginTop: 3 }}>{label}</span>
                  </div>
                  {i < 3 && (
                    <div style={{ flex: 1, height: 2, background: isCompleted ? "#16A34A" : "#E2E8F0", margin: "0 4px", marginBottom: 16 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", ...(!isMobile ? { display: "flex" } : {}) }}>
          {/* Left column (step content) */}
          <div style={{ padding: "20px 24px", ...(!isMobile ? { flex: "0 0 65%", minWidth: 0 } : {}) }}>

          {/* ═══ STEP 1: Services ═══ */}
          {step === 1 && (
            <div>
              {/* Division Pills */}
              <div className="wizard-division-pills" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {DIVISIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDivisionChange(d)}
                    style={{
                      padding: "7px 18px", borderRadius: 9999, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 600, flexShrink: 0,
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }} className="wizard-card-grid">
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
                            background: "#FFFFFF",
                            border: `1px solid ${hasSelections ? "#16A34A" : isExpanded ? "#F97316" : "#E2E8F0"}`,
                            boxShadow: isExpanded ? "0 2px 8px rgba(249,115,22,0.15)" : "none",
                            borderRadius: 12,
                            padding: "10px 8px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 3,
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
                          <span style={{ color: isExpanded ? "#F97316" : hasSelections ? "#16A34A" : "#0B2447" }}>
                            {getCategoryIcon(group.category)}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#0B2447", lineHeight: 1.2 }}>{group.category}</span>
                          {startPrice && (
                            <span style={{ fontSize: 10, color: "#F97316", fontWeight: 600 }}>From {startPrice}</span>
                          )}
                          {/* Arrow indicator */}
                          {isExpanded && (
                            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)" }}>
                              <svg width="16" height="8" viewBox="0 0 16 8"><polygon points="0,0 16,0 8,8" fill="#F97316" /></svg>
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
                          marginTop: 16, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12,
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
                                  background: checked ? "#FFF7ED" : "transparent", cursor: "pointer", transition: "background 0.15s",
                                }}
                              >
                                <span
                                  style={{
                                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                    border: checked ? "none" : "2px solid #CBD5E1",
                                    background: checked ? "#F97316" : "#FFFFFF",
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
                                <span style={{ flex: 1, fontSize: 14, color: "#1E293B" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>{svc.name}</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#F97316", whiteSpace: "nowrap" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>
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
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
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
                          background: "#FFFFFF", color: "#1E293B",
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

                  {/* Selection Summary (mobile only — sidebar replaces this on desktop) */}
                  {isMobile && (selectedServices.length > 0 || (otherSelected && otherText.trim())) && (
                    <div style={{
                      marginTop: 16, background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: 10,
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

              {renderLookupUI("Been here before? We can auto-fill your vehicle info.")}

              {isMarine ? (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
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
                      background: "#FFFFFF", color: "#1E293B",
                    }}
                  />

                  {/* Vessel description fields */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                      <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, whiteSpace: "nowrap" }}>Don&apos;t know your HIN? Describe your vessel.</span>
                      <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Vessel Year</label>
                        <input
                          type="number"
                          value={vesselYear}
                          onChange={(e) => setVesselYear(e.target.value)}
                          placeholder="e.g. 2020"
                          min="1950"
                          max="2027"
                          style={{
                            width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                            fontSize: 14, outline: "none", fontFamily: "inherit",
                            background: "#FFFFFF", color: "#1E293B",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Vessel Make</label>
                        <input
                          type="text"
                          value={vesselMake}
                          onChange={(e) => setVesselMake(e.target.value)}
                          placeholder="e.g. Boston Whaler"
                          style={{
                            width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                            fontSize: 14, outline: "none", fontFamily: "inherit",
                            background: "#FFFFFF", color: "#1E293B",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Vessel Model</label>
                        <input
                          type="text"
                          value={vesselModel}
                          onChange={(e) => setVesselModel(e.target.value)}
                          placeholder="e.g. Montauk 170"
                          style={{
                            width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                            fontSize: 14, outline: "none", fontFamily: "inherit",
                            background: "#FFFFFF", color: "#1E293B",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Year / Make / Model — desktop: unified search, mobile: cascading selects */}
                  {!isMobile ? (
                    <>
                      {/* Desktop: Unified YMM Search */}
                      {hasVehicleSelected && !showManualFields && !ymmFallback ? (
                        /* Selected vehicle chip */
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 8,
                              background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 9999,
                              padding: "10px 16px", fontSize: 15, fontWeight: 600, color: "#166534",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="13 4 6 12 3 9" />
                            </svg>
                            {[vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ")}
                            <button
                              type="button"
                              onClick={clearYmmSelection}
                              style={{
                                background: "none", border: "none", cursor: "pointer", color: "#166534",
                                fontSize: 16, fontWeight: 700, padding: "0 0 0 4px", lineHeight: 1,
                              }}
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      ) : ymmFallback || showManualFields ? (
                        /* Fallback / manual entry fields */
                        <div>
                          {ymmFallback && (
                            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 12 }}>
                              Can&apos;t load vehicle database. Enter your vehicle details below.
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Year</label>
                              <SearchableSelect
                                options={YEAR_OPTIONS}
                                value={vehicleYear}
                                onChange={handleYearChange}
                                placeholder="Year"
                                maxVisible={6}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Make</label>
                              <SearchableSelect
                                options={POPULAR_MAKES}
                                value={vehicleMake}
                                onChange={handleMakeChange}
                                placeholder="Make"
                                maxVisible={8}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Model</label>
                              <SearchableSelect
                                options={currentModels}
                                value={vehicleModel}
                                onChange={(val) => setVehicleModel(val)}
                                placeholder={vehicleMake ? "Model" : "Select make first"}
                                disabled={!vehicleMake}
                                maxVisible={8}
                                loading={modelsLoading}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Unified search bar */
                        <div ref={ymmDropdownRef} style={{ position: "relative" }}>
                          <div style={{ position: "relative" }}>
                            <svg
                              width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"
                              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                            >
                              <circle cx="7" cy="7" r="5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
                            </svg>
                            <input
                              type="text"
                              value={ymmSearch}
                              onChange={(e) => {
                                setYmmSearch(e.target.value);
                                setYmmDropdownOpen(true);
                              }}
                              onFocus={handleSearchFocus}
                              placeholder={prefetchLoading ? "Loading vehicle database..." : (
                                division === "RV" ? "Search your vehicle... e.g. 2022 Thor Four Winds" :
                                division === "Fleet" ? "Search your vehicle... e.g. 2023 Ford Transit" :
                                "Search your vehicle... e.g. 2024 Ford F-150"
                              )}
                              style={{
                                width: "100%", padding: "12px 14px 12px 38px", border: "1px solid #E2E8F0",
                                borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit",
                                background: "#FFFFFF", color: "#1E293B",
                              }}
                            />
                          </div>
                          {/* Manual entry link */}
                          {!ymmDropdownOpen && (
                            <button
                              type="button"
                              onClick={() => { setShowManualFields(true); }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 12, fontWeight: 500, marginTop: 6, padding: 0 }}
                            >
                              or enter details manually
                            </button>
                          )}
                          {/* Dropdown suggestions (opens downward) */}
                          {ymmDropdownOpen && (() => {
                            const suggestions = computeYmmSuggestions();
                            if (suggestions.length === 0 && ymmSearch.trim().length > 1) {
                              return (
                                <div
                                  style={{
                                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                                    background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12,
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 4, padding: "16px 20px",
                                  }}
                                >
                                  <div style={{ fontSize: 14, color: "#64748B", marginBottom: 8 }}>
                                    No matches for &ldquo;{ymmSearch.trim()}&rdquo;. Try searching by make or model name.
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { setShowManualFields(true); setYmmDropdownOpen(false); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#F97316", fontWeight: 600, fontSize: 14, padding: 0 }}
                                  >
                                    or enter details manually
                                  </button>
                                </div>
                              );
                            }
                            if (suggestions.length === 0) return null;
                            const query = ymmSearch.trim();
                            return (
                              <div
                                style={{
                                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                                  background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 4,
                                  maxHeight: 280, overflowY: "auto",
                                }}
                              >
                                {suggestions.map((s, i) => {
                                  const idx = s.display.toLowerCase().indexOf(query.toLowerCase());
                                  return (
                                    <button
                                      key={`${s.display}-${i}`}
                                      type="button"
                                      onClick={() => selectYmmSuggestion(s)}
                                      style={{
                                        display: "block", width: "100%", textAlign: "left", padding: "12px 20px",
                                        border: "none", background: "transparent", cursor: "pointer",
                                        fontSize: 15, color: "#1E293B", fontFamily: "inherit",
                                        borderBottom: i < suggestions.length - 1 ? "1px solid #F1F5F9" : "none",
                                      }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFF7ED"; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                    >
                                      {idx >= 0 && query ? (
                                        <>
                                          {s.display.slice(0, idx)}
                                          <span style={{ color: "#F97316", fontWeight: 700 }}>{s.display.slice(idx, idx + query.length)}</span>
                                          {s.display.slice(idx + query.length)}
                                        </>
                                      ) : s.display}
                                    </button>
                                  );
                                })}
                                {suggestions.length > 8 && (
                                  <div style={{ padding: "8px 20px 10px", fontSize: 12, color: "#94A3B8", textAlign: "center", borderTop: "1px solid #F1F5F9" }}>
                                    Showing 8 of {suggestions.length} results
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Mobile: Cascading native selects */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Year</label>
                          <select
                            value={vehicleYear}
                            onChange={(e) => handleYearChange(e.target.value)}
                            style={{
                              width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                              fontSize: 14, outline: "none", background: "#FFFFFF", color: "#1E293B", fontFamily: "inherit",
                            }}
                          >
                            <option value="">Select Year</option>
                            {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Make</label>
                          <select
                            value={vehicleMake}
                            onChange={(e) => handleMakeChange(e.target.value)}
                            style={{
                              width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                              fontSize: 14, outline: "none", background: "#FFFFFF", color: "#1E293B", fontFamily: "inherit",
                            }}
                          >
                            <option value="">Select Make</option>
                            {POPULAR_MAKES.map((pm) => (
                              <option key={pm} value={pm}>{pm}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Model</label>
                          <select
                            value={vehicleModel}
                            onChange={(e) => setVehicleModel(e.target.value)}
                            disabled={!vehicleMake || modelsLoading}
                            style={{
                              width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                              fontSize: 14, outline: "none", background: "#FFFFFF", color: "#1E293B", fontFamily: "inherit",
                              opacity: !vehicleMake || modelsLoading ? 0.5 : 1,
                            }}
                          >
                            <option value="">
                              {modelsLoading ? "Loading models..." : !vehicleMake ? "Select make first" : "Select Model"}
                            </option>
                            {currentModels.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                    <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>or enter your VIN</span>
                    <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                  </div>

                  {/* VIN input + scan */}
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>VIN</label>
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
                        background: "#FFFFFF", color: "#1E293B",
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", marginBottom: 12 }}>
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
                </>
              )}
            </div>
          )}

          {/* ═══ STEP 3: Your Details ═══ */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0B2447", margin: "0 0 4px" }}>Your Details</h3>

              {/* "Been here before?" sign-in link */}
              {renderLookupUI("Been here before? Sign in to auto-fill your details.")}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your full name"
                  style={{
                    width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                    fontSize: 14, outline: "none", fontFamily: "inherit",
                    background: "#FFFFFF", color: "#1E293B",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Phone *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(555) 555-5555"
                    style={{
                      width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                      background: "#FFFFFF", color: "#1E293B",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                      background: "#FFFFFF", color: "#1E293B",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Preferred Date</label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    style={{
                      width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                      background: "#FFFFFF", color: "#1E293B",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Preferred Time</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    style={{
                      width: "100%", padding: "12px 10px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#FFFFFF", color: "#1E293B", fontFamily: "inherit",
                    }}
                  >
                    <option value="" style={{ background: "#fff", color: "#1E293B" }}>Select time</option>
                    {TIME_SLOTS.map((t) => <option key={t.value} value={t.value} style={{ background: "#fff", color: "#1E293B" }}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Anything else we should know?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, location details, etc."
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                    fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit",
                    background: "#FFFFFF", color: "#1E293B",
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
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Services</span>
                  <button type="button" onClick={() => setStep(1)} style={{ fontSize: 12, fontWeight: 600, color: "#F97316", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                </div>
                {selectedServices.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: 13, color: "#1E293B" }}>{s.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#F97316" }}>
                      {s.price != null ? (s.price % 1 === 0 ? `$${s.price}` : `$${s.price.toFixed(2)}`) : "Quote"}
                    </span>
                  </div>
                ))}
                {otherSelected && otherText.trim() && (
                  <div style={{ padding: "4px 0", fontSize: 13, color: "#475569" }}>Other: {otherText}</div>
                )}
              </div>

              {/* Vehicle card */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{isMarine ? "Vessel" : "Vehicle"}</span>
                  <button type="button" onClick={() => setStep(2)} style={{ fontSize: 12, fontWeight: 600, color: "#F97316", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                </div>
                {(vehicleYear || vehicleMake || vehicleModel) && (
                  <div style={{ fontSize: 13, color: "#1E293B", marginBottom: 4 }}>
                    {[vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ")}
                  </div>
                )}
                {vinOrHull && (
                  <div style={{ fontSize: 13, color: "#475569" }}>{isMarine ? "HIN" : "VIN"}: {vinOrHull}</div>
                )}
                {isMarine && (vesselYear || vesselMake || vesselModel) && (
                  <div style={{ fontSize: 13, color: "#1E293B", marginTop: 4 }}>
                    {[vesselYear, vesselMake, vesselModel].filter(Boolean).join(" ")}
                  </div>
                )}
                {!vehicleYear && !vehicleMake && !vehicleModel && !vinOrHull && !(isMarine && (vesselYear || vesselMake || vesselModel)) && (
                  <div style={{ fontSize: 13, color: "#94A3B8" }}>Not provided</div>
                )}
              </div>

              {/* Contact & Schedule card */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Contact & Schedule</span>
                  <button type="button" onClick={() => setStep(3)} style={{ fontSize: 12, fontWeight: 600, color: "#F97316", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                </div>
                <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.8 }}>
                  <div>{customerName}</div>
                  <div>{customerPhone}</div>
                  {customerEmail && <div>{customerEmail}</div>}
                  {preferredDate && <div>Date: {preferredDate}</div>}
                  {preferredTime && <div>Time: {TIME_SLOTS.find((t) => t.value === preferredTime)?.label}</div>}
                  {notes && <div style={{ marginTop: 6, color: "#475569" }}>Notes: {notes}</div>}
                </div>
              </div>

              {/* Estimated Total */}
              <div style={{ background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
                We will reach out within 2 hours to confirm your appointment.
              </p>
            </div>
          )}
          </div>{/* end left column */}

          {/* ── Desktop Sidebar ── */}
          {!isMobile && (
            <div style={{
              flex: "0 0 35%", borderLeft: "1px solid #E2E8F0", background: "#F8FAFC",
              padding: 20, position: "sticky", top: 0, alignSelf: "flex-start",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0B2447", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
                Your Selection
              </div>

              {selectedServices.length === 0 && !(otherSelected && otherText.trim()) ? (
                <div style={{ fontSize: 13, color: "#94A3B8" }}>Pick services to get started</div>
              ) : (
                <>
                  {/* Grouped services */}
                  {Object.entries(
                    selectedServices.reduce<Record<string, SubService[]>>((acc, svc) => {
                      if (!acc[svc.category]) acc[svc.category] = [];
                      acc[svc.category].push(svc);
                      return acc;
                    }, {})
                  ).map(([category, svcs]) => (
                    <div key={category} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>
                        {category}
                      </div>
                      {svcs.map((svc) => (
                        <div key={svc.id} style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
                          <span style={{ fontSize: 13, color: "#1E293B", flex: 1 }}>{svc.name}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#F97316", marginRight: 8, whiteSpace: "nowrap" }}>
                            {svc.price != null ? (svc.price % 1 === 0 ? `$${svc.price}` : `$${svc.price.toFixed(2)}`) : "Quote"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleService(svc)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 14, padding: "0 2px", lineHeight: 1 }}
                          >
                            &#x2715;
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* "Something Else" in sidebar */}
                  {otherSelected && otherText.trim() && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>
                        Other
                      </div>
                      <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
                        <span style={{ fontSize: 13, color: "#1E293B", flex: 1 }}>{otherText}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F97316", marginRight: 8 }}>Quote</span>
                        <button
                          type="button"
                          onClick={() => { setOtherSelected(false); setOtherText(""); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 14, padding: "0 2px", lineHeight: 1 }}
                        >
                          &#x2715;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: 1, background: "#E2E8F0", margin: "12px 0" }} />

                  {/* Estimated Total */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0B2447" }}>Estimated Total</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#F97316" }}>
                      {selectedTotal > 0 ? `$${selectedTotal.toFixed(2)}${hasNullPriced ? "+" : ""}` : "Quote"}
                    </span>
                  </div>

                  {/* Vehicle info (steps 2-4) */}
                  {step >= 2 && (vehicleYear || vehicleMake || vehicleModel) && (
                    <div style={{ marginTop: 16, fontSize: 13, color: "#475569" }}>
                      {[vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ")}
                    </div>
                  )}

                  {/* Contact name (steps 3-4) */}
                  {step >= 3 && customerName && (
                    <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>
                      {customerName}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom Navigation ── */}
        {!submitted && (
          <div className="wizard-modal-nav" style={{
            borderTop: "1px solid #E2E8F0", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
            background: "#FFFFFF",
          }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: "1px solid #E2E8F0",
                  background: "#FFFFFF", color: "#475569", fontSize: 14, fontWeight: 600, cursor: "pointer",
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
                background: !canNext() || submitting ? "#E2E8F0" : "#F97316",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: !canNext() || submitting ? "not-allowed" : "pointer",
                boxShadow: canNext() && !submitting && step === 4 ? "0 0 20px rgba(249,115,22,0.4)" : "none",
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
            position: "relative", width: "100%", maxWidth: 480, maxHeight: "80vh",
            background: "#FFFFFF",
            borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)", border: "1px solid #E2E8F0",
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
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", background: "transparent", color: "#1E293B" }}
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
                        cursor: "pointer", background: checked ? "#FFF7ED" : "transparent",
                      }}
                    >
                      <span
                        style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: checked ? "none" : "2px solid #CBD5E1",
                          background: checked ? "#F97316" : "#FFFFFF",
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
                      <span style={{ flex: 1, fontSize: 14, color: "#1E293B" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>{svc.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#F97316" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>
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
                  background: "#F97316", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
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
        .wizard-modal-card input::placeholder,
        .wizard-modal-card textarea::placeholder { color: #94A3B8 !important; }
        .wizard-modal-card select { color-scheme: light; }
        @media (max-width: 959px) {
          .wizard-modal-card {
            margin: 0 12px !important;
          }
        }
        @media (max-width: 639px) {
          .wizard-modal-card {
            max-width: 100% !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            height: 100dvh;
            height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
            margin: 0 !important;
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
          @supports (height: 100dvh) {
            .wizard-modal-card {
              height: 100dvh !important;
              max-height: 100dvh !important;
            }
          }
          .wizard-modal-header {
            padding-top: max(18px, env(safe-area-inset-top)) !important;
          }
          .wizard-modal-nav {
            padding-bottom: max(14px, env(safe-area-inset-bottom)) !important;
          }
          .wizard-division-pills {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .wizard-division-pills::-webkit-scrollbar { display: none; }
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
