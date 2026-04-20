# WO-04: Customers Page Rebuild

## Context
Fourth WO in the Coastal admin redesign. WO-01 through WO-03 must be completed first. This WO replaces the current customers page with a sortable list, working search, and a profile slide-in panel with a unified timeline showing all bookings, invoices, and communications for each customer.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Surgical edits only. Do NOT rewrite entire files unless the page is being fully replaced
- Do NOT touch globals.css, tailwind.config, or components from prior WOs unless fixing a bug
- Build, commit, push, deploy at the end

---

## Step 1: Read the current customers page

Read these files in full:
- src/app/admin/customers/page.tsx (or whatever the customers route file is)
- Any components imported by the customers page
- src/components/admin/ directory (all shared components)
- Check Firestore customers collection structure: what fields exist
- Check if bookings and invoices have a customerId or customer reference field that links back to the customer document

Note all existing Firestore query patterns, data shapes, and any customer creation/edit forms.

---

## Step 2: Create the Customer Profile Panel

Create src/components/admin/CustomerProfilePanel.tsx

This is a fixed slide-in panel from the right, similar to the schedule detail panel but wider (480px) with tabs.

Props:
- customer: customer object (or null to hide)
- bookings: array of bookings linked to this customer
- invoices: array of invoices linked to this customer
- onClose: () => void

**Panel container:** fixed top-0 right-0, w-[480px], h-screen, bg-white, border-l border-gray-200, shadow, z-[60], flex flex-col.

**Header** (px-6 py-6, border-b):

Top row: flex justify-between items-start
- Left: flex gap-3.5 items-center
  - Avatar: w-12 h-12 rounded-xl flex items-center justify-center text-[17px] font-bold text-white
    - Commercial customers: bg-[#1A5FAC] (blue)
    - Residential customers: bg-[#0B2040] (navy)
    - Display first letter of first name + first letter of last name
  - Name block:
    - Name: text-lg font-bold text-[#0B2040]
    - Badges row: flex gap-1.5, showing customer type badge (blue for Commercial, gray for Residential) and status badge (green for Active, amber for Lead, gray for Inactive)
- Right: close button (x, text-xl text-gray-500)

Quick stats bar below (mt-4):
- bg-[#F7F8FA] rounded-[10px] overflow-hidden, flex
- Three cells, each: flex-1, py-3 px-3.5, text-center, separated by 1px gray-200 borders
  - Label: text-[10px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-1
  - Value: text-base font-bold text-[#0B2040]
- Stats: Total Spent, Jobs (count), Last Visit (date or "Not yet")

**Tabs** (border-b, px-6):
Three tabs: Timeline, Details, Vehicles (with count)
- Each: px-4 py-3, text-[13px], cursor-pointer
- Active: font-semibold text-[#0B2040], border-b-2 border-[#E07B2D]
- Inactive: font-medium text-gray-500, border-b-2 border-transparent

**Tab content** (flex-1 overflow-y-auto, px-6 py-5):

### Timeline Tab

Filter pills at top: All, Bookings, Invoices, Comms
- flex gap-1.5, mb-4
- Active: bg-[#0B2040] text-white
- Inactive: bg-transparent text-gray-500
- Each: px-3 py-1, rounded-md, text-xs font-semibold, cursor-pointer

Timeline feed:
- Vertical connector line: absolute, left 15px, top-2 bottom-2, w-0.5 bg-gray-200

Each entry:
- flex gap-3.5, mb-1, relative
- Dot column: w-8 flex justify-center pt-3
  - Dot: w-2.5 h-2.5 rounded-full, z-[2], border-2 border-white
    - Booking entries: bg-[#1A5FAC] (blue)
    - Invoice entries: bg-[#16A34A] (green)
    - Communication entries: bg-[#6B7280] (gray)

- Card: flex-1, bg-white border border-gray-200 rounded-[10px] p-3 px-3.5 mb-1
  - Booking and invoice cards: cursor-pointer, hover:bg-gray-50
  - Top row: flex justify-between
    - Title: text-[13px] font-semibold text-[#0B2040]
    - Amount (if present): text-[13px] font-semibold text-[#0B2040]
  - Bottom row: flex items-center gap-2
    - Date: text-xs text-gray-500
    - Status badge (if present): AdminBadge component
    - Vehicle (if present): text-[11px] text-gray-500
    - Channel badge (for comms): text-[10px] font-semibold px-1.5 py-0.5 rounded
      - SMS: bg-blue-100 text-blue-700
      - Email: bg-amber-100 text-amber-700
      - Phone: bg-green-100 text-green-700
      - Web: bg-purple-100 text-purple-700

Build the timeline from all bookings, invoices, and comms related to this customer, sorted by date descending. If the customer document has a "communications" subcollection or array field, use it. If not, generate comm entries from booking creation events (each booking creates a "New booking via [source]" comm entry). Add a TODO comment for a proper communications logging system.

### Details Tab

Contact information section:
- Section label style (reuse from schedule panel)
- Key-value rows for: Phone, Email, Address, Customer Since, Type
- Phone and Email: text-[#1A5FAC] cursor-pointer
- "Edit Customer" button at bottom: w-full, py-2.5, rounded-lg, border border-gray-200, text-[13px] font-semibold text-[#1A5FAC], hover:bg-gray-50
  - On click: for now, show an alert or toggle inline editing (if the current page already has edit functionality, wire it up)

Notes section:
- bg-[#F7F8FA] rounded-[10px] p-3.5, text-[13px]
- If empty: italic text-gray-500 "No notes."

### Vehicles Tab

List of vehicles:
- Each vehicle: bg-[#F7F8FA] rounded-[10px] p-3.5 mb-2, flex justify-between items-center
  - Left: vehicle name (text-sm font-semibold text-[#0B2040]) + booking count below (text-xs text-gray-500, e.g. "3 bookings")
  - Right: "View History" button, px-3.5 py-1.5, rounded-md, border border-gray-200, bg-white, text-xs font-semibold text-[#1A5FAC]

"+ Add Vehicle" button at bottom:
- w-full, py-2.5, rounded-[10px], border border-dashed border-gray-300, text-[13px] font-semibold text-gray-500
- hover: border-[#1A5FAC] text-[#1A5FAC]

**Bottom action bar** (border-t, px-6 py-4, flex gap-2.5):
- "New Booking" button: flex-1, py-2.5, bg-[#E07B2D], rounded-[10px], text-white, text-sm font-semibold. Links to booking creation (or alert for now) pre-filled with this customer's info
- "New Invoice" button: flex-1, py-2.5, bg-transparent, border border-gray-200, rounded-[10px], text-[#16A34A], text-sm font-semibold, hover:bg-green-50 hover:border-green-600

**Backdrop overlay:** Same pattern as schedule panel. Fixed inset-0, bg-black/15, z-[55], onClick closes.

---

## Step 3: Rebuild the customers page

Replace the content of the customers page file.

**AdminTopBar:** title "Customers", subtitle showing filtered count.

**Filter bar** below top bar:
- bg-white, border-b, px-8 py-3, flex items-center gap-4

Left side filters:
1. Type pills: All, Residential, Commercial
   - Active: bg-[#0B2040] text-white font-semibold
   - Inactive: bg-transparent text-gray-500
   - Show count badge next to each
   - Separated by divider from:

2. Status pills: Active, Lead, Inactive
   - Same styling pattern, lighter weight (no filled background on active, just bg-gray-50 with darker text and font-semibold)

Right side (ml-auto, flex gap-3):
- CSV Export button using AdminCSVExport component (from WO-01)
- "+ Add Customer" button: px-4.5 py-2, rounded-lg, bg-[#E07B2D], text-white, text-[13px] font-semibold, hover:bg-[#CC6A1F]

**Working search bar** in the top bar:
- Make the search bar functional (not just placeholder)
- Filter the customer list by name, email, or phone as the user types
- Use local state filtering (no Firestore query on each keystroke)
- Input: border-none outline-none bg-transparent, text-[13px], full width inside the search container

**Customer table** (px-8 py-6):
Using AdminTable, AdminTableHeader, AdminTableRow from WO-01.

Columns (all sortable):
- Customer (left-aligned): avatar initials + name + primary vehicle below
- Contact (left-aligned): phone + email below
- Type (center): AdminBadge (blue for Commercial, gray for Residential)
- Total Spent (center): dollar amount, font-semibold
- Jobs (center): count
- Status (center): AdminBadge (green Active, amber Lead, gray Inactive)

Grid template: 2fr 1.5fr 1fr 1fr 1fr 100px

Avatar initials in customer column:
- w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white
- Commercial: bg-[#1A5FAC]
- Residential: bg-[#0B2040]

Default sort: alphabetical by name. Sortable by any column.

Row click: opens CustomerProfilePanel for that customer.

**Data loading:**
- Query Firestore customers collection
- For each customer, also query their bookings and invoices (by customerId or customer name match)
- If the existing page already has this data loading logic, reuse it
- If customer documents don't have a "type" field (Residential/Commercial), default to "Residential" and add a TODO to add this field
- If customer documents don't have totalSpent or jobCount fields, calculate from linked bookings/invoices

---

## Step 4: Customer creation

If the current page has a "New Customer" or "Add Customer" modal/form, keep it functional. Just make sure it's triggered by the new "+ Add Customer" button.

If there is no existing customer creation flow, create a simple modal:
- Overlay: fixed inset-0 bg-black/30 z-50, flex items-center justify-center
- Modal: bg-white rounded-2xl shadow-xl w-[480px] max-h-[90vh] overflow-y-auto
- Header: px-6 py-5 border-b, "New Customer" text-lg font-bold, close button
- Form fields: Name, Phone, Email, Address, Type (dropdown: Residential/Commercial), Vehicle, Notes
- Each field: label text-xs font-bold text-gray-500 uppercase mb-1.5, input border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm w-full
- Footer: px-6 py-4 border-t, flex gap-3 justify-end
  - Cancel: px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500
  - Save: px-5 py-2.5 bg-[#E07B2D] rounded-lg text-sm font-semibold text-white

On save, write to Firestore customers collection and refresh the list.

---

## Step 5: Clean up old customer elements

Remove from the customers page:
- Old expanded inline detail view (replaced by slide-in profile panel)
- Old mixed edit/view layout
- Old page header (replaced by AdminTopBar)
- Any redundant navigation elements

Keep all Firestore hooks, auth checks, and data processing.

---

## Step 6: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "WO-04: Customers rebuild - sortable list, profile panel with timeline, search, CSV export"
git push origin main
npx netlify-cli deploy --prod --message="WO-04: Customers page redesign"
```

Verify /admin/customers loads with the new layout, search works, and clicking a customer opens the profile panel.
