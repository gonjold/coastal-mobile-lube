# WO-05: Invoicing Page Rebuild

## Context
Final WO in the Coastal admin redesign. WO-01 through WO-04 must be completed first. This WO replaces the current invoicing page with summary cards, a "needs invoicing" banner for completed jobs, a sortable invoice list, and a detail panel with line items, totals, and the Mark as Paid workflow. This page is the future QuickBooks API sync point.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Surgical edits only. Do NOT rewrite entire files unless the page is being fully replaced
- Do NOT touch globals.css, tailwind.config, or components from prior WOs unless fixing a bug
- Keep the existing invoice creation modal if it works well (the brief says it does)
- Keep the existing print/PDF view if it works (the brief says it's solid)
- Build, commit, push, deploy at the end

---

## Step 1: Read the current invoicing page

Read these files in full:
- src/app/admin/invoicing/page.tsx (or whatever the invoicing route file is)
- Any components imported by the invoicing page (invoice creation modal, print view, etc.)
- src/components/admin/ directory (all shared components from prior WOs)
- Check Firestore invoices collection structure: what fields exist on invoice documents
- Check Firestore bookings collection: identify completed bookings that do NOT have a linked invoice

Note the existing invoice creation modal code carefully. We want to KEEP it and potentially enhance it, not replace it.

---

## Step 2: Create the Invoice Detail Panel

Create src/components/admin/InvoiceDetailPanel.tsx

Fixed slide-in panel from the right, 500px wide.

Props:
- invoice: invoice object (or null to hide)
- onClose: () => void
- onMarkPaid: (invoiceId: string) => void

**Panel container:** fixed top-0 right-0, w-[500px], h-screen, bg-white, border-l border-gray-200, shadow, z-[60], flex flex-col.

**Header** (px-6 py-6, border-b):
- Invoice ID: text-xl font-bold text-[#0B2040] (e.g., "INV-1047")
- Status badge + "Past due" text in red if overdue
- Close button

Amount hero block (mt-3):
- Rounded-xl, p-4 px-5, flex justify-between items-center
- Background changes by status:
  - Overdue: bg-red-50
  - Paid: bg-green-50
  - Draft/Sent: bg-[#F7F8FA]
- Left side:
  - Label: text-[11px] font-bold text-gray-500 uppercase ("Balance Due" or "Amount Paid")
  - Amount: text-[32px] font-extrabold, color by status (red for overdue, green for paid, navy for others)
- Right side (for Paid invoices):
  - "Paid on" label: text-[11px] text-gray-500
  - Date: text-[13px] font-semibold text-green-700

**Scrollable content** (flex-1 overflow-y-auto, px-6 py-5):

Invoice details section:
- Key-value rows for: Customer, Email (blue, clickable), Job Reference, Vehicle, Invoice Date, Due Date, Division
- Same row styling as other detail panels

Line items section:
- Bordered table: border border-gray-200 rounded-[10px] overflow-hidden
- Header row: grid with columns Description (left) / Qty (center) / Rate (center) / Amount (center)
  - bg-[#F7F8FA], px-3.5 py-2.5, text-[11px] font-bold text-gray-500 uppercase
- Item rows: px-3.5 py-3, border-b (except last)
  - Description: text-[13px] text-[#0B2040]
  - Qty: text-[13px] text-[#0B2040] text-center
  - Rate: text-[13px] text-gray-500 text-center, formatted as $XX.XX
  - Amount: text-[13px] font-semibold text-[#0B2040] text-center, qty * rate

Totals block (below line items, right-aligned):
- Flex flex-col items-end gap-1.5, mt-3
- Subtotal row: label (text-[13px] text-gray-500) + value (text-[13px] font-medium), with min-w-[80px] text-right on values
- Tax row: same format, show tax rate in label (e.g., "Tax (7%)")
- Divider: w-[180px] h-px bg-gray-200, my-1
- Total row: label text-sm font-bold + value text-base font-bold
- If partially paid: show Paid amount in green, then Balance Due in red font-bold

Notes section (if notes exist):
- bg-[#F7F8FA] rounded-[10px] p-3.5, text-[13px]

QuickBooks sync placeholder:
- bg-[#F7F8FA] rounded-[10px] p-3.5, flex items-center gap-2.5
- Gray dot: w-2 h-2 rounded-full bg-gray-300
- Text: "QuickBooks sync not connected" text-xs text-gray-500
- "Set up" link: text-[11px] font-semibold text-[#1A5FAC] cursor-pointer, ml-auto
- This is a static placeholder. The QB OAuth flow will be built in a future phase

**Bottom action bar** (border-t, px-6 py-4, flex gap-2.5):

Actions change by invoice status:

Draft:
- "Send Invoice" (flex-1, bg-[#1A5FAC], text-white, rounded-[10px], py-2.5, font-semibold)
- "Print / PDF" (px-5, border border-gray-200, rounded-[10px], py-2.5, text-gray-500 font-semibold)

Sent or Overdue:
- "Mark as Paid" (flex-1, bg-[#16A34A], text-white, rounded-[10px], py-2.5, font-semibold) -- calls onMarkPaid
- "Resend" (px-5, border border-gray-200, rounded-[10px], py-2.5, text-[#1A5FAC] font-semibold)
- "Print / PDF" (px-5, border border-gray-200, rounded-[10px], py-2.5, text-gray-500 font-semibold)

Paid:
- "Print / PDF" (flex-1, border border-gray-200, rounded-[10px], py-2.5, text-[#0B2040] font-semibold)
- "Resend" (flex-1, border border-gray-200, rounded-[10px], py-2.5, text-[#1A5FAC] font-semibold)

"Print / PDF" button: if the existing print/PDF view works, wire it up here. Otherwise, open a new window with the invoice in a print-friendly layout.

"Send Invoice" and "Resend": if there is an existing sendInvoiceEmail Cloud Function, trigger it. If not, show an alert for now and add a TODO.

**Backdrop overlay:** Same pattern as other panels.

---

## Step 3: Create the Needs Invoicing Banner

Create src/components/admin/NeedsInvoiceBanner.tsx

Props:
- jobs: array of completed bookings that have no linked invoice
- onCreateInvoice: (job) => void

Collapsible amber banner:

**Collapsed state** (default):
- bg-white rounded-xl border border-gray-200 overflow-hidden, mb-4
- Header bar: bg-amber-50, px-5 py-3.5, flex justify-between items-center, cursor-pointer
  - Left: flex items-center gap-2.5
    - Amber dot: w-2 h-2 rounded-full bg-amber-500
    - Text: "X completed jobs ready for invoicing" text-sm font-semibold text-amber-800
    - Total amount in parens: text-[13px] font-medium text-amber-800
  - Right: chevron SVG (rotates 180deg when expanded)
- Click toggles expanded/collapsed

**Expanded state:**
Shows a list of completed jobs below the header. Each row:
- px-5 py-3, flex justify-between items-center, border-b border-gray-200
- Left: customer name (text-sm font-semibold text-[#0B2040]) + service and vehicle below (text-xs text-gray-500)
- Right: flex items-center gap-3
  - Amount: text-sm font-semibold text-[#0B2040]
  - "Create Invoice" button: px-4 py-1.5, bg-[#E07B2D], rounded-lg, text-xs font-semibold text-white, hover:bg-[#CC6A1F], cursor-pointer, whitespace-nowrap

When "Create Invoice" is clicked, call onCreateInvoice with the job data. This should open the existing invoice creation modal pre-populated with:
- Customer name, email, phone (from the booking's customer)
- Line items from the booking's service(s), pulled from the services Firestore collection
- Vehicle info

If the existing invoice modal accepts pre-populated data via props or state, wire it up. If not, open the modal empty and add a TODO for pre-population logic.

If there are no completed jobs needing invoicing, do not render this banner at all.

---

## Step 4: Rebuild the invoicing page

Replace the content of the invoicing page file.

**AdminTopBar:** title "Invoicing", subtitle showing invoice count.

**Summary cards** (below top bar, px-8 pt-6):
- Grid: grid-cols-1 sm:grid-cols-2 xl:grid-cols-4, gap-3

Four cards, each:
- bg-white rounded-xl border border-gray-200, p-4 px-5, relative overflow-hidden
- 3px accent bar at top (absolute, top-0 left-0 right-0), color matches the card
- Label: text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-2
- Value: text-[26px] font-bold, color matches accent bar
- Sub-text: text-xs text-gray-500

Cards:
1. Outstanding (accent: #1A5FAC blue): sum of Sent invoice totals, sub: "X invoices"
2. Collected MTD (accent: #16A34A green): sum of Paid invoice totals this month, sub: "X paid"
3. Overdue (accent: #DC2626 red): sum of Overdue invoice balances, sub: "X past due"
4. Avg Days to Pay (accent: #0B2040 navy): calculate from paid invoices (date paid minus invoice date), sub: "Last 30 days"

Calculate these from Firestore invoice data. If exact calculation is not possible with current data, use reasonable placeholders and add TODO comments.

**Filter bar + actions** (px-8, mt-4):
- flex items-center gap-4

Left: status pills
- All, Draft, Sent, Paid, Overdue
- Same styling pattern as other filter bars (active fills with status color, shows count badge)

Right (ml-auto, flex gap-3):
- "Export CSV" button using AdminCSVExport
- "+ New Invoice" button: px-4.5 py-2, rounded-lg, bg-[#E07B2D], text-white, text-[13px] font-semibold
  - On click: opens the existing invoice creation modal

**Content area** (px-8 py-4):

NeedsInvoiceBanner component (if there are completed jobs without invoices)

Invoice table using AdminTable:

Columns (all sortable):
- Invoice (left): invoice ID in text-[#1A5FAC] font-semibold (looks like a link)
- Customer (left): name + vehicle below
- Service (left): job reference, truncated
- Date (center): invoice date, abbreviated
- Due (center): due date, RED + font-semibold if overdue
- Amount (center): total, font-semibold
- Status (center): AdminBadge

Grid template: 100px 1.5fr 1.5fr 100px 100px 100px 90px

Overdue rows: subtle warm background tint (bg-orange-50/50 or similar) to make them stand out.

Default sort: newest first (by date descending). Sortable by any column.

Row click: opens InvoiceDetailPanel.

**Firestore data loading:**
- Query invoices collection, apply status filter
- Query bookings collection for completed bookings without a linked invoice (for the NeedsInvoiceBanner)
- If there's no "invoiceId" field on bookings to link them, match by customer name + date + amount. Add a TODO to add proper invoice linking to the booking schema
- Reuse existing Firestore patterns from the old page

**Mark as Paid flow:**
When onMarkPaid is called from the detail panel:
- Update the invoice document in Firestore: status = "paid", paidAmount = total, paidDate = today's date
- Refresh the invoice list and summary cards

---

## Step 5: Preserve existing invoice features

These existing features must continue to work:
- Invoice creation modal (keep it, ensure it opens from both "+ New Invoice" button and the NeedsInvoiceBanner)
- Print/PDF view (keep it, wire it to the "Print / PDF" button in the detail panel)
- sendInvoiceEmail Cloud Function (if it exists, wire it to "Send Invoice" and "Resend" buttons)

If any of these features had bugs or styling issues, fix them to match the new design system (navy/orange/blue colors, Plus Jakarta Sans font, rounded corners), but do not rebuild them from scratch.

---

## Step 6: Clean up old invoicing elements

Remove from the invoicing page:
- Old page header (replaced by AdminTopBar)
- Any old filter/navigation elements that duplicate the new filter bar
- Old inline invoice detail view if it existed (replaced by slide-in panel)

Keep all Firestore hooks, Cloud Function triggers, and print/PDF logic.

---

## Step 7: Final cross-page verification

After deploying, verify all five admin pages work:
1. /admin -- Dashboard with pipeline cards, schedule, action items, revenue
2. /admin/schedule -- List/calendar toggle, filters, detail panel with status workflow
3. /admin/customers -- Sortable list, search, profile panel with timeline
4. /admin/invoicing -- Summary cards, needs-invoicing banner, invoice list, detail panel
5. /admin/services -- Should still work unchanged in its existing location
6. /admin/hero-editor -- Should still work unchanged, now accessible via sidebar "Content Editor"
7. Sidebar navigation works on all pages, correct page is highlighted
8. "Get a Quote" FAB does NOT appear on any admin page

---

## Step 8: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "WO-05: Invoicing rebuild - summary cards, needs-invoicing banner, detail panel, mark as paid"
git push origin main
npx netlify-cli deploy --prod --message="WO-05: Invoicing page redesign - admin redesign complete"
```

Verify /admin/invoicing loads with the new layout and all features work.

---

## QuickBooks API Integration (Future Reference)

This page is designed as the QB sync point. When the QB integration is built (separate future WO), these are the touchpoints:

1. **Invoice sync (Coastal > QB):** When an invoice is created or updated in Coastal, push it to QB via the QB REST API. The invoice detail panel already has the line items structure that maps to QB invoice line items.

2. **Payment sync (QB > Coastal):** When a payment is recorded in QB, update the invoice status in Coastal Firestore. The "Mark as Paid" flow already sets the right fields.

3. **Customer sync (Coastal > QB):** When a customer is created in Coastal, create a matching customer in QB. The customer profile panel has all the fields QB needs.

4. **QB sync status indicator:** The gray dot placeholder in the invoice detail panel becomes green when synced, amber when pending, red when failed. Add a lastQBSync timestamp field to invoice documents.

5. **OAuth flow:** "Set up" link in the invoice detail panel opens a QB OAuth consent screen. Store the refresh token securely in Firebase (use firebase functions:secrets:set).

None of this is built in this WO. This note is for future reference so the next WO knows exactly where to hook in.
