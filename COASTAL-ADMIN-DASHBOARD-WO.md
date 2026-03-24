# WO: Admin Dashboard + Booking Page Layout Fix
## Coastal Mobile Lube & Tire — 2026-03-24

Read every file mentioned below IN FULL before making any changes.

This WO has two parts:
- Part A: Quick fix to /book page layout
- Part B: Full admin dashboard build at /admin

---

## PART A — Fix /book page layout

**File:** `src/app/book/page.tsx` (or wherever the /book page layout is)

The Trust Bar component (navy bar with "Fully Licensed & Insured", "ASE-Certified Technicians", etc.) currently sits BETWEEN the hero text and the booking form. This creates a visual wall that pushes the form down and makes it hard to find.

**Fix:** Remove the TrustBar component from the /book page entirely. The trust signals are already shown in the sidebar ("What's included" section) so they're redundant here. The form should appear immediately after the hero text with no visual interruption.

If there's a "For fleet or marine service..." redirect banner, keep that — but it should be subtle (small text, not a full-width bar). Move it to just above the form or make it a small note inside the form area.

---

## PART B — Admin Dashboard at /admin

Build a full admin dashboard for managing bookings from all forms. No authentication for now — the /admin route should be publicly accessible (we'll add Firebase Auth login later).

### File Structure

Create these new files:

```
src/app/admin/page.tsx          — main dashboard page
src/app/admin/layout.tsx        — admin layout (different from public site)
```

### Admin Layout (layout.tsx)

- Simple layout with NO public site header/footer (no nav bar, no sticky bottom bar)
- Instead: a minimal admin header bar with:
  - Left: "Coastal Mobile Admin" text (navy, bold)
  - Right: "Back to site" link (→ /)
- White background, no fancy styling
- Full-width content area below

### Dashboard Page (page.tsx)

This is a single-page dashboard that shows all bookings from the Firestore `bookings` collection. Build it as a client component ("use client").

#### Section 1: Stats Bar (top of page)

Four stat cards in a row:
- **Total Bookings** — count of all docs in `bookings`
- **Pending** — count where status == "pending" (orange badge)
- **Confirmed** — count where status == "confirmed" (blue badge)
- **Completed** — count where status == "completed" (green badge)

Style: white cards, subtle border, rounded-12, the count number is large (32px, weight 800), label below in gray. Pending count should use orange text to draw attention.

#### Section 2: Filters (below stats)

A single row of filter controls:
- **Source filter** — button group or select: All | Automotive | Fleet | Marine
  - Filter by `serviceCategory` field (or `source` field — check which one differentiates)
  - "All" selected by default
- **Status filter** — button group: All | Pending | Confirmed | Completed
  - "All" selected by default
- **Date range** — two date inputs: From / To (filter by `createdAt`)
  - Default: last 30 days

Filters should work client-side (filter the already-fetched data, don't re-query Firestore on every filter change).

#### Section 3: Bookings Table (main content)

A table/list showing all bookings, sorted by `createdAt` descending (newest first).

Columns:
| Column | Field | Notes |
|--------|-------|-------|
| Date | `createdAt` | Format as "Mar 24, 2026 3:42 PM" |
| Customer | `name` | Bold |
| Phone | `phone` | Format as (555) 555-5555, clickable tel: link |
| Email | `email` | If exists, show it. If not, show "—" |
| Service | `service` | The service they selected |
| Source | `source` or `serviceCategory` | Badge: blue for automotive, green for fleet, purple for marine. Use the `source` field to determine: "homepage-widget", "website" (= /book), "fleet-page", "marine-page" |
| Contact Pref | `contactPreference` | Small badge: "Call" / "Text" / "Email" |
| Status | `status` | Color-coded badge: orange "Pending", blue "Confirmed", green "Completed" |
| Actions | — | Status change buttons (see below) |

**Status Action Buttons:**
- If status is "pending": show "Confirm" button (blue) and "Complete" button (green, outlined)
- If status is "confirmed": show "Complete" button (green)
- If status is "completed": show a green checkmark icon, no buttons
- Clicking a status button updates the Firestore doc: `updateDoc(doc(db, 'bookings', id), { status: newStatus, updatedAt: serverTimestamp() })`
- Update should be instant in the UI (optimistic update)

**Row click → expand detail:**
When you click a row (not the action buttons), expand it inline to show ALL fields from that booking:
- Name, Phone, Email, Contact Preference
- Service, Service Category, Source
- Address (if present — from /book form)
- Preferred Date, Time Window (if present — from /book form)
- Zip Code (if present — from homepage widget)
- Notes
- Fleet Size (if present — from fleet form)
- Engine Type, Engine Count (if present — from marine form)
- Status, Created At, Updated At
- An "Admin Notes" textarea where you can type notes and save them to the Firestore doc (field: `adminNotes`)

Style the expanded detail as a card below the row with a light background (#FAFBFC), 2-column grid for the fields.

#### Section 4: Calendar View Toggle

Add a toggle at the top of section 3: "List View" | "Calendar View"

**Calendar View:**
- Monthly calendar grid (simple, don't need a library — build with CSS grid)
- Each day cell shows dots/badges for bookings on that date
- Use `preferredDate` field for /book bookings, `createdAt` for widget/fleet/marine submissions
- Clicking a day shows the bookings for that day in a panel below the calendar
- Color-coded dots: orange = pending, blue = confirmed, green = completed
- Navigation: < Previous Month | Month Year | Next Month >

If building a calendar from scratch is too complex, use a simpler approach:
- Show a week-by-week list view grouped by date
- Each date header shows "Mon, Mar 24" with booking cards below it
- Still color-coded by status

#### Data Fetching

On page load:
1. Query Firestore `bookings` collection, order by `createdAt` desc
2. Use `onSnapshot` for real-time updates (so if someone submits a form while admin is open, it appears automatically)
3. Store all bookings in state, apply filters client-side
4. Show a loading spinner while fetching

#### Empty State

If no bookings exist, show:
- "No bookings yet" with a subtle illustration or icon
- "Bookings from the website will appear here automatically."

### Design System (for admin)

Use the same design tokens as the main site:
- Navy: #0B2040 (headings, admin header)
- Orange: #E07B2D (pending badges, primary actions)
- Blue: #1A5FAC (confirmed badges, secondary actions)
- Green: #16a34a (completed badges, complete buttons)
- Surface: #FAFBFC (expanded detail background, alternating rows)
- Font: Plus Jakarta Sans (same as main site)
- Cards: white bg, 1px #e8e8e8 border, rounded-12
- Status badges: rounded-full, px-3 py-1, text-xs font-semibold, colored bg with white text

---

## BUILD AND DEPLOY

```
npm run build && netlify deploy --prod && git add -A && git commit -m "feat: admin dashboard with booking management + calendar view, fix /book layout" && git push origin main
```
