/* ── Vehicle API Utility ─────────────────────────────────────
   Uses the NHTSA vPIC API (free, no key required).
   ──────────────────────────────────────────────────────────── */

export interface VehicleInfo {
  year: string;
  make: string;
  model: string;
  trim: string;
  engineType: string; // e.g., "2.5L I4"
  engineSize: string; // e.g., "3.4L 6-cyl"
  fuelType: string; // Gas, Diesel, Hybrid, Electric, Plug-in Hybrid, Flex Fuel
  isHybrid: boolean;
  isElectric: boolean;
  isDiesel: boolean;
  driveType: string; // FWD, RWD, AWD, 4WD
  bodyClass: string; // Sedan, SUV, Truck, Van, etc.
  vinDecoded: boolean;
}

/* ── VIN Decode ── */

const PROXY_BASE = "https://us-east1-coastal-mobile-lube.cloudfunctions.net/decodeVIN";

export async function decodeVIN(vin: string): Promise<VehicleInfo | null> {
  try {
    const res = await fetch(
      `${PROXY_BASE}?action=decode&vin=${encodeURIComponent(vin)}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const results = json.Results?.[0];
    if (!results || !results.ModelYear || results.ErrorCode === "1") return null;

    // Build engine type string e.g. "2.5L I4" or "3.5L V6"
    const displacement = results.DisplacementL || "";
    const cylinders = results.EngineCylinders || "";
    let engineType = "";
    let engineSize = "";
    if (displacement) {
      const liters = parseFloat(displacement).toFixed(1);
      if (cylinders) {
        const cyl = parseInt(cylinders, 10);
        engineType = `${liters}L ${cyl <= 4 ? "I" : "V"}${cyl}`;
        engineSize = `${liters}L ${cyl}-cyl`;
      } else {
        engineType = `${liters}L`;
        engineSize = `${liters}L`;
      }
    } else if (results.EngineModel) {
      engineType = results.EngineModel;
    }

    // Normalize fuel type with secondary fuel & electrification detection
    const primaryFuel = results.FuelTypePrimary || "";
    const secondaryFuel = results.FuelTypeSecondary || "";
    const electrification = results.ElectrificationLevel || "";

    let fuelType = "Gas";
    let isHybrid = false;
    let isElectric = false;
    let isDiesel = false;

    if (/bev/i.test(electrification)) {
      fuelType = "Electric";
      isElectric = true;
    } else if (electrification || /electric/i.test(secondaryFuel)) {
      fuelType = "Hybrid";
      isHybrid = true;
      if (/phev|plug.?in/i.test(electrification)) {
        fuelType = "Plug-in Hybrid";
      }
    } else if (/diesel/i.test(primaryFuel)) {
      fuelType = "Diesel";
      isDiesel = true;
    } else if (/plug.?in|phev/i.test(primaryFuel)) {
      fuelType = "Plug-in Hybrid";
      isHybrid = true;
    } else if (/hybrid/i.test(primaryFuel)) {
      fuelType = "Hybrid";
      isHybrid = true;
    } else if (/electric|bev/i.test(primaryFuel)) {
      fuelType = "Electric";
      isElectric = true;
    } else if (/flex|e85/i.test(primaryFuel)) {
      fuelType = "Flex Fuel";
    }

    return {
      year: results.ModelYear || "",
      make: results.Make || "",
      model: results.Model || "",
      trim: results.Trim || "",
      engineType,
      engineSize,
      fuelType,
      isHybrid,
      isElectric,
      isDiesel,
      driveType: results.DriveType || "",
      bodyClass: results.BodyClass || "",
      vinDecoded: true,
    };
  } catch {
    return null;
  }
}

/* ── Year/Make/Model Cascading Lookups ── */

export function getYears(): string[] {
  const current = new Date().getFullYear();
  const years: string[] = [];
  for (let y = current + 1; y >= 1990; y--) {
    years.push(String(y));
  }
  return years;
}

export async function getMakes(): Promise<string[]> {
  try {
    const res = await fetch(`${PROXY_BASE}?action=makes`);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.Results || []) as string[];
  } catch {
    return [];
  }
}

export async function getModels(
  year: string,
  make: string,
): Promise<string[]> {
  try {
    const res = await fetch(
      `${PROXY_BASE}?action=models&year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    const models = (json.Results || [])
      .map((r: { Model_Name: string }) => r.Model_Name)
      .filter(Boolean) as string[];
    return [...new Set(models)].sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/* ── Fuel Type Helper ── */

export function getFuelCategory(
  fuelType: string,
): "gas" | "diesel" | "hybrid" | "electric" {
  if (!fuelType) return "gas";
  const lower = fuelType.toLowerCase();
  if (lower.includes("diesel")) return "diesel";
  if (
    lower.includes("hybrid") ||
    lower.includes("plug-in") ||
    lower.includes("phev")
  )
    return "hybrid";
  if (lower.includes("electric") || lower.includes("bev")) return "electric";
  return "gas";
}
