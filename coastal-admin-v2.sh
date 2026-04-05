#!/bin/bash
# coastal-admin-v2.sh — Admin Backend Refinements Pipeline
# CORE FEATURE: Full service management CMS from admin
# Run on main branch (which is now navy), deploy to prod when done
# Usage: ./coastal-admin-v2.sh [--start-from N]

set -euo pipefail

PROJECT_DIR="$HOME/coastal-mobile-lube"
LOG_DIR="$HOME/setup-logs/admin-v2-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$PROJECT_DIR/ADMIN-V2-LOG.md"
START_FROM=1

if [ "${1:-}" = "--start-from" ] && [ -n "${2:-}" ]; then
  START_FROM=$2
fi

mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"
git checkout main
git pull origin main || true
git add -A && git commit -m "pre-admin-v2: stage changes" || true

echo "# Admin V2 Pipeline — Service CMS + Refinements" > "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "Branch: main" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

run_task() {
  local num=$1
  local name=$2
  local prompt=$3

  if [ "$num" -lt "$START_FROM" ]; then
    echo "⏭ Skipping Task $num: $name (--start-from $START_FROM)"
    return 0
  fi

  echo "" >> "$LOG_FILE"
  echo "## Task $num: $name" >> "$LOG_FILE"
  echo "Started: $(date)" >> "$LOG_FILE"

  echo "▶ Task $num: $name"

  cd "$PROJECT_DIR"
  claude -p "$prompt" --max-turns 30 > "$LOG_DIR/task-${num}.log" 2>&1
  local exit_code=$?

  if [ $exit_code -ne 0 ]; then
    echo "Status: FAILED (exit $exit_code)" >> "$LOG_FILE"
    echo "Finished: $(date)" >> "$LOG_FILE"
    echo "---" >> "$LOG_FILE"
    echo "❌ Task $num FAILED — check $LOG_DIR/task-${num}.log"
    return 1
  fi

  cd "$PROJECT_DIR"
  git add -A && git commit -m "[AV2-$num] $name" || true

  echo "Status: COMPLETED" >> "$LOG_FILE"
  echo "Finished: $(date)" >> "$LOG_FILE"
  echo "---" >> "$LOG_FILE"
  echo "✅ Task $num: $name"
}

# ─────────────────────────────────────────────────
# TASK 1: Migrate Services to Firestore
# ─────────────────────────────────────────────────
run_task 1 "Migrate services from static file to Firestore" "
You are working on ~/coastal-mobile-lube (Next.js + Firebase).

Read src/data/pricingCatalog.ts (or wherever the static pricing/services data lives) in FULL.
Also read the Firebase config to understand the Firestore setup.

GOAL: Move all service data from the hardcoded TypeScript file into Firestore so it can be managed dynamically from the admin panel.

Step 1 — Design the Firestore structure:
Collection: 'services'
Each document represents one service item:
{
  id: auto-generated,
  name: string,
  description: string,
  price: number,
  priceLabel: string,
  category: string,
  division: string,       // 'auto' | 'marine' | 'fleet'
  sortOrder: number,
  isActive: boolean,
  showOnBooking: boolean,
  showOnPricing: boolean,
  bundleItems: string[],
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

Also create a 'serviceCategories' collection:
{
  id: auto-generated,
  name: string,
  division: string,
  sortOrder: number,
  isActive: boolean,
  createdAt: timestamp
}

Step 2 — Create a Firestore seed script:
Create scripts/seed-services.js (Node.js, uses firebase-admin)
- Reads the EXISTING pricingCatalog data
- Transforms into Firestore document format
- Seeds both collections
- Preserves all existing pricing, categories, divisions, item details
- Use application default credentials or check for existing service account setup
- Run with: node scripts/seed-services.js

Step 3 — Create a shared services hook:
Create src/hooks/useServices.ts:
- Exports useServices() hook that fetches from Firestore
- Returns { services, categories, loading, error }
- Supports filtering by division, category, isActive
- Sorts by sortOrder
- Uses onSnapshot for real-time updates

Step 4 — Create a shared services utility:
Create src/lib/serviceHelpers.ts:
- groupByCategory(services) — groups by category, sorted
- getActiveServices(services, division) — filters to active for a division
- getBookingServices(services) — filters where showOnBooking is true
- getPricingServices(services, division) — filters where showOnPricing is true

Do NOT modify any page components yet. Do NOT delete pricingCatalog.ts. Do NOT touch globals.css or tailwind config.

After creating the seed script, RUN IT. Log the count of documents seeded.
"

# ─────────────────────────────────────────────────
# TASK 2: Admin Service Management Page
# ─────────────────────────────────────────────────
run_task 2 "Admin service management page" "
You are working on ~/coastal-mobile-lube (Next.js + Firebase).

Read these files first:
- src/hooks/useServices.ts
- src/lib/serviceHelpers.ts
- src/app/admin/pricing/page.tsx (existing pricing admin page)
- The admin layout/sidebar/nav component

GOAL: Build a service management page at /admin/services with full CRUD and reordering.

TOP — Division Tabs:
- Automotive | Marine | Fleet
- Active tab: bg-[#0F2A44] text-white. Inactive: white with gray border

PER DIVISION — Category Sections:
- Each category: collapsible section (expanded by default)
- Category header: name, item count in parens, move up/down arrows, edit button, active toggle
- 'Add Category' button at bottom of each division

WITHIN EACH CATEGORY — Service Items:
- Each row: move up/down arrows, service name (click to edit inline), price (editable), active toggle, booking toggle (whether it shows on booking form), pricing toggle (whether it shows on public pricing pages), edit button (opens modal), delete button (with confirm dialog)
- 'Add Service' button at bottom of each category

EDIT SERVICE MODAL:
- Name, Description, Price, Price Label, Category dropdown, Division dropdown, Notes, Bundle Items, Show on Booking toggle, Show on Pricing toggle, Active toggle, Save/Cancel

EDIT CATEGORY MODAL:
- Category Name, Division dropdown, Active toggle, Save/Cancel

TOP BAR:
- Title: 'Service Management'
- Add Service button (primary), Add Category button (secondary)
- Search bar to filter by name

All changes save to Firestore. Toast notifications on save/delete.

STYLING:
- Cards: bg-white rounded-xl shadow-sm border border-gray-100
- Primary buttons: bg-[#0F2A44] text-white hover:bg-[#1a3d5c] px-4 py-2 rounded-lg
- Toggles: bg-gray-200 off, bg-[#0F2A44] on
- No external drag-and-drop libraries. Use move up/down arrow buttons for reordering.
- Do NOT install any new npm packages

Add 'Services' to admin sidebar nav between Dashboard and Schedule.

Do NOT touch globals.css, tailwind config, or any public pages.
"

# ─────────────────────────────────────────────────
# TASK 3: Wire Public Pages to Firestore Services
# ─────────────────────────────────────────────────
run_task 3 "Wire public pages to Firestore services" "
You are working on ~/coastal-mobile-lube (Next.js + Firebase).

Read IN FULL:
- src/hooks/useServices.ts
- src/lib/serviceHelpers.ts
- src/app/services/page.tsx (automotive services page, might be at a different route)
- src/app/marine/page.tsx
- src/app/fleet/page.tsx
- src/app/booking/page.tsx (or scheduler page)
- src/app/rv/page.tsx
- Any other page displaying service listings or pricing

GOAL: Replace all hardcoded service/pricing data on public pages with Firestore data via useServices hook. Admin changes flow to public site in real-time.

For EACH public page showing services:
1. Import and use useServices()
2. Filter using helper functions (getActiveServices, getPricingServices, getBookingServices)
3. Group by category using groupByCategory()
4. Render in the SAME visual layout — do NOT change public page design
5. Add subtle loading skeleton while Firestore loads
6. Hide empty categories automatically
7. Respect sortOrder for categories and items

For the BOOKING page:
- Only show services where showOnBooking is true
- Preserve existing booking form UX, just swap data source

RULES:
- Do NOT change visual design of any public page
- Keep all existing CSS classes and layouts
- Only replace service listing data sources
- Add loading states while data loads
- Do NOT delete pricingCatalog.ts
- Do NOT touch globals.css, tailwind config, or booking submission logic
"

# ─────────────────────────────────────────────────
# TASK 4: Invoice Email Cloud Function
# ─────────────────────────────────────────────────
run_task 4 "Invoice email Cloud Function" "
You are working on ~/coastal-mobile-lube (Next.js + Firebase).

Read functions/index.js for the existing sendConfirmationEmail pattern.
Read the invoice admin component for the invoice data model.

Create sendInvoiceEmail Cloud Function in functions/index.js:
- HTTP POST endpoint, same pattern as sendConfirmationEmail
- Accepts: customerEmail, customerName, invoiceNumber, lineItems array, total, notes
- Sends branded HTML email:
  - Header: navy #0F2A44 bg, white text, Coastal Mobile Lube and Tire
  - Invoice number and date
  - Line items table (description, qty, unit price, line total)
  - Bold total
  - Notes if provided
  - Payment instructions: Payment due upon completion. Cash, check, all major cards accepted.
  - Footer: 813-722-LUBE, website link
- Same nodemailer/Gmail transport, CORS enabled

Wire admin invoice UI: Send Invoice button calls the function, shows success/error toast.
Invoice Create from Booking should auto-populate line items from booking services, pulling current prices from Firestore services collection.

Surgical additions only. Do NOT touch public pages or globals.css.
"

# ─────────────────────────────────────────────────
# TASK 5: Admin UI Consistency + Dashboard Stats
# ─────────────────────────────────────────────────
run_task 5 "Admin UI consistency and dashboard stats" "
You are working on ~/coastal-mobile-lube (Next.js + Firebase).

Read ALL admin pages and the admin layout/nav.

Apply consistent styles across ALL admin pages:
- Containers: max-w-7xl mx-auto px-6 py-8
- Cards: bg-white rounded-xl shadow-sm border border-gray-100 p-6
- Titles: text-2xl font-bold text-gray-900 mb-6
- Section headers: text-lg font-semibold text-gray-800 mb-4
- Tables: border-gray-200, header bg-gray-50, hover:bg-gray-50, no zebra
- Primary buttons: bg-[#0F2A44] text-white hover:bg-[#1a3d5c]
- Secondary buttons: border border-gray-300 text-gray-700 hover:bg-gray-50
- Inputs: border-gray-300 rounded-lg focus:ring-[#0F2A44]
- Status badges: px-3 py-1 rounded-full text-sm font-medium
- Remove gradients, frosted glass, decorative effects from admin

DASHBOARD real Firestore stats:
- Total Bookings, This Week, Pending, Total Customers, Revenue (paid invoices), Outstanding Invoices, Active Services count
- KPI cards: responsive grid (3 cols desktop, 2 tablet, 1 mobile)
- Recent Activity: last 10 bookings with name, service, date, status

SCHEDULE page: group by date (Today/Tomorrow/This Week/Later), status filter pills, clean empty states

CUSTOMERS page: search bar, table with name/email/phone/booking count, Add Customer button, CSV Export

Surgical edits. Do NOT rewrite entire files. Do NOT touch public pages or globals.css.
"

# ─────────────────────────────────────────────────
# TASK 6: Build, Deploy, Verify
# ─────────────────────────────────────────────────
run_task 6 "Build and deploy" "
You are working on ~/coastal-mobile-lube.

1. git checkout main
2. npm run build
3. If build fails, fix errors with minimal changes. Re-run until it passes.
4. Once passing:
   git add -A && git commit -m 'admin-v2: service CMS + admin refinements'
   git push origin main
   
   Check build output dir (.next or out — look at next.config):
   npx netlify-cli deploy --prod --dir=[CORRECT_DIR] --message='Admin V2: Service CMS live'
   npx netlify-cli deploy --alias navy-preview --dir=[CORRECT_DIR] --message='Admin V2 staging'

5. Deploy Cloud Functions:
   cd functions && npm install && cd ..
   npx firebase-tools deploy --only functions --project coastal-mobile-lube

6. Verify:
   curl -s -o /dev/null -w '%{http_code}' https://coastal-mobile-lube.netlify.app && echo ' prod'
   curl -s -o /dev/null -w '%{http_code}' https://navy-preview--coastal-mobile-lube.netlify.app && echo ' staging'

7. Sync navy-redesign with main:
   git checkout navy-redesign && git merge main && git push origin navy-redesign && git checkout main
"

echo "" >> "$LOG_FILE"
echo "## Pipeline Complete" >> "$LOG_FILE"
echo "Finished: $(date)" >> "$LOG_FILE"
echo "Production: https://coastal-mobile-lube.netlify.app" >> "$LOG_FILE"
echo "Staging: https://navy-preview--coastal-mobile-lube.netlify.app" >> "$LOG_FILE"

echo ""
echo "══════════════════════════════════════════════"
echo "  ADMIN V2 PIPELINE COMPLETE"
echo "  Log: $LOG_FILE"
echo "  Task logs: $LOG_DIR/"
echo "══════════════════════════════════════════════"
