"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, limit as firestoreLimit, getDoc, doc, setDoc } from "firebase/firestore";
import { useServices, type Service } from "@/hooks/useServices";
import { groupByCategory } from "@/lib/serviceHelpers";
import { decodeVIN as decodeVINApi, getFuelCategory } from "@/lib/vehicleApi";
import SearchableSelect from "./SearchableSelect";
import VehicleSelector from "./booking/VehicleSelector";

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
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  fuelType: string;
  services: string;
  date: string;
  sortKey: number;
}

/* ─── Phone helpers ──────────────────────────────────────── */

function formatPhoneDisplay(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
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

const FUEL_TYPES = ["Gas", "Diesel", "Hybrid", "Electric"] as const;

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

/* ─── Fee config type ─────────────────────────────────────── */

interface FeeConfig {
  enabled: boolean;
  amount: number;
  label: string;
  taxable: boolean;
  waiveFirstService: boolean;
  promoOverride?: { label: string; discount: number; startDate: string; endDate: string } | null;
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
  const [packagesExpanded, setPackagesExpanded] = useState(false);

  /* ── Step 1: Vehicle (was Step 2) ── */
  const [vinOrHull, setVinOrHull] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleTrim, setVehicleTrim] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinDecoded, setVinDecoded] = useState(false);
  const [vinDecodeError, setVinDecodeError] = useState("");
  const vinAbortRef = useRef<AbortController | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  /* ── Convenience fee ── */
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null);
  const [feeWaived, setFeeWaived] = useState(false);

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

  /* ── Typeahead display value ── */
  const [typeaheadValue, setTypeaheadValue] = useState("");

  /* ── Vehicle text search (public wizard) ── */
  const [vehicleSearchText, setVehicleSearchText] = useState("");
  const [showManualDropdowns, setShowManualDropdowns] = useState(false);

  /* ── Marine vessel description ── */
  const [vesselYear, setVesselYear] = useState("");
  const [vesselMake, setVesselMake] = useState("");
  const [vesselModel, setVesselModel] = useState("");

  /* ── Step 3: Details ── */
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [contactPreference, setContactPreference] = useState<"call" | "text" | "email">("call");
  const [address, setAddress] = useState("");
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

  /* ── Coastal Packages (auto division only) ── */
  const coastalPackages = divKey === "auto"
    ? allServices.filter((s) => s.type === "package" && s.division === "auto").sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];

  /* ── Build category groups ── */
  const categoryGroups: CategoryGroup[] = (() => {
    const divServices = allServices.filter((s) => s.division === divKey && s.type !== "package");
    if (divServices.length > 0) {
      const grouped = groupByCategory(divServices);
      const groups: CategoryGroup[] = grouped
        .filter((g) => !/labor\s*rate/i.test(g.category))
        .filter((g) => !/coastal\s*packages?/i.test(g.category))
        .filter((g) => !(divKey === "marine" && /marine\s*brakes/i.test(g.category)))
        .map((g) => ({
          category: g.category,
          services: g.services.map((s) => ({
            id: s.id,
            name: s.displayName || s.name,
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
  const feeAmount = feeConfig?.enabled && !feeWaived ? feeConfig.amount : 0;
  const estimatedTotal = selectedTotal + feeAmount;

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

  /* ── Load convenience fee config ── */
  useEffect(() => {
    async function loadFees() {
      try {
        const snap = await getDoc(doc(db, "settings", "fees"));
        if (snap.exists()) {
          const data = snap.data()?.convenienceFee;
          if (data) setFeeConfig(data);
        } else {
          const defaultFee: FeeConfig = {
            enabled: true, amount: 39.95, label: "Mobile Service Fee",
            taxable: false, waiveFirstService: true, promoOverride: null,
          };
          await setDoc(doc(db, "settings", "fees"), { convenienceFee: defaultFee });
          setFeeConfig(defaultFee);
        }
      } catch { /* silent */ }
    }
    loadFees();
  }, []);

  /* ── First-time customer check (triggers on Step 3 phone/email input) ── */
  useEffect(() => {
    if (step !== 3) return;

    const phone = customerPhone.replace(/\D/g, "");
    const email = customerEmail.trim().toLowerCase();

    if (!phone && !email) return;

    const timer = setTimeout(async () => {
      try {
        let found = false;
        for (const field of ["phone", "email"] as const) {
          const val = field === "phone" ? phone : email;
          if (!val || (field === "phone" && val.length < 7)) continue;
          const q = query(collection(db, "customers"), where(field, "==", val), firestoreLimit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            found = true;
            break;
          }
        }
        setFeeWaived(!found && !!feeConfig?.waiveFirstService);
      } catch { /* silent */ }
    }, 500);

    return () => clearTimeout(timer);
  }, [step, customerPhone, customerEmail, feeConfig?.waiveFirstService]);

  /* ── Fuel category for service steering ── */
  const fuelCategory = getFuelCategory(fuelType);

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
    setVehicleSearchText("");
    setShowManualDropdowns(false);
    setTypeaheadValue("");
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

  /* ── Vehicle text search parser ── */
  const parseVehicleText = (text: string) => {
    const words = text.trim().split(/\s+/);
    let year = '';
    let make = '';
    let model = '';
    let trim = '';

    const yearIdx = words.findIndex(w => /^(19|20)\d{2}$/.test(w));
    if (yearIdx !== -1) {
      year = words[yearIdx];
      words.splice(yearIdx, 1);
    }

    const makes = [
      'Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chevy',
      'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda',
      'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover',
      'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'McLaren', 'Mercedes', 'Mercedes-Benz',
      'Mini', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Rivian', 'Rolls-Royce',
      'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'VW', 'Volvo',
    ];

    const makeIdx = words.findIndex(w =>
      makes.some(m => m.toLowerCase() === w.toLowerCase())
    );

    if (makeIdx !== -1) {
      const matched = words[makeIdx];
      if (matched.toLowerCase() === 'chevy') make = 'Chevrolet';
      else if (matched.toLowerCase() === 'vw') make = 'Volkswagen';
      else if (matched.toLowerCase() === 'mercedes') make = 'Mercedes-Benz';
      else make = makes.find(m => m.toLowerCase() === matched.toLowerCase()) || matched;
      words.splice(makeIdx, 1);
    }

    if (words.length > 0) {
      model = words[0];
      if (words.length > 1) {
        trim = words.slice(1).join(' ');
      }
    }

    return { year, make, model, trim };
  };

  const handleVehicleTextBlur = () => {
    if (!vehicleSearchText.trim()) return;
    const parsed = parseVehicleText(vehicleSearchText);
    if (parsed.year) setVehicleYear(parsed.year);
    if (parsed.make) setVehicleMake(parsed.make);
    if (parsed.model) setVehicleModel(parsed.model);
    if (parsed.trim) setVehicleTrim(parsed.trim);
  };

  /* ── VIN decode handler (button-triggered) ── */
  async function handleVinDecode() {
    const cleaned = vinOrHull.replace(/\s/g, "");
    if (cleaned.length !== 17) return;
    setVinDecoding(true);
    setVinDecoded(false);
    setVinDecodeError("");
    try {
      const result = await decodeVINApi(cleaned);
      if (result) {
        setVehicleYear(result.year);
        setVehicleMake(result.make);
        setVehicleModel(result.model);
        setVehicleTrim(result.trim);
        setFuelType(result.fuelType || "Gas");
        setTypeaheadValue([result.year, result.make, result.model, result.trim].filter(Boolean).join(" "));
        setVinDecoded(true);
      } else {
        setVinDecodeError("Could not decode VIN. Enter vehicle details manually.");
      }
    } catch {
      setVinDecodeError("Could not decode VIN. Enter vehicle details manually.");
    } finally {
      setVinDecoding(false);
    }
  }

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
    if (step === 1) {
      if (isMarine) return true;
      const vehicleComplete = vehicleYear.length > 0 && vehicleMake.length > 0 && vehicleModel.length > 0 && fuelType.length > 0;
      return vehicleComplete || needsConfirmation;
    }
    if (step === 2) return selectedServices.length > 0 || (otherSelected && otherText.trim().length > 0);
    if (step === 3) return customerFirstName.trim().length > 0 && customerLastName.trim().length > 0 && customerPhone.trim().length > 0;
    return true;
  }

  /* ── Submit ── */
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const serviceNames = selectedServices.map((s) => s.name);
      if (otherSelected && otherText.trim()) serviceNames.push(`Other: ${otherText.trim()}`);

      const phone = customerPhone.replace(/\D/g, "");
      const email = customerEmail.trim().toLowerCase();

      // Check for existing customer by phone or email
      let customerId: string | null = null;
      try {
        for (const field of ["phone", "email"] as const) {
          const val = field === "phone" ? phone : email;
          if (!val) continue;
          const q = query(collection(db, "customers"), where(field, "==", val), firestoreLimit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            customerId = snap.docs[0].id;
            // Check if first-time customer (for fee waiving)
            break;
          }
        }

        // Create customer if not found
        if (!customerId) {
          const custDoc = await addDoc(collection(db, "customers"), {
            name: `${customerFirstName.trim()} ${customerLastName.trim()}`,
            firstName: customerFirstName.trim(),
            lastName: customerLastName.trim(),
            phone,
            email,
            address: address.trim(),
            totalBookings: 0,
            createdAt: serverTimestamp(),
          });
          customerId = custDoc.id;
          // Waive fee for first-time customer
          if (feeConfig?.waiveFirstService) setFeeWaived(true);
        }
      } catch { /* customer dedup is best-effort */ }

      const finalFeeWaived = feeWaived || (feeConfig?.waiveFirstService && !customerId);
      const finalFeeAmount = feeConfig?.enabled && !finalFeeWaived ? feeConfig.amount : 0;

      await addDoc(collection(db, "bookings"), {
        division: divKey,
        service: serviceNames.join(", "),
        selectedServices: selectedServices.map((s) => ({ id: s.id, name: s.name, price: s.price, category: s.category, division: divKey })),
        otherDescription: otherSelected ? otherText.trim() : "",
        vinOrHull: vinOrHull.trim(),
        vehicleYear: vehicleYear.trim(),
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleTrim: vehicleTrim.trim(),
        fuelType,
        vin: vinOrHull.trim(),
        needsConfirmation: needsConfirmation || false,
        vesselYear: vesselYear.trim(),
        vesselMake: vesselMake.trim(),
        vesselModel: vesselModel.trim(),
        firstName: customerFirstName.trim(),
        lastName: customerLastName.trim(),
        name: `${customerFirstName.trim()} ${customerLastName.trim()}`,
        phone,
        email,
        contactPreference,
        address: address.trim(),
        preferredDate,
        timeWindow: preferredTime,
        notes: notes.trim(),
        convenienceFee: {
          amount: finalFeeWaived ? 0 : (feeConfig?.amount || 0),
          waived: !!finalFeeWaived,
          label: feeConfig?.label || "Mobile Service Fee",
        },
        totalEstimate: selectedTotal + finalFeeAmount,
        customerId: customerId || null,
        source: "Website",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
    setVehicleTrim("");
    setFuelType("");
    setNeedsConfirmation(false);
    setVinDecoded(false);
    setVinDecodeError("");
    setFeeWaived(false);
    setVesselYear("");
    setVesselMake("");
    setVesselModel("");
    setCustomerFirstName("");
    setCustomerLastName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setPreferredDate("");
    setPreferredTime("");
    setContactPreference("call");
    setAddress("");
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
    setVehicleSearchText("");
    setShowManualDropdowns(false);
    setTypeaheadValue("");
    setLookupOpen(false);
    setLookupPhone("");
    setLookupLoading(false);
    setLookupMsg("");
    setLookupDone(false);
    setLookupResults([]);
  }

  /* ── "Been here before?" lookup ── */
  async function handleLookup() {
    const digits = phoneDigits(lookupPhone);
    if (digits.length < 7) return;
    setLookupLoading(true);
    setLookupMsg("");
    setLookupResults([]);

    function mapDoc(doc: import("firebase/firestore").QueryDocumentSnapshot): LookupBooking {
      const d = doc.data();
      const svcs = (d.selectedServices || []).map((s: { name?: string }) => s.name || "").filter(Boolean).join(", ");
      const ts = d.createdAt?.toDate?.();
      // Prefer split firstName/lastName; fall back to splitting legacy combined name on first space
      let firstName = d.firstName || "";
      let lastName = d.lastName || "";
      if (!firstName && !lastName) {
        const combined = (d.name || d.customerName || "").trim();
        if (combined) {
          const parts = combined.split(/\s+/);
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ");
        }
      }
      return {
        id: doc.id,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerPhone: d.phone || d.customerPhone || "",
        customerEmail: d.email || d.customerEmail || "",
        vehicleYear: d.vehicleYear || "",
        vehicleMake: d.vehicleMake || "",
        vehicleModel: d.vehicleModel || "",
        fuelType: d.fuelType || "Gas",
        services: svcs,
        date: ts ? ts.toLocaleDateString() : "",
        sortKey: ts ? ts.getTime() : 0,
      };
    }

    try {
      // Try "phone" field first (current schema), then "customerPhone" (legacy)
      let results: LookupBooking[] = [];

      for (const field of ["phone", "customerPhone"] as const) {
        if (results.length > 0) break;
        const q = query(
          collection(db, "bookings"),
          where(field, "==", digits),
          firestoreLimit(10),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          results = snap.docs.map(mapDoc);
        }
      }

      // Client-side normalized match: if exact query found nothing,
      // the stored phone might have formatting chars — fetch recent bookings and compare digits
      if (results.length === 0) {
        const recentQ = query(
          collection(db, "bookings"),
          where("status", "==", "pending"),
          firestoreLimit(10),
        );
        const recentSnap = await getDocs(recentQ);
        if (!recentSnap.empty) {
          results = recentSnap.docs
            .map(mapDoc)
            .filter((b) => phoneDigits(b.customerPhone) === digits);
        }
      }

      if (results.length > 0) {
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
    // Set customer identity fields
    if (b.customerFirstName) setCustomerFirstName(b.customerFirstName);
    if (b.customerLastName) setCustomerLastName(b.customerLastName);
    if (b.customerPhone) setCustomerPhone(formatPhoneDisplay(b.customerPhone));
    if (b.customerEmail && !customerEmail) setCustomerEmail(b.customerEmail);
    // Populate vehicle fields from previous booking
    if (b.vehicleYear) setVehicleYear(b.vehicleYear);
    if (b.vehicleMake) setVehicleMake(b.vehicleMake);
    if (b.vehicleModel) setVehicleModel(b.vehicleModel);
    if (b.fuelType) setFuelType(b.fuelType);
    setNeedsConfirmation(false);
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
                onChange={(e) => setLookupPhone(formatPhoneDisplay(e.target.value))}
                placeholder="(555) 555-5555"
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
  const steps = ["Vehicle", "Services", "Details", "Review"];

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
                Pick your service, your vehicle, and a time. Takes about a minute.
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
          <div style={{ padding: "20px 24px", ...(!isMobile ? (step === 1 ? { flex: 1, maxWidth: 672, margin: "0 auto", minWidth: 0 } : { flex: "0 0 65%", minWidth: 0 }) : {}) }}>

          {/* ═══ STEP 2: Services ═══ */}
          {step === 2 && (
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

              {/* Coastal Packages (auto only) -- collapsible */}
              {coastalPackages.length > 0 && !servicesLoading && (
                <div style={{ marginBottom: 20 }}>
                  <button
                    type="button"
                    onClick={() => setPackagesExpanded((p) => !p)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#FFF7ED",
                      border: "1px solid #FDBA74",
                      borderRadius: 12,
                      padding: "12px 14px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0B2447" }}>Bundle and save with Coastal Packages</span>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ transition: "transform 0.2s", transform: packagesExpanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
                    >
                      <polyline points="4 6 8 10 12 6" />
                    </svg>
                  </button>
                  {packagesExpanded && (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                        {coastalPackages.map((pkg) => {
                          const isSelected = isServiceSelected(pkg.id);
                          return (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => toggleService({ id: pkg.id, name: pkg.displayName || pkg.name, price: pkg.price, category: "Coastal Packages" })}
                              style={{
                                position: "relative",
                                background: isSelected ? "#FFF7ED" : "#FFFFFF",
                                border: `1px solid ${isSelected ? "#F97316" : "#E2E8F0"}`,
                                borderRadius: 12,
                                padding: "12px 14px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                textAlign: "left",
                                transition: "all 0.15s",
                              }}
                            >
                              <span
                                style={{
                                  width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                                  border: isSelected ? "none" : "2px solid #CBD5E1",
                                  background: isSelected ? "#F97316" : "#FFFFFF",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                              >
                                {isSelected && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 3 5 9 3 7" />
                                  </svg>
                                )}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0B2447" }}>{pkg.displayName || pkg.name}</span>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "#F97316", whiteSpace: "nowrap", marginLeft: 8 }}>${pkg.price.toFixed(2)}</span>
                                </div>
                                {pkg.featured && (
                                  <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: "#fff", background: "#F97316", borderRadius: 4, padding: "1px 6px", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Most Popular
                                  </span>
                                )}
                                <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none" }}>
                                  {pkg.bundleItems.map((item: string, i: number) => (
                                    <li key={i} style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, display: "flex", alignItems: "baseline", gap: 5 }}>
                                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#94A3B8", flexShrink: 0, marginTop: 5, display: "inline-block" }} />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                        <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                        <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, whiteSpace: "nowrap" }}>Or choose individual services</span>
                        <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Collapsible Accordion Categories */}
              {servicesLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 32, height: 32, border: "3px solid #E2E8F0", borderTopColor: "#0B2447", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </div>
              ) : (
                <>
                  {/* EV notice */}
                  {fuelCategory === "electric" && (
                    <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1E40AF" }}>
                      Electric vehicles don&apos;t need oil changes. Here are the services available for your EV.
                    </div>
                  )}
                  {/* Hybrid notice */}
                  {fuelCategory === "hybrid" && (
                    <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#166534" }}>
                      Hybrid vehicles may have different oil requirements. Please confirm specifics with our technician.
                    </div>
                  )}

                  {/* Accordion sections */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {(() => {
                      // Determine category sort/filter/dim based on fuel type
                      let groups = [...categoryGroups];
                      const isDieselCat = (cat: string) => /diesel/i.test(cat);
                      const isOilCat = (cat: string) => /oil/i.test(cat);

                      if (fuelCategory === "electric") {
                        // Hide oil and diesel categories
                        groups = groups.filter((g) => !isOilCat(g.category) && !isDieselCat(g.category));
                      } else if (fuelCategory === "diesel") {
                        // Promote diesel to top
                        const diesel = groups.filter((g) => isDieselCat(g.category));
                        const rest = groups.filter((g) => !isDieselCat(g.category));
                        groups = [...diesel, ...rest];
                      }

                      return groups.map((group) => {
                        const isOther = /else|other/i.test(group.category);
                        const isDiesel = isDieselCat(group.category);
                        const isExpanded = expandedCategory === group.category;
                        const count = countForCategory(group.category);
                        const startPrice = getStartingPrice(group);
                        const isDimmed = isDiesel && fuelCategory === "gas";

                        if (isOther) {
                          return (
                            <div key={group.category} style={{ marginBottom: 8 }}>
                              <button
                                type="button"
                                onClick={() => setOtherSelected((p) => !p)}
                                style={{
                                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                                  padding: "14px 20px", border: "1px solid #E2E8F0", borderRadius: 12,
                                  background: otherSelected ? "#FFF7ED" : "#FFFFFF", cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                              >
                                <span style={{ fontSize: 15, fontWeight: 600, color: "#0B2040" }}>Something Else</span>
                                {otherSelected && (
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="13 4 6 12 3 9" />
                                  </svg>
                                )}
                              </button>
                              {otherSelected && (
                                <div style={{ padding: "12px 20px", borderLeft: "1px solid #E2E8F0", borderRight: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", borderRadius: "0 0 12px 12px", marginTop: -4 }}>
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
                            </div>
                          );
                        }

                        return (
                          <div key={group.category} style={{ marginBottom: 8 }}>
                            {/* Accordion header */}
                            <button
                              type="button"
                              onClick={() => setExpandedCategory(isExpanded ? null : group.category)}
                              style={{
                                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "14px 20px", border: "1px solid #E2E8F0", borderRadius: 12,
                                background: count > 0 ? "#FFF7ED" : "#FFFFFF", cursor: "pointer",
                                opacity: isDimmed ? 0.5 : 1,
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => { if (!isDimmed) (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = count > 0 ? "#FFF7ED" : "#FFFFFF"; }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 15, fontWeight: 600, color: isDimmed ? "#9CA3AF" : "#0B2040" }}>
                                  {group.category}
                                </span>
                                {count > 0 && (
                                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                    {count}
                                  </span>
                                )}
                                {isDimmed && (
                                  <span style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic" }}>(for diesel vehicles only)</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {!isExpanded && startPrice && (
                                  <span style={{ fontSize: 14, fontWeight: 500, color: "#E07B2D" }}>From {startPrice}</span>
                                )}
                                <svg
                                  width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={isDimmed ? "#9CA3AF" : "#475569"}
                                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                  style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
                                >
                                  <polyline points="4 6 8 10 12 6" />
                                </svg>
                              </div>
                            </button>

                            {/* Expanded service list */}
                            {isExpanded && group.hasSubServices && (
                              <div style={{ borderLeft: "1px solid #E2E8F0", borderRight: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", borderRadius: "0 0 12px 12px", marginTop: -4, overflow: "hidden", animation: "fadeIn 0.2s ease-out" }}>
                                {group.services.map((svc, si) => {
                                  const checked = isServiceSelected(svc.id);
                                  const svcIsDiesel = isDiesel && fuelCategory === "gas";
                                  return (
                                    <label
                                      key={svc.id}
                                      style={{
                                        display: "flex", alignItems: "center", gap: 10, padding: "12px 20px",
                                        background: checked ? "#FFF7ED" : "transparent", cursor: "pointer",
                                        borderBottom: si < group.services.length - 1 ? "1px solid #F1F5F9" : "none",
                                        transition: "background 0.15s",
                                        opacity: svcIsDiesel ? 0.5 : 1,
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
                                      <div style={{ flex: 1 }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>
                                        <span style={{ fontSize: 14, fontWeight: 500, color: "#0B2040" }}>{svc.name}</span>
                                      </div>
                                      <span style={{ fontSize: 14, fontWeight: 600, color: "#E07B2D", whiteSpace: "nowrap" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>
                                        {svc.price != null ? (svc.price % 1 === 0 ? `$${svc.price}` : `$${svc.price.toFixed(2)}`) : "Quote"}
                                      </span>
                                    </label>
                                  );
                                })}
                                {/* Diesel warning if gas vehicle selects diesel service */}
                                {isDiesel && fuelCategory === "gas" && selectedServices.some((s) => s.category === group.category) && (
                                  <div style={{ padding: "8px 20px", background: "#FFFBEB", borderTop: "1px solid #FDE68A", fontSize: 12, color: "#92400E" }}>
                                    This service is typically for diesel vehicles. Your vehicle uses gas.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
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
                        {estimatedTotal > 0 ? `$${estimatedTotal.toFixed(2)}${hasNullPriced ? "+" : ""}` : "Quote"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ STEP 1: Vehicle ═══ */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0B2447", margin: "0 0 16px" }}>
                {isMarine ? "Vessel Information" : "Your Vehicle"}
              </h3>

              {!isMarine ? (
                <>
                  {/* Phone lookup panel (expanded when triggered from VehicleSelector) */}
                  {lookupOpen && !lookupDone && (
                    <div style={{ background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="tel"
                          value={lookupPhone}
                          onChange={(e) => setLookupPhone(formatPhoneDisplay(e.target.value))}
                          placeholder="(555) 555-5555"
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

                  <VehicleSelector
                    value={{
                      year: vehicleYear,
                      make: vehicleMake,
                      model: vehicleModel,
                      fuelType,
                      vin: vinOrHull,
                      needsConfirmation,
                    }}
                    onChange={(v) => {
                      setVehicleYear(v.year || "");
                      setVehicleMake(v.make || "");
                      setVehicleModel(v.model || "");
                      setFuelType(v.fuelType || "");
                      setVinOrHull(v.vin || "");
                      setNeedsConfirmation(!!v.needsConfirmation);
                    }}
                    onLookupByPhone={() => setLookupOpen(true)}
                  />
                </>
              ) : (
                <>
                  {renderLookupUI("Been here before? We can auto-fill your vessel info.")}

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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>First name *</label>
                  <input
                    type="text"
                    value={customerFirstName}
                    onChange={(e) => setCustomerFirstName(e.target.value)}
                    placeholder="First name"
                    style={{
                      width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                      background: "#FFFFFF", color: "#1E293B",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Last name *</label>
                  <input
                    type="text"
                    value={customerLastName}
                    onChange={(e) => setCustomerLastName(e.target.value)}
                    placeholder="Last name"
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
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Phone *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(formatPhoneDisplay(e.target.value))}
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

              {/* Contact Preference */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Best way to reach you</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["call", "text", "email"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setContactPreference(opt)}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        border: contactPreference === opt ? "2px solid #F97316" : "1px solid #E2E8F0",
                        background: contactPreference === opt ? "#FFF7ED" : "#FFFFFF",
                        color: contactPreference === opt ? "#F97316" : "#64748B",
                        cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Address */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Service Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Where should we come? (street address or cross streets)"
                  style={{
                    width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
                    fontSize: 14, outline: "none", fontFamily: "inherit",
                    background: "#FFFFFF", color: "#1E293B",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Anything else we should know?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g.: Keys will be at reception, ask for Ana. Call (813) 555-1234 upon arrival. Access code: #1234. Car is on parking level 2, spot 45."
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

              {/* Vehicle card */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{isMarine ? "Vessel" : "Vehicle"}</span>
                  <button type="button" onClick={() => setStep(1)} style={{ fontSize: 12, fontWeight: 600, color: "#F97316", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                </div>
                {(vehicleYear || vehicleMake || vehicleModel) && (
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0B2447", marginBottom: 4 }}>
                    {[vehicleYear, vehicleMake, vehicleModel, vehicleTrim].filter(Boolean).join(" ")}{fuelType ? ` (${fuelType})` : ""}
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
                {needsConfirmation && (
                  <div style={{ marginTop: 8, background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#92400E" }}>
                    Vehicle details unconfirmed - we will confirm on the call
                  </div>
                )}
              </div>

              {/* Services card */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Services</span>
                  <button type="button" onClick={() => setStep(2)} style={{ fontSize: 12, fontWeight: 600, color: "#F97316", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
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
                {/* Convenience fee */}
                {feeConfig?.enabled && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderTop: "1px solid #E2E8F0", marginTop: 6, paddingTop: 8 }}>
                    <span style={{ fontSize: 13, color: "#1E293B" }}>{feeConfig.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: feeWaived ? "#16A34A" : "#F97316" }}>
                      {feeWaived ? (
                        <><span style={{ textDecoration: "line-through", color: "#94A3B8", marginRight: 6 }}>${feeConfig.amount.toFixed(2)}</span>FREE</>
                      ) : `$${feeConfig.amount.toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact & Schedule card */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Contact & Schedule</span>
                  <button type="button" onClick={() => setStep(3)} style={{ fontSize: 12, fontWeight: 600, color: "#F97316", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                </div>
                <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.8 }}>
                  <div>{`${customerFirstName} ${customerLastName}`.trim()}</div>
                  <div>{formatPhoneDisplay(customerPhone)}</div>
                  {customerEmail && <div>{customerEmail}</div>}
                  <div>Contact: {contactPreference}</div>
                  {address && <div>Address: {address}</div>}
                  {preferredDate && <div>Date: {preferredDate}</div>}
                  {preferredTime && <div>Time: {TIME_SLOTS.find((t) => t.value === preferredTime)?.label}</div>}
                  {notes && <div style={{ marginTop: 6, color: "#475569" }}>Notes: {notes}</div>}
                </div>
              </div>

              {/* Estimated Total */}
              <div style={{ background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0B2447" }}>Estimated Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#F97316" }}>
                  {estimatedTotal > 0 ? `$${estimatedTotal.toFixed(2)}${hasNullPriced ? "+" : ""}` : "Quote on-site"}
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

          {/* ── Desktop Sidebar (hidden on Step 1) ── */}
          {!isMobile && step > 1 && (
            <div style={{
              flex: "0 0 35%", borderLeft: "1px solid #E2E8F0", background: "#FFFFFF",
              padding: 20, position: "sticky", top: 0, alignSelf: "flex-start",
            }}>
              <div style={{
                background: "#FFFFFF", borderRadius: 14, padding: 20,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
                border: "1px solid #F1F5F9",
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

                  {/* Convenience Fee */}
                  {feeConfig?.enabled && selectedServices.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", padding: "4px 0", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "#1E293B", flex: 1 }}>{feeConfig.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: feeWaived ? "#16A34A" : "#F97316", whiteSpace: "nowrap" }}>
                        {feeWaived ? (
                          <><span style={{ textDecoration: "line-through", color: "#94A3B8", marginRight: 4 }}>${feeConfig.amount.toFixed(2)}</span><span style={{ fontSize: 11, fontWeight: 700 }}>FREE</span></>
                        ) : `$${feeConfig.amount.toFixed(2)}`}
                      </span>
                      {/* No remove button — customer cannot opt out */}
                    </div>
                  )}
                  {feeWaived && feeConfig?.waiveFirstService && (
                    <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 500, marginBottom: 8 }}>
                      FREE - first service
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: 1, background: "#E2E8F0", margin: "12px 0" }} />

                  {/* Estimated Total */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0B2447" }}>Estimated Total</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#F97316" }}>
                      {estimatedTotal > 0 ? `$${estimatedTotal.toFixed(2)}${hasNullPriced ? "+" : ""}` : "Quote"}
                    </span>
                  </div>

                  {/* Vehicle info (steps 2-4) */}
                  {step >= 2 && (vehicleYear || vehicleMake || vehicleModel) && (
                    <div style={{ marginTop: 16, fontSize: 13, color: "#475569" }}>
                      {[vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ")}{fuelType ? ` (${fuelType})` : ""}
                    </div>
                  )}

                  {/* Contact name (steps 3-4) */}
                  {step >= 3 && (customerFirstName || customerLastName) && (
                    <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>
                      {`${customerFirstName} ${customerLastName}`.trim()}
                    </div>
                  )}
                </>
              )}
              </div>
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
