// Popular vehicle makes covering ~99% of US bookings.
// Sorted alphabetically. Multi-word makes listed explicitly.
export const COMMON_MAKES = [
  "Acura",
  "Alfa Romeo",
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ferrari",
  "Fiat",
  "Ford",
  "Genesis",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Land Rover",
  "Lexus",
  "Lincoln",
  "Maserati",
  "Mazda",
  "Mercedes-Benz",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Polestar",
  "Porsche",
  "Ram",
  "Rivian",
  "Rolls-Royce",
  "Subaru",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
] as const;

export const MULTI_WORD_MAKES = COMMON_MAKES.filter(
  (m) => m.includes(" ") || m.includes("-"),
);

export interface ParsedSearch {
  year: string | null;
  make: string | null;
  modelHint: string;
}

export function parseVehicleSearch(
  query: string,
  makes: readonly string[],
): ParsedSearch {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return { year: null, make: null, modelHint: "" };

  const currentYear = new Date().getFullYear();
  const yearMatch = normalized.match(/\b(19[89]\d|20\d{2})\b/);
  let year: string | null = null;
  let remaining = normalized;
  if (yearMatch) {
    const candidate = parseInt(yearMatch[1], 10);
    if (candidate >= 1980 && candidate <= currentYear + 1) {
      year = yearMatch[1];
      remaining = normalized.replace(yearMatch[0], "").trim();
    }
  }

  let make: string | null = null;
  const multiWord = makes.filter((m) => m.includes(" ") || m.includes("-"));
  const singleWord = makes.filter((m) => !m.includes(" ") && !m.includes("-"));

  for (const mw of multiWord) {
    const mwLower = mw.toLowerCase();
    if (remaining.startsWith(mwLower)) {
      make = mw;
      remaining = remaining.slice(mwLower.length).trim();
      break;
    }
  }
  if (!make) {
    const firstWord = remaining.split(/\s+/)[0];
    const matched = singleWord.find((m) => m.toLowerCase() === firstWord);
    if (matched) {
      make = matched;
      remaining = remaining.slice(firstWord.length).trim();
    }
  }

  return { year, make, modelHint: remaining };
}
