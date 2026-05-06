"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, limit as firestoreLimit, getDoc, doc, setDoc } from "firebase/firestore";
import { resolveBookingVisibility } from "@/hooks/useServices";
import type { Service, ServiceCategory, BookingVisibility } from "@/lib/services";
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
  description?: string;
  bookingVisibility?: BookingVisibility;
  sortOrder?: number;
}

interface CategoryGroup {
  category: string;
  services: SubService[];
  hasSubServices: boolean;
  isFeatured?: boolean;
  featuredSubtitle?: string;
  bookingVisibility?: BookingVisibility;
  startingAt?: number;
  sortOrder?: number;
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
  services?: Service[];
  serviceCategories?: ServiceCategory[];
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

export default function BookingWizardModal({
  isOpen,
  onClose,
  preselect,
  services = [],
  serviceCategories = [],
}: Props) {
  /* ── Wizard state ── */
  const [step, setStep] = useState(1);
  const [division, setDivision] = useState<Division>("Automotive");

  /* ── Step 2: Services ── */
  const [selectedServices, setSelectedServices] = useState<SubService[]>([]);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [somethingElseText, setSomethingElseText] = useState("");
  // otherText / otherSelected mirror somethingElseText to keep the
  // untouched sidebar, review card, and Firestore `otherDescription` field working.
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  /* ── Services data (pre-fetched server-side via firebase-admin) ── */
  const divKey = DIVISION_KEY_MAP[division];
  const allServices = services;
  const allCategoriesRaw = serviceCategories;

  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Category metadata lookup (by category name, for this division) ── */
  const categoryMetaByName = new Map<string, ServiceCategory>();
  for (const c of allCategoriesRaw) {
    if (c.division !== divKey) continue;
    categoryMetaByName.set(c.name, c);
  }

  /* ── Build category groups ── */
  const categoryGroups: CategoryGroup[] = (() => {
    const divServices = allServices.filter((s) => s.division === divKey);
    if (divServices.length > 0) {
      const grouped = groupByCategory(divServices);
      const groups: CategoryGroup[] = grouped
        .filter((g) => !/labor\s*rate/i.test(g.category))
        .filter((g) => !(divKey === "marine" && /marine\s*brakes/i.test(g.category)))
        .map((g) => {
          const meta = categoryMetaByName.get(g.category);
          const catVis: BookingVisibility = meta
            ? resolveBookingVisibility(meta as { bookingVisibility?: BookingVisibility; showOnBooking?: boolean })
            : "inline";
          const catSortOrder = meta?.sortOrder ?? g.services[0]?.sortOrder ?? 0;
          return {
            category: g.category,
            services: g.services
              .map((s) => ({
                id: s.id,
                name: s.displayName || s.name,
                price: s.price,
                category: g.category,
                description: s.description || "",
                bookingVisibility: resolveBookingVisibility(s),
                sortOrder: s.sortOrder ?? 0,
              }))
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
            hasSubServices: g.services.length > 0,
            isFeatured: meta?.isFeatured ?? false,
            featuredSubtitle: meta?.featuredSubtitle ?? "",
            bookingVisibility: catVis,
            startingAt: meta?.startingAt,
            sortOrder: catSortOrder,
          };
        });
      // Featured first, then regular; within each group sort by sortOrder asc
      groups.sort((a, b) => {
        const af = a.isFeatured ? 0 : 1;
        const bf = b.isFeatured ? 0 : 1;
        if (af !== bf) return af - bf;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
      return groups;
    }
    // No services for this division (Firestore unavailable at build/revalidate time
    // or empty catalog). Surface the empty-state CTA in the render block instead of
    // fabricating fallback prices that would silently drift from real data.
    return [];
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
      setExpandedCats((prev) => ({ ...prev, [preselect.categoryId!]: true }));
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
    setExpandedCats({});
    setSomethingElseText("");
    setOtherSelected(false);
    setOtherText("");
    setSearchQuery("");
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
    if (step === 1) return true;
    if (step === 2) return selectedServices.length > 0 || (otherSelected && otherText.trim().length > 0);
    if (step === 3) {
      return customerFirstName.trim().length > 0
        && customerPhone.trim().length > 0
        && address.trim().length > 0;
    }
    return true;
  }

  /* ── Submit ── */
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const serviceNames = selectedServices.map((s) => s.name);
      if (somethingElseText.trim()) serviceNames.push(`Other: ${somethingElseText.trim()}`);

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

      const trimmedSomethingElse = somethingElseText.trim();
      await addDoc(collection(db, "bookings"), {
        division: divKey,
        service: serviceNames.join(", "),
        selectedServices: selectedServices.map((s) => ({ id: s.id, name: s.name, price: s.price, category: s.category, division: divKey })),
        otherDescription: trimmedSomethingElse,
        ...(trimmedSomethingElse ? { somethingElseText: trimmedSomethingElse } : {}),
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
    setExpandedCats({});
    setSomethingElseText("");
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

              {categoryGroups.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#0B2447", marginBottom: 8 }}>
                    We&apos;re updating our service catalog.
                  </p>
                  <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
                    Please call to book — we&apos;ll get you on the schedule right away.
                  </p>
                  <a
                    href="tel:8137225823"
                    style={{ display: "inline-block", padding: "10px 20px", background: "#F97316", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
                  >
                    Call 813-722-LUBE
                  </a>
                </div>
              ) : (() => {
                const isDieselCat = (cat: string) => /diesel/i.test(cat);
                const isOilCat = (cat: string) => /oil/i.test(cat);

                let groups = categoryGroups;
                if (fuelCategory === "electric") {
                  groups = groups.filter((g) => !isOilCat(g.category) && !isDieselCat(g.category));
                }

                const visibleGroups = groups.filter((g) => g.bookingVisibility !== "hidden");
                const featuredBlocks = visibleGroups.filter(
                  (g) => g.isFeatured && g.bookingVisibility === "inline"
                );
                const inlineCategories = visibleGroups.filter(
                  (g) => !g.isFeatured && g.bookingVisibility === "inline"
                );
                const searchableOnlyCats = visibleGroups.filter(
                  (g) => !g.isFeatured && g.bookingVisibility === "searchable"
                );

                // Search pool: non-featured, non-hidden categories → their non-hidden services
                const searchablePool: (SubService & { categoryName: string })[] = visibleGroups
                  .filter((g) => !g.isFeatured)
                  .flatMap((g) =>
                    g.services
                      .filter((s) => s.bookingVisibility !== "hidden")
                      .map((s) => ({ ...s, categoryName: g.category }))
                  );

                const searchQ = searchQuery.trim().toLowerCase();
                const searchHits = searchQ
                  ? searchablePool.filter((s) => s.name.toLowerCase().includes(searchQ))
                  : [];

                const toggleCatOpen = (id: string, defaultOpen: boolean) => {
                  setExpandedCats((prev) => {
                    const current = prev[id];
                    const isOpen = current === undefined ? defaultOpen : current;
                    return { ...prev, [id]: !isOpen };
                  });
                };

                const formatPrice = (p: number | null, allowFree: boolean) => {
                  if (p == null) return "Quote";
                  if (allowFree && p === 0) return "FREE";
                  return p % 1 === 0 ? `$${p}` : `$${p.toFixed(2)}`;
                };

                const selectedCount = selectedServices.length + (somethingElseText.trim() ? 1 : 0);

                return (
                  <>
                    {/* EV notice */}
                    {fuelCategory === "electric" && (
                      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#1E40AF" }}>
                        Electric vehicles don&apos;t need oil changes. Here are the services available for your EV.
                      </div>
                    )}
                    {/* Hybrid notice */}
                    {fuelCategory === "hybrid" && (
                      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#166534" }}>
                        Hybrid vehicles may have different oil requirements. Please confirm specifics with our technician.
                      </div>
                    )}

                    {/* 1. Featured blocks — default open */}
                    {featuredBlocks.map((block) => {
                      const isOpen = expandedCats[block.category] !== false;
                      const visibleItems = block.services.filter((s) => s.bookingVisibility === "inline");
                      return (
                        <div
                          key={block.category}
                          style={{
                            marginBottom: 10,
                            borderRadius: 12,
                            border: "1px solid rgba(224,123,45,0.25)",
                            background: "#FFFFFF",
                            overflow: "hidden",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCatOpen(block.category, true)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "12px 16px", border: "none", background: "#FFFFFF", cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                background: "rgba(224,123,45,0.1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                  <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                              </div>
                              <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0B2040" }}>{block.category}</div>
                                {block.featuredSubtitle && (
                                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{block.featuredSubtitle}</div>
                                )}
                              </div>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                              <polyline points="4 6 8 10 12 6" />
                            </svg>
                          </button>
                          {isOpen && visibleItems.length > 0 && (
                            <div style={{ borderTop: "1px solid #E5E7EB", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                              {visibleItems.map((item) => {
                                const checked = isServiceSelected(item.id);
                                return (
                                  <label
                                    key={item.id}
                                    style={{
                                      display: "flex", alignItems: "flex-start", gap: 10,
                                      padding: "10px 12px", borderRadius: 10, border: "1px solid #E5E7EB",
                                      background: checked ? "#FFF7ED" : "#FFFFFF", cursor: "pointer", transition: "background 0.15s",
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                                        border: checked ? "none" : "2px solid #CBD5E1",
                                        background: checked ? "#F97316" : "#FFFFFF",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                      }}
                                      onClick={(e) => { e.preventDefault(); toggleService(item); }}
                                    >
                                      {checked && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="9 3 5 9 3 7" />
                                        </svg>
                                      )}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }} onClick={(e) => { e.preventDefault(); toggleService(item); }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0B2040" }}>{item.name}</span>
                                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#374151", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                                          {formatPrice(item.price, true)}
                                        </span>
                                      </div>
                                      {item.description && (
                                        <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 2 }}>{item.description}</div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 2. Regular inline categories — collapsed by default */}
                    {inlineCategories.map((cat) => {
                      const isOpen = !!expandedCats[cat.category];
                      const visibleServices = cat.services.filter((s) => s.bookingVisibility === "inline");
                      if (visibleServices.length === 0) return null;
                      const prices = visibleServices.filter((s) => s.price != null).map((s) => s.price as number);
                      const computedStart = prices.length > 0 ? Math.min(...prices) : null;
                      const startingAt = computedStart != null ? computedStart : (cat.startingAt ?? null);
                      const startingLabel = startingAt != null ? `Starting at ${formatPrice(startingAt, false)}` : null;
                      return (
                        <div
                          key={cat.category}
                          style={{
                            marginBottom: 10,
                            borderRadius: 12,
                            border: "1px solid #E5E7EB",
                            background: "#FFFFFF",
                            overflow: "hidden",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCatOpen(cat.category, false)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "12px 16px", border: "none", background: "#FFFFFF", cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}
                          >
                            <div style={{ textAlign: "left" }}>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0B2040" }}>{cat.category}</div>
                              <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 2 }}>
                                {startingLabel ? `${startingLabel} · ` : ""}
                                {visibleServices.length} option{visibleServices.length !== 1 ? "s" : ""}
                              </div>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                              <polyline points="4 6 8 10 12 6" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div style={{ borderTop: "1px solid #E5E7EB", padding: "6px 14px" }}>
                              {visibleServices.map((svc, i) => {
                                const checked = isServiceSelected(svc.id);
                                return (
                                  <label
                                    key={svc.id}
                                    style={{
                                      display: "flex", alignItems: "center", justifyContent: "space-between",
                                      padding: "10px 8px", cursor: "pointer", borderRadius: 8, margin: "0 -8px",
                                      borderBottom: i < visibleServices.length - 1 ? "1px solid #F3F4F6" : "none",
                                      background: checked ? "#FFF7ED" : "transparent",
                                      transition: "background 0.15s",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
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
                                      <span style={{ fontSize: 13, color: "#1F2937" }} onClick={(e) => { e.preventDefault(); toggleService(svc); }}>{svc.name}</span>
                                    </div>
                                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4B5563", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", marginLeft: 8 }}
                                      onClick={(e) => { e.preventDefault(); toggleService(svc); }}>
                                      {formatPrice(svc.price, false)}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 3. Something else? — always rendered */}
                    <div style={{
                      marginBottom: 10, padding: 16, borderRadius: 12, border: "1px solid #E5E7EB", background: "#FFFFFF",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: "rgba(11,32,64,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B2040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0B2040" }}>Something else?</div>
                          <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 2, marginBottom: 8 }}>
                            Tell us what you need. We&apos;ll call you back with a quote.
                          </div>
                          <textarea
                            value={somethingElseText}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSomethingElseText(v);
                              setOtherText(v);
                              setOtherSelected(v.trim().length > 0);
                            }}
                            rows={2}
                            placeholder="Squeaky brakes, weird noise, not sure what it is..."
                            style={{
                              width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10,
                              fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit",
                              background: "#FFFFFF", color: "#1E293B",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Search the full menu — always rendered */}
                    <div style={{ marginBottom: 10, borderRadius: 12, border: "1px solid #E5E7EB", background: "#FFFFFF", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: searchQuery.trim() || searchableOnlyCats.length > 0 ? "1px solid #E5E7EB" : "none" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round">
                          <circle cx="7" cy="7" r="5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
                        </svg>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search our entire service menu..."
                          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: "inherit", background: "transparent", color: "#1E293B" }}
                        />
                        {searchQuery.trim() && (
                          <span style={{ fontSize: 11, color: "#6B7280" }}>
                            {searchHits.length} result{searchHits.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {searchQuery.trim() ? (
                        <div style={{ maxHeight: 220, overflowY: "auto", padding: "6px 8px" }}>
                          {searchHits.length === 0 ? (
                            <div style={{ padding: "16px 8px", textAlign: "center", fontSize: 12, color: "#6B7280" }}>
                              No services match. Try the &quot;Something else&quot; box above.
                            </div>
                          ) : (
                            searchHits.map((s) => {
                              const checked = isServiceSelected(s.id);
                              return (
                                <label
                                  key={s.id}
                                  style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "8px 8px", cursor: "pointer", borderRadius: 8,
                                    background: checked ? "#FFF7ED" : "transparent",
                                    transition: "background 0.15s",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                                    <span
                                      style={{
                                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                        border: checked ? "none" : "2px solid #CBD5E1",
                                        background: checked ? "#F97316" : "#FFFFFF",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                      }}
                                      onClick={(e) => { e.preventDefault(); toggleService(s); }}
                                    >
                                      {checked && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="9 3 5 9 3 7" />
                                        </svg>
                                      )}
                                    </span>
                                    <div style={{ minWidth: 0 }} onClick={(e) => { e.preventDefault(); toggleService(s); }}>
                                      <div style={{ fontSize: 13, color: "#1F2937" }}>{s.name}</div>
                                      <div style={{ fontSize: 10.5, color: "#6B7280", marginTop: 2 }}>in {s.categoryName}</div>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4B5563", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", marginLeft: 8 }}
                                    onClick={(e) => { e.preventDefault(); toggleService(s); }}>
                                    {formatPrice(s.price, false)}
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      ) : (searchableOnlyCats.length > 0 && (
                        <div style={{ padding: "10px 16px", fontSize: 11, color: "#6B7280" }}>
                          {searchablePool.length} service{searchablePool.length !== 1 ? "s" : ""} available.
                          {" "}Includes searchable-only: {searchableOnlyCats.map((c) => c.category).join(", ")}.
                        </div>
                      ))}
                    </div>

                    {/* Mobile Selection Summary */}
                    {isMobile && selectedCount > 0 && (
                      <div style={{
                        marginTop: 16, background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: 10,
                        padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0B2447" }}>
                          {selectedCount} service(s) selected
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#F97316" }}>
                          {estimatedTotal > 0 ? `$${estimatedTotal.toFixed(2)}${hasNullPriced ? "+" : ""}` : "Quote"}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
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
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Last name</label>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Service Address *</label>
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
                  <div style={{ marginTop: 8, background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 500, color: "#92400E" }}>
                    No worries if you&apos;re not sure — we&apos;ll sort it out on the call.
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
        {!submitted && (() => {
          const serviceCount = selectedServices.length + (otherSelected && otherText.trim() ? 1 : 0);
          const stepLabel = steps[step - 1] || "";
          const summaryPrimary = serviceCount > 0
            ? `${serviceCount} service${serviceCount === 1 ? "" : "s"}`
            : `Step ${step} · ${stepLabel}`;
          const summarySecondary = serviceCount > 0
            ? (estimatedTotal > 0 ? `$${estimatedTotal.toFixed(2)}${hasNullPriced ? "+" : ""} est.` : "Quote")
            : "";
          return (
            <div className="wizard-modal-nav" style={{
              borderTop: "1px solid #E2E8F0", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexShrink: 0,
              background: "#FFFFFF",
            }}>
              {/* Mobile-only compact summary (hidden on desktop by .wizard-nav-summary rule) */}
              <div className="wizard-nav-summary" style={{
                display: "none", flex: 1, minWidth: 0, flexDirection: "column",
                overflow: "hidden",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0B2447", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {summaryPrimary}
                </span>
                {summarySecondary && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#F97316", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {summarySecondary}
                  </span>
                )}
              </div>

              {/* Desktop: Back on left; Mobile: Back moves beside Continue */}
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="wizard-nav-back"
                  style={{
                    padding: "10px 20px", minHeight: 44, borderRadius: 10, border: "1px solid #E2E8F0",
                    background: "#FFFFFF", color: "#475569", fontSize: 14, fontWeight: 600, cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Back
                </button>
              ) : <div className="wizard-nav-spacer" />}

              {(() => {
                // Block step-4 submit until convenience fee loads, so users
                // never click Submit on a total that's missing the fee.
                const feeNotReady = step === 4 && feeConfig === null;
                const isDisabled = !canNext() || submitting || feeNotReady;
                return (
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (step === 1 && !isMarine && (!vehicleYear || !vehicleMake)) {
                        setNeedsConfirmation(true);
                      }
                      if (step < 4) setStep(step + 1);
                      else handleSubmit();
                    }}
                    style={{
                      padding: "10px 24px", minHeight: 44, borderRadius: 10, border: "none",
                      background: isDisabled ? "#E2E8F0" : "#F97316",
                      color: "#fff", fontSize: 14, fontWeight: 700, cursor: isDisabled ? "not-allowed" : "pointer",
                      boxShadow: !isDisabled && step === 4 ? "0 0 20px rgba(249,115,22,0.4)" : "none",
                      transition: "background 0.15s", flexShrink: 0,
                    }}
                  >
                    {submitting
                      ? "Submitting..."
                      : feeNotReady
                        ? "Loading…"
                        : step === 4
                          ? (division === "Fleet" ? "Request a Quote" : "Submit Booking")
                          : "Next"}
                  </button>
                );
              })()}
            </div>
          );
        })()}
      </div>

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
          .wizard-modal-card input,
          .wizard-modal-card select,
          .wizard-modal-card textarea {
            font-size: 16px !important;
          }
          .wizard-modal-nav {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          .wizard-nav-summary {
            display: flex !important;
          }
          .wizard-nav-spacer {
            display: none !important;
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
