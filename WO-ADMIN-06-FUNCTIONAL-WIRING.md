# WO-06: Create New Flows + Customer Edit/Delete

## Context
Admin redesign is complete (WO-01 through WO-05 + Polish). All pages render with the new layout. This WO wires up the functional connections: the Create New dropdown actions, customer editing, customer deletion, and cross-page linking so the admin actually works as an operational tool.

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
- src/components/admin/AdminSidebar.tsx (Create New dropdown)
- src/app/admin/customers/page.tsx (existing New Customer modal)
- src/components/admin/CustomerProfilePanel.tsx
- src/app/admin/invoicing/page.tsx (existing invoice creation modal)
- src/app/admin/schedule/page.tsx
- src/components/admin/ScheduleDetailPanel.tsx
- src/components/admin/NeedsInvoiceBanner.tsx
- Check Firestore collections structure: bookings, customers, invoices
- Check what shared types exist (src/types/ or src/lib/shared.ts or similar)

List what you find so we understand the data model before wiring things up.

---

## Step 2: Create New Booking modal

Create src/components/admin/NewBookingModal.tsx

This modal is opened from three places:
1. Sidebar "Create New" > "New Booking"
2. Customer profile panel "New Booking" button (pre-fills customer)
3. Schedule page (future: clicking empty time slot)

**Modal structure:**
- Overlay: fixed inset-0 bg-black/30 z-[70], flex items-center justify-center
- Modal: bg-white rounded-2xl shadow-xl w-[540px] max-h-[90vh] overflow-y-auto
- Header: px-6 py-5 border-b, "New Booking" text-lg font-bold, close X button
- Footer: px-6 py-4 border-t, flex justify-end gap-3, Cancel + Save Draft + Create Booking buttons

**Form fields** (each with label text-xs font-bold text-gray-500 uppercase mb-1.5):

1. **Customer** (required)
   - Searchable dropdown/combobox
   - Type to search existing customers by name, phone, or email
   - Shows matching customers in a dropdown list below the input
   - Each result shows: name + phone + email
   - Selecting a customer fills in their info
   - If no match: show "Create new customer" option at the bottom of the dropdown
   - If pre-filled from customer profile panel, show the customer name as a non-editable pill with an X to clear

2. **Service** (required)
   - Dropdown populated from Firestore services collection
   - Group by division (Automotive, Marine, Fleet, RV)
   - Show service name + price
   - After selection, show the price below the dropdown
   - Allow selecting multiple services (each shows as a pill with X to remove)

3. **Vehicle**
   - Text input
   - If a customer is selected and has vehicles on file, show them as quick-select pills above the input
   - Clicking a pill fills the input

4. **Date** (required)
   - Date picker input (type="date")
   - Default to tomorrow

5. **Time** (required)
   - Dropdown with time slots: 8:00 AM, 8:30 AM, 9:00 AM... through 4:30 PM (30-min increments)
   - Match the business hours (Mon-Fri 8-5)

6. **Address**
   - Text input
   - If customer is selected, pre-fill from their address on file

7. **Division**
   - Dropdown: Auto, Marine, Fleet, RV
   - Auto-detect from selected service if possible

8. **Notes**
   - Textarea, 3 rows
   - Placeholder: "Gate code, key location, special instructions..."

9. **Estimated Total** (read-only)
   - Calculated from selected services
   - Show below the form as a summary: service line items + subtotal
   - Future: add convenience fee here

**On "Create Booking":**
- Validate required fields (customer, service, date, time)
- Write a new document to Firestore bookings collection with:
  - customer name, phone, email, address (from selected customer)
  - customerId (reference to customer doc)
  - services array (selected services with names and prices)
  - vehicle, date, time, division, notes
  - status: "pending"
  - source: "Admin"
  - createdAt: serverTimestamp()
  - totalEstimate: sum of service prices
- Close modal
- If on the schedule page, refresh the bookings list
- If on the dashboard, refresh pipeline counts

**On "Save Draft":**
- Same as Create but set status to "draft" instead of "pending"

**Styling:** All inputs should use border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm w-full focus:border-[#1A5FAC] focus:ring-1 focus:ring-[#1A5FAC] outline-none transition. Buttons match the existing admin design system (orange for primary, gray border for secondary).

---

## Step 3: Wire the Create New dropdown

Modify src/components/admin/AdminSidebar.tsx

The Create New dropdown currently has three items that close the dropdown but do nothing. Wire them up:

1. **"New Booking"** -- opens NewBookingModal
2. **"New Customer"** -- opens the existing New Customer modal from the customers page
3. **"New Invoice"** -- opens the existing invoice creation modal from the invoicing page

To make this work across pages, use a global state approach. The simplest pattern for Next.js:

Create src/contexts/AdminModalContext.tsx:
- React context with state for which modal is open: null | "booking" | "customer" | "invoice"
- Also holds optional pre-fill data (e.g., customer object for pre-linked booking/invoice)
- Provider wraps the admin layout children
- Export useAdminModal hook

Wrap the admin layout (src/app/admin/layout.tsx) children with AdminModalProvider.

Render all three modals in the admin layout (they overlay regardless of which page you're on):
- NewBookingModal (new)
- NewCustomerModal (extract from customers page into its own component file if not already)
- NewInvoiceModal (extract from invoicing page into its own component file if not already)

Update AdminSidebar to use useAdminModal:
- "New Booking" calls openModal("booking")
- "New Customer" calls openModal("customer")
- "New Invoice" calls openModal("invoice")

Update the customer profile panel "New Booking" button:
- Calls openModal("booking", { customer: selectedCustomer })
- This pre-fills the customer in NewBookingModal

Update the customer profile panel "New Invoice" button:
- Calls openModal("invoice", { customer: selectedCustomer })

Update NeedsInvoiceBanner "Create Invoice" buttons:
- Calls openModal("invoice", { booking: completedJob })
- This pre-fills customer + line items from the completed job

---

## Step 4: Customer edit functionality

Modify src/components/admin/CustomerProfilePanel.tsx

The "Edit Customer" button in the Details tab currently does nothing. Wire it up:

**Approach:** Toggle the Details tab into edit mode. When edit mode is active:

1. All key-value rows become editable:
   - Name: text input
   - Phone: text input (tel type)
   - Email: text input (email type)
   - Address: text input
   - Type: dropdown (Residential / Commercial)
   - Notes: textarea

2. The "Edit Customer" button changes to a row of two buttons:
   - "Save Changes" (bg-[#16A34A] text-white, rounded-lg, flex-1)
   - "Cancel" (border border-gray-200 text-gray-500, rounded-lg)

3. Input styling: same as other form inputs in the admin (border border-gray-200 rounded-lg px-3 py-2 text-sm)

4. On "Save Changes":
   - Update the customer document in Firestore with the changed fields
   - Exit edit mode
   - Refresh the customer data in the parent page

5. On "Cancel":
   - Discard changes
   - Exit edit mode

**Vehicles tab editing:**
- Each vehicle's "View History" button stays as-is
- Add a small X button on each vehicle card to remove it (with confirmation)
- The "+ Add Vehicle" button opens a small inline input (text field + Save button) that adds to the customer's vehicles array in Firestore

---

## Step 5: Customer delete functionality

Add a delete option to the customer profile panel.

**Location:** Add a "Delete Customer" text button at the very bottom of the Details tab, below the Edit Customer button. Style: text-red-500 text-xs font-medium cursor-pointer hover:text-red-700. No icon, just text.

**Confirmation modal:**
When clicked, show a confirmation modal:
- Overlay: fixed inset-0 bg-black/30 z-[80]
- Modal: bg-white rounded-xl shadow-xl w-[400px], centered
- Content:
  - "Delete Customer" as text-lg font-bold text-[#0B2040]
  - "Are you sure you want to delete [Customer Name]? This will permanently remove their profile. Bookings and invoices linked to this customer will NOT be deleted."
  - text-sm text-gray-500, mt-2
- Buttons: flex gap-3 mt-6
  - "Cancel" (flex-1, border border-gray-200, rounded-lg, py-2.5, text-sm font-semibold text-gray-500)
  - "Delete" (flex-1, bg-red-600, rounded-lg, py-2.5, text-sm font-semibold text-white, hover:bg-red-700)

**On Delete:**
- Delete the customer document from Firestore
- Close the profile panel
- Refresh the customer list
- Do NOT delete linked bookings or invoices (they become "orphaned" but still exist with the customer name as a string)

---

## Step 6: Cross-page navigation wiring

Wire up these clickable links that should navigate between pages:

**Dashboard:**
- "Review Incoming" button on Incoming pipeline card -> /admin/schedule?filter=pending
- "View Schedule" button on Scheduled card -> /admin/schedule
- "Create Invoice" button on Jobs card -> /admin/invoicing
- "View Invoices" button on Invoices card -> /admin/invoicing
- Action item "View" button (overdue invoices) -> /admin/invoicing?filter=overdue
- Action item "Invoice" button -> /admin/invoicing
- Action item "Review" button -> /admin/schedule?filter=pending
- Action item "Contact" button -> opens the relevant booking in schedule detail panel (or just navigate to /admin/schedule for now)
- "Full Schedule" button -> /admin/schedule
- Today's schedule rows -> /admin/schedule (clicking a row navigates to schedule and selects that booking)

**Schedule:**
- "Create Invoice" in detail panel (when status is Completed) -> opens invoice modal pre-filled with booking data

**Customers:**
- Customer name in schedule detail panel -> /admin/customers (and select that customer)
- Customer name in invoice detail panel -> /admin/customers (and select that customer)

For the filter-via-URL pattern, check if the schedule and invoicing pages already read URL params. If not, add basic support:
```
const searchParams = useSearchParams();
const filterParam = searchParams.get('filter');
// If filterParam exists, set it as the active status filter on mount
```

---

## Step 7: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "WO-06: Create New flows, customer edit/delete, cross-page navigation wiring"
git push origin main
npx netlify-cli deploy --prod --message="WO-06: Functional wiring - Create New, edit, delete, navigation"
```

Verify:
- Create New dropdown opens booking/customer/invoice modals from any page
- New Booking modal creates a booking in Firestore
- Customer edit saves changes
- Customer delete works with confirmation
- Dashboard action buttons navigate to correct pages
- Schedule "Create Invoice" opens invoice modal pre-filled
