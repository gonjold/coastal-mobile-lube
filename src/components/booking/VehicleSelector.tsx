"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { decodeVIN as decodeVINApi } from "@/lib/vehicleApi";
import { COMMON_MAKES, parseVehicleSearch } from "@/lib/vehicleMakes";
import VINScanner from "./VINScanner";

/* ── Types ── */

interface VehicleValue {
  year?: string;
  make?: string;
  model?: string;
  fuelType?: string;
  vin?: string;
  needsConfirmation?: boolean;
}

export interface VehicleSelectorProps {
  value: VehicleValue;
  onChange: (vehicle: VehicleValue) => void;
  onLookupByPhone?: () => void;
}

/* ── Constants ── */

const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

const YEARS = Array.from({ length: 38 }, (_, i) => String(2027 - i));

const FUEL_OPTIONS = ["Gas", "Hybrid", "Electric", "Diesel"];

/* ── Normalize fuel type from VIN decode to dropdown options ── */

function normalizeFuelType(ft: string): string {
  if (!ft) return "";
  const lower = ft.toLowerCase();
  if (lower.includes("electric") || lower.includes("bev")) return "Electric";
  if (lower.includes("hybrid") || lower.includes("plug") || lower.includes("phev")) return "Hybrid";
  if (lower.includes("diesel")) return "Diesel";
  return "Gas";
}

/* ══════════════════════════════════════════════════════════════
   Searchable Dropdown
   ══════════════════════════════════════════════════════════════ */

function SearchableDropdown({
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder,
  loading,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownDirection, setDropdownDirection] = useState<"down" | "up">("down");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const recomputeDirection = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownMaxHeight = 280;
    if (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow) {
      setDropdownDirection("up");
    } else {
      setDropdownDirection("down");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    recomputeDirection();
    window.addEventListener("resize", recomputeDirection);
    window.addEventListener("scroll", recomputeDirection, true);
    return () => {
      window.removeEventListener("resize", recomputeDirection);
      window.removeEventListener("scroll", recomputeDirection, true);
    };
  }, [open, recomputeDirection]);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <label
        style={{
          fontSize: 11, fontWeight: 600, color: "#64748B", display: "block",
          marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!disabled) {
            if (!open) recomputeDirection();
            setOpen(!open);
            setSearch("");
          }
        }}
        disabled={disabled}
        style={{
          width: "100%", padding: "11px 14px", border: "1px solid #E2E8F0", borderRadius: 8,
          fontSize: 14, fontFamily: "inherit",
          background: disabled ? "#F8FAFC" : "#FFFFFF",
          color: value ? "#1E293B" : (disabled ? "#CBD5E1" : "#94A3B8"),
          cursor: disabled ? "not-allowed" : "pointer", textAlign: "left",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || placeholder || "Select..."}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          stroke={disabled ? "#CBD5E1" : "#64748B"} strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, marginLeft: 8, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0)" }}
        >
          <polyline points="2 4 6 8 10 4" />
        </svg>
      </button>

      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            ...(dropdownDirection === "up"
              ? { bottom: "100%", marginBottom: 4 }
              : { top: "100%", marginTop: 4 }),
            left: 0, right: 0, zIndex: 100,
            background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}
        >
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                width: "100%", padding: "6px 8px", border: "1px solid #E2E8F0", borderRadius: 6,
                fontSize: 13, outline: "none", fontFamily: "inherit", background: "#F8FAFC", color: "#1E293B",
              }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "#94A3B8", textAlign: "center" }}>
                <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #E2E8F0", borderTopColor: "#E07B2D", borderRadius: "50%", animation: "spin 0.7s linear infinite", verticalAlign: "middle", marginRight: 6 }} />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "#94A3B8" }}>No matches</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt === value;
                return (
                  <div
                    key={opt}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                      setSearch("");
                    }}
                    style={{
                      padding: "9px 14px", fontSize: 14,
                      color: isSelected ? "#FFFFFF" : "#1E293B",
                      cursor: "pointer",
                      background: isSelected ? "#0B2040" : "transparent",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#F1F5F9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected ? "#0B2040" : "transparent";
                    }}
                  >
                    {opt}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VEHICLE SELECTOR
   ══════════════════════════════════════════════════════════════ */

export default function VehicleSelector({ value, onChange, onLookupByPhone }: VehicleSelectorProps) {
  const [mode, setMode] = useState<"ymm" | "vin">("ymm");

  /* ── Quick-search input ── */
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Model data ── */
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const modelsCacheRef = useRef<Record<string, string[]>>({});
  const modelsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Latest quick-search hints; consumed when models load / model is set. */
  const searchHintRef = useRef<{ model: string; fuel: string }>({ model: "", fuel: "" });

  /* ── VIN state ── */
  const [vinInput, setVinInput] = useState(value.vin || "");
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinDecoded, setVinDecoded] = useState(false);
  const [vinDecodeError, setVinDecodeError] = useState("");
  const [vinResult, setVinResult] = useState<{
    year: string; make: string; model: string; fuelType: string;
  } | null>(null);

  /* ── Skip state ── */
  const [skipped, setSkipped] = useState(!!value.needsConfirmation);

  /* ── Scanner state ── */
  const [scannerOpen, setScannerOpen] = useState(false);

  /* Latest-render refs so the async models-fetch closure can call onChange
     without becoming an effect dep (parent passes an inline-arrow onChange). */
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const vinInputRef = useRef(vinInput);
  vinInputRef.current = vinInput;

  /* ── Read YMM from value prop (parent is source of truth) ── */
  const year = value.year || "";
  const make = value.make || "";
  const model = value.model || "";
  const fuelType = value.fuelType || "";

  /* ── Auto-switch to YMM when external values arrive (phone lookup) ── */
  useEffect(() => {
    if (value.year && value.make && value.model && mode === "vin" && !vinDecoded) {
      setMode("ymm");
    }
    if (value.needsConfirmation === false && skipped) {
      setSkipped(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.year, value.make, value.model, value.needsConfirmation]);

  /* ── Sync vinInput from parent (e.g. initial VIN) ── */
  useEffect(() => {
    if (value.vin && value.vin !== vinInput) {
      setVinInput(value.vin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.vin]);

  /* ── Fetch models when year + make are both set ── */
  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      return;
    }

    /* Auto-select model from quick-search hint: first word of modelHint must
       lowercase-startsWith exactly one model name. Bundles fuel hint when the
       model resolves so both apply in a single onChange. */
    const applySearchHint = (names: string[]) => {
      const hint = searchHintRef.current;
      if (!hint.model) return;
      const firstWord = hint.model.toLowerCase().split(/\s+/)[0];
      if (!firstWord) return;
      const matches = names.filter((n) => n.toLowerCase().startsWith(firstWord));
      if (matches.length !== 1) return;
      const matchedFuel =
        hint.fuel && FUEL_OPTIONS.includes(hint.fuel) ? hint.fuel : "";
      onChangeRef.current({
        year,
        make,
        model: matches[0],
        fuelType: matchedFuel,
        vin: vinInputRef.current,
        needsConfirmation: false,
      });
      searchHintRef.current = { model: "", fuel: matchedFuel ? "" : hint.fuel };
    };

    const cacheKey = `${make.toLowerCase()}|${year}`;
    if (modelsCacheRef.current[cacheKey]) {
      const cached = modelsCacheRef.current[cacheKey];
      setModels(cached);
      applySearchHint(cached);
      return;
    }
    if (modelsDebounceRef.current) clearTimeout(modelsDebounceRef.current);
    setModelsLoading(true);
    modelsDebounceRef.current = setTimeout(() => {
      fetch(
        `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`,
      )
        .then((r) => r.json())
        .then((json) => {
          const names = [
            ...new Set(
              (json.Results || [])
                .map((m: { Model_Name: string }) => m.Model_Name)
                .filter((n: string) => n && n.trim().length > 0),
            ),
          ].sort() as string[];
          modelsCacheRef.current[cacheKey] = names;
          setModels(names);
          applySearchHint(names);
        })
        .catch(() => setModels([]))
        .finally(() => setModelsLoading(false));
    }, 300);

    return () => {
      if (modelsDebounceRef.current) clearTimeout(modelsDebounceRef.current);
    };
  }, [year, make]);

  /* Apply pending fuel hint when the model becomes set (covers manual model
     pick after an ambiguous quick-search). Skips if fuelType already filled. */
  useEffect(() => {
    if (!model || fuelType) return;
    const hint = searchHintRef.current;
    if (!hint.fuel || !FUEL_OPTIONS.includes(hint.fuel)) return;
    onChangeRef.current({
      year, make, model, fuelType: hint.fuel,
      vin: vinInputRef.current, needsConfirmation: false,
    });
    searchHintRef.current = { ...searchHintRef.current, fuel: "" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  /* ── YMM field handlers with dependency chain ── */
  const handleYearChange = useCallback(
    (val: string) => {
      onChange({ year: val, make: "", model: "", fuelType: "", vin: vinInput, needsConfirmation: false });
      setSkipped(false);
    },
    [onChange, vinInput],
  );

  const handleMakeChange = useCallback(
    (val: string) => {
      onChange({ year, make: val, model: "", fuelType: "", vin: vinInput, needsConfirmation: false });
      setSkipped(false);
    },
    [onChange, year, vinInput],
  );

  const handleModelChange = useCallback(
    (val: string) => {
      onChange({ year, make, model: val, fuelType: "", vin: vinInput, needsConfirmation: false });
      setSkipped(false);
    },
    [onChange, year, make, vinInput],
  );

  const handleFuelTypeChange = useCallback(
    (val: string) => {
      onChange({ year, make, model, fuelType: val, vin: vinInput, needsConfirmation: false });
      setSkipped(false);
    },
    [onChange, year, make, model, vinInput],
  );

  /* ── Quick-search: parse on each keystroke and cascade into selectors ── */
  const handleSearchChange = useCallback(
    (val: string) => {
      setSearchQuery(val);
      const parsed = parseVehicleSearch(val, COMMON_MAKES);

      /* Stash hints for the model-list / fuel-options consumers. */
      const lower = val.toLowerCase();
      let fuelHint = "";
      if (/\bhybrid\b/.test(lower)) fuelHint = "Hybrid";
      else if (/\b(electric|ev)\b/.test(lower)) fuelHint = "Electric";
      else if (/\bdiesel\b/.test(lower)) fuelHint = "Diesel";
      else if (/\b(gas|gasoline)\b/.test(lower)) fuelHint = "Gas";
      searchHintRef.current = { model: parsed.modelHint, fuel: fuelHint };

      const nextYear = parsed.year && parsed.year !== year ? parsed.year : year;
      const nextMake = parsed.make && parsed.make !== make ? parsed.make : make;
      if (nextYear !== year || nextMake !== make) {
        const clearedModel = nextMake !== make ? "" : model;
        const clearedFuel = nextMake !== make || nextYear !== year ? "" : fuelType;
        onChange({
          year: nextYear,
          make: nextMake,
          model: clearedModel,
          fuelType: clearedFuel,
          vin: vinInput,
          needsConfirmation: false,
        });
        setSkipped(false);
      }
    },
    [onChange, year, make, model, fuelType, vinInput],
  );

  /* ── VIN decode ── */
  async function handleVinDecode(override?: string) {
    const source = typeof override === "string" ? override : vinInput;
    const cleaned = source.replace(/\s/g, "");
    if (cleaned.length !== 17) return;
    setVinDecoding(true);
    setVinDecoded(false);
    setVinDecodeError("");
    try {
      const result = await decodeVINApi(cleaned);
      if (result) {
        const fuel = normalizeFuelType(result.fuelType);
        const data = { year: result.year, make: result.make, model: result.model, fuelType: fuel };
        setVinResult(data);
        setVinDecoded(true);
        setSkipped(false);
        onChange({
          year: data.year, make: data.make, model: data.model,
          fuelType: data.fuelType, vin: cleaned, needsConfirmation: false,
        });
      } else {
        setVinDecodeError("Could not decode VIN. Try entering details manually.");
      }
    } catch {
      setVinDecodeError("Could not decode VIN. Try entering details manually.");
    } finally {
      setVinDecoding(false);
    }
  }

  function handleEditVinResult() {
    setMode("ymm");
    setVinDecoded(false);
    setVinResult(null);
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */

  return (
    <div>
      {/* ── Mode Toggle Pills ── */}
      <div
        style={{
          display: "flex", gap: 0, marginBottom: 16,
          background: "#F1F5F9", borderRadius: 20, padding: 3, width: "fit-content",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("ymm")}
          style={{
            padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
            background: mode === "ymm" ? "#0B2040" : "transparent",
            color: mode === "ymm" ? "#FFFFFF" : "#64748B",
            transition: "all 0.15s",
          }}
        >
          Year / Make / Model
        </button>
        <button
          type="button"
          onClick={() => setMode("vin")}
          style={{
            padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
            background: mode === "vin" ? "#0B2040" : "transparent",
            color: mode === "vin" ? "#FFFFFF" : "#64748B",
            transition: "all 0.15s",
          }}
        >
          VIN
        </button>
      </div>

      {/* ── Quick search (YMM mode only) ── */}
      {mode === "ymm" && (
        <div className="mb-4">
          <label
            htmlFor="vehicleSearch"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
          >
            Quick search
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M10.5 17a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"
              />
            </svg>
            <input
              id="vehicleSearch"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Try: 2023 Toyota"
              className="w-full h-12 pl-10 pr-4 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E07B2D] focus:border-[#E07B2D]"
              autoComplete="off"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">Fills year and make — pick model below</p>
        </div>
      )}

      {/* ── YMM Mode: 4 native selects, stacked on mobile, 2x2 on tablet+ ── */}
      {mode === "ymm" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="w-full">
            <label
              htmlFor="vehicle-year"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
            >
              Year
            </label>
            <div className="relative">
              <select
                id="vehicle-year"
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full h-12 px-4 pr-10 text-base bg-white border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#E07B2D] focus:border-[#E07B2D] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">Select year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="w-full">
            <label
              htmlFor="vehicle-make"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
            >
              Make
            </label>
            <div className="relative">
              <select
                id="vehicle-make"
                value={make}
                onChange={(e) => handleMakeChange(e.target.value)}
                disabled={!year}
                className="w-full h-12 px-4 pr-10 text-base bg-white border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#E07B2D] focus:border-[#E07B2D] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!year ? "Select year first" : "Select make"}
                </option>
                {COMMON_MAKES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="w-full">
            <label
              htmlFor="vehicle-model"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
            >
              Model
            </label>
            <div className="relative">
              <select
                id="vehicle-model"
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!make || modelsLoading}
                className="w-full h-12 px-4 pr-10 text-base bg-white border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#E07B2D] focus:border-[#E07B2D] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!make
                    ? "Select make first"
                    : modelsLoading
                    ? "Loading models..."
                    : "Select model"}
                </option>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="w-full">
            <label
              htmlFor="vehicle-fuel"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
            >
              Fuel Type
            </label>
            <div className="relative">
              <select
                id="vehicle-fuel"
                value={fuelType}
                onChange={(e) => handleFuelTypeChange(e.target.value)}
                className="w-full h-12 px-4 pr-10 text-base bg-white border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#E07B2D] focus:border-[#E07B2D] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">Select fuel type</option>
                {FUEL_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ── VIN Mode ── */}
      {mode === "vin" && (
        <div>
          {!vinDecoded ? (
            <>
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 h-12 bg-[#0B2040] text-white rounded-lg font-semibold hover:bg-[#0B2040]/90 transition-colors mb-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23l-.38.054a2.25 2.25 0 00-1.94 2.2v10.58A2.25 2.25 0 005.116 22.3h13.768a2.25 2.25 0 002.25-2.236V9.484a2.25 2.25 0 00-1.94-2.2l-.38-.054a2.31 2.31 0 01-1.64-1.055l-.822-1.316A2.192 2.192 0 0014.155 4h-4.31a2.192 2.192 0 00-1.857 1.03l-.822 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Scan VIN with camera
              </button>
              <label
                style={{
                  fontSize: 11, fontWeight: 600, color: "#64748B", display: "block",
                  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em",
                }}
              >
                Vehicle Identification Number
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    type="text"
                    value={vinInput}
                    onChange={(e) => {
                      const val = e.target.value
                        .toUpperCase()
                        .replace(/[^A-HJ-NPR-Z0-9]/g, "")
                        .slice(0, 17);
                      setVinInput(val);
                      setVinDecoded(false);
                      setVinDecodeError("");
                      if (skipped) {
                        setSkipped(false);
                        onChange({ year, make, model, fuelType, vin: val, needsConfirmation: false });
                      }
                    }}
                    placeholder="Enter 17-character VIN"
                    maxLength={17}
                    style={{
                      width: "100%", padding: "11px 14px", paddingRight: 52,
                      border: "1px solid #E2E8F0", borderRadius: 8,
                      fontSize: 15, outline: "none", fontFamily: "monospace", letterSpacing: 1.5,
                      textTransform: "uppercase", background: "#FFFFFF", color: "#1E293B",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      fontSize: 11, color: "#94A3B8", fontFamily: "monospace",
                    }}
                  >
                    {vinInput.length}/17
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleVinDecode()}
                  disabled={vinDecoding || vinInput.replace(/\s/g, "").length !== 17}
                  style={{
                    padding: "10px 24px", background: "#E07B2D", color: "#fff", border: "none",
                    borderRadius: 8, fontSize: 14, fontWeight: 600, flexShrink: 0,
                    cursor: vinDecoding || vinInput.length !== 17 ? "not-allowed" : "pointer",
                    opacity: vinDecoding || vinInput.length !== 17 ? 0.5 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {vinDecoding ? "Decoding..." : "Decode"}
                </button>
              </div>
              {vinDecodeError && (
                <div style={{ fontSize: 13, color: "#DC2626", marginTop: 8 }}>{vinDecodeError}</div>
              )}
            </>
          ) : vinResult && (
            /* ── Green confirmation card ── */
            <div
              style={{
                background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <svg
                  width="18" height="18" viewBox="0 0 18 18" fill="none"
                  stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="9" cy="9" r="8" />
                  <polyline points="6 9 8 11 12 7" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>
                  VIN Decoded Successfully
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {([
                  { label: "Year", val: vinResult.year },
                  { label: "Make", val: vinResult.make },
                  { label: "Model", val: vinResult.model },
                  { label: "Fuel Type", val: vinResult.fuelType },
                ] as const).map((item) => (
                  <div key={item.label}>
                    <span
                      style={{
                        fontSize: 11, color: "#64748B", textTransform: "uppercase",
                        letterSpacing: "0.05em", fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0B2040" }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleEditVinResult}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: "#0B2040", padding: 0,
                  textDecoration: "underline",
                }}
              >
                Edit
              </button>
            </div>
          )}
          <VINScanner
            isOpen={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onScanSuccess={(vin) => {
              setVinInput(vin);
              setScannerOpen(false);
              handleVinDecode(vin);
            }}
          />
        </div>
      )}

      {/* ── "Been here before?" inline row ── */}
      {onLookupByPhone && (
        <div
          style={{
            marginTop: 16, paddingTop: 12, borderTop: "1px solid #F1F5F9",
            fontSize: 13, color: "#64748B",
          }}
        >
          Been here before?{" "}
          <button
            type="button"
            onClick={onLookupByPhone}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontSize: 13, fontWeight: 700, color: "#0B2040",
            }}
          >
            Look up by phone number {"\u2192"}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
