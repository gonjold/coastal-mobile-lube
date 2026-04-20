# WO-22d: Instant Make Loading + Smart Vehicle Search

**Project:** Coastal Mobile Lube & Tire
**Scope:** Vehicle selector ONLY (`src/components/booking/VehicleSelector.tsx`).
**Estimated time:** 20-30 min (probably less on 4.7)
**Prerequisite:** WO-22c deployed (native selects in place).

---

## CONTEXT

Two issues to fix in one pass:

1. **Make dropdown is slow on mobile.** Current implementation fetches the Make list from NHTSA (or similar) after the user picks a Year. On mobile networks, this takes multiple seconds, leaving the Make select disabled and the user waiting.

2. **No fast path for users who know what they drive.** Typing "2023 Toyota Corolla" should auto-populate the selectors in one action instead of three separate dropdowns. Top automotive sites (KBB, Edmunds, Carvana) all offer a search input alongside the dropdowns.

This WO fixes both without adding dependencies.

---

## SCOPE

### IN
- `src/components/booking/VehicleSelector.tsx`
- A new `src/lib/vehicleMakes.ts` (or equivalent location) for the static makes list

### OUT
- Any other component, page, or form
- Models API call (still fetched per year+make, that's correct)
- Fuel Type (remains manual)
- VIN mode, skip flow, phone lookup flow — all untouched

---

## STEPS

### Step 0: Pre-flight read

1. Read `src/components/booking/VehicleSelector.tsx` in full.
2. Identify where and how Makes are currently fetched (which API, which function, what triggers it).
3. Confirm whether makes are cached, or refetched on each Year change.
4. Print a brief summary of what you find before editing.

---

### Step 1: Create the static makes list

Create `src/lib/vehicleMakes.ts`:

```typescript
// Popular vehicle makes covering ~99% of US bookings.
// Sorted alphabetically. Multi-word makes listed explicitly.
export const COMMON_MAKES = [
  'Acura',
  'Alfa Romeo',
  'Aston Martin',
  'Audi',
  'Bentley',
  'BMW',
  'Buick',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ferrari',
  'Fiat',
  'Ford',
  'Genesis',
  'GMC',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jaguar',
  'Jeep',
  'Kia',
  'Lamborghini',
  'Land Rover',
  'Lexus',
  'Lincoln',
  'Maserati',
  'Mazda',
  'Mercedes-Benz',
  'Mini',
  'Mitsubishi',
  'Nissan',
  'Polestar',
  'Porsche',
  'Ram',
  'Rivian',
  'Rolls-Royce',
  'Subaru',
  'Suzuki',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
] as const;

export const MULTI_WORD_MAKES = COMMON_MAKES.filter((m) => m.includes(' ') || m.includes('-'));
```

---

### Step 2: Replace the NHTSA make fetch with the static list

In `VehicleSelector.tsx`:

- Remove any `useEffect` or fetch that populates the Make list when Year changes.
- Import `COMMON_MAKES` from the new file.
- Render the Make `<select>` options directly from `COMMON_MAKES`.
- Make `<select>` is now enabled as soon as Year is selected (no loading state needed).
- Keep the dependency-clear logic: changing Year still clears Make/Model/Fuel, changing Make still clears Model/Fuel.

The Models fetch (which fires when Year + Make are both set) stays untouched — it still hits the API for year+make specific models.

**Verify after this step:** picking a Year makes the Make dropdown immediately usable. No spinner, no disabled period.

---

### Step 3: Add a smart search input above the dropdowns

Above the 4-dropdown grid, add a search input in YMM mode only (not VIN mode):

```tsx
<div className="mb-4">
  <label htmlFor="vehicleSearch" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 17a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" />
    </svg>
    <input
      id="vehicleSearch"
      type="text"
      value={searchQuery}
      onChange={(e) => handleSearchChange(e.target.value)}
      placeholder="Try: 2023 Toyota Corolla"
      className="w-full h-12 pl-10 pr-4 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E07B2D] focus:border-[#E07B2D]"
      autoComplete="off"
    />
    {/* Suggestion dropdown rendered here when searchQuery is non-empty and has matches */}
  </div>
  <p className="mt-2 text-xs text-slate-500">Or pick below</p>
</div>
```

---

### Step 4: Implement the search parser

Add a utility function inside `VehicleSelector.tsx` (or colocated in `vehicleMakes.ts`):

```typescript
interface ParsedSearch {
  year: string | null;
  make: string | null;
  modelHint: string;
}

function parseVehicleSearch(query: string, makes: readonly string[]): ParsedSearch {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return { year: null, make: null, modelHint: '' };

  // Extract year (4-digit number between 1980 and current year + 1)
  const currentYear = new Date().getFullYear();
  const yearMatch = normalized.match(/\b(19[89]\d|20\d{2})\b/);
  let year: string | null = null;
  let remaining = normalized;
  if (yearMatch) {
    const candidate = parseInt(yearMatch[1], 10);
    if (candidate >= 1980 && candidate <= currentYear + 1) {
      year = yearMatch[1];
      remaining = normalized.replace(yearMatch[0], '').trim();
    }
  }

  // Match make (multi-word first, then single-word)
  let make: string | null = null;
  const multiWord = makes.filter((m) => m.includes(' ') || m.includes('-'));
  const singleWord = makes.filter((m) => !m.includes(' ') && !m.includes('-'));

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
```

---

### Step 5: Wire up the search to auto-fill

Add state for `searchQuery` and a handler that parses on each keystroke:

```typescript
const [searchQuery, setSearchQuery] = useState('');

function handleSearchChange(value: string) {
  setSearchQuery(value);
  const { year, make, modelHint } = parseVehicleSearch(value, COMMON_MAKES);
  if (year && year !== selectedYear) {
    setYear(year);
    // trigger the same cascade as a manual year change
  }
  if (make && make !== selectedMake) {
    setMake(make);
    // trigger the same cascade as a manual make change
  }
  // modelHint is available if/when we want to pre-filter the Model dropdown
  // (optional: we can skip wiring this for now and let user pick Model manually)
}
```

The goal: as the user types "2023 Toyota Corolla", the Year select shows 2023 and the Make select shows Toyota within a second or two. User then taps the Model select to finish.

**Visual behavior:**
- User types in search bar → selectors below light up with matched values
- Selectors below remain fully functional (user can override)
- Clearing the search bar does NOT clear the selectors (they keep whatever was selected)

### Step 6: Suggestions dropdown (optional but nice)

If time permits: as the user types, show a small suggestions dropdown below the search input with exact matches. Keep it simple — no need to be exhaustive.

For example, if `searchQuery` is "2023 toy":
- Parse finds year=2023, no make yet (still typing)
- Show suggestions that start with "toy" from COMMON_MAKES: "Toyota"
- Click suggestion → set make=Toyota, append "Toyota " to search input

If time doesn't permit or this adds complexity, skip it. The parse-on-type behavior alone is already a major UX win.

---

### Step 7: Help text and copy

Update the help text near the search:
- Above the search bar (label): "Quick search"
- Placeholder: "Try: 2023 Toyota Corolla"
- Below the search bar (hint): "Or pick below"

No em dashes in copy. No emojis.

---

### Step 8: Build, commit, push, deploy

1. `npm run build` — confirm zero errors.
2. `git add src/`
3. `git commit -m "WO-22d: instant make loading + smart vehicle search"`
4. `git push`
5. `npx netlify-cli deploy --prod`

---

## ACCEPTANCE CRITERIA

### Desktop
- [ ] Picking a Year makes the Make dropdown immediately populated and enabled (no loading delay)
- [ ] Make dropdown shows all common makes (Toyota, Honda, Ford, BMW, Mercedes-Benz, etc.)
- [ ] Multi-word makes (Alfa Romeo, Land Rover, Mercedes-Benz, Rolls-Royce) appear correctly
- [ ] Typing "2023 toyota corolla" into the search bar auto-fills Year=2023 and Make=Toyota
- [ ] User can then pick Model from the dropdown
- [ ] Clearing the search bar does NOT clear the selectors
- [ ] Using the search bar and the dropdowns interchangeably both work

### Mobile (iPhone)
- [ ] Same as above
- [ ] Make dropdown opens instantly after Year is picked — no spinner, no delay
- [ ] Search bar is comfortable to type in (16px font, no zoom)

---

## DO NOT

- Do NOT change the Models fetch (keep existing API call for year+make specific models)
- Do NOT add any new dependencies
- Do NOT touch any other component or page
- Do NOT rewrite entire files — surgical edits only
- Do NOT change VIN mode, skip flow, or phone lookup

---

## ROLLBACK

```bash
git revert HEAD
git push
npx netlify-cli deploy --prod
```
