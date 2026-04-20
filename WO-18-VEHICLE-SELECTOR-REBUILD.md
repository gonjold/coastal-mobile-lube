# WO-18: Vehicle Selector Rebuild (4 Dropdowns + VIN Toggle)

**Goal:** Replace the NHTSA typeahead from WO-17 with a Menards-style 4-dropdown pattern (Year, Make, Model, Trim) all searchable, plus a toggle to switch to VIN entry. Keep fuel type auto-detection. Keep the "Been here before?" phone lookup. License plate lookup is NOT in this WO.

**Reference mockup:** `vehicle-selector-mockup.jsx` in the Claude chat session. Matches that UX.

**Expected execution time:** 25-35 minutes.
**Files touched:** ~4-6 files in the booking wizard flow.

---

## Step 1: Read current state

Read these files in full before making changes. Do not skim.

```bash
cd ~/coastal-mobile-lube
ls src/app/book
ls src/components/booking
cat src/app/book/page.tsx
```

Then read whichever component currently holds the vehicle step. Look for:
- A file named something like `VehicleStep.tsx`, `Step1Vehicle.tsx`, or similar
- The NHTSA typeahead component from WO-17 (likely named `VehicleTypeahead.tsx` or `NHTSATypeahead.tsx`)
- The existing VIN decode flow (uses the NHTSA `/DecodeVinValues` endpoint via Cloud Function proxy)
- The "Been here before?" phone lookup component
- Wherever `applyLookupBooking()` is defined (must remain backward compatible)

Identify and print these locations before proceeding:

```bash
grep -rn "VehicleTypeahead\|NHTSATypeahead\|DecodeVinValues\|GetAllMakes\|GetModelsForMakeIdYear" src/
grep -rn "applyLookupBooking" src/
```

## Step 2: Build the new VehicleSelector component

Create a new file: `src/components/booking/VehicleSelector.tsx`

Requirements:

1. **Two modes via a pill toggle at the top:**
   - `Year / Make / Model` (default)
   - `VIN`

2. **YMM mode — 4 searchable dropdowns in a 2x2 grid:**
   - Year: searchable, options = 2027 down to 1990 (38 options)
   - Make: searchable, options fetched ONCE on component mount via NHTSA `GetAllMakes` endpoint, cached in component state. Disabled until Year is selected.
   - Model: searchable, options fetched via NHTSA `GetModelsForMakeIdYear` with 300ms debounce when year+make are both set. Disabled until Make is selected.
   - Fuel Type: searchable dropdown with 4 hardcoded options: `Gas`, `Hybrid`, `Electric`, `Diesel`. Disabled until Model is selected.

   **Note on trim:** Trim dropdown was dropped in favor of Fuel Type. NHTSA doesn't return reliable trim data and free alternatives (CarQuery) have uptime risk. Fuel Type covers what actually affects oil selection. If the customer has a non-standard engine, the tech will confirm on the confirmation call.

3. **Dependency chain:** selecting a new Year clears Make/Model/FuelType. Selecting a new Make clears Model/FuelType. Selecting a new Model clears FuelType.

4. **Skip option (bypass without filling all fields):**
   - Below the form, show a subtle link: `Don't have all the details? Skip and we'll confirm on the call →`
   - Clicking the link sets a `skipped` state to true
   - When `skipped === true`:
     - Replace the Skip link with an amber banner: `We'll confirm your vehicle on the call.` / `Keep going. A technician will verify year, make, model, and fuel type before the appointment.` with an "Undo" button
     - The `Continue` button becomes enabled regardless of form completion
   - Editing any field after skipping clears the `skipped` state (back to normal validation)
   - On submit, if skipped, the booking document should store whatever partial vehicle data was entered (or nothing) plus `vehicle.needsConfirmation = true` so the admin can see which bookings need a follow-up call

5. **VIN mode:**
   - Single text input, 17 characters max, auto-uppercase, monospace font
   - "Decode" button disabled until exactly 17 chars entered
   - On click, call existing VIN decode Cloud Function
   - On success, show a green confirmation card with Year / Make / Model / Fuel and "Edit" link that flips back to YMM mode with fields pre-populated
   - Also offer the Skip link in VIN mode: `Don't have your VIN? Skip and we'll confirm on the call →`

6. **Searchable dropdown sub-component:**
   - Click to open, auto-focus a search input at top of dropdown panel
   - Options filter live as user types
   - Highlight selected option with `bg-[#0B2040] text-white`
   - Closes on outside click or selection
   - Max-height 240px, scrollable if overflow

7. **Styling:**
   - Use Coastal theme: navy `#0B2040` for primary/selected, orange `#E07B2D` for CTAs, amber `#FCD34D`/`#FEF3C7` for skip banner, Plus Jakarta Sans
   - Border radius 8px on inputs, 12px on cards, 20px on toggle pills
   - Labels uppercase, tracking-wide, font-semibold text-xs, text-slate-700

8. **Returning customer row (tight inline layout):**
   - Single line below the form fields: `Been here before? Look up by phone number →`
   - "Look up by phone number →" is a bold link in navy `#0B2040`, inline directly after the question, not separated by `justify-between`
   - Sits just above the footer / border

9. **Component API (props):**
```ts
interface VehicleSelectorProps {
  value: {
    year?: string;
    make?: string;
    model?: string;
    fuelType?: string;
    vin?: string;
    needsConfirmation?: boolean;
  };
  onChange: (vehicle: {
    year?: string;
    make?: string;
    model?: string;
    fuelType?: string;
    vin?: string;
    needsConfirmation?: boolean;
  }) => void;
  onLookupByPhone?: () => void;  // opens the "Been here before?" flow
}
```

## Step 3: Wire the new component into the booking wizard

Find the existing Step 1 Vehicle component. Replace the NHTSA typeahead with `<VehicleSelector>`.

Requirements:

1. The booking wizard's existing state (`vehicleYear`, `vehicleMake`, `vehicleModel`, `fuelType`, `vin`) must still be populated — map the `onChange` callback to the existing setters.
2. Add a new `needsConfirmation: boolean` flag to the booking wizard state. Stored as `vehicle.needsConfirmation` in the booking document on submit.
3. The "Next" button should require: (Year + Make + Model + Fuel Type) OR a successfully decoded VIN OR `skipped === true`.
4. The "Been here before?" phone lookup must continue working. When `applyLookupBooking()` populates a returning customer's vehicle, pass the values to `VehicleSelector` via its `value` prop. Mode should auto-switch to YMM and fields pre-fill. Skip state should clear.
5. On the admin side (booking detail panel), if `vehicle.needsConfirmation === true`, show a visible amber badge: `Vehicle details unconfirmed — call customer`. This gives Jason and the BDC an obvious queue of bookings that need a verification call before scheduling.

## Step 4: Delete the old NHTSA typeahead

After the new component is wired and tested, delete the old component file(s) from WO-17. Search for any imports of the old component and remove them:

```bash
grep -rn "VehicleTypeahead\|NHTSATypeahead" src/
```

Remove the old component file and any unused imports.

## Step 5: Verify booking submission

The booking document written to Firestore must now include:
- `vehicle.year`
- `vehicle.make`
- `vehicle.model`
- `vehicle.fuelType`
- `vehicle.vin` (when entered)
- `vehicle.needsConfirmation` (new — true if the customer skipped)

Make sure the admin-side booking detail panel and email confirmations can read these fields. Check `functions/src/bookings.ts` or wherever booking emails are composed — ensure the vehicle line shows year/make/model/fuel. If `needsConfirmation` is true, the admin email and text to Jason/Jon should include the line: `VEHICLE UNCONFIRMED - call customer`.

## Step 6: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
git add src/
git commit -m "WO-18: Replace NHTSA typeahead with YMM dropdowns + Fuel Type + Skip option

- New VehicleSelector: Year/Make/Model searchable dropdowns + Fuel Type dropdown
- Dropped Trim (NHTSA data unreliable); Fuel Type covers oil selection
- Skip option lets customer bypass with confirmation note
- vehicle.needsConfirmation flag surfaces skipped bookings to admin
- VIN mode preserved with Edit/Skip options
- Returning customer lookup inline below form
- Removes old NHTSA typeahead component"
git push origin main
npx netlify-cli deploy --prod
```

If functions/src/bookings.ts was edited:
```bash
firebase deploy --only functions --project coastal-mobile-lube
```

## Step 7: Verification checklist

Open https://coastal-mobile-lube.netlify.app/book and confirm:

1. Step 1 shows a toggle at top: `Year / Make / Model` and `VIN`
2. YMM mode shows 4 dropdowns: Year, Make, Model, Fuel Type. Typing in any dropdown filters options.
3. Year defaults to empty. Selecting a year enables Make.
4. Selecting Toyota → Model dropdown populates with Toyota models.
5. Selecting Tacoma → Fuel Type dropdown becomes active with Gas/Hybrid/Electric/Diesel options.
6. A subtle "Skip and we'll confirm on the call →" link is visible below the form when fields are incomplete.
7. Clicking the Skip link shows an amber banner, `Continue` button becomes enabled.
8. Clicking Undo on the amber banner returns to normal validation.
9. Editing a field after skipping clears the skipped state.
10. Clicking VIN tab → single input with 17-char counter. Paste a valid VIN, click Decode, confirmation card appears with Year/Make/Model/Fuel.
11. Clicking Edit on VIN confirmation → flips back to YMM with fields filled.
12. "Been here before? Look up by phone number →" is inline on a single line below the form.
13. Phone lookup still works and populates the selector.
14. Submitting a booking with skipped state stores `vehicle.needsConfirmation = true` in Firestore.
15. Admin-side booking detail for a skipped booking shows the amber "Vehicle details unconfirmed" badge.

## Do NOT

- Do NOT rewrite the entire booking wizard page. Only touch the Step 1 vehicle section and the VehicleSelector component.
- Do NOT break the VIN decode Cloud Function — only call it, do not modify it unless needed.
- Do NOT use `git add -A`. Use `git add src/` to avoid sweeping in workflow files.
- Do NOT add license plate lookup. That is v2.
- Do NOT use em dashes, emojis, or template literal backticks in GTM-facing code.
