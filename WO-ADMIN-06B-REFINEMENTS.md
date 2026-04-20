# WO-06B: Modal Refinements, Action Menus, Vehicle API, Convenience Fee

## Context
WO-06 deployed the Create New flows, customer edit/delete, and cross-page wiring. This WO refines those features based on testing feedback and adds the vehicle API integration and convenience fee system.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css or tailwind.config
- Build, commit, push, deploy at the end

---

## Step 1: Read all relevant files

Read these files in full:
- src/components/admin/NewBookingModal.tsx
- src/components/admin/NewCustomerModal.tsx
- src/components/admin/CustomerProfilePanel.tsx
- src/components/admin/InvoiceDetailPanel.tsx
- src/app/admin/customers/page.tsx
- src/app/admin/invoicing/page.tsx
- src/contexts/AdminModalContext.tsx
- src/app/admin/layout.tsx

---

## Step 2: Build the Vehicle API utility

Create src/lib/vehicleApi.ts

Uses the NHTSA vPIC API (free, no key required).

### VIN Decode
```typescript
interface VehicleInfo {
  year: string;
  make: string;
  model: string;
  trim: string;
  engineType: string;      // e.g., "2.5L I4"
  fuelType: string;         // Gas, Diesel, Hybrid, Electric, Plug-in Hybrid
  driveType: string;        // FWD, RWD, AWD, 4WD
  bodyClass: string;        // Sedan, SUV, Truck, Van, etc.
  vinDecoded: boolean;
}

async function decodeVIN(vin: string): Promise<VehicleInfo | null>
```

API endpoint: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`

Parse the response Results array. Map these fields:
- ModelYear -> year
- Make -> make
- Model -> model
- Trim -> trim
- EngineModel or DisplacementL + EngineCylinders -> engineType (format as "2.5L I4" or "3.5L V6")
- FuelTypePrimary -> fuelType (normalize to: Gas, Diesel, Hybrid, Electric, Plug-in Hybrid)
- DriveType -> driveType
- BodyClass -> bodyClass

Return null if the VIN is invalid or the API returns an error.

### Year/Make/Model Cascading Lookups
```typescript
async function getYears(): Promise<string[]>
// Return an array of years from current year down to 1990

async function getMakes(year: string): Promise<string[]>
// API: https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json
// Also call for truck and motorcycle, combine and deduplicate
// Sort alphabetically

async function getModels(year: string, make: string): Promise<string[]>
// API: https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${make}/modelyear/${year}?format=json
// Return Model_Name values, sorted alphabetically
```

### Fuel Type Helper
```typescript
function getFuelCategory(fuelType: string): 'gas' | 'diesel' | 'hybrid' | 'electric'
// Normalize any fuelType string to one of four categories
// "Gasoline" | "Gas" | "" | null -> 'gas'
// "Diesel" -> 'diesel'
// "Hybrid" | "Plug-in Hybrid" | "PHEV" -> 'hybrid'
// "Electric" | "BEV" -> 'electric'
```

---

## Step 3: Rebuild the vehicle input in New Booking Modal

Modify src/components/admin/NewBookingModal.tsx

Replace the current single "Vehicle" text input with a structured vehicle section:

### Layout:
```
VEHICLE
[VIN input field] [Decode button]
-- or --
[Year dropdown] [Make dropdown] [Model dropdown]
[Engine/Fuel Type dropdown]
```

### VIN input:
- Text input, placeholder: "Enter VIN to auto-fill"
- "Decode" button next to it (px-4 py-2.5, bg-[#1A5FAC], text-white, text-xs font-semibold, rounded-lg)
- On click: call decodeVIN(), if successful fill all fields below automatically
- Show a green checkmark and "Decoded" text next to the button on success
- Show red "Invalid VIN" on failure
- Loading state: button shows spinner/loading text while API call is in progress

### "-- or --" divider:
- flex items-center gap-3, my-3
- Left and right: flex-1 h-px bg-gray-200
- Center: text-xs text-gray-400 "or enter manually"

### Year/Make/Model dropdowns (cascading):
- Three dropdowns in a row (grid grid-cols-3 gap-3)
- Year: populated from getYears() on mount
- Make: populated from getMakes(year) when year is selected. Disabled until year is selected.
- Model: populated from getModels(year, make) when make is selected. Disabled until make is selected.
- Each dropdown: select element, border border-gray-200 rounded-lg px-3 py-2.5 text-sm, focus:border-[#1A5FAC]
- Default option: "Year" / "Make" / "Model" in gray
- Show loading text ("Loading...") while API calls are in progress

### Engine/Fuel Type dropdown:
- Below the YMM row, full width or half width
- Options: Gas, Diesel, Hybrid, Electric
- If VIN was decoded, this is pre-filled and shown as a read-only pill (but can be changed)
- This field is critical: it drives the service filtering logic

### Service filtering based on vehicle:
After the vehicle section, when the SERVICE dropdown is rendered:
- If fuelType is "diesel": show diesel services first, then other services. Add a subtle label "Recommended for diesel" on diesel items
- If fuelType is "electric": hide oil change services entirely, show only electric-compatible services (tires, brakes, fluids, general maintenance)
- If fuelType is "hybrid": show all services but flag diesel-only services as "Not compatible"
- If fuelType is "gas" or not set: show all non-diesel services first, diesel services at the bottom grayed out with "Diesel vehicles only"

This filtering is purely UI-side. Do NOT remove any services from the dropdown, just reorder and annotate. Jason can still manually select any service if needed.

---

## Step 4: New Customer modal -- first/last name split

Modify src/components/admin/NewCustomerModal.tsx

Replace the single "Name" field with two fields side by side:

```
FIRST NAME *          LAST NAME *
[______________]     [______________]
```

- grid grid-cols-2 gap-3
- Both required
- When saving to Firestore, store as separate fields: firstName, lastName
- Also store a computed fullName field: `${firstName} ${lastName}` for display and search purposes
- Update any code that reads customer.name to use customer.fullName (or firstName + lastName)

Also update the customer Firestore document type/interface to include firstName, lastName, fullName.

For existing customers that only have a "name" field, handle gracefully: if fullName is missing, fall back to name. Do NOT run a migration on existing data.

---

## Step 5: Inline customer creation from booking and invoice modals

Modify src/components/admin/NewBookingModal.tsx

Current behavior: customer search shows existing customers. If no match found, it shows a "Create new customer" option.

New behavior when "Create new customer" is selected:

Instead of opening the separate NewCustomerModal, expand inline fields within the booking modal itself:

```
CUSTOMER *
[Search existing or enter new...]  -- typed "Dave Smith" with no matches

  > Create "Dave Smith" as new customer

  [expanded inline section:]
  FIRST NAME          LAST NAME
  [Dave         ]     [Smith        ]
  
  PHONE               EMAIL
  [____________]      [____________]
  
  ADDRESS
  [________________________________]
```

- The inline section appears smoothly below the search input when "Create new customer" is clicked
- Pre-fill first/last name from whatever was typed in the search input (split on space)
- Phone and email are optional but encouraged
- Address can be left empty (it's also in the booking address field below)

When "Create Booking" is clicked and a new customer is being created:
1. First write the new customer to Firestore customers collection
2. Get the new customer's document ID
3. Then write the booking with that customerId
4. Both writes should be in a Firestore batch for atomicity

Apply the same pattern to the invoice creation modal:
- If the customer search in New Invoice modal doesn't find a match, show the inline creation fields
- When "Create & Send" is clicked, create customer first, then invoice

---

## Step 6: Three-dot action menu on customer rows

Modify src/app/admin/customers/page.tsx

Add a three-dot menu (vertical ellipsis) as the last element in each customer table row.

### Three-dot button:
- w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition
- Three dots: render as three small circles stacked vertically (or use the character "⋮" at text-lg text-gray-400)
- On click: opens a dropdown menu positioned to the left of the button (so it doesn't get clipped by the right edge)
- Click outside closes the dropdown

### Dropdown menu:
- bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-[50]
- Position: absolute, anchored to the three-dot button

Menu items:
1. **View Profile** -- opens the customer profile panel (same as clicking the row)
2. **Edit Customer** -- opens the profile panel directly in edit mode (Details tab with edit toggled on)
3. **New Booking** -- opens NewBookingModal pre-filled with this customer
4. **New Invoice** -- opens NewInvoiceModal pre-filled with this customer
5. Divider (h-px bg-gray-100 my-1)
6. **Delete Customer** -- opens the delete confirmation modal

Each item: px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition
- Regular items: text-gray-700
- Delete: text-red-600

### Prevent row click when three-dot is clicked:
Add e.stopPropagation() to the three-dot button click handler so it doesn't also open the profile panel.

### Update the grid template:
Add a narrow column at the end for the action button:
Change from: `2fr 1.5fr 1fr 1fr 1fr 100px`
To: `2fr 1.5fr 1fr 1fr 1fr 100px 40px`

Add a matching empty header cell for the actions column (no label, just empty space).

---

## Step 7: Three-dot action menu on invoice rows

Modify src/app/admin/invoicing/page.tsx

Same pattern as customers. Add a three-dot menu to each invoice row.

Menu items:
1. **View Details** -- opens the invoice detail panel (same as clicking the row)
2. **Edit Invoice** -- opens the invoice detail panel (future: edit mode. For now, same as View Details)
3. **Mark as Paid** -- updates invoice status to paid (only shown when status is Sent or Overdue)
4. **Resend** -- triggers resend (only shown when status is Sent or Overdue)
5. **Print / PDF** -- opens print view
6. Divider
7. **Delete Invoice** -- delete with confirmation modal

Delete confirmation for invoices:
- Same modal pattern as customer delete
- "Are you sure you want to delete invoice [INV-ID]? This action cannot be undone."
- On confirm: delete from Firestore, refresh list

Update the grid template:
Change from: `150px 1.2fr 1.2fr 90px 90px 110px 90px`
To: `150px 1.2fr 1.2fr 90px 90px 110px 90px 40px`

---

## Step 8: Fix New Invoice not opening from sidebar on invoicing page

Read src/contexts/AdminModalContext.tsx and src/app/admin/invoicing/page.tsx

The issue: when the user is already on /admin/invoicing and clicks "New Invoice" from the sidebar Create New dropdown, the modal may not open because the invoicing page has its own local modal state that conflicts with the global AdminModalContext.

Fix: The invoicing page should listen to the AdminModalContext. When the context's activeModal changes to "invoice", the invoicing page's local invoice creation modal should open.

Add a useEffect in the invoicing page:
```typescript
const { activeModal, prefillData, closeModal } = useAdminModal();

useEffect(() => {
  if (activeModal === 'invoice') {
    // Open the local invoice creation modal
    setShowInvoiceModal(true);
    // If prefillData has customer or booking data, use it to pre-fill
    if (prefillData?.customer) {
      // pre-fill customer fields
    }
    if (prefillData?.booking) {
      // pre-fill from completed job
    }
    // Clear the global modal state so it doesn't re-trigger
    closeModal();
  }
}, [activeModal]);
```

---

## Step 9: Convenience fee system

### Add fee configuration to Firestore

Create a Firestore document at `settings/fees` (or read from existing settings collection if one exists):

```typescript
interface FeeConfig {
  convenienceFee: {
    enabled: boolean;
    amount: number;          // e.g., 39.95
    label: string;           // e.g., "Mobile Service Fee"
    taxable: boolean;        // whether tax applies to the fee
    waiveFirstService: boolean;  // auto-waive for first-time customers
    promoOverride: {
      enabled: boolean;
      type: 'waive' | 'discount_fixed' | 'discount_percent';
      value: number;          // dollar amount or percentage
      label: string;          // e.g., "First Service Free"
      startDate: string | null;
      endDate: string | null;
    } | null;
  };
}
```

Seed this document with the initial values:
```json
{
  "convenienceFee": {
    "enabled": true,
    "amount": 39.95,
    "label": "Mobile Service Fee",
    "taxable": false,
    "waiveFirstService": true,
    "promoOverride": null
  }
}
```

### Add fee to New Booking Modal estimated total

Modify src/components/admin/NewBookingModal.tsx

After the service line items in the ESTIMATED TOTAL section, add the convenience fee as a separate line item:

```
ESTIMATED TOTAL
Battery Replacement                    $50.00
Tire Rotation                          $49.95
Mobile Service Fee                     $39.95
─────────────────────────────────────────────
Total                                 $139.90
```

The fee line item should:
- Read from the Firestore settings/fees document on modal mount
- Show only when convenienceFee.enabled is true
- Display the configured label and amount
- If the selected customer is a first-time customer (0 completed bookings) AND waiveFirstService is true: show the fee with a strikethrough and "Waived - first service" text in green next to it, and exclude from total
- If promoOverride is active and within date range: apply the discount and show the promo label

Add an admin override: below the total, add a small toggle or link:
- "Waive Mobile Service Fee" text in text-xs text-blue-600 cursor-pointer
- Clicking it toggles the fee off for this booking, shows strikethrough
- Clicking again restores it
- This override is per-booking, not global

### Store the fee in the booking document

When creating a booking, store the fee info:
```typescript
{
  // ... existing booking fields
  convenienceFee: {
    amount: 39.95,    // 0 if waived
    waived: false,
    waivedReason: null  // 'first_service' | 'admin_override' | 'promo'
  }
}
```

### Add fee to invoice creation

When an invoice is created from a completed booking (via NeedsInvoiceBanner or "Create Invoice" in schedule detail panel), the convenience fee should appear as a line item in the invoice if it was not waived:

```
Line Items:
Battery Replacement    1    $50.00    $50.00
Tire Rotation          1    $49.95    $49.95
Mobile Service Fee     1    $39.95    $39.95
```

---

## Step 10: Notes field placeholder update

Modify src/components/admin/NewBookingModal.tsx

Update the Notes textarea placeholder to match Jason's preference (inspired by Luby Dudes):

Change from: "Gate code, key location, special instructions..."

To: "E.g.: Keys will be at reception, ask for Ana. Call (813) 555-1234 upon arrival. Access code: #1234. Car is on parking level 2, spot 45."

This gives customers (and Jason when booking on their behalf) concrete examples of useful info to provide.

---

## Step 11: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "WO-06B: Vehicle API, convenience fee, action menus, inline customer creation, modal fixes"
git push origin main
npx netlify-cli deploy --prod --message="WO-06B: Vehicle API, fees, action menus, modal refinements"
```

Verify:
- VIN decode works (test with a real VIN like 1HGCV1F34LA000001)
- Year/Make/Model cascading dropdowns populate correctly
- Fuel type filters services in the dropdown
- Three-dot menus work on customer and invoice rows
- Convenience fee shows in booking estimated total
- First-time customer gets fee waived automatically
- "Waive Mobile Service Fee" toggle works
- New Invoice opens from sidebar on invoicing page
- Inline customer creation works in booking and invoice modals
- First/Last name fields on New Customer modal
