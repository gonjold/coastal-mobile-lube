# WO: Add Email + Communication Preference to All Forms
## Coastal Mobile Lube & Tire — 2026-03-24

Read every file mentioned below IN FULL before making any changes. Do not rewrite entire files. Make surgical edits only.

---

## CHANGE 1 — Homepage widget: add email + contact preference

**File:** `src/app/page.tsx`

In the homepage "Get a quick quote" widget form, add two new fields BETWEEN the Phone field and the Notes field:

### 1a — Email field
Add an email input field:
- Label: "EMAIL" (matching the existing uppercase label style)
- Input: type="email", placeholder="you@email.com"
- Full width (not side-by-side with another field)
- Same styling as existing inputs

### 1b — Preferred contact method
Add a button group for contact preference:
- Label: "BEST WAY TO REACH YOU" (same uppercase label style)
- Three toggle buttons in a row: "Call" | "Text" | "Email"
- Default: "Call" selected
- Style: same as the Automotive/Fleet/Marine tab switcher — bordered buttons, selected one gets navy background with white text, unselected get white background with gray border
- Store as state variable: contactPreference (default "call")

### 1c — Update the submit handler
Add both new fields to the Firestore write:
- `email`: email field value (trimmed, lowercase)
- `contactPreference`: "call" | "text" | "email"

---

## CHANGE 2 — Booking form (/book): add email + contact preference

**File:** `src/app/book/BookingForm.tsx`

### 2a — Email field
Add an email input field AFTER the Phone field:
- Label: "Email" (matching existing label style in this form)
- Input: type="email", placeholder="you@email.com"
- Full width
- Same styling as existing inputs in this form

### 2b — Preferred contact method
Add a button group AFTER the email field:
- Label: "Best way to reach you" (matching existing label style)
- Three toggle buttons: "Call" | "Text" | "Email"
- Default: "Call" selected
- Style: similar to the time window button group (Morning/Midday/Afternoon) — reuse that same visual pattern

### 2c — Update submit handler
Add both new fields to the Firestore write:
- `email`: email value (trimmed, lowercase)
- `contactPreference`: "call" | "text" | "email"

### 2d — Update returning customer lookup
When a returning customer is found via phone lookup, also auto-fill the email field if the previous booking had one.

---

## CHANGE 3 — Fleet form: add contact preference only (already has email)

**File:** `src/app/fleet/FleetContent.tsx` (or wherever the fleet inline form is)

### 3a — Preferred contact method
Add a button group AFTER the Email field:
- Label: "BEST WAY TO REACH YOU" (matching existing label style)
- Three toggle buttons: "Call" | "Text" | "Email"
- Default: "Call"
- Same visual pattern as used in Changes 1 and 2

### 3b — Update submit handler
Add `contactPreference` to the Firestore write.

---

## CHANGE 4 — Marine form: add email + contact preference

**File:** `src/app/marine/page.tsx` (or MarineContent.tsx — wherever the marine inline form is)

### 4a — Email field
Add an email input AFTER the Phone field:
- Label matching existing label style
- type="email", placeholder="you@email.com"
- Full width, same styling as other inputs in this form

### 4b — Preferred contact method
Add the same button group AFTER email:
- "Call" | "Text" | "Email" toggle buttons
- Default: "Call"

### 4c — Update submit handler
Add both `email` and `contactPreference` to the Firestore write.

---

## CHANGE 5 — Remove debug console.logs from homepage

**File:** `src/app/page.tsx`

Remove the three debug console.log/console.error lines we added earlier:
- `console.log("SUBMIT FIRED")`
- `console.log("Firebase db instance:", db)`
- `console.error("WIDGET SUBMIT ERROR:", error)`

Keep the try/catch structure but remove the console output. In the catch block, you can keep a generic error state that shows the user a message like "Something went wrong. Please call us instead." instead of silently failing.

---

## BUILD AND DEPLOY

```
npm run build && netlify deploy --prod && git add -A && git commit -m "feat: email field + contact preference on all forms, remove debug logs" && git push origin main
```
