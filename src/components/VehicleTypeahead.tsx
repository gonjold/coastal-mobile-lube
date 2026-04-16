"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ── Types ── */

interface NHTSAMake {
  Make_ID: number;
  Make_Name: string;
}

interface NHTSAModel {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

interface VehicleSelection {
  year: string;
  make: string;
  model: string;
  trim: string;
  fuelType: string;
}

interface Props {
  onSelect: (vehicle: VehicleSelection) => void;
  /** Pre-fill the input (e.g. after VIN decode) */
  initialValue?: string;
  /** Signal that VIN decode filled the fields externally */
  vinDecoded?: boolean;
}

/* ── Module-level caches (survive re-renders, shared across instances) ── */

let allMakesCache: NHTSAMake[] | null = null;
let allMakesFetching = false;
const modelsCache: Record<string, NHTSAModel[]> = {};

const TOP_50_MAKES = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Hyundai", "Kia",
  "BMW", "Mercedes-Benz", "Volkswagen", "Subaru", "Mazda", "Jeep", "Ram",
  "GMC", "Dodge", "Lexus", "Audi", "Acura", "Infiniti", "Buick", "Cadillac",
  "Chrysler", "Lincoln", "Tesla", "Volvo", "Porsche", "Land Rover", "Jaguar",
  "Mitsubishi", "Mini", "Fiat", "Alfa Romeo", "Genesis", "Maserati", "Rivian",
  "Lucid", "Polestar", "Ferrari", "Lamborghini", "McLaren", "Bentley",
  "Rolls-Royce", "Aston Martin", "Lotus", "Scion", "Saturn", "Pontiac",
  "Mercury", "Saab",
];

const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

/* ── Helpers ── */

function detectFuelType(modelName: string, trimName: string): string {
  const combined = `${modelName} ${trimName}`.toLowerCase();
  if (/\bev\b|\belectric\b|\bbev\b/.test(combined)) return "Electric";
  if (/\bhybrid\b|\bphev\b|\bprime\b/.test(combined)) return "Hybrid";
  if (/\bdiesel\b|\btdi\b/.test(combined)) return "Diesel";
  return "Gas";
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function VehicleTypeahead({ onSelect, initialValue, vinDecoded }: Props) {
  const [inputValue, setInputValue] = useState(initialValue || "");
  const [results, setResults] = useState<{ year: string; make: string; model: string; display: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");
  const [makesReady, setMakesReady] = useState(!!allMakesCache);
  const [apiFailed, setApiFailed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Sync initialValue from parent (VIN decode) ── */
  useEffect(() => {
    if (initialValue !== undefined) setInputValue(initialValue);
  }, [initialValue]);

  /* ── Fetch all makes on mount ── */
  useEffect(() => {
    if (allMakesCache) { setMakesReady(true); return; }
    if (allMakesFetching) {
      // Another instance is fetching; poll until ready
      const interval = setInterval(() => {
        if (allMakesCache) { setMakesReady(true); clearInterval(interval); }
      }, 200);
      return () => clearInterval(interval);
    }

    allMakesFetching = true;

    async function fetchMakes(retryCount = 0) {
      try {
        const res = await fetch(`${NHTSA_BASE}/GetAllMakes?format=json`);
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        const makes: NHTSAMake[] = (json.Results || []).filter(
          (m: NHTSAMake) => m.Make_Name && m.Make_Name.trim().length > 0
        );
        allMakesCache = makes;
        setMakesReady(true);
      } catch {
        if (retryCount < 1) {
          await new Promise((r) => setTimeout(r, 2000));
          return fetchMakes(retryCount + 1);
        }
        // Fallback to top 50
        allMakesCache = TOP_50_MAKES.map((name, i) => ({ Make_ID: 90000 + i, Make_Name: name }));
        setMakesReady(true);
        setApiFailed(true);
      } finally {
        allMakesFetching = false;
      }
    }

    fetchMakes();
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Fetch models for make + year ── */
  const fetchModels = useCallback(async (makeId: number, makeName: string, year: string): Promise<NHTSAModel[]> => {
    const cacheKey = `${makeId}|${year}`;
    if (modelsCache[cacheKey]) return modelsCache[cacheKey];

    try {
      const res = await fetch(
        `${NHTSA_BASE}/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`
      );
      if (!res.ok) return [];
      const json = await res.json();
      const models: NHTSAModel[] = (json.Results || []).filter(
        (m: NHTSAModel) => m.Model_Name && m.Model_Name.trim().length > 0
      );
      modelsCache[cacheKey] = models;
      return models;
    } catch {
      return [];
    }
  }, []);

  /* ── Core search logic ── */
  const runSearch = useCallback(async (text: string) => {
    if (!text.trim() || !makesReady || !allMakesCache) {
      setResults([]);
      setHint("");
      setOpen(false);
      return;
    }

    const trimmed = text.trim();
    const words = trimmed.split(/\s+/);

    // Detect year
    let year = "";
    let restWords = [...words];
    const yearIdx = words.findIndex((w) => /^(19[89]\d|20\d{2})$/.test(w));
    if (yearIdx !== -1) {
      const y = parseInt(words[yearIdx], 10);
      const currentYear = new Date().getFullYear();
      if (y >= 1981 && y <= currentYear + 1) {
        year = words[yearIdx];
        restWords.splice(yearIdx, 1);
      } else {
        setResults([]);
        setHint(`Year must be between 1981 and ${currentYear + 1}`);
        setOpen(true);
        setLoading(false);
        return;
      }
    }

    const rest = restWords.join(" ").trim();

    // Year only, no make text yet
    if (year && !rest) {
      setResults([]);
      setHint("Year: " + year + " \u2014 keep typing for make");
      setOpen(true);
      setLoading(false);
      return;
    }

    // No year, just text - hint to add year
    if (!year && rest) {
      // Still try to match makes for usability
      const lowerRest = rest.toLowerCase();
      const matchedMakes = allMakesCache.filter((m) =>
        m.Make_Name.toLowerCase().startsWith(lowerRest)
      ).slice(0, 8);

      if (matchedMakes.length > 0) {
        setHint("Add a year for better results (e.g., 2021 " + matchedMakes[0].Make_Name + ")");
        setResults([]);
        setOpen(true);
        setLoading(false);
        return;
      }
      setResults([]);
      setHint("");
      setOpen(false);
      setLoading(false);
      return;
    }

    // Have year + rest text -- try to match make
    const lowerRest = rest.toLowerCase();

    // Find make: try longest match first (handles "Land Rover", "Alfa Romeo", etc.)
    const sortedMakes = [...allMakesCache].sort(
      (a, b) => b.Make_Name.length - a.Make_Name.length
    );

    // Check if rest starts with a known make name
    let matchedMake: NHTSAMake | null = null;
    let afterMake = "";

    for (const m of sortedMakes) {
      const ml = m.Make_Name.toLowerCase();
      if (lowerRest.startsWith(ml) && (lowerRest.length === ml.length || lowerRest[ml.length] === " ")) {
        matchedMake = m;
        afterMake = rest.slice(m.Make_Name.length).trim();
        break;
      }
    }

    if (!matchedMake) {
      // Partial make match - show matching makes in dropdown
      const partialMakes = allMakesCache.filter((m) =>
        m.Make_Name.toLowerCase().startsWith(lowerRest)
      );

      if (partialMakes.length === 0) {
        setResults([]);
        setHint("Make not found. Try a different spelling or use VIN decode.");
        setOpen(true);
        setLoading(false);
        return;
      }

      // Show makes as suggestions (up to 8)
      const makeResults = partialMakes.slice(0, 8).map((m) => ({
        year,
        make: m.Make_Name,
        model: "",
        display: `${year} ${m.Make_Name}`,
      }));
      setResults(makeResults);
      setHint("");
      setHighlightIdx(-1);
      setOpen(true);
      setLoading(false);
      return;
    }

    // Make matched -- fetch models
    setLoading(true);
    setOpen(true);
    setHint("");

    const models = await fetchModels(matchedMake.Make_ID, matchedMake.Make_Name, year);

    if (models.length === 0) {
      setResults([]);
      setHint(`No models found for ${year} ${matchedMake.Make_Name}`);
      setLoading(false);
      return;
    }

    // Filter models by afterMake text
    const lowerAfterMake = afterMake.toLowerCase();
    let filtered = models;
    if (lowerAfterMake) {
      filtered = models.filter((m) =>
        m.Model_Name.toLowerCase().includes(lowerAfterMake)
      );
    }

    if (filtered.length === 0) {
      setResults([]);
      setHint("No vehicles found for this search");
      setLoading(false);
      return;
    }

    // Deduplicate and sort: exact start match first
    const seen = new Set<string>();
    const deduped = filtered.filter((m) => {
      const key = m.Model_Name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => {
      const al = a.Model_Name.toLowerCase();
      const bl = b.Model_Name.toLowerCase();
      if (lowerAfterMake) {
        const aStarts = al.startsWith(lowerAfterMake);
        const bStarts = bl.startsWith(lowerAfterMake);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
      }
      return al.localeCompare(bl);
    });

    const displayResults = deduped.slice(0, 8).map((m) => ({
      year,
      make: matchedMake!.Make_Name,
      model: m.Model_Name,
      display: `${year} ${matchedMake!.Make_Name} ${m.Model_Name}`,
    }));

    setResults(displayResults);
    setHighlightIdx(-1);
    setLoading(false);
  }, [makesReady, fetchModels]);

  /* ── Input change handler with debounce ── */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(val);
    }, 300);
  }

  /* ── Select a result ── */
  function handleSelect(result: { year: string; make: string; model: string; display: string }) {
    if (!result.model) {
      // Make-only result, fill in and keep searching
      const newVal = result.display + " ";
      setInputValue(newVal);
      inputRef.current?.focus();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      runSearch(newVal);
      return;
    }

    setInputValue(result.display);
    setOpen(false);
    setResults([]);
    setHint("");

    // Parse trim from model name: many NHTSA model names include trim
    // e.g., "Camry LE", "Tacoma TRD Pro"
    const modelParts = result.model.split(/\s+/);
    let model = result.model;
    let trim = "";
    // Simple heuristic: if model name has 2+ words, last words might be trim
    if (modelParts.length >= 2) {
      model = result.model;
      trim = "";
    }

    const fuel = detectFuelType(model, trim);

    onSelect({
      year: result.year,
      make: result.make,
      model,
      trim,
      fuelType: fuel,
    });
  }

  /* ── Keyboard navigation ── */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < results.length) {
        handleSelect(results[highlightIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  /* ── Highlight matching text ── */
  function renderHighlighted(display: string) {
    const trimmed = inputValue.trim();
    if (!trimmed) return <span>{display}</span>;

    const idx = display.toLowerCase().indexOf(trimmed.toLowerCase());
    if (idx === -1) return <span>{display}</span>;

    return (
      <span>
        {display.slice(0, idx)}
        <strong>{display.slice(idx, idx + trimmed.length)}</strong>
        {display.slice(idx + trimmed.length)}
      </span>
    );
  }

  /* ── API failure fallback ── */
  if (apiFailed) {
    return (
      <div>
        <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 6 }}>
          Vehicle search unavailable. Please type your vehicle description.
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => {
            if (!inputValue.trim()) return;
            const words = inputValue.trim().split(/\s+/);
            let year = "";
            let make = "";
            let model = "";
            let trim = "";
            const yIdx = words.findIndex((w) => /^(19|20)\d{2}$/.test(w));
            if (yIdx !== -1) { year = words[yIdx]; words.splice(yIdx, 1); }
            if (words.length > 0) make = words[0];
            if (words.length > 1) model = words[1];
            if (words.length > 2) trim = words.slice(2).join(" ");
            onSelect({ year, make, model, trim, fuelType: "Gas" });
          }}
          placeholder="e.g. 2024 Toyota Camry LE"
          style={{
            width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
            fontSize: 14, outline: "none", fontFamily: "inherit",
            background: "#FFFFFF", color: "#1E293B",
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Search input */}
      <div style={{ position: "relative" }}>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        >
          <circle cx="7" cy="7" r="5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (inputValue.trim()) runSearch(inputValue); }}
          onKeyDown={handleKeyDown}
          placeholder="Start typing: 2024 Toyota Camry..."
          style={{
            width: "100%", padding: "12px 14px 12px 40px", border: "1px solid #E2E8F0", borderRadius: 10,
            fontSize: 14, outline: "none", fontFamily: "inherit",
            background: "#FFFFFF", color: "#1E293B",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#CBD5E1"; }}
          onMouseLeave={(e) => {
            if (document.activeElement !== e.currentTarget) {
              (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0";
            }
          }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = "#E07B2D"; e.currentTarget.style.boxShadow = "0 0 0 1px #E07B2D"; }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
        />
        {loading && (
          <div style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            width: 16, height: 16, border: "2px solid #E2E8F0", borderTopColor: "#F97316",
            borderRadius: "50%", animation: "spin 0.7s linear infinite",
          }} />
        )}
      </div>

      {/* Dropdown */}
      {open && (results.length > 0 || hint) && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 300, overflowY: "auto",
          zIndex: 100,
        }}>
          {hint && results.length === 0 && (
            <div style={{ padding: "12px 16px", fontSize: 13, color: "#64748B" }}>
              {hint}
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={`${r.display}-${i}`}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setHighlightIdx(i)}
              role="option"
              aria-selected={i === highlightIdx}
              style={{
                padding: "10px 16px", fontSize: 14, color: "#1E293B",
                cursor: "pointer", minHeight: 44,
                display: "flex", alignItems: "center",
                background: i === highlightIdx ? "#FFF7ED" : "transparent",
                borderBottom: i < results.length - 1 ? "1px solid #F8FAFC" : "none",
                transition: "background 0.1s",
              }}
            >
              {r.model ? (
                renderHighlighted(r.display)
              ) : (
                <span>{r.display} <span style={{ color: "#94A3B8", fontSize: 12 }}>(type model)</span></span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
