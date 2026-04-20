# WO-ADMIN-18: Typeahead Popularity Sort + Look Me Up Bug Fix

## Context

Two bugs from WO-17 deployment verification:

1. **Typeahead shows obscure makes first.** Typing "2024 toy" in the booking wizard shows "2024 TOY CARRIERS, INC" and "2024 TOY DOLLY" before "2024 TOYOTA". Need popularity-based sort so common makes always surface first.

2. **"Look me up" flow: Next button stays disabled after selecting a previous booking.** User enters phone, clicks "Look me up", sees previous bookings, clicks one — the card highlights (orange border) but Next remains grayed out. Yesterday's fix added vehicle field setters to `applyLookupBooking()` but the Next button validation is not seeing them.

Do NOT rewrite entire files. Make surgical edits only.

---

## FIX 1: VehicleTypeahead Popularity Sort

**File:** `src/components/VehicleTypeahead.tsx`

### Step 1.1 — Add popularity rank constant

Near the top of the file, below imports but above the component definition, add this constant:

```typescript
// Popularity ranking for make sorting. Lower rank = higher priority.
// Covers top 45 passenger vehicle makes by US relevance.
// Makes not in this list get rank 999 and sort alphabetically after ranked makes.
const MAKE_POPULARITY_RANK: Record<string, number> = {
  'TOYOTA': 1,
  'FORD': 2,
  'CHEVROLET': 3,
  'HONDA': 4,
  'NISSAN': 5,
  'JEEP': 6,
  'RAM': 7,
  'GMC': 8,
  'HYUNDAI': 9,
  'KIA': 10,
  'SUBARU': 11,
  'MAZDA': 12,
  'VOLKSWAGEN': 13,
  'TESLA': 14,
  'BMW': 15,
  'MERCEDES-BENZ': 16,
  'LEXUS': 17,
  'DODGE': 18,
  'CHRYSLER': 19,
  'BUICK': 20,
  'CADILLAC': 21,
  'ACURA': 22,
  'INFINITI': 23,
  'AUDI': 24,
  'VOLVO': 25,
  'LINCOLN': 26,
  'MITSUBISHI': 27,
  'PORSCHE': 28,
  'LAND ROVER': 29,
  'JAGUAR': 30,
  'MINI': 31,
  'GENESIS': 32,
  'FIAT': 33,
  'ALFA ROMEO': 34,
  'MASERATI': 35,
  'PONTIAC': 36,
  'SATURN': 37,
  'SCION': 38,
  'HUMMER': 39,
  'SUZUKI': 40,
  'ISUZU': 41,
  'MERCURY': 42,
  'OLDSMOBILE': 43,
  'PLYMOUTH': 44,
  'SMART': 45,
};

function compareByPopularity(a: string, b: string): number {
  const rankA = MAKE_POPULARITY_RANK[a.toUpperCase()] ?? 999;
  const rankB = MAKE_POPULARITY_RANK[b.toUpperCase()] ?? 999;
  if (rankA !== rankB) return rankA - rankB;
  return a.localeCompare(b);
}
```

### Step 1.2 — Apply sort to make filtering logic

Find the code block that filters the cached NHTSA makes list based on user input (the part that generates the dropdown suggestions when the user is typing a make name). It will look something like `makes.filter(m => m.Make_Name.toUpperCase().startsWith(...))` or a similar filter.

**After** the filter, **before** the `.slice(0, 8)` cap, add a sort by popularity:

```typescript
.sort((a, b) => compareByPopularity(
  typeof a === 'string' ? a : a.Make_Name,
  typeof b === 'string' ? b : b.Make_Name
))
```

If the filtered array uses string values directly (e.g. `filteredMakes: string[]`), simplify to:
```typescript
.sort(compareByPopularity)
```

Apply this sort to **every place** in the file where makes are filtered for dropdown display. If there are multiple filter passes (e.g. one for year+make suggestions, another for make-only), add the sort to each.

### Step 1.3 — Verify sort also applies to fallback hardcoded top 50 list

If the NHTSA fetch fails and the component falls back to a hardcoded list of makes, that fallback list should also be ordered by popularity. If the fallback list is currently alphabetical, reorder it to match the MAKE_POPULARITY_RANK order.

---

## FIX 2: "Look Me Up" Next Button Bug

**File:** `src/components/BookingWizardModal.tsx`

### Step 2.1 — DIAGNOSTIC FIRST (before making changes)

Print to the console (during dev, we'll remove after):

1. Find the `applyLookupBooking` function. Log at the top: `console.log('[LOOKUP] applyLookupBooking called with:', booking);`
2. Find the click handler on the previous booking cards in the "Select a previous booking" list. Log right before applyLookupBooking is called: `console.log('[LOOKUP] Card clicked, booking:', booking);`
3. Find the Step 1 Next button's disabled condition. Log the validation state on every render: `console.log('[LOOKUP] Step1 validation state:', { vehicleYear, vehicleMake, vehicleModel, fuelType, customerFirstName, customerPhone });`

Run a local build (no deploy yet), attach to tmux `coastal`, inspect the code, and identify which of these is true:

**Hypothesis A:** Clicking the booking card doesn't actually fire `applyLookupBooking` (handler missing or wrong prop)
**Hypothesis B:** `applyLookupBooking` fires but doesn't set all required fields the Next button validates
**Hypothesis C:** The Next button validates a DIFFERENT state variable than what gets set (e.g. checks `vehicle` string field but setters populate `vehicleYear/Make/Model` separately, or vice versa)
**Hypothesis D:** The Next button validates customer fields (name, phone, email) that aren't populated by `applyLookupBooking` even though the phone lookup had them

### Step 2.2 — Fix based on diagnosis

Once you identify the root cause from the console logs:

- **If Hypothesis A:** Wire the onClick handler to call `applyLookupBooking(selectedBooking)`.
- **If Hypothesis B:** Extend `applyLookupBooking` to set every field the Next button validates. Read the Next button disabled condition carefully and ensure every state setter is called.
- **If Hypothesis C:** Harmonize the two representations. If the wizard stores vehicle as both a string (e.g. `vehicle: "2024 Toyota Tundra"`) and separate fields, set both in `applyLookupBooking`.
- **If Hypothesis D:** Extend `applyLookupBooking` to populate customer identity fields (firstName, lastName, phone, email) from the lookup response. These should already be available on the lookup record since the phone lookup succeeded.

### Step 2.3 — Remove console.log statements

After the fix works, remove the three diagnostic `console.log` calls added in Step 2.1.

### Step 2.4 — Verify with a test flow

Test locally before deploying:

1. Open /book, click Book Service
2. Click "Been here before?" (or equivalent entry to the phone lookup)
3. Enter phone `(949) 292-6686` and click "Look me up"
4. Click the "2024 Toyota Tundra — Front and Rear Brake Job" card
5. Confirm: card gets orange border AND Next button becomes enabled (not grayed out)
6. Click Next — should advance to Step 2 (Services) with vehicle pre-filled

If the test fails, re-add diagnostic logs, re-diagnose, re-fix.

---

## BUILD, COMMIT, DEPLOY

```bash
cd ~/coastal-mobile-lube
npm run build
# If build succeeds:
npx netlify-cli deploy --prod
# Confirm deploy URL returns 200, then:
git add src/components/VehicleTypeahead.tsx src/components/BookingWizardModal.tsx
git commit -m "Fix typeahead popularity sort and Look me up Next button bug"
git push origin main
```

**Do NOT use `--dir` flag on netlify-cli deploy** (known to cause silent deploy failures on this project).

**Do NOT use `git add -A`** (sweeps in workflow files requiring scoped PAT).

---

## SUCCESS CRITERIA

1. Typing "2024 toy" in booking wizard shows Toyota as first result (above TOY CARRIERS, TOY DOLLY, etc.)
2. Typing "ford" shows Ford as first result (above any alphabetically-earlier obscure makes)
3. Typing "bmw", "honda", "chevy" → each make appears at top of dropdown
4. "Look me up" flow: selecting a previous booking enables the Next button
5. Clicking Next after lookup selection advances to Step 2 with vehicle pre-filled
6. Live at https://coastal-mobile-lube.netlify.app/book with new build timestamp
