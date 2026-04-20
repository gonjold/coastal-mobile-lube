# WO-ADMIN-BUGFIX-ALL: Fix All Known Admin Bugs

## Context
This WO fixes 8 bugs in the Coastal admin portal plus wires the invoice three-dot menu actions. The last bug fix attempt (WO-08) left things half-wired because instructions were too vague. This WO is extremely specific about what to read, what to change, and how.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read EVERY file mentioned in full BEFORE making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css, tailwind.config, or AdminSidebar.tsx
- After EACH fix, verify the build still passes (`npm run build`)
- Do NOT skip any fixes. Execute every single one.
- Build, commit, push, deploy at the end

---

## STEP 0: Read all target files first

Read these files IN FULL before touching anything:

```
src/components/admin/CustomerProfilePanel.tsx
src/components/admin/AdminTopBar.tsx
src/components/admin/DashboardDrilldownModal.tsx
src/components/admin/InvoiceDetailPanel.tsx
src/lib/vehicleApi.ts
src/components/admin/NewBookingModal.tsx
src/app/admin/page.tsx
src/app/admin/schedule/page.tsx
src/app/admin/customers/page.tsx
src/app/admin/invoicing/page.tsx
src/contexts/AdminModalContext.tsx
```

Note the exact variable names, state hooks, function signatures, and import paths used in each file. You will need these exact names for the fixes below.

---

## FIX 1: DNC Toggle Broken (CustomerProfilePanel.tsx)

**Problem:** The Do Not Contact toggle flips visually but cannot be toggled back, and may not persist to Firestore.

**Root cause (likely):** The toggle is reading from local state that was initialized once from props and never re-syncs with Firestore. Or the updateDoc call uses a wrong path or stale reference.

**File:** `src/components/admin/CustomerProfilePanel.tsx`

**What to do:**

1. Find the DNC toggle code. It will be a checkbox, switch, or clickable element that updates a `doNotContact` or `dnc` or similar boolean field.

2. Find the local state variable tracking the DNC value. It will look something like:
   ```
   const [dnc, setDnc] = useState(customer?.doNotContact || false)
   ```
   or similar.

3. The fix has THREE parts:

   **Part A: Make state sync with props.** Add a useEffect that re-syncs the local DNC state when the customer prop changes:
   ```typescript
   useEffect(() => {
     setDnc(customer?.doNotContact ?? false);
   }, [customer?.doNotContact]);
   ```
   If this useEffect already exists, check that it uses `??` (nullish coalescing), NOT `||`. The value `false` is falsy and `|| false` will always resolve to false.

   **Part B: Fix the Firestore update.** Find the function that handles the toggle click. It should:
   - Calculate the NEW value as `!currentDncState` (not `!customer.doNotContact`, which would be stale)
   - Call `updateDoc(doc(db, 'customers', customer.id), { doNotContact: newValue })`
   - Then update local state: `setDnc(newValue)`
   - Wrap the updateDoc in try/catch with console.error on failure

   Make the handler look exactly like this (adjust variable names to match what exists in the file):
   ```typescript
   const handleDncToggle = async () => {
     if (!customer?.id) return;
     const newValue = !dnc;
     try {
       await updateDoc(doc(db, 'customers', customer.id), { doNotContact: newValue });
       setDnc(newValue);
     } catch (err) {
       console.error('Failed to update DNC status:', err);
     }
   };
   ```

   **Part C: Make sure the toggle UI reads from local state, not props.** The toggle/checkbox `checked` or conditional rendering MUST use the local state variable (`dnc`), NOT `customer.doNotContact`.

4. Verify `updateDoc` and `doc` are imported from `firebase/firestore` and that `db` is imported from wherever the firebase config is (likely `@/lib/firebase` or `@/lib/firebaseConfig`). Check other files in the same directory for the correct import path.

---

## FIX 2: Global Search Only Works on Dashboard (AdminTopBar.tsx)

**Problem:** Typing in the top bar search on Dashboard shows a customer/booking/invoice results dropdown. On Schedule, Invoicing, and Customers pages, the dropdown does not appear.

**File:** `src/components/admin/AdminTopBar.tsx`

**What to do:**

1. Read AdminTopBar.tsx in full. Find the search input and the dropdown that shows results.

2. Look for any condition that gates the search dropdown visibility. Common patterns that break it:
   - A prop like `showGlobalSearch` that only the Dashboard passes as true
   - A pathname check like `if (pathname === '/admin')` before rendering the dropdown
   - The dropdown rendering is inside a conditional that checks a prop only Dashboard provides
   - The search results state or query function is defined in the Dashboard page and passed as a prop, rather than living inside AdminTopBar itself

3. The fix depends on what you find:

   **If the search/query logic lives inside AdminTopBar already** but is gated by a condition:
   - Remove the condition. The search dropdown should always render when the user types, regardless of pathname.

   **If the search/query logic is passed in as props from the Dashboard page:**
   - Move the Firestore query logic INTO AdminTopBar.tsx so it works on every page.
   - The search should query the `customers` collection by name/email/phone (use a local filter on a pre-fetched list, or a simple Firestore query).
   - Do NOT query on every keystroke. Either pre-fetch all customers once (they are a small collection) and filter locally, or debounce the query with a 300ms delay.

4. The search dropdown should:
   - Appear below the search input when query length >= 2 characters
   - Show matching customers with name, phone, email
   - On click: set a state variable or call a callback that opens the CustomerProfilePanel for that customer
   - Position: absolute, below the search input, z-50, bg-white, rounded-xl, shadow-lg, border border-gray-200, max-h-[400px] overflow-y-auto, w-full or min-w-[360px]

5. **On the Customers page specifically:** The top bar search should ALSO filter the customer table (current behavior). So on Customers page, typing in search should do BOTH: show the global dropdown AND filter the table. The page-level filter state should be updated via a callback prop or context.

   Look at how the Customers page currently passes its search state. It likely has a prop like `onSearchChange` or sets a value via context. Keep that working AND add the global dropdown.

6. **On Schedule and Invoicing pages:** The top bar search is ONLY the global customer finder. It should NOT filter those page tables. Those pages have their own per-page search/filter bars below the top bar.

---

## FIX 3: Dashboard Drill-Down Customer Click Navigates Away (DashboardDrilldownModal.tsx)

**Problem:** Clicking a customer name inside a drill-down modal navigates to /admin/customers (the list page) instead of opening the customer profile panel/modal in place.

**File:** `src/components/admin/DashboardDrilldownModal.tsx`

**What to do:**

1. Read DashboardDrilldownModal.tsx in full. Find where customer names are rendered as links or clickable elements.

2. Find the click handler or Link component on the customer name. It currently does something like:
   ```
   <Link href="/admin/customers">
   ```
   or
   ```
   onClick={() => router.push('/admin/customers')}
   ```

3. Replace it with a state-based approach that opens the CustomerProfilePanel:

   **Option A (if AdminModalContext exists and has a customer profile state):**
   - Import the modal context
   - On customer name click: `setSelectedCustomer(customer)` via the context
   - This should open the CustomerProfilePanel overlay

   **Option B (if there is no shared context for this):**
   - Add local state to DashboardDrilldownModal: `const [profileCustomer, setProfileCustomer] = useState(null)`
   - Render CustomerProfilePanel at the bottom of the component, conditionally: `{profileCustomer && <CustomerProfilePanel customer={profileCustomer} onClose={() => setProfileCustomer(null)} bookings={...} invoices={...} />}`
   - On customer name click: `onClick={() => setProfileCustomer(customer)}`
   - You will need to fetch or pass the customer's bookings and invoices. If the drill-down modal already has access to bookings data (it should, since it is showing booking/pipeline details), pass what is available. For invoices, query Firestore: `where('customerId', '==', customer.id)`.

4. Remove any `<Link>` or `router.push` for customer name clicks. Customer names in the drill-down modal should NEVER navigate away from the dashboard.

5. Make sure CustomerProfilePanel is imported at the top of the file.

---

## FIX 4: VIN Decode Missing Trim, Engine, Hybrid Detection (vehicleApi.ts)

**Problem:** NHTSA vPIC API returns trim, engine displacement, and fuel type including hybrids, but the parsing code ignores these fields.

**File:** `src/lib/vehicleApi.ts`

**What to do:**

1. Read vehicleApi.ts in full. Find the function that calls the VIN decode endpoint (either the Cloud Function proxy at `https://us-east1-coastal-mobile-lube.cloudfunctions.net/decodeVIN` or the NHTSA API directly).

2. Find where the response results array is parsed. NHTSA returns an array of objects with `{ Variable: string, Value: string }`. The code currently extracts Year, Make, Model, and possibly FuelTypePrimary.

3. Add extraction for these additional NHTSA variables (exact Variable names from NHTSA vPIC):
   - `"Trim"` -- e.g. "TRD Pro", "Limited", "XLE"
   - `"Displacement (L)"` -- e.g. "3.4" (this is engine size in liters)
   - `"Engine Number of Cylinders"` -- e.g. "6"
   - `"Fuel Type - Primary"` -- e.g. "Gasoline", "Diesel"
   - `"Fuel Type - Secondary"` -- e.g. "Electric" (present on hybrids)
   - `"Electrification Level"` -- e.g. "Strong HEV", "Mild HEV", "BEV", "PHEV"

4. Build the parsed result object to include:
   ```typescript
   {
     year: number,
     make: string,
     model: string,
     trim: string,           // from "Trim" variable, default ''
     engineSize: string,     // formatted as "3.4L V6" from Displacement + Cylinders
     fuelType: string,       // parsed fuel type (see step 5)
     isHybrid: boolean,      // true if secondary fuel or electrification level present
     isElectric: boolean,    // true if electrification level is "BEV"
     isDiesel: boolean,      // true if primary fuel contains "Diesel"
   }
   ```

5. Fuel type parsing logic:
   ```typescript
   const primaryFuel = getValue('Fuel Type - Primary') || '';
   const secondaryFuel = getValue('Fuel Type - Secondary') || '';
   const electrification = getValue('Electrification Level') || '';

   let fuelType = 'Gas';
   let isHybrid = false;
   let isElectric = false;
   let isDiesel = false;

   if (electrification.includes('BEV')) {
     fuelType = 'Electric';
     isElectric = true;
   } else if (electrification || secondaryFuel.toLowerCase().includes('electric')) {
     fuelType = 'Hybrid';
     isHybrid = true;
   } else if (primaryFuel.toLowerCase().includes('diesel')) {
     fuelType = 'Diesel';
     isDiesel = true;
   } else if (primaryFuel.toLowerCase().includes('flex') || primaryFuel.toLowerCase().includes('e85')) {
     fuelType = 'Flex Fuel';
   }
   ```

6. Engine size formatting:
   ```typescript
   const displacement = getValue('Displacement (L)') || '';
   const cylinders = getValue('Engine Number of Cylinders') || '';
   let engineSize = '';
   if (displacement) {
     engineSize = `${displacement}L`;
     if (cylinders) engineSize += ` ${cylinders}-cyl`;
   }
   ```

7. Make sure the return type of the decode function includes all new fields. Update the TypeScript interface/type if one exists.

**Then in `src/components/admin/NewBookingModal.tsx`:**

8. Find where VIN decode results are displayed after a successful decode. Currently it shows Year, Make, Model, and maybe fuel type.

9. Add display for Trim and Engine Size. After the Year/Make/Model line, add:
   - Trim: show if not empty, e.g. as a badge or inline text after the model name
   - Engine: show if not empty, e.g. "3.4L 6-cyl" in gray text below the vehicle name
   - Fuel type: if hybrid, show an amber badge "Hybrid". If diesel, show "Diesel". If electric, show "Electric".

10. If there are any fields in the booking form that should auto-fill from the VIN decode (like a fuel type dropdown), wire them up. Set the form state for fuel type from the decoded result.

---

## FIX 5: Vehicle Input Should Be Text Search First (NewBookingModal.tsx)

**Problem:** Currently the vehicle section shows VIN field + cascading Year/Make/Model dropdowns. The primary input should be a text search field with the dropdowns as a fallback.

**File:** `src/components/admin/NewBookingModal.tsx`

**What to do:**

1. Find the vehicle input section in the modal. It currently has:
   - A VIN input field
   - Year dropdown (populated from NHTSA years API or hardcoded range)
   - Make dropdown (populated after year is selected)
   - Model dropdown (populated after make is selected)

2. Restructure the vehicle section layout to this order:
   - **VIN input** (stays as-is, at the top of the vehicle section)
   - **Text search input** (NEW, below VIN)
   - **"Or select manually" collapsible** (contains the Y/M/M dropdowns, collapsed by default)

3. The text search input:
   - Placeholder: "Search vehicle... (e.g. 2024 Toyota Camry)"
   - Styling: same as other inputs in the modal (match the VIN input styling)
   - When user types 3+ characters, show an autocomplete dropdown below the input
   - The dropdown should show results formatted as "YEAR MAKE MODEL TRIM"
   - On select, auto-fill Year, Make, Model, Trim into the form state

4. For the autocomplete data source, use the NHTSA API:
   - First, check if the text starts with a 4-digit year. If so, extract it.
   - Query NHTSA makes endpoint filtered by year: `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json` (or the make-specific endpoint)
   - This is complex to implement fully. **Simpler approach:** keep the text search as a LOCAL filter over a small static list of common vehicles (top 50 makes), and let the user fall back to dropdowns for anything else.
   - OR: Just make the text search parse the user's input into year/make/model tokens and auto-fill the dropdowns. E.g., if user types "2024 Toyota Camry", parse: year=2024, make=Toyota, model=Camry, and set the dropdown values accordingly.

5. **Simplified implementation (recommended to avoid API complexity):**
   - Add a single text input labeled "Quick Vehicle Search"
   - On blur or Enter, attempt to parse the text as "[Year] [Make] [Model] [Trim]"
   - If a 4-digit number between 1990-2030 is found, set it as year
   - If remaining words match a known make (Toyota, Honda, Ford, Chevrolet, BMW, etc. -- hardcode a list of ~40 common makes), set it as make
   - Remaining words become the model/trim
   - Auto-populate the Year/Make/Model dropdowns with parsed values
   - Show the dropdowns always visible (not collapsed) so the user can correct any parsing errors
   - This avoids external API calls for the search and keeps it simple

6. The "Or select manually" toggle for dropdowns:
   ```typescript
   const [showManualVehicle, setShowManualVehicle] = useState(false);
   ```
   - Below the text search: `<button onClick={() => setShowManualVehicle(!showManualVehicle)} className="text-xs text-[#1A5FAC] mt-1">Or select year/make/model manually</button>`
   - Wrap the existing Y/M/M dropdowns in `{showManualVehicle && (<div>...</div>)}`
   - BUT: if VIN decode or text search has already populated the year/make/model, show the dropdowns as read-only display (not hidden)

---

## FIX 6: Invoice Three-Dot Menu -- Wire ALL Actions (invoicing page)

**Problem:** The invoice three-dot menu exists but the actions may not be wired. The customer three-dot menu had the same problem and was fixed by switching from `onClick` to `onMouseDown` (to fire before the menu's blur event closes it). Apply the same fix here.

**File:** `src/app/admin/invoicing/page.tsx` (or wherever the invoicing table is rendered)

**What to do:**

1. Read the invoicing page file in full. Find the three-dot menu rendered on each invoice row.

2. The three-dot menu likely renders a dropdown with items like:
   - View Details
   - Send Invoice (or Resend)
   - Mark as Paid
   - Download PDF
   - Delete

3. **Critical fix:** Every menu item's click handler MUST use `onMouseDown` instead of `onClick`. This is because the three-dot dropdown closes on blur, and `onClick` fires AFTER blur. `onMouseDown` fires BEFORE blur.

   Change every action in the dropdown from:
   ```
   onClick={() => handleSomething(invoice)}
   ```
   to:
   ```
   onMouseDown={(e) => { e.preventDefault(); handleSomething(invoice); }}
   ```

   The `e.preventDefault()` is required to prevent the mousedown from triggering other side effects.

4. Wire each action:

   **View Details:**
   ```typescript
   onMouseDown={(e) => {
     e.preventDefault();
     setSelectedInvoice(invoice);
     // This should open InvoiceDetailPanel
   }}
   ```
   Find the state variable that controls InvoiceDetailPanel visibility (likely `selectedInvoice` or similar). Set it here.

   **Mark as Paid:**
   ```typescript
   onMouseDown={async (e) => {
     e.preventDefault();
     try {
       await updateDoc(doc(db, 'invoices', invoice.id), {
         status: 'paid',
         paidDate: new Date().toISOString(),
         paidAmount: invoice.total
       });
     } catch (err) {
       console.error('Failed to mark as paid:', err);
     }
   }}
   ```
   Make sure `updateDoc` and `doc` are imported from firebase/firestore and `db` is imported from the firebase config.

   **Send Invoice:**
   ```typescript
   onMouseDown={async (e) => {
     e.preventDefault();
     try {
       await updateDoc(doc(db, 'invoices', invoice.id), {
         status: 'sent',
         sentDate: new Date().toISOString()
       });
     } catch (err) {
       console.error('Failed to update invoice status:', err);
     }
   }}
   ```

   **Delete:**
   ```typescript
   onMouseDown={async (e) => {
     e.preventDefault();
     if (!confirm('Delete this invoice? This cannot be undone.')) return;
     try {
       await deleteDoc(doc(db, 'invoices', invoice.id));
     } catch (err) {
       console.error('Failed to delete invoice:', err);
     }
   }}
   ```
   Make sure `deleteDoc` is imported from firebase/firestore.

   **Download PDF:**
   If a PDF function already exists, wire it. If not, for now:
   ```typescript
   onMouseDown={(e) => {
     e.preventDefault();
     window.print(); // Placeholder -- will be replaced with proper PDF export later
   }}
   ```

5. Also check InvoiceDetailPanel.tsx. If it has a "Mark as Paid" button, verify it calls `updateDoc` with the same pattern above and updates the UI state after success. The panel should show updated status without requiring a page refresh -- either re-fetch the invoice or update local state optimistically.

6. Check that the invoice row click (clicking the row itself, not the three-dot) opens the InvoiceDetailPanel. If it does not:
   - Add `onClick={() => setSelectedInvoice(invoice)}` to the row or the main clickable area
   - Make sure this does NOT conflict with the three-dot button (the three-dot should `e.stopPropagation()` to prevent row click)

---

## FIX 7: Search Architecture -- Separate Global vs Per-Page (AdminTopBar.tsx + page files)

**Problem:** Global search (customer finder) and per-page table filter are conflated. They should be two separate tools.

**Files:**
- `src/components/admin/AdminTopBar.tsx`
- `src/app/admin/schedule/page.tsx`
- `src/app/admin/invoicing/page.tsx`
- `src/app/admin/customers/page.tsx`

**What to do:**

1. **AdminTopBar search = always global customer finder.** When typing in the top bar search on ANY page, a dropdown of matching customers appears. Clicking a customer opens their profile panel. This was addressed in Fix 2 above.

2. **Customers page special case:** On the customers page, the top bar search should BOTH show the global dropdown AND filter the customer table. To do this:
   - AdminTopBar should accept an optional callback prop: `onSearchChange?: (query: string) => void`
   - When the search input changes, call `onSearchChange(query)` if the prop is provided
   - The Customers page passes this prop to update its local table filter state
   - The global dropdown ALSO shows (both behaviors happen simultaneously)

3. **Schedule page:** Should NOT have a duplicate search bar in the filter area that does the same thing as the top bar. If there is a search input in the schedule filter bar, it should ONLY filter the schedule table (search bookings by customer name, service, etc.) and should NOT show the global customer dropdown.

   Check the schedule page filter bar. If it has a text input:
   - Keep it as a local table filter (filters displayed bookings)
   - Make sure it does NOT render the global customer dropdown
   - It should have its own state separate from AdminTopBar

4. **Invoicing page:** Same as schedule. Any search in the invoicing filter bar should ONLY filter the invoice table.

5. Visual differentiation:
   - Top bar search: has a search icon, full-width in the top bar area, placeholder "Search customers..."
   - Per-page filter inputs (in schedule and invoicing filter bars): smaller, placeholder specific to content ("Filter bookings...", "Filter invoices...")

---

## FIX 8: Mark as Dead Lead and Reason Dropdown Polish

**Problem:** This was partially built in WO-08 but needs verification.

**File:** `src/app/admin/schedule/page.tsx` and `src/components/admin/ScheduleDetailPanel.tsx`

**What to do:**

1. In the schedule page three-dot menu, verify "Mark as Dead" exists and works:
   - It should use `onMouseDown` (same pattern as Fix 6)
   - On click, it should either show a reason dropdown inline or open a small confirm dialog
   - Reasons: "No response", "Went to competitor", "Price too high", "Changed mind", "Duplicate", "Other"
   - On confirm: `updateDoc(doc(db, 'bookings', booking.id), { status: 'dead', deadReason: selectedReason })`

2. In ScheduleDetailPanel, verify the "Mark as Dead Lead" button works the same way.

3. Verify that dead bookings show the dead reason in the detail panel and have a visual indicator (gray background, strikethrough, or "DEAD" badge).

---

## FINAL STEP: Build, Commit, Push, Deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix ALL TypeScript or build errors. Do not skip errors or comment out code to make it compile.

```bash
git add src/
git commit -m "WO-BUGFIX-ALL: DNC toggle, global search, drill-down modals, VIN decode, vehicle search, invoice actions, search architecture, dead lead polish"
git push origin main
npx netlify-cli deploy --prod --message="WO-BUGFIX-ALL: 8 bug fixes + invoice three-dot wiring"
```

Verify:
1. /admin -- dashboard loads, drill-down modal opens, customer click opens profile (not navigate)
2. /admin/schedule -- global search dropdown works in top bar, dead lead works
3. /admin/customers -- search filters table AND shows global dropdown, DNC toggle works both ways
4. /admin/invoicing -- three-dot menu actions all fire (Mark as Paid, Send, Delete, View Details)
5. New Booking modal -- VIN decode shows trim/engine/hybrid, text search field present

---

*End of WO-ADMIN-BUGFIX-ALL*
