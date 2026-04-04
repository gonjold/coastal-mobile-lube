#!/bin/bash
# coastal-backend.sh
# Backend features pipeline - runs on navy-redesign branch
# Seeds Firestore with full pricing catalog, builds admin features
# tmux new -s backend && bash ~/coastal-mobile-lube/coastal-backend.sh

set -e
cd ~/coastal-mobile-lube
git checkout navy-redesign
git stash 2>/dev/null || true

LOG=~/coastal-mobile-lube/BACKEND-LOG.md
echo "# Backend Features Pipeline" > $LOG
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
  
  if claude --dangerously-skip-permissions -p "$PROMPT" 2>&1 | tee /tmp/backend-task-$TASK_NUM.log; then
    echo "Status: COMPLETED" >> $LOG
  else
    echo "Status: FAILED (exit code $?)" >> $LOG
  fi
  
  echo "Finished: $(date)" >> $LOG
  echo "---" >> $LOG
  sleep 3
}

# ============================================================
# TASK B1: Seed Firestore Pricing Collection
# ============================================================
run_task B1 "Seed Firestore Pricing Collection" \
'Read src/lib/firebase.ts to understand the Firebase config. 

Create a new file src/data/pricingCatalog.ts that exports the COMPLETE pricing catalog as a typed data structure. This will be used both for seeding Firestore and for the frontend service pages.

The structure should be:

```typescript
export interface ServiceItem {
  id: string;
  category: string;
  subcategory?: string;
  name: string;
  price: number;
  note?: string;
  laborHours?: number;
  division: "auto" | "marine" | "fleet";
  displayOnSite: boolean;
  displayOrder: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  division: "auto" | "marine" | "fleet";
  description: string;
  startingAt: number;
  displayOrder: number;
  items: ServiceItem[];
}
```

Here is the COMPLETE pricing data to include:

AUTO DIVISION:
Category: Oil Changes
- Synthetic Blend: $89.95 (up to 5 qts)
- Full Synthetic: $119.95 (up to 5 qts)
- Diesel Oil Change: $219.95
- Syn Blend Basic bundle: $119.95 (oil + rotation)
- Syn Blend Better bundle: $139.95 (Basic + MOA additive)
- Syn Blend Best bundle: $179.95 (Basic + MOA + fuel additives)
- Full Syn Basic bundle: $149.95 (oil + rotation)
- Full Syn Better bundle: $169.95 (Basic + MOA additive)
- Full Syn Best bundle: $209.95 (Basic + MOA + fuel additives)
- Diesel Basic bundle: $259.95 (oil + rotation)
- Diesel Better bundle: $269.95 (Basic + MOA additive)
- Diesel Best bundle: $309.95 (Basic + MOA + fuel additives)
- Semi Syn per qt over 5: $7
- Full Syn per qt over 5: $12

Category: Wynns Fluid Services
- A/C Evaporator Service: $259.95
- Battery Service: $79.95
- Brake Flush: $239.95
- Coolant Flush: $269.95
- Ethanol Service: $29.95
- Front Differential Flush: $269.95
- Rear Differential Flush: $269.95
- Fuel Additive: $42.11
- Fuel Induction Service: $239.95
- MOA Additive: $29.95
- Power Steering Flush: $219.95
- Stop Squeal: $297.95
- Throttle Body Service: $129.95
- Transfer Case Flush: $249.95
- Transmission Auto Flush: $419.95
- Transmission Manual Flush: $249.95

Category: Wynns Diesel Services
- Diesel Injection Service: $439.95
- Diesel MOA: $49.95
- Dual Coolant Flush (Diesel): $499.95
- F250+ Frt Diff Flush: $299.95
- F250+ Rear Diff Flush: $299.95
- F450-550 Rear Diff Flush: $399.95

Category: Basic Maintenance
- Battery Replacement: $50 labor (some makes $100)
- Front Wiper Blades: $79.95
- Rear Wiper Blade: $34.95
- Engine Air Filter: $79.95
- Diesel Air Filter: $119.95
- Cabin Air Filter: $99.95
- Cabin Air Filter w/ Frigi Fresh: $129.95
- Diesel Fuel Filters: $399.95

Category: Tire/Wheel
- Mount and Balance Single: $49.95
- Mount and Balance 4 Tires: $159.95
- Aftermarket/Oversized M&B: $50
- Replace TPMS/Valve Stem: $69.95
- Tire Patch: $69.95
- Tire Rotation: $39.95
- Tire Rotation Oversized: $59.95
- Rotate and Balance: $89.95
- Rotate and Balance Oversized: $119.95
- Road Force Balance: $199.95

Category: Brakes
- Front and Rear Brake Job: $320 (includes pads and resurfacing rotors)
- Transit Front and Rear: $450
- Dually Front Brake Job: $450
- Dually Rear Brake Job: $720

Category: HVAC
- EVAC and Recharge HVAC: $299.99

MARINE DIVISION:
Category: Marine Oil Service
- Outboard Small (up to 6 qts): $149.95
- Outboard V6/V8: $199.95
- Inboard Small Block: $229.95
- Inboard Big Block: $279.95
- Diesel Marine: $349.95
- Generator Oil Service: $129.95
- Twin Engine Surcharge: $75
- Semi Syn per qt over included: $8
- Full Syn per qt over included: $14
- Pre-Trip Inspection: $59.95
- Sea Trial/Ramp Run Support: $149.95

Category: Marine Fuel/Fluid Services
- Water Separating Fuel Filter: $89.95
- Engine Fuel Filter: $129.95
- Racor Dual Filter Set: $199.95
- Lower Unit Gear Lube: $149.95
- Twin Lower Unit Gear Lube: $279.95
- Stern Drive Gear Lube: $179.95
- Cooling System Descale/Flush: $299.95
- Fuel Stabilizer Additive: $29.95
- MOA/Oil Additive: $29.95
- Corrosion Guard Treatment: $69.95
- Throttle Body/Intake Service: $149.95
- Battery Terminal Service: $39.95
- Battery Test/Charging Check: $59.95
- Fuel System Treatment: $49.95
- Water-in-Fuel Check: $39.95
- Prop Removal and Reinstall: $79.95

Category: Marine Diesel Services
- Diesel Fuel Filter Service: $249.95
- Diesel Injection Service: $449.95
- Dual Coolant Flush (Diesel): $499.95
- Primary/Secondary Diesel Filters: $329.95
- Diesel MOA: $49.95
- DEF Top-Off/Handling: $29.95

Category: Marine Basic Maintenance
- Battery Replacement: $75 labor
- Dual Battery Replacement: $125 labor
- Spark Plug Replacement: from $199.95
- Impeller Service: $249.95
- Engine Air Filter/Flame Arrestor: $79.95
- Grease Steering/Pivot Points: $39.95
- Bilge/Safety Inspection: $59.95
- Trailer Light Check: $29.95
- Trailer Hub Temp/Bearing Check: $39.95

Category: Marine Trailer/Tire
- Trailer Tire M&B Single: $49.95
- Trailer Tire M&B 4: $159.95
- Trailer Tire Rotation: $39.95
- Trailer Tire Patch: $69.95
- Wheel Bearing Repack: from $179.95
- Hub Service: $129.95
- Replace Valve Stem/TPMS: $29.95
- Spare Tire Mount: $39.95
- Trailer Alignment Check: $49.95
- Aftermarket/Oversized Trailer: $50

Category: Marine Brakes
- Trailer Brake Adjustment: $129.95
- Trailer Brake Service: $249.95
- Tandem Trailer Brake Service: from $399.95
- Surge Brake Inspection/Service: $199.95

Category: Marine Travel/Surcharges
- Travel/Trip Charge: $49.95
- After Hours/Weekend Surcharge: $75

DO NOT display these anywhere (internal reference only):
- Customer Pay Labor Rates (auto): Gas $185/hr, Diesel $199/hr, EV/Hybrid $199/hr, Gas Maintenance $165/hr, Diesel Maintenance $175/hr
- Marine Labor Rates: Outboard $195/hr, Inboard/Stern $225/hr, Diesel Marine $249/hr, Electrical Diagnostic $225/hr

FLEET DIVISION (displayOnSite: false for individual pricing, show PM tier structure only):
- PM-A Gas: $99.95, PM-B Gas: $139.95, PM-C Gas: $189.95
- PM-A Diesel: $199.95, PM-B Diesel: $249.95, PM-C Diesel: $329.95

Mark labor rates with displayOnSite: false.

Also create src/scripts/seedPricing.ts that can be run to seed this data into a Firestore "services" collection. Each category becomes a document, items are subcollection or nested array.

npm run build && git add -A && git commit -m "[B1] Full pricing catalog data structure + Firestore seed script"'

# ============================================================
# TASK B2: Admin Home Screen / Dashboard Landing
# ============================================================
run_task B2 "Admin Home Screen" \
'Read the admin page source files (look in src/app/admin/). Understand the current admin structure.

Build a proper admin HOME SCREEN that serves as the landing page after login. Currently the admin dumps straight into the bookings list. Instead, build a dashboard with:

1. TOP ROW - Quick Stats Cards:
   - Total Bookings (all time)
   - This Week bookings count
   - Pending (needs attention) count with orange highlight
   - Total Customers count

2. NAVIGATION CARDS (main admin sections):
   - Schedule (calendar icon) - "View calendar, incoming bookings, and appointments" -> links to /admin/schedule
   - Customers (people icon) - "Customer database, history, and notes" -> links to /admin/customers  
   - Invoicing (receipt icon) - "Create and send invoices" -> links to /admin/invoicing (placeholder for now)
   - Pricing & Services (tag icon) - "Manage service pricing and availability" -> links to /admin/pricing

3. RECENT ACTIVITY feed:
   - Last 5 bookings with status badges
   - Click to expand details

The existing admin functionality (bookings list, calendar view, customers tab) should be reorganized:
- Move the bookings list view to /admin/schedule
- Move the customers tab to /admin/customers
- Keep the current admin page as the new home dashboard
- Use Next.js App Router nested routes: src/app/admin/page.tsx (home), src/app/admin/schedule/page.tsx, src/app/admin/customers/page.tsx, etc.

Style: clean white cards, navy accents, orange action buttons. Professional admin look. The AdminAuthGuard should wrap all /admin/* routes.

IMPORTANT: Do NOT break the existing Firebase Auth or Firestore connections. The AdminAuthGuard component must still protect all admin routes.

npm run build && git add -A && git commit -m "[B2] Admin home screen with dashboard stats and navigation"'

# ============================================================
# TASK B3: Admin Pricing Management Page
# ============================================================
run_task B3 "Admin Pricing Management" \
'Read src/data/pricingCatalog.ts (created in B1) and the admin route structure.

Build /admin/pricing page that lets Jason manage his service pricing:

1. CATEGORY TABS across the top: Auto | Marine | Fleet
2. Each category shows its services in an editable table/card grid:
   - Service name (read-only or editable)
   - Current price (editable input)
   - Notes (editable)
   - Active/Inactive toggle (controls if it shows on the public site)
3. SAVE button that writes changes to Firestore "services" collection
4. RESET button that reverts to the original catalog prices
5. A "Last updated" timestamp showing when prices were last modified

The page reads from Firestore if data exists there, otherwise falls back to the static pricingCatalog.ts data. When Jason saves, it writes to Firestore. The public-facing pages should eventually read from Firestore too (but that wiring is a separate task).

Style should match the admin dashboard aesthetic. Clean table layout, easy to scan, quick to edit.

Protected by AdminAuthGuard.

npm run build && git add -A && git commit -m "[B3] Admin pricing management - editable service catalog"'

# ============================================================
# TASK B4: Admin Schedule View (Reorganized)
# ============================================================
run_task B4 "Admin Schedule View" \
'Read the current admin page source. The existing admin has bookings list, calendar view, and customers tab all on one page.

Create /admin/schedule page that combines the schedule-relevant features:

1. TOP: Quick filter bar - Today | This Week | This Month | All + Status filter (Pending/Confirmed/Completed/All)
2. TWO-COLUMN LAYOUT:
   - LEFT (60%): Incoming bookings list (the existing list view, moved here)
   - RIGHT (40%): Mini calendar showing bookings as dots (the existing calendar, made smaller)
3. Clicking a day on the calendar filters the list to that day
4. Keep ALL existing functionality: expand details, set appointment, confirm/complete/cancel, comms log, admin notes, Google Calendar link, send confirmation email
5. Add a "Today" highlight showing how many bookings are scheduled for today

Move the existing admin page code into this new route. The main /admin/page.tsx should be the dashboard from B2.

CRITICAL: Preserve all Firestore listeners (onSnapshot), all status update functions, all comms log functionality. This is a REORGANIZATION, not a rewrite. Move the code, do not recreate it.

Protected by AdminAuthGuard.

npm run build && git add -A && git commit -m "[B4] Admin schedule view - reorganized bookings + calendar"'

# ============================================================
# TASK B5: Admin Customers View (Reorganized)
# ============================================================
run_task B5 "Admin Customers View" \
'Read the current admin page source. The existing admin has a Customers tab.

Create /admin/customers page by moving the existing customers functionality:

1. Customer list with search (existing)
2. Customer detail with booking history and comms log (existing)
3. Editable customer info (existing)
4. "New Customer" button and modal (added in overnight pipeline Task 10)
5. CSV export (added in overnight pipeline Task 9)
6. ADD: Customer stats at the top - Total customers, New this month, Repeat customers count

Move the existing customers code into this new route. Keep all Firestore queries and real-time listeners intact.

Protected by AdminAuthGuard.

npm run build && git add -A && git commit -m "[B5] Admin customers view - reorganized with stats"'

# ============================================================
# TASK B6: Admin Invoicing Page (Scaffold)
# ============================================================
run_task B6 "Admin Invoicing Scaffold" \
'Create /admin/invoicing page as a functional scaffold:

1. INVOICE LIST: Shows created invoices (reads from Firestore "invoices" collection)
   - Columns: Invoice #, Customer, Date, Amount, Status (Draft/Sent/Paid), Actions
   - Status badges: Draft (gray), Sent (blue), Paid (green), Overdue (red)

2. CREATE INVOICE button opens a form:
   - Customer selector (dropdown from Firestore customers, or type new name)
   - Customer phone and email (auto-filled from customer record if selected)
   - Line items: Service name (dropdown from pricing catalog), Qty, Price (auto-filled from catalog, editable), Line total
   - Add line item button
   - Subtotal, Tax (editable percentage, default 0), Total
   - Notes field
   - Invoice date (default today)
   - Due date (default 30 days)

3. ACTIONS per invoice:
   - Edit (if Draft)
   - Mark as Sent
   - Mark as Paid
   - Delete (if Draft)
   - Print/Download (generate a simple printable HTML view)

4. Invoices write to Firestore "invoices" collection with structure:
   - invoiceNumber (auto-generated: CMLT-2026-001 format)
   - customerName, customerPhone, customerEmail
   - lineItems: array of { serviceName, quantity, unitPrice, lineTotal }
   - subtotal, taxRate, taxAmount, total
   - status: "draft" | "sent" | "paid" | "overdue"
   - notes
   - invoiceDate, dueDate
   - createdAt, updatedAt

The line items service dropdown should read from pricingCatalog.ts (or Firestore if available) so prices auto-populate.

Style: clean, professional. Invoice creation should feel fast and easy. This is for a mobile service tech in a van, so keep it simple.

Protected by AdminAuthGuard.

npm run build && git add -A && git commit -m "[B6] Admin invoicing - create, send, track invoices"'

# ============================================================
# TASK B7: Admin Navigation
# ============================================================
run_task B7 "Admin Navigation Sidebar" \
'Read all the admin route pages created in B2-B6.

Add a consistent admin navigation component that appears on all /admin/* pages:

1. LEFT SIDEBAR (collapsible on mobile):
   - Coastal Mobile logo/text at top
   - Dashboard (home icon) -> /admin
   - Schedule (calendar icon) -> /admin/schedule
   - Customers (people icon) -> /admin/customers
   - Invoicing (receipt icon) -> /admin/invoicing
   - Pricing (tag icon) -> /admin/pricing
   - Active page highlighted with orange left border
   - Logout button at bottom

2. TOP BAR:
   - Page title (dynamic based on current route)
   - User email display (from Firebase Auth)
   - "Back to site" link -> /

3. The sidebar should collapse to icons-only on tablet, and become a hamburger menu on mobile.

Create this as a shared layout component at src/app/admin/layout.tsx (or update existing). Make sure AdminAuthGuard still wraps everything.

Do NOT break any existing page functionality. This is adding navigation chrome around existing content.

npm run build && git add -A && git commit -m "[B7] Admin sidebar navigation + top bar"'

# ============================================================
# DEPLOY
# ============================================================
echo "## Deploy" >> $LOG
echo "Started: $(date)" >> $LOG
git push origin navy-redesign 2>&1 | tail -5 >> $LOG
npx netlify-cli deploy --alias navy-preview 2>&1 | tail -10 >> $LOG
echo "---" >> $LOG
echo "## Pipeline Complete" >> $LOG
echo "Finished: $(date)" >> $LOG
echo "Navy preview: https://navy-preview--coastal-mobile-lube.netlify.app" >> $LOG
