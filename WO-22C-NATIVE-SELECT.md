# WO-22c: Replace SearchableDropdown with Native Select Elements

**Project:** Coastal Mobile Lube & Tire
**Scope:** Vehicle selector ONLY. No other component, no other page.
**Estimated time:** 20-30 min
**Prerequisite:** WO-22b deployed (current state).

---

## CONTEXT

After WO-22 + WO-22b, the SearchableDropdown component still has persistent UX bugs:

1. On desktop, Model dropdown flips up but loses its search input and overlaps the Make dropdown
2. On desktop, Fuel Type dropdown flips up and covers the step indicator
3. On mobile, tapping the search input opens the iOS keyboard, which shrinks the viewport, which pushes the dropdown results off-screen

These are not isolated bugs. The root cause is architectural: **hand-rolled popovers inside constrained modal containers are inherently fragile**, and adding a search input inside the popover creates a keyboard-vs-popover conflict that cannot be solved without a portal-rendered bottom-sheet component library (Radix, Headless UI, floating-ui).

Rather than add a dependency or continue band-aiding, replace the SearchableDropdown in VehicleSelector with **native `<select>` elements**. This is the pattern Carvana, AutoTrader, ServiceTitan, and most modern automotive form flows use because browsers solve all of the above problems natively:

- iOS opens the wheel picker, pinned to bottom of screen, no keyboard conflict
- Android opens a modal picker, no clipping
- Desktop uses the OS-native dropdown with type-to-jump support
- Zero z-index or overflow issues
- Accessibility and keyboard navigation come free

---

## SCOPE

### IN
- `src/components/booking/VehicleSelector.tsx`
- Any direct styles or types affected by removing the SearchableDropdown sub-component
- Layout grid change inside VehicleSelector

### OUT
- The SearchableDropdown component file itself: leave it in place for now (other parts of the app may use it). Only stop using it in VehicleSelector.
- `BookingWizardModal.tsx`: no changes
- Any other page, any other form
- Admin portal
- VIN mode: untouched
- "Skip and we'll confirm on the call" flow: untouched
- "Been here before? Look up by phone number" flow: untouched

---

## STEPS

### Step 0: Pre-flight read

1. Read `src/components/booking/VehicleSelector.tsx` in full.
2. Identify:
   - How SearchableDropdown is imported and used
   - The data shape for year/make/model/fuel options (arrays of strings? objects with value/label?)
   - How the state is managed for the 4 fields
   - How the dependency chain works (Year clears Make/Model/Fuel; Make clears Model/Fuel; Model clears Fuel)
3. Print a brief summary of findings before editing.

### Step 1: Replace the 4 SearchableDropdowns with native `<select>`

For each of Year, Make, Model, Fuel Type, replace the SearchableDropdown usage with a native `<select>` element styled to match the existing form aesthetic.

**Component pattern (use this for all 4):**

```tsx
<div className="w-full">
  <label 
    htmlFor="year" 
    className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
  >
    Year
  </label>
  <div className="relative">
    <select
      id="year"
      value={year}
      onChange={(e) => handleYearChange(e.target.value)}
      className="w-full h-12 px-4 pr-10 text-base bg-white border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#E07B2D] focus:border-[#E07B2D] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      disabled={/* appropriate disabled state */}
    >
      <option value="">Select year</option>
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
    {/* Chevron icon, absolute positioned on the right */}
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
```

Key styling requirements:
- `appearance-none` to remove the native arrow, then add a custom chevron SVG
- `h-12` (48px height) for comfortable touch targets
- `text-base` (16px) to prevent iOS zoom on focus
- Orange focus ring `#E07B2D` to match the brand
- Disabled state visually clear (grayed out, not-allowed cursor)

**Apply to all 4 fields** with the right labels, state bindings, and disabled conditions.

### Step 2: Preserve the existing dependency chain

Keep the existing logic that clears dependent fields when a parent changes:
- When Year changes: clear Make, Model, Fuel Type
- When Make changes: clear Model, Fuel Type
- When Model changes: clear Fuel Type

Keep any existing API calls that populate Make list based on Year, Model list based on Year+Make, Fuel Type list based on Year+Make+Model.

Disabled states:
- Make `<select>` disabled until Year selected
- Model `<select>` disabled until Make selected
- Fuel Type `<select>` disabled until Model selected

### Step 3: Stack 4x1 on mobile, 2x2 on tablet+, 2x2 on desktop

The current 2x2 grid on all breakpoints is too cramped on mobile. Change to:

- **Mobile (< 640px):** 4 dropdowns stack vertically (`grid-cols-1`)
- **Tablet / Desktop (≥ 640px):** 2x2 grid (`sm:grid-cols-2`)

**Change:**
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  {/* Year */}
  {/* Make */}
  {/* Model */}
  {/* Fuel Type */}
</div>
```

Vertical stack on mobile gives each field full width (~343px at iPhone SE), readable, easy to tap.

### Step 4: Remove SearchableDropdown imports if no longer used in this file

Clean up any imports that are now unused in `VehicleSelector.tsx`. Leave the component file itself untouched.

### Step 5: Verify data shape compatibility

If the SearchableDropdown accepted arrays of objects like `{value, label}` and the native `<select>` needs to iterate differently, adapt the mapping:

```tsx
{makes.map((make) => (
  <option key={typeof make === 'string' ? make : make.value} value={typeof make === 'string' ? make : make.value}>
    {typeof make === 'string' ? make : make.label}
  </option>
))}
```

Match whatever shape the existing data uses. Do not change the data source or API.

### Step 6: Keep VIN mode and skip/lookup flows intact

- The YMM / VIN pill toggle at the top: unchanged
- The VIN input mode: unchanged
- The "Don't have all the details? Skip and we'll confirm on the call →" banner: unchanged
- The "Been here before? Look up by phone number →" link: unchanged
- The skipped-booking `vehicle.needsConfirmation = true` logic in BookingWizardModal: unchanged

Only the 4 dropdowns in YMM mode change.

### Step 7: Build, test, commit, deploy

1. Run `npm run build` and confirm zero errors.
2. Click through Step 1 locally or on preview:
   - Select Year 2024
   - Select Make Toyota
   - Select Model Corolla
   - Select Fuel Type Gas
   - Confirm all dependency chains clear correctly when parent changes
3. `git add src/`
4. `git commit -m "WO-22c: replace SearchableDropdown with native select elements in vehicle selector"`
5. `git push`
6. `npx netlify-cli deploy --prod` (no `--dir` flag)

---

## ACCEPTANCE CRITERIA

### Desktop (1280px+)
- [ ] 4 dropdowns in a clean 2x2 grid
- [ ] Opening Year dropdown shows the OS-native dropdown, no clipping, no overlap
- [ ] Opening Make dropdown shows the OS-native dropdown, no clipping, no overlap
- [ ] Opening Model dropdown shows the OS-native dropdown, no clipping, no overlap (even in bottom row)
- [ ] Opening Fuel Type dropdown shows the OS-native dropdown, no clipping, no overlap (even in bottom row)
- [ ] Typing a letter key jumps to matching option (native behavior)
- [ ] Chevron icon is visible on each dropdown
- [ ] Focus ring is orange `#E07B2D`
- [ ] Dependency chain works: changing Year clears Make/Model/Fuel, etc.

### Mobile (iPhone, verified on actual device)
- [ ] 4 dropdowns stack vertically, full width
- [ ] Tapping any dropdown opens the iOS wheel picker from the bottom
- [ ] Picker does not conflict with the keyboard (no keyboard appears)
- [ ] No dropdown clipping or overflow issues
- [ ] No horizontal scroll
- [ ] All dropdowns are at least 48px tall (comfortable tap target)
- [ ] 16px font size prevents zoom when focusing
- [ ] Dependency chain works same as desktop

### Both
- [ ] VIN mode still works (toggle to VIN, paste 17-char VIN, decode)
- [ ] Skip banner still works
- [ ] Phone lookup link still works
- [ ] Step 1 "Next" button enables correctly when required fields populated
- [ ] No console errors

---

## DO NOT

- Do NOT delete the `SearchableDropdown` component file. Leave it for now.
- Do NOT add any new dependencies (no Radix, no Headless UI, no react-select).
- Do NOT change the data source or API calls.
- Do NOT touch any other component, page, or form.
- Do NOT change copy.
- Do NOT rewrite the entire file — surgical replacement of the 4 dropdown usages only.

---

## ROLLBACK

If this introduces any regression:

```bash
git revert HEAD
git push
npx netlify-cli deploy --prod
```

The previous state (post-WO-22b) is broken but functional — rollback restores that state.

---

## WHY THIS IS THE RIGHT FIX

The hand-rolled SearchableDropdown is a component that tries to solve 4 problems simultaneously:

1. Display a filtered list
2. Handle collision with container edges
3. Manage z-index in a nested modal
4. Accept text input (search)

Problems 2-4 conflict with each other in ways that cannot be solved without a portal render + floating-ui positioning engine + keyboard-aware viewport math. That is a 500-line component, minimum, and every major UI library (Radix, Headless UI, MUI, Chakra) ships one because it is genuinely that hard.

Native `<select>` hands all 4 problems to the browser. The browser's implementation has been tested on billions of devices for 30 years. It is the correct tool.

The only tradeoff is no inline search filtering. For 4 form fields with 4-40 options each, this is acceptable UX — especially given that native selects support type-to-jump on desktop and a native picker on mobile that users already know how to use.

If Coastal ever needs a truly searchable combobox elsewhere (e.g., a 10,000-entry customer lookup), add Radix Combobox at that point. Do not try to roll it for a 4-field form.
