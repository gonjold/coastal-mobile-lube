# WO-ADMIN-17: NHTSA Typeahead Vehicle Search in Booking Wizard

## Objective
Replace the current manual year/make/model dropdowns in the booking wizard with a single smart text input that searches the NHTSA vPIC API as the customer types. Similar to the TOCC Value Your Trade page -- type "2021 toyota tac" and see matching vehicles narrow down in real-time. Selecting a result fills in year, make, model, trim, and engine/fuel type automatically.

## Pre-read (MANDATORY)
Read these files in full before making any changes:
- The booking wizard component (likely src/components/BookingWizard.tsx or src/app/book/page.tsx)
- Any existing NHTSA/VIN decode helper files (check src/lib/ or src/utils/ for vin, vehicle, or nhtsa references)
- The vehicle step of the wizard -- understand all current fields and state

## NHTSA vPIC API Endpoints to Use

Base URL: https://vpic.nhtsa.dot.gov/api/vehicles

1. **Get all makes:** GET /GetAllMakes?format=json
   - Cache this on first load (it's ~1000 makes, doesn't change often)
   - Store in component state or a module-level variable

2. **Get models for make + year:** GET /GetModelsForMakeIdYear/makeId/{makeId}/modelyear/{year}?format=json
   - Returns all models for a specific make and year

3. **Decode VIN (already exists):** GET /DecodeVinValues/{vin}?format=json
   - Keep existing VIN decode working as-is

## Step 1: Create the typeahead search component

Create a new component: src/components/VehicleTypeahead.tsx

**Input behavior:**
- Single text input field, full width
- Placeholder: "Start typing: 2024 Toyota Camry..."
- As the user types, parse the input to detect:
  - Year (4 digits starting with 19 or 20)
  - Make (match against cached makes list)
  - Model (fetch from NHTSA once make + year are known)
  - Trim (from model results -- NHTSA model results often include trim)

**Parsing logic (progressive narrowing):**
1. User types "20" -- no search yet, too short
2. User types "2021" -- year detected (2021). Show text: "Year: 2021 -- keep typing for make"
3. User types "2021 t" -- filter cached makes list for makes starting with "t" (Toyota, Tesla, etc). Show dropdown with matching makes
4. User types "2021 toyota" -- make matched (Toyota, makeId from cache). Fetch models for Toyota + 2021 from NHTSA
5. User types "2021 toyota tac" -- filter fetched models for those containing "tac". Show dropdown: Tacoma SR, Tacoma TRD Pro, Tacoma SR5, etc.
6. User types "2021 toyota tacoma" -- show all Tacoma trims
7. User selects "2021 Toyota Tacoma TRD Pro" from dropdown

**Dropdown:**
- Position: absolute, below the input, full width of input
- Max height: 300px, overflow-y auto
- Each result row: "YEAR Make Model Trim" (font-size 14px)
- Highlight matching text portions in bold
- Keyboard navigation: arrow up/down to highlight, Enter to select, Escape to close
- Click to select
- Show max 8 results at a time
- If no results: "No vehicles found for this search"

**Debouncing:**
- Debounce NHTSA API calls by 300ms (the make list is cached locally so make filtering is instant)
- Only call the models API when both year AND make are confirmed
- Show a subtle loading spinner in the dropdown while fetching

## Step 2: Handle selection

When the user selects a vehicle from the dropdown:
- Fill the input with the full text: "2021 Toyota Tacoma TRD Pro"
- Set the wizard state: vehicleYear, vehicleMake, vehicleModel, vehicleTrim
- Auto-detect fuel type from the model/trim name:
  - If trim contains "EV", "Electric", "BEV" -> Electric
  - If trim contains "Hybrid", "PHEV", "Prime" -> Hybrid
  - If trim contains "Diesel", "TDI" -> Diesel
  - Otherwise -> Gas
- Set the Engine/Fuel Type dropdown to the detected value
- The user can still manually change fuel type after auto-detection
- Close the dropdown
- The vehicle section should now show as "complete" for Next button validation

## Step 3: Integrate into the booking wizard

Replace the current vehicle entry section (below the VIN field) with:

```
VIN (optional)
[VIN input] [Decode] [Scan]

---- or describe your vehicle ----

[🔍 Start typing: 2024 Toyota Camry...                          ]
  └─ dropdown results appear here

Engine / Fuel Type
[Gas ▼]
```

Remove:
- The "e.g. 2024 Toyota Camry LE" free-text input (replaced by typeahead)
- The "Or select year, make, and model" link and the manual Year/Make/Model dropdown fields

Keep:
- VIN input + Decode button + Scan button (unchanged)
- Engine / Fuel Type dropdown (still manually changeable)
- The "or describe your vehicle" divider text (change to "or search your vehicle")

## Step 4: Handle edge cases

1. **Obscure makes:** The NHTSA GetAllMakes endpoint includes ALL makes (not just popular ones). If a user types "maser" they'll find Maserati. If they type "pago" they'll find Pagani. The full list handles this.

2. **No year entered:** If the user types just a make without a year (e.g., "toyota"), show a hint: "Add a year for better results (e.g., 2021 Toyota)"

3. **Year out of range:** If year is before 1981 or after current year + 1, show: "Year must be between 1981 and [current+1]"

4. **Make not found:** If the typed text after the year doesn't match any make, show: "Make not found. Try a different spelling or use VIN decode."

5. **API failure:** If NHTSA API is unreachable, fall back to showing a free-text input with a message: "Vehicle search unavailable. Please type your vehicle description."

6. **Mobile:** The dropdown should work on mobile -- full width, large tap targets (min 44px row height), scroll-friendly.

## Step 5: Cache the makes list

On component mount, fetch GetAllMakes once:
- Store in a module-level variable (not component state -- avoids refetch on re-render)
- The makes list is ~10KB and rarely changes
- If the fetch fails, retry once after 2 seconds, then fall back to a hardcoded list of the top 50 most common makes

## Step 6: Preserve VIN decode flow

The VIN decode flow must continue working exactly as before:
- User enters VIN, clicks Decode
- NHTSA DecodeVinValues returns year, make, model, trim, fuel type
- Fields populate
- The typeahead input shows the decoded vehicle text
- If the user then types in the typeahead, it clears the VIN-decoded values and starts fresh

## Build and deploy

```bash
npm run build
npx netlify-cli deploy --prod
git add src/
git commit -m "WO-17: NHTSA typeahead vehicle search in booking wizard"
git push origin main
```

## Do NOT:
- Touch globals.css or tailwind config
- Remove the VIN decode functionality
- Change any admin pages
- Install any new npm packages (use native fetch + built-in debounce or setTimeout)
- Change the Firestore booking schema
- Touch any other wizard steps (Services, Details, Review)
