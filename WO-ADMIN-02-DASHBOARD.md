# WO-02: Dashboard Page Rebuild

## Context
Second WO in the Coastal admin redesign. WO-01 (sidebar, layout shell, shared components) must be completed first. This WO replaces the current dashboard (/admin) with a professional operations overview: pipeline cards, today's schedule, action items, and revenue summary.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css, tailwind.config, or any files modified in WO-01 (AdminSidebar, AdminTopBar, etc.) unless fixing a bug
- Build, commit, push, deploy at the end

---

## Step 1: Read the current dashboard

Read these files in full:
- src/app/admin/page.tsx (current dashboard)
- Any components imported by the dashboard page
- src/components/admin/AdminBadge.tsx (from WO-01)
- src/components/admin/AdminTopBar.tsx (from WO-01)
- Check what Firestore collections exist: bookings, customers, invoices, services

Understand what data the current dashboard pulls and how. We will reuse existing Firestore hooks/queries where possible.

---

## Step 2: Build the Pipeline Card component

Create src/components/admin/PipelineCard.tsx

Props:
- title: string (e.g., "Incoming")
- accentColor: string (hex color for top bar and action button)
- rows: array of { label: string, count: number, dotColor: string, amount?: string }
- actionLabel: string (e.g., "Review Incoming")
- onAction: () => void
- total: number (sum of row counts, displayed large in top right)

Layout:
- bg-white, rounded-xl, border border-gray-200, p-5, relative overflow-hidden, flex-1
- 3px accent bar at very top using accentColor (absolute positioned, top-0 left-0 right-0)
- Header row: flex justify-between items-baseline, mb-3.5
  - Title: text-[13px] font-semibold text-gray-500 uppercase tracking-[0.04em]
  - Total count: text-[28px] font-bold text-[#0B2040]

- Sub-status rows: flex flex-col gap-1.5, mb-3.5
  - Each row: flex justify-between items-center, px-2.5 py-1.5, rounded-lg, bg-[#F7F8FA], cursor-pointer, hover:bg-[#EEF0F4] transition
    - Left side: flex items-center gap-2
      - Dot: w-[7px] h-[7px] rounded-full, background set to dotColor
      - Label: text-[13px] text-[#0B2040] font-medium
    - Right side: flex items-center gap-2
      - Amount (if present): text-xs text-gray-500
      - Count: text-sm font-semibold text-[#0B2040], min-w-[20px] text-right

- Sparkline area: mb-3, height 24px
  - For now, render a simple SVG placeholder sparkline with 7 data points
  - Below the sparkline: text-[10px] text-gray-500, "Last 7 days"
  - In production these will pull from real Firestore aggregation queries (not in this WO scope)

- Action button: w-full, py-2, rounded-lg, border border-gray-200, text-[13px] font-semibold, cursor-pointer, transition
  - Default: bg-transparent, text color matches accentColor
  - Hover: bg set to accentColor, text-white, border-color matches accentColor

---

## Step 3: Rebuild the dashboard page

Replace the content of src/app/admin/page.tsx (keep the file, replace its contents).

The page should:
1. Import AdminTopBar and render it with title "Dashboard" and subtitle showing today's date (format: "Monday, April 14, 2026")
2. Import PipelineCard, AdminBadge

### Pipeline Cards Section
Render 4 PipelineCard components in a responsive grid: grid-cols-1 md:grid-cols-2 xl:grid-cols-4, gap-4, mb-6.

Card definitions:

**Incoming** (accent: #1A5FAC blue)
- New Leads: count from Firestore bookings where status is "new" or "lead", dot blue
- Quote Requests: count from bookings where source contains "quote", dot amber, show dollar amount
- Pending Bookings: count from bookings where status is "pending", dot amber
- Action: "Review Incoming"

**Scheduled** (accent: #16A34A green)
- Confirmed: count from bookings where status is "confirmed", dot green
- Today: count from bookings where date is today AND status is confirmed/in-progress, dot teal
- This Week: count from bookings for current week, dot blue
- Action: "View Schedule", navigates to /admin/schedule

**Jobs** (accent: #E07B2D orange)
- In Progress: count from bookings where status is "in-progress", dot orange
- Needs Invoice: count from bookings where status is "completed" AND no linked invoice, dot red, show dollar amount
- Completed: count from bookings where status is "completed", dot green, show dollar amount
- Action: "Create Invoice", navigates to /admin/invoicing

**Invoices** (accent: #0B2040 navy)
- Sent: count from invoices where status is "sent", dot blue, show dollar amount
- Paid: count from invoices where status is "paid", dot green, show dollar amount
- Overdue: count from invoices where status is "overdue", dot red, show dollar amount
- Action: "View Invoices", navigates to /admin/invoicing

**DATA NOTE:** If the Firestore collections do not yet have enough data or the right status fields to populate these counts, use static placeholder numbers that look realistic (like the mockup data). Add a TODO comment noting which queries need to be wired up. Do NOT skip rendering the cards.

### Bottom Section: Two-Column Grid
grid-cols-1 lg:grid-cols-2, gap-4

**Left column: Today's Schedule**
- bg-white rounded-xl border border-gray-200 overflow-hidden
- Header: px-5 py-4, flex justify-between items-center, border-b
  - "Today's Schedule" as text-[15px] font-bold text-[#0B2040]
  - Subtitle: text-xs text-gray-500 showing count of today's bookings
  - "Full Schedule" link button: px-3.5 py-1.5, rounded-lg, border border-gray-200, text-xs font-semibold text-[#1A5FAC], links to /admin/schedule
- List of today's bookings from Firestore (or placeholders), each row:
  - flex items-center, px-5 py-3, border-b border-gray-200, hover:bg-gray-50 cursor-pointer transition
  - Time: text-[13px] font-semibold text-gray-500, min-w-[60px], flex-shrink-0
  - Middle: flex-1
    - Customer name: text-sm font-semibold text-[#0B2040]
    - Service + vehicle: text-xs text-gray-500, truncated
  - Status badge using AdminBadge

**Right column: Two stacked cards**

**Action Items card (top):**
- bg-white rounded-xl border border-gray-200 overflow-hidden
- Header: "Needs Attention", text-[15px] font-bold, with count subtitle
- List of action items, each:
  - flex items-center justify-between, px-5 py-2.5, border-b
  - Left: flex items-center gap-2.5
    - Urgency dot: w-2 h-2 rounded-full (red for high, amber for medium, blue for low)
    - Text: text-[13px] text-[#0B2040]
  - Right: action button, px-3 py-1, rounded-md, border border-gray-200, text-xs font-semibold text-[#1A5FAC], hover:bg-[#1A5FAC] hover:text-white hover:border-[#1A5FAC] transition

Action items to generate dynamically (or use placeholders):
- Overdue invoices count + "View"
- Completed jobs needing invoicing + "Invoice"
- Unconfirmed bookings + "Review"
- Unresponded quote requests + "Review"

**Revenue Summary card (bottom):**
- bg-white rounded-xl border border-gray-200, p-5
- Header: "Revenue Summary", text-[15px] font-bold text-[#0B2040], mb-4
- Three stats in a flex row with dividers:
  - This Month: large number (text-[26px] font-bold), trend indicator below (green "+X%" or red "-X%", text-xs font-semibold)
  - Outstanding: large number, "X overdue" in red below
  - Avg Job Value: large number, trend indicator
  - Each stat: flex-1, text-center
  - Dividers: w-px bg-gray-200 self-stretch between stats

- Invoice Aging bar below stats (mt-4):
  - Label: "Invoice Aging" in text-[11px] font-bold text-gray-500 uppercase
  - Stacked bar: flex, h-2.5, rounded-md overflow-hidden, gap-0.5
    - Green segment (current invoices, proportional width)
    - Amber segment (30-60 days)
    - Red segment (60+ days)
  - Legend below: flex justify-between, mt-1.5
    - Each: flex items-center gap-1.5
      - Color square: w-2 h-2 rounded-sm
      - Label + amount: text-[11px] text-gray-500

**DATA NOTE:** Same as above -- use Firestore data where available, static placeholders where not. Leave TODO comments for queries that need wiring.

---

## Step 4: Clean up old dashboard elements

After the new dashboard is rendering, remove any leftover elements from the old dashboard that are now redundant:
- Old stat cards / navigation cards / "Manage" cards
- Old "Create Invoice" / "Add Customer" / "Export All Data" random button row
- Old "Recent Activity" list (replaced by Today's Schedule)
- Any old header or page title (now handled by AdminTopBar)

Do NOT remove any Firestore hooks, auth checks, or utility imports that are still needed.

---

## Step 5: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "WO-02: Dashboard rebuild - pipeline cards, schedule, action items, revenue summary"
git push origin main
npx netlify-cli deploy --prod --message="WO-02: Dashboard page redesign"
```

Verify /admin loads and shows the new dashboard layout.
