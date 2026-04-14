/* ── Vehicle API Utility ─────────────────────────────────────
   Uses the NHTSA vPIC API (free, no key required).
   ──────────────────────────────────────────────────────────── */

export interface VehicleInfo {
  year: string;
  make: string;
  model: string;
  trim: string;
  engineType: string; // e.g., "2.5L I4"
  fuelType: string; // Gas, Diesel, Hybrid, Electric, Plug-in Hybrid
  driveType: string; // FWD, RWD, AWD, 4WD
  bodyClass: string; // Sedan, SUV, Truck, Van, etc.
  vinDecoded: boolean;
}

/* ── VIN Decode ── */

export async function decodeVIN(vin: string): Promise<VehicleInfo | null> {
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const results = json.Results?.[0];
    if (!results || !results.ModelYear || results.ErrorCode === "1") return null;

    // Build engine type string e.g. "2.5L I4" or "3.5L V6"
    let engineType = "";
    if (results.DisplacementL) {
      const liters = parseFloat(results.DisplacementL).toFixed(1);
      const cylinders = results.EngineCylinders || "";
      if (cylinders) {
        const cyl = parseInt(cylinders, 10);
        engineType = `${liters}L ${cyl <= 4 ? "I" : "V"}${cyl}`;
      } else {
        engineType = `${liters}L`;
      }
    } else if (results.EngineModel) {
      engineType = results.EngineModel;
    }

    // Normalize fuel type
    const rawFuel = results.FuelTypePrimary || "";
    let fuelType = "Gas";
    if (/diesel/i.test(rawFuel)) {
      fuelType = "Diesel";
    } else if (/plug.?in|phev/i.test(rawFuel)) {
      fuelType = "Plug-in Hybrid";
    } else if (/hybrid/i.test(rawFuel)) {
      fuelType = "Hybrid";
    } else if (/electric|bev/i.test(rawFuel)) {
      fuelType = "Electric";
    }

    return {
      year: results.ModelYear || "",
      make: results.Make || "",
      model: results.Model || "",
      trim: results.Trim || "",
      engineType,
      fuelType,
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
    const types = ["car", "truck", "motorcycle"];
    const results = await Promise.all(
      types.map(async (type) => {
        const res = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/${type}?format=json`,
        );
        if (!res.ok) return [];
        const json = await res.json();
        return (json.Results || []).map(
          (r: { MakeName: string }) => r.MakeName,
        );
      }),
    );
    const all = new Set<string>();
    results.flat().forEach((name: string) => {
      if (name) all.add(name);
    });
    return Array.from(all).sort((a, b) => a.localeCompare(b));
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
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(year)}?format=json`,
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
