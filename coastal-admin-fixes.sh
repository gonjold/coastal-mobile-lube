#!/bin/bash
# coastal-admin-fixes.sh
# Admin backend refinements based on Jon's review
# tmux new -s admin-fixes && bash ~/coastal-mobile-lube/coastal-admin-fixes.sh

set -e
cd ~/coastal-mobile-lube
git checkout navy-redesign
git pull origin navy-redesign 2>/dev/null || true

LOG=~/coastal-mobile-lube/ADMIN-FIXES-LOG.md
echo "# Admin Fixes Pipeline" > $LOG
echo "Started: $(date)" >> $LOG
echo "Branch: navy-redesign" >> $LOG
echo "---" >> $LOG

run_task() {
  local TASK_NUM=$1
  local TASK_NAME=$2
  local PROMPT=$3
  
  echo "" >> $LOG
  echo "## Task $TASK_NUM: $TASK_NAME" >> $LOG
  echo "Started: $(date)" >> $LOG
  
  if claude --dangerously-skip-permissions -p "$PROMPT" 2>&1 | tee /tmp/admin-fix-$TASK_NUM.log; then
    echo "Status: COMPLETED" >> $LOG
  else
    echo "Status: FAILED (exit code $?)" >> $LOG
  fi
  
  echo "Finished: $(date)" >> $LOG
  echo "---" >> $LOG
  sleep 3
}

# ============================================================
# TASK A1: Add Coastal Email to Auth Allowlist
# ============================================================
run_task A1 "Add Coastal Email to Auth Allowlist" \
'Find the Firebase Auth allowlist in the codebase. It is in the AdminAuthGuard component or similar auth wrapper. Currently it allows:
- jon@jgoldco.com
- coastalmobilelube@gmail.com

Verify both are in the allowlist. If coastalmobilelube@gmail.com is missing, add it. Also search for any other places where allowed emails are hardcoded and make sure both are present everywhere.

Search with: grep -rn "jgoldco\|coastalmobilelube\|allowlist\|allowedEmails\|ALLOWED" src/

npm run build && git add -A && git commit -m "[A1] Verify auth allowlist includes both admin emails"'

# ============================================================
# TASK A2: Schedule Layout Fix
# ============================================================
run_task A2 "Schedule Page Layout Fix" \
'Read the schedule page source (likely src/app/admin/schedule/page.tsx or similar).

The current layout has a problem: when a booking row is expanded to show customer detail, the calendar on the right side causes the layout to be cramped and wonky.

Fix the layout:

1. Make the layout responsive to expansion state:
   - When NO booking is expanded: two-column layout (bookings list 60%, calendar 40%)
   - When a booking IS expanded: calendar collapses to a mini version or moves below the expanded detail
   
2. Better approach: Stack the layout vertically instead of side-by-side:
   - TOP: Quick filter bar (Today / This Week / This Month + status filters) + Today card + Export CSV
   - MIDDLE: Full-width bookings list with expandable rows
   - BOTTOM: Calendar (full width, shows month view with booking dots)
   
3. The expanded booking detail should show in a full-width card below the selected row with:
   - LEFT column: Customer Info (name, phone, email, contact pref, source, preferred date, status, service)
   - RIGHT column: Actions (Send Confirmation Email, Set Appointment, Confirm/Complete/Cancel, Admin Notes, Communication Log, Google Calendar link)
   - This should NOT be constrained by a narrow column

4. The mini calendar can stay as a sidebar on desktop (above 1280px) but should move below on smaller screens.

5. Status count cards (Pending, Confirmed, Completed, Cancelled) should be in a row at the bottom of the calendar or below the filter bar.

Do NOT break any Firestore listeners, status update functions, or comms log functionality. This is a LAYOUT reorganization only.

npm run build && git add -A && git commit -m "[A2] Schedule page layout fix - better expansion, responsive calendar"'

# ============================================================
# TASK A3: Invoice Auto-Populate from Booking
# ============================================================
run_task A3 "Invoice Auto-Populate from Booking" \
'Read the invoicing page source (likely src/app/admin/invoicing/page.tsx or similar). Also read the schedule page to understand the booking data structure.

Add the ability to create an invoice pre-populated from a booking:

1. On the SCHEDULE page, add a "Create Invoice" button in the expanded booking detail (next to Send Confirmation Email, etc). This button should:
   - Navigate to /admin/invoicing with query params: ?from=booking&id=BOOKING_ID
   - OR open the Create Invoice modal with pre-filled data

2. On the INVOICING page, when the Create Invoice modal opens:
   - Check for URL query params (from=booking, id=BOOKING_ID)
   - If present, fetch the booking document from Firestore
   - Pre-fill the invoice with:
     * Customer name from booking
     * Customer phone from booking
     * Customer email from booking
     * Line items from booking.services array (if it exists) or booking.service field
     * Look up each service name in the pricing catalog to get the price
   - Show a note at the top: "Auto-filled from booking [date]. Review and adjust before creating."

3. On the CUSTOMERS page, add a "Create Invoice" button in the customer detail view that:
   - Opens the invoice modal pre-filled with customer info (name, phone, email)
   - No services pre-filled (customer might not have a recent booking)

4. The invoice modal notes field should be clearly visible and not cut off. Make sure the modal is scrollable if content exceeds viewport height.

npm run build && git add -A && git commit -m "[A3] Invoice auto-populate from bookings and customers"'

# ============================================================
# TASK A4: Invoice Modal Notes + UX Polish
# ============================================================
run_task A4 "Invoice Modal Polish" \
'Read the invoicing page and the Create Invoice modal.

Fix these UX issues:

1. NOTES FIELD: Must be visible without scrolling past the fold. If the modal is too tall:
   - Make the modal max-height: 90vh with overflow-y: auto
   - Or put notes in a collapsible section that is expanded by default
   - Notes textarea should be at least 80px tall

2. LINE ITEMS:
   - The service name field should be a searchable dropdown/combobox that filters from the pricing catalog as you type
   - When a service is selected, auto-fill the price from the catalog
   - Price should be editable (Jason might give a discount)
   - Quantity defaults to 1
   - Line total auto-calculates (qty x price)
   - Add line item button should be prominent
   - Each line item should have a delete (X) button

3. INVOICE NUMBER: Auto-generated as CMLT-2026-XXX (incrementing). Should not be editable.

4. DATE FIELDS: Invoice date defaults to today, due date defaults to 30 days from today.

5. TAX: Default to 0%. Jason can change this per invoice.

6. TOTAL: Bold, large, prominent at the bottom. Updates in real-time as line items and tax change.

7. BUTTONS at bottom:
   - "Cancel" (gray, closes modal)
   - "Save as Draft" (outlined, saves but does not send)
   - "Create & Send" (orange filled, creates invoice and marks as Sent)

npm run build && git add -A && git commit -m "[A4] Invoice modal UX polish - notes visible, searchable services, better layout"'

# ============================================================
# TASK A5: Invoice Print/PDF Improvements
# ============================================================
run_task A5 "Invoice Print View" \
'Read the invoice print/download functionality.

Improve the printed invoice:

1. The print view should include:
   - Coastal Mobile Lube & Tire header with oval badge logo
   - "INVOICE" prominently displayed
   - Invoice number, date, due date
   - Bill To: customer name, phone, email
   - Line items table: Service, Qty, Price, Total
   - Subtotal, Tax (with percentage), Total
   - Payment methods: Zelle, Venmo, cash, or check
   - Phone: 813-722-LUBE
   - "Thank you for choosing Coastal Mobile Lube and Tire"

2. The print CSS should:
   - Hide the sidebar navigation
   - Hide all buttons and interactive elements
   - Use clean black text on white background
   - Proper margins for printing
   - Logo should render properly in print

3. Add a "Download PDF" option if not already present (use window.print() which generates PDF on most browsers)

4. The invoice list should show a "Print" link for each invoice that opens the print view in a new tab.

npm run build && git add -A && git commit -m "[A5] Invoice print view - branded layout, print CSS, PDF download"'

# ============================================================
# TASK A6: Admin Dashboard Polish
# ============================================================
run_task A6 "Admin Dashboard Home Polish" \
'Read src/app/admin/page.tsx (the dashboard home).

Polish the admin dashboard:

1. STATS CARDS should show real data from Firestore:
   - Total Bookings (count of all documents in bookings collection)
   - This Week (bookings created in the last 7 days)
   - Pending (count where status === "pending") - highlight in orange if > 0
   - Total Customers (unique phone numbers across all bookings)

2. NAVIGATION CARDS should have:
   - Clean icons (use Lucide React icons: Calendar, Users, Receipt, Tag)
   - Brief description of what each section does
   - Click to navigate
   - Hover effect (subtle shadow lift)

3. RECENT ACTIVITY should show the last 5 bookings:
   - Customer name, service, date, status badge
   - Click to go to /admin/schedule with that booking highlighted

4. Add a QUICK ACTIONS row:
   - "Create Invoice" button -> /admin/invoicing
   - "Add Customer" button -> /admin/customers (with new customer modal trigger)
   - "Export All Data" button -> triggers CSV download of all bookings

5. The breadcrumb should just show "Dashboard" (no "Dashboard / Dashboard")

6. Make sure the sidebar nav highlights "Dashboard" when on this page.

npm run build && git add -A && git commit -m "[A6] Admin dashboard polish - real stats, quick actions, recent activity"'

# ============================================================
# DEPLOY
# ============================================================
echo "## Deploy" >> $LOG
echo "Started: $(date)" >> $LOG
git pull origin navy-redesign --rebase 2>&1 | tail -5 >> $LOG || true
git push origin navy-redesign 2>&1 | tail -5 >> $LOG
npx netlify-cli deploy --alias navy-preview 2>&1 | tail -10 >> $LOG
echo "---" >> $LOG
echo "## Pipeline Complete" >> $LOG
echo "Finished: $(date)" >> $LOG
echo "Navy preview: https://navy-preview--coastal-mobile-lube.netlify.app" >> $LOG
