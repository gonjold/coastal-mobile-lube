# WO-08-HOTFIX: Fix All Broken WO-08 Features

## Context
WO-08 deployed UI elements for 9 features but several are not properly wired. This WO fixes every broken feature with surgical precision. Each fix tells you exactly what file, what function, and what code to change.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Do NOT rewrite entire files
- Do NOT add new features. Only fix broken existing features
- Build, commit, push, deploy at the end

---

## Fix 1: Three-dot menu onClick handlers (Customers)

File: src/app/admin/customers/page.tsx

Read the file in full. Find the three-dot dropdown menu rendered for each customer row. The menu items ("View Profile", "Edit Customer", "New Booking", "New Invoice", "Delete Customer") render visually but their onClick handlers are missing or empty.

For EACH menu item, verify there is a real onClick handler that does something. If any handler is missing, empty, or calls a function that doesn't exist, fix it:

- "View Profile": must call a function that sets the selected customer ID state so the CustomerProfilePanel opens. Also must close the dropdown menu.
- "Edit Customer": must set the selected customer AND set a flag to open the profile panel in edit mode. If no editMode prop exists on CustomerProfilePanel, add one: `initialEditMode?: boolean`. When true, the panel opens with the Details tab active and the edit toggle already on.
- "New Booking": must call `openModal('booking', { customer: customerObject })` using the useAdminModal context. Import useAdminModal if not imported.
- "New Invoice": must call `openModal('invoice', { customer: customerObject })` using the useAdminModal context.
- "Delete Customer": must set state to show a delete confirmation modal for that specific customer.

EVERY onClick handler must also: (a) call e.stopPropagation() to prevent the table row click from firing, and (b) close the dropdown menu by setting the open menu state to null.

Verify the dropdown menu itself has e.stopPropagation() on its container div so clicking inside the menu doesn't trigger the row click.

## Fix 2: Three-dot menu onClick handlers (Invoices)

File: src/app/admin/invoicing/page.tsx

Same issue. Read the file in full. Find the three-dot dropdown menu for each invoice row. Fix every onClick handler:

- "View Details": must set the selected invoice ID to open InvoiceDetailPanel.
- "Edit Invoice": same as View Details for now.
- "Mark as Paid": must update the invoice document in Firestore: set status to "paid", paidAmount to invoice total, paidDate to new Date(). Then refresh the invoice list. Only show this option when status is NOT "paid".
- "Print / PDF": must trigger the existing print functionality. If a print route or window.print() pattern exists, use it. If not, open the invoice detail panel and add a TODO.
- "Delete Invoice": must show a confirmation modal. On confirm, call deleteDoc on the invoice document in Firestore, then refresh the list.

Same rules: every handler needs e.stopPropagation() and must close the dropdown.

## Fix 3: DNC toggles not saving

File: src/components/admin/CustomerProfilePanel.tsx

Read the file in full. Find the Communication Preferences section with Do Not Call, Do Not Text, Do Not Email toggles.

The toggles likely render but don't actually write to Firestore when toggled. Find the onChange or onClick handler for each toggle. It must:

1. Update the local state immediately (so the toggle visually flips)
2. Call updateDoc on the customer's Firestore document to save the new value:
```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // or wherever the Firestore instance is

// Inside the toggle handler:
const customerRef = doc(db, 'customers', customer.id);
await updateDoc(customerRef, {
  'communicationPreferences.doNotCall': newValue,
  // or doNotText, or doNotEmail depending on which toggle
});
```

If the communicationPreferences field doesn't exist on the customer document yet, the updateDoc will create it. Make sure the toggle handler uses the dot notation path ('communicationPreferences.doNotCall') so it sets nested fields correctly.

If the toggle is a plain div/span styled as a switch and not a real input, make sure it has an onClick handler. If it's using an onChange, make sure it's on an actual input element.

## Fix 4: VIN decode not populating fuel type

File: src/components/admin/NewBookingModal.tsx AND src/lib/vehicleApi.ts

Read both files in full. The VIN decodes Year/Make/Model correctly but does not set the Fuel Type dropdown.

In vehicleApi.ts, check the decodeVIN function. It should return a fuelType field parsed from the NHTSA response. The NHTSA field is called "FuelTypePrimary". Verify it is being extracted and returned.

In NewBookingModal.tsx, find where the VIN decode result is applied to form state. It likely sets year, make, model but misses fuelType. Find the lines that set state after decode and add:
```typescript
setFuelType(decoded.fuelType || 'Gas');
// or whatever the state setter for fuel type is called
```

Make sure the fuel type dropdown's value is controlled by this state variable.

## Fix 5: Booking modal field order

File: src/components/admin/NewBookingModal.tsx

Read the file in full. The current field order in the JSX is: Customer > Service > Vehicle > Date/Time > Address > Division > Notes > Estimated Total.

Change the JSX render order to: Customer > Vehicle (VIN + Year/Make/Model + Fuel Type) > Service > Date/Time > Address > Division > Notes > Estimated Total.

This is purely a JSX reorder. Move the entire Vehicle section (VIN input, "or enter manually" divider, Year/Make/Model dropdowns, Fuel Type dropdown) to ABOVE the Service section. Do NOT change any logic or state, just the render order.

## Fix 6: Global search behavior -- open customer modal instead of navigating

File: src/components/admin/AdminTopBar.tsx

Read the file in full. Find the global search dropdown results. When a customer result is clicked, it currently navigates to /admin/customers with a query param to select that customer. This takes the user away from their current page.

Change the behavior: when a CUSTOMER result is clicked from the global search:
1. Instead of using router.push(), call openModal from AdminModalContext with a new modal type: `openModal('customer-profile', { customer: resultCustomer })`
2. Close the search dropdown

Then in src/app/admin/layout.tsx (where global modals are rendered), add handling for the 'customer-profile' modal type. When active, render the CustomerProfilePanel as a modal overlay (with backdrop) regardless of which page the user is on. Import CustomerProfilePanel if not already imported.

For BOOKING results: keep the navigate behavior (go to /admin/schedule with the booking selected). Bookings are best viewed in the schedule context.

For INVOICE results: keep the navigate behavior (go to /admin/invoicing with the invoice selected).

## Fix 7: Per-page table filter search bars

Files: src/app/admin/schedule/page.tsx, src/app/admin/invoicing/page.tsx

Each page needs its own search/filter input NEAR the table (in the filter bar row), separate from the global search in the top bar.

### Schedule page:
Add a text input in the filter bar (after the division filter pills, before or near the List/Calendar toggle):
- Placeholder: "Filter bookings..."
- Filters the displayed booking rows by customer name, service name, or vehicle (client-side, immediate)
- Style: same as other inputs (border border-gray-200 rounded-lg px-3 py-2 text-sm, w-[200px])

### Invoicing page:
Add a text input in the filter bar row (between the status pills and Export CSV button):
- Placeholder: "Filter invoices..."
- Filters by invoice ID, customer name, or service name (client-side, immediate)
- Same styling

These are simple text inputs that filter the already-loaded data. No Firestore queries.

## Fix 8: Dead lead in three-dot menu

File: src/app/admin/schedule/page.tsx

The "Mark as Dead Lead" option is only in the schedule detail panel. It should ALSO be in the three-dot menu on schedule booking rows (if a three-dot menu exists on schedule rows).

First check: does the schedule page have three-dot menus on rows? If not, add them with these options:
- "View Details" (opens detail panel)
- "Confirm" (only if status is pending/new-lead)
- "Mark as Dead" (shows reason dropdown inline or navigates to detail panel)
- "Cancel" (only if not already cancelled/dead)

If three-dot menus already exist, just add "Mark as Dead" to the menu items.

When "Mark as Dead" is clicked from the menu: show a small inline dropdown (right in the menu, expanding the menu height) with the reason options: "No response", "Not interested", "Chose competitor", "Wrong number", "Budget", "Out of service area", "Other". Selecting a reason immediately updates the booking in Firestore (status = "dead", deadReason = selected reason) and closes the menu.

## Fix 9: Dashboard drill-down -- click to open customer modal, not navigate

File: src/app/admin/page.tsx AND src/components/admin/DashboardDrilldownModal.tsx

In the dashboard drill-down modal (the popup that shows when you click a pipeline sub-status row), each record row is clickable. Currently it navigates to the source page. Instead:

- For booking records in the drill-down: clicking should open the schedule detail panel inline (or navigate to /admin/schedule with that booking selected -- this is acceptable since bookings need schedule context)
- For customer-related actions: if the record shows a customer name that's clickable, clicking the customer name should open the customer profile modal (same as Fix 6)

The key principle: clicking a record in the drill-down should show details without losing the dashboard context when possible.

---

## Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "WO-08-HOTFIX: Fix all broken WO-08 features - menus, DNC, VIN, search, dead leads"
git push origin main
npx netlify-cli deploy --prod --message="WO-08-HOTFIX: Fix broken action menus, DNC, VIN decode, search UX"
```

Verify each fix individually:
1. Customer three-dot menu: click each item, verify it does something
2. Invoice three-dot menu: click each item, verify it does something
3. DNC: toggle Do Not Call on a customer, refresh page, verify it persists
4. VIN decode: decode a VIN, verify fuel type dropdown auto-selects
5. New Booking: vehicle section appears ABOVE service section
6. Global search: click a customer result, verify modal opens without navigating
7. Schedule page: filter input near table filters bookings by name
8. Schedule three-dot menu: "Mark as Dead" option with reason dropdown
9. Dashboard drill-down: verify click behavior
