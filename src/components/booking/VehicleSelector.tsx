"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { decodeVIN as decodeVINApi } from "@/lib/vehicleApi";

/* ── Types ── */

interface NHTSAMake {
  Make_ID: number;
  Make_Name: string;
}

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

const MAKE_POPULARITY_RANK: Record<string, number> = {
  TOYOTA: 1, FORD: 2, CHEVROLET: 3, HONDA: 4, NISSAN: 5,
  JEEP: 6, RAM: 7, GMC: 8, HYUNDAI: 9, KIA: 10,
  SUBARU: 11, MAZDA: 12, VOLKSWAGEN: 13, TESLA: 14, BMW: 15,
  "MERCEDES-BENZ": 16, LEXUS: 17, DODGE: 18, CHRYSLER: 19, BUICK: 20,
  CADILLAC: 21, ACURA: 22, INFINITI: 23, AUDI: 24, VOLVO: 25,
  LINCOLN: 26, MITSUBISHI: 27, PORSCHE: 28, "LAND ROVER": 29, JAGUAR: 30,
  MINI: 31, GENESIS: 32, FIAT: 33, "ALFA ROMEO": 34, MASERATI: 35,
  PONTIAC: 36, SATURN: 37, SCION: 38, HUMMER: 39, SUZUKI: 40,
  ISUZU: 41, MERCURY: 42, OLDSMOBILE: 43, PLYMOUTH: 44, SMART: 45,
};

/* ── Module-level make cache (shared across instances) ── */

let allMakesCache: NHTSAMake[] | null = null;
let allMakesFetching = false;

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

  /* ── Make data ── */
  const [allMakes, setAllMakes] = useState<NHTSAMake[]>(allMakesCache || []);
  const [makesReady, setMakesReady] = useState(!!allMakesCache);

  /* ── Model data ── */
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const modelsCacheRef = useRef<Record<string, string[]>>({});
  const modelsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* ── Read YMM from value prop (parent is source of truth) ── */
  const year = value.year || "";
  const make = value.make || "";
  const model = value.model || "";
  const fuelType = value.fuelType || "";

  /* ── Fetch all makes on mount ── */
  useEffect(() => {
    if (allMakesCache) {
      setAllMakes(allMakesCache);
      setMakesReady(true);
      return;
    }
    if (allMakesFetching) {
      const interval = setInterval(() => {
        if (allMakesCache) {
          setAllMakes(allMakesCache);
          setMakesReady(true);
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
    allMakesFetching = true;

    fetch(`${NHTSA_BASE}/GetAllMakes?format=json`)
      .then((r) => r.json())
      .then((json) => {
        const makes: NHTSAMake[] = (json.Results || []).filter(
          (m: NHTSAMake) => m.Make_Name && m.Make_Name.trim().length > 0,
        );
        allMakesCache = makes;
        setAllMakes(makes);
        setMakesReady(true);
      })
      .catch(() => {
        const fallback: NHTSAMake[] = Object.keys(MAKE_POPULARITY_RANK).map((name, i) => ({
          Make_ID: 90000 + i,
          Make_Name: name
            .split(" ")
            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
            .join(" "),
        }));
        allMakesCache = fallback;
        setAllMakes(fallback);
        setMakesReady(true);
      })
      .finally(() => {
        allMakesFetching = false;
      });
  }, []);

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
    if (!year || !make || !makesReady) {
      setModels([]);
      return;
    }
    const makeEntry = allMakes.find(
      (m) => m.Make_Name.toLowerCase() === make.toLowerCase(),
    );
    if (!makeEntry) {
      setModels([]);
      return;
    }
    const cacheKey = `${makeEntry.Make_ID}|${year}`;
    if (modelsCacheRef.current[cacheKey]) {
      setModels(modelsCacheRef.current[cacheKey]);
      return;
    }
    if (modelsDebounceRef.current) clearTimeout(modelsDebounceRef.current);
    setModelsLoading(true);
    modelsDebounceRef.current = setTimeout(() => {
      fetch(
        `${NHTSA_BASE}/GetModelsForMakeIdYear/makeId/${makeEntry.Make_ID}/modelyear/${year}?format=json`,
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
        })
        .catch(() => setModels([]))
        .finally(() => setModelsLoading(false));
    }, 300);

    return () => {
      if (modelsDebounceRef.current) clearTimeout(modelsDebounceRef.current);
    };
  }, [year, make, makesReady, allMakes]);

  /* ── Make option names sorted by popularity ── */
  const makeNames = allMakes
    .map((m) => m.Make_Name)
    .sort((a, b) => {
      const rankA = MAKE_POPULARITY_RANK[a.toUpperCase()] ?? 999;
      const rankB = MAKE_POPULARITY_RANK[b.toUpperCase()] ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });

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

  /* ── Skip handlers ── */
  function handleSkip() {
    setSkipped(true);
    onChange({ year, make, model, fuelType, vin: vinInput, needsConfirmation: true });
  }

  function handleUndoSkip() {
    setSkipped(false);
    onChange({ year, make, model, fuelType, vin: vinInput, needsConfirmation: false });
  }

  /* ── VIN decode ── */
  async function handleVinDecode() {
    const cleaned = vinInput.replace(/\s/g, "");
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

  /* ── Is form complete? ── */
  const isComplete = !!(year && make && model && fuelType) || vinDecoded;

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

      {/* ── YMM Mode: 4 searchable dropdowns in 2x2 grid ── */}
      {mode === "ymm" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <SearchableDropdown
            label="Year"
            options={YEARS}
            value={year}
            onChange={handleYearChange}
            placeholder="Select year"
          />
          <SearchableDropdown
            label="Make"
            options={makeNames}
            value={make}
            onChange={handleMakeChange}
            disabled={!year || !makesReady}
            placeholder={!makesReady ? "Loading makes..." : "Select make"}
            loading={!makesReady && !!year}
          />
          <SearchableDropdown
            label="Model"
            options={models}
            value={model}
            onChange={handleModelChange}
            disabled={!make}
            placeholder={modelsLoading ? "Loading models..." : "Select model"}
            loading={modelsLoading}
          />
          <SearchableDropdown
            label="Fuel Type"
            options={FUEL_OPTIONS}
            value={fuelType}
            onChange={handleFuelTypeChange}
            disabled={!model}
            placeholder="Select fuel type"
          />
        </div>
      )}

      {/* ── VIN Mode ── */}
      {mode === "vin" && (
        <div>
          {!vinDecoded ? (
            <>
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
                  onClick={handleVinDecode}
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
        </div>
      )}

      {/* ── Skip Option ── */}
      {!isComplete && !skipped && (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontSize: 13, color: "#64748B", textAlign: "left",
            }}
          >
            {mode === "vin" ? "Don\u2019t have your VIN? " : "Don\u2019t have all the details? "}
            <span style={{ fontWeight: 600, color: "#0B2040" }}>
              Skip and we&apos;ll confirm on the call
            </span>
            {" \u2192"}
          </button>
        </div>
      )}

      {/* ── Skip Banner (amber) ── */}
      {skipped && (
        <div
          style={{
            marginTop: 16, background: "#FEF3C7", border: "1px solid #FCD34D",
            borderRadius: 12, padding: "12px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#92400E", marginBottom: 2 }}>
              We&apos;ll confirm your vehicle on the call.
            </div>
            <div style={{ fontSize: 12, color: "#92400E" }}>
              Keep going. A technician will verify year, make, model, and fuel type before the appointment.
            </div>
          </div>
          <button
            type="button"
            onClick={handleUndoSkip}
            style={{
              background: "none", border: "1px solid #D97706", borderRadius: 6,
              cursor: "pointer", padding: "4px 12px",
              fontSize: 12, fontWeight: 600, color: "#D97706",
              flexShrink: 0, marginLeft: 12,
            }}
          >
            Undo
          </button>
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
