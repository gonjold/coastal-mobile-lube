# WO: Preferred Date + Flexible Checkbox on All Forms
## Coastal Mobile Lube & Tire — 2026-03-24

Read every file mentioned below IN FULL before making any changes. Do not rewrite entire files. Surgical edits only.

---

## CHANGE 1 — Homepage widget: add preferred date + flexible checkbox

**File:** `src/app/page.tsx`

In the homepage quote widget form, add two new fields AFTER the "Best Way to Reach You" toggle and BEFORE the Notes field:

### 1a — Preferred date
- Label: "PREFERRED DATE" (matching existing uppercase label style)
- Input: type="date", min = tomorrow's date (dynamically calculated)
- Full width
- Same input styling as zip/phone fields

### 1b — Dates flexible checkbox
- Below the date input, add a checkbox with label: "My dates are flexible"
- Checkbox styling: custom checkbox with orange checkmark when checked, label text in gray, 14px
- Default: unchecked

### 1c — Update submit handler
Add both to the Firestore write:
- `preferredDate`: date value as ISO string (or empty string if not set)
- `datesFlexible`: boolean (true/false)

---

## CHANGE 2 — Fleet form: add preferred date + flexible checkbox

**File:** `src/app/fleet/FleetContent.tsx` (or wherever the fleet inline form is)

Add the same two fields AFTER the "Best Way to Reach You" toggle and BEFORE the notes/textarea field:

### 2a — Preferred date
- Label matching existing label style in this form
- type="date", min = tomorrow
- Same input styling

### 2b — Dates flexible checkbox
- "My dates are flexible" checkbox below date
- Same styling as Change 1

### 2c — Update submit handler
Add `preferredDate` and `datesFlexible` to the Firestore write.

---

## CHANGE 3 — Marine form: add preferred date + flexible checkbox

**File:** `src/app/marine/page.tsx` (or MarineContent.tsx)

Same pattern. Add after the contact preference toggle, before the notes/textarea:

### 3a — Preferred date + flexible checkbox
Same as Changes 1 and 2.

### 3b — Update submit handler
Add `preferredDate` and `datesFlexible` to the Firestore write.

---

## CHANGE 4 — Booking form: add dates flexible checkbox

**File:** `src/app/book/BookingForm.tsx`

The /book form already has a preferred date field. Just add the "My dates are flexible" checkbox below the existing date input:
- Same checkbox styling as the other forms
- Add `datesFlexible` to the Firestore write (boolean)

---

## CHANGE 5 — Admin dashboard: use preferredDate for calendar positioning

**File:** `src/app/admin/page.tsx`

### 5a — Calendar view date logic
Update the calendar view to position bookings by `preferredDate` when available, falling back to `createdAt` when `preferredDate` is not set. Currently it probably uses `createdAt` for everything.

The logic should be:
```
const bookingDate = booking.preferredDate 
  ? new Date(booking.preferredDate) 
  : booking.createdAt?.toDate?.() || new Date(booking.createdAt)
```

### 5b — Show "flexible" indicator
In both list view and calendar view, if a booking has `datesFlexible: true`, show a small "Flexible" badge (gray, rounded) next to the date or next to the customer name. This tells the admin they can reschedule easily.

### 5c — Show preferred date in list view
Add a "PREFERRED DATE" column to the table, between SERVICE and SOURCE. Format as "Mar 26" (short). If no preferred date, show "—". If datesFlexible is true, append a small "(flex)" text.

### 5d — Show preferred date in expanded detail
In the expandable booking detail card, add "Preferred Date" and "Dates Flexible" to the field grid.

---

## BUILD AND DEPLOY

```
npm run build && netlify deploy --prod && git add -A && git commit -m "feat: preferred date + dates flexible on all forms, admin calendar uses preferred dates" && git push origin main
```
