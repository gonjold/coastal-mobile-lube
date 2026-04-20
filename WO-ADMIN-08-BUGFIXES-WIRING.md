# WO-08: Admin Bug Fixes + Functional Wiring

## Context
WO-06B deployed vehicle API, convenience fee, three-dot menus, and modal refinements. WO-07 deployed customer dedup. Multiple features from WO-06B are broken or partially wired. This WO fixes all broken features and adds missing functionality.

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

Read these files in full before making any changes:
- src/lib/vehicleApi.ts
- src/components/admin/NewBookingModal.tsx
- src/components/admin/NewCustomerModal.tsx
- src/components/admin/CustomerProfilePanel.tsx
- src/components/admin/InvoiceDetailPanel.tsx
- src/app/admin/customers/page.tsx
- src/app/admin/invoicing/page.tsx
- src/app/admin/schedule/page.tsx
- src/app/admin/page.tsx (dashboard)
- src/components/admin/AdminTopBar.tsx
- src/contexts/AdminModalContext.tsx
- Check if any Firebase Cloud Functions exist in functions/ directory
- Check Firestore bookings document structure for status field values

---

## Fix 1: VIN Decoder -- Cloud Function proxy

The NHTSA vPIC API call from the browser is failing (likely CORS or the URL construction is wrong). Fix by creating a Firebase Cloud Function that proxies the request.

Create or add to the Cloud Functions file (functions/src/index.ts or functions/index.js):

```typescript
export const decodeVIN = onRequest({ cors: true }, async (req, res) => {
  const vin = req.query.vin as string;
  if (!vin || vin.length !== 17) {
    res.status(400).json({ error: 'Invalid VIN length' });
    return;
  }
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to decode VIN' });
  }
});
```

Deploy the function:
```bash
cd functions && npm install && cd .. && npx firebase-tools deploy --only functions --project coastal-mobile-lube
```

Then update src/lib/vehicleApi.ts to call the Cloud Function URL instead of the NHTSA API directly:
```typescript
const response = await fetch(
  `https://us-east1-coastal-mobile-lube.cloudfunctions.net/decodeVIN?vin=${vin}`
);
```

Also check the Year/Make/Model cascading lookups. If those are also failing from CORS, proxy them through the same Cloud Function pattern or use a single function with an "action" parameter:
```
?action=decode&vin=XXX
?action=makes&year=2024
?action=models&year=2024&make=Toyota
```

Test after deploying: VIN `1HGCV1F34LA000001` should return a Honda Civic.

---

## Fix 2: Three-dot menu actions -- wire all onClick handlers

### Customers page three-dot menu (src/app/admin/customers/page.tsx):

Read the three-dot menu code. Each menu item likely renders but has no onClick handler or the handler does nothing. Wire each one:

1. **View Profile** -- `onClick={() => { setSelectedId(customer.id); closeMenu(); }}`
2. **Edit Customer** -- `onClick={() => { setSelectedId(customer.id); setEditMode(true); closeMenu(); }}`
   - Need to pass an `initialEditMode` prop to CustomerProfilePanel. Add this prop: when true, the Details tab is active and edit mode is toggled on when the panel opens
3. **New Booking** -- `onClick={() => { openModal('booking', { customer }); closeMenu(); }}`
4. **New Invoice** -- `onClick={() => { openModal('invoice', { customer }); closeMenu(); }}`
5. **Delete Customer** -- `onClick={() => { setDeleteTarget(customer); setShowDeleteConfirm(true); closeMenu(); }}`

Make sure `closeMenu()` sets the open menu state to null. Make sure `e.stopPropagation()` is on the three-dot button AND on the dropdown menu div to prevent the row click from firing.

### Invoicing page three-dot menu (src/app/admin/invoicing/page.tsx):

1. **View Details** -- `onClick={() => { setSelectedId(invoice.id); closeMenu(); }}`
2. **Edit Invoice** -- Same as View Details for now (the detail panel is the edit view). Add a TODO for inline editing
3. **Mark as Paid** -- `onClick={() => { handleMarkPaid(invoice.id); closeMenu(); }}`
   - Only show this item when invoice.status is "sent" or "overdue"
   - handleMarkPaid updates the invoice doc: status = "paid", paidAmount = total, paidDate = new Date()
4. **Print / PDF** -- `onClick={() => { window.open('/admin/invoicing/print/' + invoice.id, '_blank'); closeMenu(); }}`
   - If no print route exists, use `window.print()` after selecting the invoice, or open the detail panel and trigger print from there
5. **Delete Invoice** -- `onClick={() => { setDeleteTarget(invoice); setShowDeleteConfirm(true); closeMenu(); }}`
   - Add a delete confirmation modal (same pattern as customer delete)
   - On confirm: deleteDoc from Firestore, refresh the list

For "Mark as Paid" -- if the invoice status is already "paid", do NOT show this option. Show "Revert to Sent" instead (sets status back to "sent", clears paidDate).

---

## Fix 3: View History button in customer profile

Read src/components/admin/CustomerProfilePanel.tsx, find the Vehicles tab.

The "View History" button next to each vehicle does nothing. Wire it up:

When clicked, switch to the Timeline tab and filter it to only show entries for that specific vehicle. Implementation:

1. Add a `vehicleFilter` state to the panel (string | null, default null)
2. When "View History" is clicked: `setActiveTab('timeline'); setVehicleFilter(vehicleName);`
3. In the Timeline tab, if vehicleFilter is set:
   - Filter timeline entries to only those where the vehicle field matches vehicleFilter
   - Show a dismissible filter chip at the top: "[Vehicle Name] x" (clicking X clears the filter and shows all)
4. The existing timeline filter pills (All/Bookings/Invoices/Comms) still work on top of the vehicle filter

---

## Fix 4: Currency formatting

Search the entire src/components/admin/ directory for any place that displays dollar amounts. Look for patterns like:

- `customer.totalSpent` displayed without formatting
- `${amount}` without .toFixed(2)
- Any number rendered as "$329.9" instead of "$329.90"

Create a utility function in src/lib/formatCurrency.ts:
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

Replace all inline dollar formatting across these files with the formatCurrency utility:
- CustomerProfilePanel.tsx (Total Spent stat)
- Customer list rows (Total Spent column)
- InvoiceDetailPanel.tsx (all amounts)
- Invoice list rows (Amount column)
- PipelineCard.tsx (dollar amounts in sub-status rows)
- Dashboard revenue summary
- NewBookingModal.tsx (estimated total)
- NeedsInvoiceBanner.tsx (amounts)
- ScheduleDetailPanel.tsx (price field)

---

## Fix 5: New Invoice from sidebar on invoicing page

Read src/app/admin/invoicing/page.tsx and src/contexts/AdminModalContext.tsx.

The issue: clicking "New Invoice" in the sidebar Create New dropdown while already on the invoicing page does not open the invoice creation modal.

Check if the useEffect from the earlier fix is present. If not, add it:

```typescript
const { activeModal, prefillData, closeModal } = useAdminModal();

useEffect(() => {
  if (activeModal === 'invoice') {
    setShowInvoiceModal(true);
    if (prefillData?.customer) {
      // pre-fill customer fields in the invoice modal
    }
    if (prefillData?.booking) {
      // pre-fill from completed job
    }
    closeModal();
  }
}, [activeModal]);
```

If the invoicing page uses a different state variable for the modal, match it. The key is that the global context triggers the local modal state.

---

## Fix 6: Dead/Lost lead status

### Add "Dead" as a booking status

Search for where booking statuses are defined (likely in a shared types file, or inline in the schedule page filter).

Add "Dead" to the list of valid statuses alongside: new, pending, confirmed, in-progress, completed, cancelled.

### Update the schedule detail panel

In src/components/admin/ScheduleDetailPanel.tsx, add a "Mark as Dead" option:

- Show as a text button below the Cancel button (not as a primary action): "Mark as Dead Lead" in text-xs text-gray-500 cursor-pointer hover:text-red-600
- When clicked, show an inline dropdown or a small modal asking for a Dead Reason:
  - Dropdown options: "No response", "Not interested", "Chose competitor", "Wrong number", "Budget", "Out of service area", "Other"
  - If "Other": show a text input for custom reason
  - "Confirm" button saves to Firestore: status = "dead", deadReason = selected reason, deadDate = now

### Update the schedule filter

Add "Dead" to the status filter pills. Style: variant "gray" with a strikethrough effect or darker gray to visually separate dead leads from active statuses.

### Dead leads in pipeline cards

Dead leads should NOT count in any pipeline card. They are excluded from Incoming, Scheduled, Jobs totals. The dashboard could show a subtle "X dead leads this month" stat at the bottom of the Needs Attention section, but this is optional.

### Booking list styling

Dead bookings in the schedule list view should have a muted/faded row style (opacity-50 or text-gray-400) so they visually recede.

---

## Fix 7: Do Not Call / Opt-out data model

### Add fields to customer document

Update the customer type/interface to include:

```typescript
interface Customer {
  // ... existing fields
  communicationPreferences: {
    doNotCall: boolean;
    doNotText: boolean;
    doNotEmail: boolean;
    optOutDate: string | null;
    optOutReason: string | null;
  };
}
```

### Add to customer profile panel

In the Details tab, add a "Communication Preferences" section below Notes:

- Section label: "COMMUNICATION PREFERENCES" (same uppercase style as other sections)
- Three toggle rows:
  - "Do Not Call" -- toggle switch
  - "Do Not Text" -- toggle switch
  - "Do Not Email" -- toggle switch
- Each toggle: small switch (w-9 h-5 rounded-full, bg-gray-200 when off, bg-red-500 when on)
- When any toggle is turned ON, it saves immediately to Firestore (no need to be in edit mode)
- When turned on, show a subtle "(opted out [date])" text next to the toggle

### Visual indicator on customer list

If a customer has ANY do-not-contact flag set, show a small red indicator on their row. Options:
- A tiny red dot next to their name
- Or add "DNC" in red text next to their status badge

Keep it subtle -- this is a reference indicator, not an alarm.

### Booking creation warning

In NewBookingModal, when a customer is selected who has do-not-contact flags:
- Show a yellow warning bar below the customer field: "This customer has opted out of [call/text/email]. Contact through other channels."
- Do NOT block the booking creation -- just warn

---

## Fix 8: Global search bar

Modify src/components/admin/AdminTopBar.tsx

Convert the search placeholder span to a real input on ALL pages.

The AdminTopBar already has an optional `searchQuery`/`onSearchChange` prop pattern from WO-04 (used on Customers). Extend this:

If `onSearchChange` is provided (like on Customers), use it as a page-specific search.

If `onSearchChange` is NOT provided (Dashboard, Schedule, Invoicing), implement a global search:

1. Make the search input always functional (real input element, not a span)
2. When the user types 2+ characters, show a dropdown below the search bar with results grouped by type:
   - **Customers** section: match by name, phone, email. Show top 3 matches. Each result: name + phone
   - **Bookings** section: match by customer name or service name. Show top 3 matches. Each result: customer + service + date
   - **Invoices** section: match by invoice ID or customer name. Show top 3 matches. Each result: ID + customer + amount + status
3. Clicking a result navigates to the relevant page and selects that record:
   - Customer result -> /admin/customers (opens profile panel for that customer)
   - Booking result -> /admin/schedule (opens detail panel for that booking)
   - Invoice result -> /admin/invoicing (opens detail panel for that invoice)
4. Dropdown styling: bg-white rounded-xl shadow-lg border border-gray-200, positioned below the search bar, w-[400px], max-h-[400px] overflow-y-auto, z-[60]
5. Section headers: px-4 py-2 bg-gray-50, text-[11px] font-bold text-gray-500 uppercase
6. Result rows: px-4 py-2.5 cursor-pointer hover:bg-gray-50
7. Click outside or Escape closes the dropdown
8. Empty state: "No results found" centered text

For the search queries, fetch all three collections on mount (they're small enough) and filter client-side. Do NOT query Firestore on every keystroke.

---

## Fix 9: Dashboard drill-down modals

Modify src/app/admin/page.tsx and src/components/admin/PipelineCard.tsx

When a user clicks on a sub-status row in a pipeline card (e.g., "New Leads: 1" or "Needs Invoice: 4"), show a modal with those filtered records.

### Make sub-status rows clickable

In PipelineCard.tsx, add an `onRowClick` callback prop:
```typescript
rows: Array<{
  label: string;
  count: number;
  dotColor: string;
  amount?: string;
  filterKey?: string;  // e.g., 'new_leads', 'pending', 'needs_invoice'
}>
onRowClick?: (filterKey: string) => void;
```

Each sub-status row calls `onRowClick(row.filterKey)` when clicked.

### Create the drill-down modal

Create src/components/admin/DashboardDrilldownModal.tsx

Props:
- title: string (e.g., "New Leads", "Needs Invoice")
- records: array of booking or invoice objects
- type: 'booking' | 'invoice'
- onClose: () => void
- onViewAll: () => void (navigates to the full page)

**Modal structure:**
- Overlay: fixed inset-0 bg-black/20 z-[65], flex items-center justify-center
- Modal: bg-white rounded-2xl shadow-xl w-[700px] max-h-[80vh] overflow-hidden, flex flex-col
- Header: px-6 py-5 border-b, flex justify-between
  - Title: text-lg font-bold text-[#0B2040]
  - Count badge: text-sm font-semibold bg-gray-100 px-2.5 py-0.5 rounded-md
  - Close X button
- Content: flex-1 overflow-y-auto
  - List of records, each as a card/row:
    - For bookings: customer name, service, vehicle, date/time, status badge, price
    - For invoices: invoice ID, customer, amount, status badge, due date
    - Each row is clickable (navigates to the record on its page)
  - If the record type is booking and status allows actions, show inline action buttons:
    - "Confirm" for pending bookings
    - "Create Invoice" for completed jobs needing invoicing
- Footer: px-6 py-4 border-t, flex justify-between
  - Left: summary text ("4 jobs totaling $2,180")
  - Right: "View All in [Schedule/Invoicing]" button (bg-[#1A5FAC] text-white rounded-lg px-5 py-2.5 text-sm font-semibold)

### Wire to dashboard

In the dashboard page, add state for the drill-down modal (which filter is active, or null):

```typescript
const [drilldown, setDrilldown] = useState<{ title: string; filterKey: string; type: string } | null>(null);
```

Pass `onRowClick` to each PipelineCard. When a row is clicked:
1. Set the drilldown state with the filter key and title
2. Filter the bookings/invoices data to match that filter key
3. Render DashboardDrilldownModal with the filtered data

Filter key mappings:
- new_leads -> bookings where status is "lead" or "new"
- quote_requests -> bookings where source contains "quote"
- pending_bookings -> bookings where status is "pending"
- confirmed -> bookings where status is "confirmed"
- today -> bookings where date is today
- this_week -> bookings for current week
- in_progress -> bookings where status is "in-progress"
- needs_invoice -> bookings where status is "completed" AND no linked invoice
- completed -> bookings where status is "completed"
- sent_invoices -> invoices where status is "sent"
- paid_invoices -> invoices where status is "paid"
- overdue_invoices -> invoices where status is "overdue"

---

## Step 2: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

If a Cloud Function was added for VIN decode, also deploy functions:
```bash
cd functions && npm install && cd .. && npx firebase-tools deploy --only functions --project coastal-mobile-lube
```

Then deploy the frontend:
```bash
git add src/ functions/
git commit -m "WO-08: Fix VIN decoder, wire action menus, global search, drill-down modals, dead leads, DNC"
git push origin main
npx netlify-cli deploy --prod --message="WO-08: Admin bug fixes and functional wiring"
```

Verify:
- VIN decode works with `1HGCV1F34LA000001`
- Three-dot menus: all items functional on both customers and invoices
- View History filters timeline by vehicle
- All dollar amounts show 2 decimal places
- New Invoice opens from sidebar on invoicing page
- Dead lead flow works (mark as dead with reason)
- DNC toggles save to Firestore
- Global search returns results across collections
- Dashboard sub-status rows open drill-down modals
