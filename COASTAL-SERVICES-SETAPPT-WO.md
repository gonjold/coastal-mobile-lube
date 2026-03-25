# WO: Expanded Booking Services + Admin "Set Appointment" Workflow
## Coastal Mobile Lube & Tire — 2026-03-24

Read every file mentioned below IN FULL before making changes. Surgical edits only. Do not rewrite entire files.

---

## PART A — Expand service options on the booking page

**File:** `src/app/book/BookingForm.tsx`

Replace the current service card options with an expanded list. Keep the same card UI (selectable cards with service name and "starting at" price). Update to these services:

| Service | Starting Price | 
|---|---|
| Synthetic Oil Change | $49 |
| Conventional Oil Change | $39 |
| Tire Rotation & Balance | $29 |
| Tire Sales & Installation | $75 |
| Brake Pads (per axle) | $199 |
| Brake Pads & Rotors | $349 |
| Battery Replacement | $149 |
| A/C Recharge | $149 |
| Spark Plugs | $89 |
| Suspension/Struts (per strut) | $149 |
| Full Maintenance Package | $179 |
| Coolant Flush | $99 |
| Transmission Fluid Change | $129 |
| Power Steering Flush | $89 |
| Diagnostic Visit | $49 |
| Other (describe below) | Quote |

Show these in a 2-column grid of selectable cards (3 columns on large screens). Each card shows the service name and "starting at $XX" below it. The "Other" card should just say "Quote" instead of a price.

Keep the existing selection behavior (click to select, orange border on selected). Allow selecting only ONE service (not multi-select).

---

## PART B — Admin "Set Appointment" workflow

**File:** `src/app/admin/page.tsx` (and potentially a new component file)

### B1 — Replace the simple "Confirm" button with a "Set Appointment" flow

When the admin clicks "Confirm" on a pending booking, instead of immediately changing the status, show an inline appointment setter form that expands below the row (or replaces the action buttons area). This form includes:

**Appointment Date:**
- Date picker input (pre-filled with the customer's preferredDate if they provided one)
- type="date", min = today

**Arrival Window:**
- Button group with these options:
  - "7:00 - 8:00 AM"
  - "8:00 - 9:00 AM"
  - "9:00 - 10:00 AM"
  - "10:00 - 11:00 AM"
  - "11:00 AM - 12:00 PM"
  - "12:00 - 1:00 PM"
  - "1:00 - 2:00 PM"
  - "2:00 - 3:00 PM"
  - "3:00 - 4:00 PM"
  - "4:00 - 5:00 PM"
- Pre-select based on customer's timeWindow if provided:
  - "morning" → "8:00 - 9:00 AM"
  - "midday" → "11:00 AM - 12:00 PM"
  - "afternoon" → "2:00 - 3:00 PM"
- Style: small pill buttons, selected one gets navy bg + white text

**Estimated Duration:**
- Select dropdown: "Under 1 hour" | "1-2 hours" | "2-3 hours" | "Half day"
- Default: "Under 1 hour"

**Confirm & Set Button:**
- Orange button: "Confirm Appointment"
- On click:
  1. Update the Firestore booking doc with:
     - `status`: "confirmed"
     - `confirmedDate`: the selected date (ISO string)
     - `confirmedArrivalWindow`: the selected time window string
     - `estimatedDuration`: the selected duration
     - `confirmedAt`: serverTimestamp()
     - `updatedAt`: serverTimestamp()
  2. Auto-log a comms entry: `{ type: "note", direction: "outbound", summary: "Appointment confirmed for [date] [arrival window]" }`
  3. Show the Google Calendar toast (existing behavior)
  4. Show success toast: "Appointment set for [date] at [arrival window]"

**Cancel button:**
- Gray outlined button: "Cancel" — collapses the form, doesn't change status

### B2 — Update the Google Calendar link

Update the `generateGCalUrl` function to use `confirmedDate` and `confirmedArrivalWindow` instead of `preferredDate` when available:

- Parse the arrival window to get the start hour (e.g., "8:00 - 9:00 AM" → start at 08:00, end at 09:00)
- If `confirmedDate` exists, use it. Otherwise fall back to `preferredDate`, then tomorrow.

### B3 — Show confirmed appointment details in the expanded booking detail

In the expanded detail card, when a booking is confirmed, show:
- **Confirmed Date:** formatted nicely (e.g., "Thursday, March 27, 2026")
- **Arrival Window:** e.g., "8:00 - 9:00 AM"
- **Estimated Duration:** e.g., "Under 1 hour"

These should appear prominently, maybe in a highlighted box with a blue/green left border.

### B4 — Update calendar view to use confirmed dates

In the calendar view, position confirmed bookings by `confirmedDate` instead of `preferredDate`. The priority should be:
1. `confirmedDate` (if confirmed/completed)
2. `preferredDate` (if pending with a preferred date)
3. `createdAt` (fallback)

### B5 — Update the confirmation email trigger

When the admin clicks "Confirm Appointment" and the booking has an email, automatically trigger the "Send Confirmation Email" flow (the existing Cloud Function call). The email should include the confirmed date and arrival window in the email body.

To do this, after the Firestore update succeeds, call the same send confirmation email logic that the "Send Confirmation Email" button uses. Pass the updated booking data (with confirmedDate and confirmedArrivalWindow) so the email includes the actual appointment time.

If the customer doesn't have an email, skip the automatic email but still show a toast: "Appointment confirmed. No email on file - contact customer manually."

---

## BUILD AND DEPLOY

```
npm run build && netlify deploy --prod && git add -A && git commit -m "feat: expanded service menu + admin Set Appointment workflow with arrival windows" && git push origin main
```
