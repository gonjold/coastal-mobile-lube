# WO-03: Schedule Page Rebuild

## Context
Third WO in the Coastal admin redesign. WO-01 (layout) and WO-02 (dashboard) must be completed first. This WO replaces the current schedule page with a clean list/calendar toggle, single filter row, and a slide-in detail panel with the Confirm > Complete > Invoice workflow.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Surgical edits only. Do NOT rewrite entire files unless the page is being fully replaced
- Do NOT touch globals.css, tailwind.config, or WO-01/WO-02 components unless fixing a bug
- Build, commit, push, deploy at the end

---

## Step 1: Read the current schedule page

Read these files in full:
- src/app/admin/schedule/page.tsx (or whatever the schedule route file is)
- Any components imported by the schedule page (booking cards, filter components, calendar components)
- src/components/admin/ directory (all shared components from WO-01)
- Check Firestore bookings collection structure: what fields exist on booking documents

Note the current Firestore query patterns so we can reuse them.

---

## Step 2: Create the Schedule Detail Panel

Create src/components/admin/ScheduleDetailPanel.tsx

This is a fixed slide-in panel from the right side of the screen. It shows full booking details and the primary workflow action.

Props:
- booking: the booking object (or null to hide)
- onClose: () => void
- onAdvance: (bookingId: string, nextStatus: string) => void

**Structure:**

Panel container: fixed top-0 right-0, w-[420px], h-screen, bg-white, border-l border-gray-200, shadow (-8px 0 32px rgba(0,0,0,0.08)), z-[60], flex flex-col. Animate in from right if possible (translate-x transition), otherwise just show/hide.

**Header** (border-b, px-6 py-5):
- Customer name: text-lg font-bold text-[#0B2040]
- Status badge below name using AdminBadge
- Close button: absolute or flex, text-xl text-gray-500 cursor-pointer

**Scrollable content** (flex-1 overflow-y-auto, px-6 py-5):

Job Details section:
- Section label: text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3
- Key-value rows for: Service, Vehicle, Date + Time, Duration, Division, Price, Source
- Each row: flex justify-between, py-2, border-b border-gray-50
  - Label: text-[13px] text-gray-500
  - Value: text-[13px] font-medium text-[#0B2040], text-right, max-w-[60%]

Contact section (same format):
- Phone (text-[#1A5FAC] cursor-pointer), Email (same), Address

Notes section:
- bg-[#F7F8FA] rounded-[10px] p-3.5, text-[13px], italic if empty

Progress timeline:
- Vertical stepper showing: New Lead > Confirmed > In Progress > Completed > Invoiced
- Each step: flex with dot and connector line
  - Dot: w-3.5 h-3.5 rounded-full
    - Completed steps: bg-[#16A34A] (green)
    - Current step: bg-[#E07B2D] (orange) with 2px orange border
    - Future steps: bg-gray-200
  - Connector line: w-0.5 h-6 between dots
    - Completed: bg-green
    - Future: bg-gray-200
  - Step label: text-[13px], font-semibold if current, text-gray-500 if future

**Bottom action bar** (border-t, px-6 py-4, flex gap-2.5):

The primary action button changes based on booking status:
- "New Lead" or "Pending": "Confirm Booking" button, bg-[#16A34A] (green), flex-1
- "Confirmed": "Start Job" button, bg-[#0D8A8F] (teal), flex-1
- "In Progress": "Complete Job" button, bg-[#16A34A] (green), flex-1
- "Completed": "Create Invoice" button, bg-[#E07B2D] (orange), flex-1
- "Cancelled": show italic gray text "This booking was cancelled."

All primary buttons: py-2.5, rounded-[10px], text-white, text-sm font-semibold, cursor-pointer, hover:opacity-90

Secondary "Cancel" button (shown when status is not Completed or Cancelled):
- px-5 py-2.5, bg-transparent, border border-gray-200, rounded-[10px], text-red-600, text-[13px] font-semibold
- hover: bg-red-50 border-red-600

When primary action is clicked, call onAdvance with the booking ID and the next status string. For "Create Invoice", navigate to /admin/invoicing (or show an alert for now indicating it would pre-populate an invoice).

**Backdrop overlay:** When the panel is open, render a fixed inset-0 div with bg-black/15, z-[55], onClick closes the panel.

---

## Step 3: Create the Calendar Day View component

Create src/components/admin/ScheduleCalendar.tsx

Props:
- bookings: array of booking objects
- selectedId: string or null
- onSelect: (id: string) => void
- selectedDay: string (date string to show)
- onDayChange: (day: string) => void

**Day selector bar** at top:
- px-5 py-4, border-b, flex items-center gap-4
- Render 5-7 day buttons for the current week
- Each button: px-4 py-2, rounded-lg, text-[13px], cursor-pointer
  - Active day: bg-[#0B2040] text-white font-semibold
  - Today (if not active): border border-[#E07B2D]
  - Other days: bg-transparent text-[#0B2040] font-medium
  - Each shows day label (Mon 14) and job count badge

**Timeline grid:**
- Relative container, min-height based on hours shown (7 AM to 5 PM = 11 hours)
- ROW_HEIGHT: 72px per hour

Hour lines (absolute positioned):
- Each hour: left label (w-[72px], text-right, text-xs font-medium text-gray-500, pr-4, pt-2) + horizontal line (border-b border-gray-200) extending to the right

"Now" indicator:
- Red line at current time position (for demo, hardcode to a reasonable time like 10:15 AM)
- Red dot (w-2.5 h-2.5 rounded-full bg-red-600) on the left edge + red line extending right (h-0.5 bg-red-600)

Job blocks (absolute positioned based on timeHour and duration):
- Top position: (booking.timeHour - 7) * ROW_HEIGHT + 2
- Height: booking.duration * ROW_HEIGHT - 4, minimum 48px
- Left: 80px, right: 16px (to the right of the hour labels)

Block styling:
- Background: use status-based light color (green-50 for confirmed, amber-50 for pending, blue-50 for new lead, teal-50 for in progress, gray-100 for completed)
- Border: 1.5px solid using status color (slightly darker), rounded-[10px]
- Left accent border: 4px solid using DIVISION color (navy for Auto, teal for Marine, blue for Fleet, purple for RV)
- Padding: py-2 px-3.5
- Cursor pointer, hover shadow transition
- Selected: stronger border + subtle shadow

Block content:
- Top row: customer name (text-sm font-semibold truncate) + price (text-xs font-semibold, right side)
- Middle: time + service (text-xs text-gray-500 truncate)
- Bottom (only if block height > 56px): vehicle + status badge

**Booking timeHour field:** The Firestore booking likely stores a time string like "8:00 AM". Parse this to a decimal hour (8:00 AM = 8, 1:30 PM = 13.5) for positioning. Add a utility function for this parsing.

**Duration field:** If bookings don't have a duration field in Firestore, default to 1 hour. Add a TODO comment to add duration to the booking schema.

---

## Step 4: Rebuild the schedule page

Replace the content of the schedule page file.

**AdminTopBar:** title "Schedule", subtitle showing booking count. Add a List/Calendar toggle in the top bar area next to the title:
- Container: flex items-center, bg-[#F7F8FA], rounded-lg, p-0.5, border border-gray-200
- Two buttons: "List" and "Calendar"
- Active: bg-white, text-[#0B2040], font-semibold, shadow-sm, rounded-md
- Inactive: bg-transparent, text-gray-500, font-medium
- Each: px-4 py-1.5, text-xs, cursor-pointer, transition

**Single filter row** below the top bar:
- bg-white, border-b border-gray-200, px-8 py-3
- flex items-center gap-6, flex-wrap

Three filter groups separated by vertical dividers (w-px h-6 bg-gray-200):

1. Status pills: All, New Lead, Pending, Confirmed, In Progress, Completed, Cancelled
   - Each: px-3.5 py-1.5, rounded-lg, text-xs font-semibold, cursor-pointer, transition
   - Active: bg set to that status's color, text-white
   - Inactive: bg-transparent, text-gray-500, hover:bg-gray-50
   - Show count badge next to each: text-[10px] font-bold, rounded, px-1.5 py-px
     - Active: bg-white/25 text-white
     - Inactive: bg-gray-100 text-gray-500

2. Time filter: Today, This Week, This Month, All Time
   - Each: px-3 py-1.5, rounded-lg, text-xs, cursor-pointer
   - Active: bg-[#F7F8FA] text-[#0B2040] font-semibold
   - Inactive: text-gray-500 font-medium

3. Division filter: All, Auto, Marine, Fleet, RV
   - Same styling as time filter

**Content area** (px-8 py-6):
- If viewMode is "list": render the booking table using AdminTable components from WO-01
  - Columns: Customer (left), Service (left), Vehicle (left), Date (center), Division (center), Status (center)
  - All columns sortable
  - Rows clickable, open detail panel
  - Division text color-coded: Auto gray, Marine teal, Fleet blue, RV purple

- If viewMode is "calendar": render ScheduleCalendar component
  - Blocks clickable, open detail panel

**Detail panel:** Render ScheduleDetailPanel when a booking is selected. Pass the onAdvance handler that updates the booking status in Firestore (or local state if Firestore update patterns are not yet established).

**Firestore integration:** Use the existing Firestore query patterns from the old schedule page. Filter bookings based on the active status, time, and division filters. If the old page used real-time listeners (onSnapshot), keep using them. If it used one-time fetches, keep that pattern.

---

## Step 5: Wire up status advancement

When onAdvance is called from the detail panel:
- If the next status is a booking status (confirmed, in-progress, completed): update the booking document in Firestore with the new status field
- If the next status is "invoice": navigate to /admin/invoicing (for now). In WO-05, this will pre-populate an invoice creation flow
- If Cancel is clicked: update the booking status to "cancelled" in Firestore

Use whatever Firestore update pattern the app already uses (firebase/firestore or firebase-admin). If no update pattern exists yet, use updateDoc from firebase/firestore and add the necessary import.

---

## Step 6: Clean up old schedule elements

Remove from the schedule page:
- Old triple-layer filter system (time filter tabs + status tabs + colored summary cards)
- Old expanded inline booking detail (replaced by slide-in panel)
- Old Bootstrap-style action buttons (Confirm/Complete/Cancel colored rectangles)
- Fix "Confrimed" typo if it exists anywhere in the codebase (search for it)
- Old page header (replaced by AdminTopBar)

Keep all Firestore query logic, auth checks, and data processing utilities.

---

## Step 7: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "WO-03: Schedule rebuild - list/calendar toggle, filter bar, detail panel, status workflow"
git push origin main
npx netlify-cli deploy --prod --message="WO-03: Schedule page redesign"
```

Verify /admin/schedule loads with the new layout and both list and calendar views work.
