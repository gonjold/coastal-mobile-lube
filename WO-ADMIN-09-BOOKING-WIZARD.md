# WO-09: Public Booking Wizard Redesign

## Context
The public-facing booking wizard at coastal-mobile-lube.netlify.app needs a flow and UX overhaul. Currently: Services > Vehicle > Details > Review. New flow: Vehicle > Services > Details > Review. This puts vehicle first so we can steer service recommendations based on fuel type. Also removing category icons in favor of cleaner collapsible menus, adding the convenience fee, and cleaning up the visual density.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css or tailwind.config
- Do NOT break the admin booking modal (separate component)
- Build, commit, push, deploy at the end

---

## Step 1: Read all relevant files

Read these files in full:
- Find the booking wizard component (likely in src/components/BookingWizard.tsx or src/app/booking/ or search for "Book Your Service")
- Read ALL files imported by the wizard (steps, substeps, service data, vehicle input)
- src/lib/vehicleApi.ts (from WO-06B, the NHTSA API utility)
- Check Firestore services collection structure
- Check how services are loaded and rendered currently
- Read the entire wizard end-to-end: understand every step, every state variable, every Firestore write

List all the files and their roles before making changes.

---

## Step 2: Swap flow order -- Vehicle FIRST, then Services

### Step 1 (was Services, now Vehicle): "Your Vehicle"

Replace the current Step 1 (service category grid) with a vehicle entry step.

**Layout:**
```
Step 1: Your Vehicle
─────────────────────────────────

VIN (optional)
[_________________________________] [Decode]

──────── or enter manually ────────

Year              Make              Model
[▼ Select year]   [▼ Select make]   [▼ Select model]

Engine / Fuel Type
[▼ Gas]

[image/illustration of vehicle type if available, otherwise skip]

                                    [Next →]
```

**VIN input:**
- Text input, placeholder "Enter your VIN for auto-fill (optional)"
- "Decode" button next to it (bg-[#E07B2D] text-white, rounded-lg, px-5 py-2.5, font-semibold)
- On decode: call the Cloud Function from WO-08 (or the vehicleApi.ts utility)
- Success: auto-fill Year/Make/Model and Fuel Type, show green checkmark + vehicle summary text ("2020 Honda Civic LX - Gas")
- Failure: show red "Could not decode VIN. Enter vehicle details manually." and do not block progress

**Year/Make/Model dropdowns (cascading):**
- Use the NHTSA API utilities from vehicleApi.ts
- Year: current year down to 1990
- Make: loads when year is selected (show "Loading..." while fetching)
- Model: loads when make is selected
- Style each dropdown consistently: border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white, focus:border-[#E07B2D] focus:ring-1

**Fuel Type dropdown:**
- Options: Gas (default), Diesel, Hybrid, Electric
- Pre-filled if VIN was decoded
- This value is passed to Step 2 to filter/steer services

**Next button:**
- Requires at minimum Year + Make + Model OR a successfully decoded VIN
- Fuel type defaults to Gas if not explicitly set
- Store vehicle data in wizard state: year, make, model, trim (if from VIN), fuelType, vin (if provided)

### Step 2 (was Vehicle, now Services): "Select Services"

This replaces the current icon-grid service category layout with collapsible accordion menus.

**Layout:**
```
Step 2: Select Services
─────────────────────────────────

[Automotive ▾] [Marine ▾] [RV ▾] [Fleet ▾]     YOUR SELECTION
                                                  ─────────────
▼ Coastal Packages                                Oil Change    $89.95 ×
  ☑ Coastal Basic         $99.95                  
  ☐ Coastal Complete      $139.95  MOST POPULAR   Estimated     $89.95
  ☐ Coastal Ultimate      $169.95                 

▶ Oil Changes
▶ Brakes  
▶ Tires & Wheels
▶ Basic General Maintenance
▶ Fluid Exchange Services
▶ A/C Services
▶ Diesel Engine Services        ← dimmed if fuelType is Gas
                                    [Next →]
```

**Division tabs** (keep these, same style as current):
- Automotive, Marine, RV, Fleet
- Default to Automotive. If the vehicle from Step 1 is obviously a boat/RV (from the model name or if user selected Marine/RV in a future field), auto-select the right tab

**Service categories as collapsible accordions:**
- Remove ALL category card icons. Replace with text-only collapsible sections
- Each category: clickable header row with category name + "From $XX.XX" price on the right + chevron
- Collapsed by default except "Coastal Packages" which starts expanded
- Header style: px-5 py-4, text-[15px] font-semibold text-[#0B2040], border border-gray-200 rounded-xl mb-2, cursor-pointer, hover:bg-gray-50
- Chevron: right side, rotates 180deg when expanded
- "From $XX.XX" price text: text-sm font-medium text-[#E07B2D], shown on collapsed headers only

**Expanded category content:**
- List of services in that category, each as a selectable row:
  - Checkbox on the left (not radio -- multiple selections allowed)
  - Service name: text-sm font-medium text-[#0B2040]
  - Price on the right: text-sm font-semibold text-[#E07B2D]
  - Optional description below name: text-xs text-gray-500 (if the service has one in Firestore)
- Padding: px-5 py-3 per row, border-b border-gray-100 (except last)
- Selected rows: light orange background (bg-orange-50) with filled checkbox

**"MOST POPULAR" badge:**
- Show on Coastal Complete package (or whichever is flagged as popular in Firestore)
- Small orange badge: bg-[#E07B2D] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded

**Fuel type steering:**
Based on the fuelType from Step 1:
- If **Gas**: Show all non-diesel categories normally. Show "Diesel Engine Services" category at the bottom with dimmed text (text-gray-400) and a note "(for diesel vehicles only)". It is still expandable but services inside are also dimmed with the same note. If user selects a diesel service anyway, show a yellow warning: "This service is typically for diesel vehicles. Your vehicle uses gas."
- If **Diesel**: Show "Diesel Engine Services" at the TOP of the list (promoted position). Show "Oil Changes" but with a note to select diesel-specific oil changes. Dim any gas-only services if they exist
- If **Hybrid**: Show all services normally. Add a note on oil change services: "Hybrid vehicles may have different oil requirements"
- If **Electric**: HIDE oil change categories entirely. Hide diesel services. Show only: Tires & Wheels, Brakes, A/C Services, Basic General Maintenance, Fluid Exchange Services. Show a helpful note: "Electric vehicles don't need oil changes. Here are the services available for your EV."

**YOUR SELECTION sidebar** (keep this, same position as current):
- Shows selected services as removable pills
- Running estimated total
- Vehicle info at the bottom (from Step 1)
- Sticky on scroll (but within the modal bounds)

**"Browse all [Division] services" link:**
- Remove this link at the bottom. The accordion sections already show everything

### Step 3: Details (mostly keep current, small fixes)

- Keep: First name, Last name, Phone, Email, Preferred Date, Preferred Time, Best way to reach you (Call/Text/Email), Service Address, Notes
- Fix the notes placeholder to match: "E.g.: Keys will be at reception, ask for Ana. Call (813) 555-1234 upon arrival. Access code: #1234. Car is on parking level 2, spot 45."
- YOUR SELECTION sidebar should now show the convenience fee:
  ```
  YOUR SELECTION
  ─────────────
  Synthetic Blend Oil Change    $89.95 ×
  Mobile Service Fee            $39.95
  ─────────────────────────────
  Estimated Total              $129.90
  ```
- The Mobile Service Fee should NOT have an X to remove it (customer can't opt out)
- If the fee is waived (first-time or promo), show it with strikethrough and "$0.00" or "FREE" next to it

### Step 4: Review (update to reflect new data)

- Show vehicle info prominently: "2020 Honda Civic LX (Gas)"
- Show all selected services with prices
- Show Mobile Service Fee as a line item
- Show Estimated Total
- Show customer details
- "Submit Booking" button

### When booking is submitted:

Write to Firestore bookings collection with:
- All customer fields (firstName, lastName, phone, email, address, contactPreference)
- Vehicle fields (year, make, model, trim, fuelType, vin)
- Selected services array (name, price, category, division)
- Convenience fee info (amount, waived status)
- date, time (preferred, not guaranteed)
- notes
- status: "pending"
- source: "Website"
- totalEstimate: sum of services + fee
- createdAt: serverTimestamp()

Also create a customer document if one doesn't exist with matching phone or email (use the dedup logic from WO-07's customerDedup.ts to check). If a matching customer exists, link the booking to them via customerId.

---

## Step 3: Convenience fee in the wizard

Read the Firestore settings/fees document (created in WO-06B).

Load the fee config when the wizard mounts. Display the fee in YOUR SELECTION sidebar starting from Step 2 (once services are selected):

- Show as a separate line item: label from config (default "Mobile Service Fee"), amount from config (default $39.95)
- Not removable by the customer
- If waiveFirstService is true and this is a new customer (no existing bookings with their phone/email), show the fee as waived with visual treatment (strikethrough on the amount, "FREE - first service" text in green)
- Include in the Estimated Total calculation (unless waived)
- If promoOverride is active and within date range, apply the discount and show the promo label

---

## Step 4: Visual cleanup

### Remove category icons
- Search for any icon imports or SVG components used in the service category cards
- Remove them all. The collapsible accordion headers are text-only

### Reduce visual density
- Increase spacing between accordion sections (mb-3 instead of mb-2)
- Use comfortable padding inside expanded sections (py-3 per row)
- YOUR SELECTION sidebar: clean card with subtle shadow, not a flat gray box

### Stepper bar cleanup
- The step numbers/labels at the top (1 Services, 2 Vehicle, etc.) need to update to the new order:
  1. Vehicle
  2. Services
  3. Details
  4. Review
- Green checkmark on completed steps, orange circle on current step, gray on future

### Modal sizing
- Make sure the modal is not too tall on smaller screens
- max-h-[90vh] with overflow-y-auto on the content area
- Footer (Back/Next buttons) should be sticky at the bottom, not scroll with content

---

## Step 5: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "WO-09: Booking wizard redesign - vehicle first, collapsible services, fee, fuel steering"
git push origin main
npx netlify-cli deploy --prod --message="WO-09: Public booking wizard redesign"
```

Verify:
- Wizard opens from public site booking buttons
- Step 1 is Vehicle (VIN decode + manual entry + fuel type)
- Step 2 is Services (collapsible accordions, no icons, fuel type steering works)
- Diesel vehicles see diesel services promoted, electric vehicles see oil changes hidden
- Mobile Service Fee shows in YOUR SELECTION sidebar
- Step 3 has the updated notes placeholder
- Step 4 Review shows vehicle + services + fee + total
- Booking submits to Firestore with all fields
- New customer auto-created if no match found
