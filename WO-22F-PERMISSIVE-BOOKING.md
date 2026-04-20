# WO-22f: Permissive Booking Flow (Fewer Required Fields, Fewer Warnings)

**Project:** Coastal Mobile Lube & Tire
**Scope:** Booking wizard — validation, gating, and warning copy.
**Estimated time:** 20-30 min
**Prerequisite:** WO-22e deployed.

---

## CONTEXT

The current booking wizard is over-gated. Users must fill every vehicle field (Year, Make, Model, Fuel Type) before the Next button enables, and the "unconfirmed" warning chain (amber banner, admin badge, email/SMS warning) is alarming for what is actually a normal business pattern: the Coastal team confirms every first-time booking by phone anyway.

This WO flips the default from "lock down until validated" to "let them book, we'll confirm on the call." Jason's business relies on phone follow-up for every booking regardless — the wizard should not fight that workflow.

---

## SCOPE

### IN
- Validation logic in `BookingWizardModal.tsx` (Next button gating, required field rules)
- Gating on Fuel Type dropdown ("Select model first" state) in `VehicleSelector.tsx`
- "VEHICLE UNCONFIRMED" / "we'll confirm on the call" copy and visual treatment
- Contact info validation on Step 3 (Details)

### OUT
- Any booking success flow or confirmation email content beyond the warning copy
- Admin portal (badge stays, just toned down — see Step 5)
- Pricing or service logic
- Any other page
- Any other form

---

## STEPS

### Step 0: Pre-flight read

1. Read `src/components/BookingWizardModal.tsx` in full.
2. Read `src/components/booking/VehicleSelector.tsx` in full.
3. Identify:
   - What conditions currently enable/disable the Next button on each step
   - All required-field markers and validation errors
   - The `needsConfirmation` flag path and where it surfaces in UI/emails
4. Print a brief summary before editing.

---

### Step 1: Loosen Step 1 (Vehicle) validation

The ONLY required field on Step 1 should be a minimum vehicle signal. Anything more is optional and can be confirmed by phone.

**Step 1 Next-button rule:**
- Enabled if ANY of these is true:
  - Year is selected (even if Make/Model/Fuel are blank)
  - VIN is entered (17 chars, even if not decoded yet)
  - "Been here before? Look up by phone number" was used and a returning customer was matched

**Remove:**
- Any requirement that Make/Model/Fuel be filled
- Any requirement that VIN be successfully decoded (if user entered it, trust them — we'll validate on the call)

**Keep:**
- The "Skip and we'll confirm on the call →" flow for users who want to bypass even the Year selection. Clicking it sets `needsConfirmation = true` and enables Next immediately.

---

### Step 2: Ungate Fuel Type dropdown

Currently Fuel Type says "Select model first" and is disabled until Model is picked. Remove that gate.

**Change:**
- Fuel Type `<select>` is always enabled (not dependent on Model)
- Options are the static list: Gas, Hybrid, Electric, Diesel, Plug-in Hybrid (whatever the current list is — don't change the options themselves)
- Placeholder: "Select fuel type" (never "Select model first")

This lets users fill in whatever they know in any order. If they know they drive a hybrid but aren't sure of the model year, great — they can pick Hybrid without being blocked.

---

### Step 3: Loosen Step 3 (Details) validation

Current required fields are likely: First name, Last name, Phone, some date/time, Address.

**New rules — ONLY these are truly required:**
- First name
- Phone (valid-enough format, not strict)
- Service address (just SOMETHING in the field — we'll confirm the exact address on the call)
- Best way to reach (Call / Text / Email — one selection)

**Make optional (remove asterisks, remove validation errors):**
- Last name
- Email
- Preferred date (if blank, staff picks a time during confirmation call)
- Preferred time (same)

**Visual change:**
- Remove the red asterisks from optional fields
- Remove any error messages that fire for blank optional fields
- Next button enables when the 4 required fields above have any non-empty value (phone can be any format, don't enforce E.164 or area code presence)

---

### Step 4: Tone down "we'll confirm on the call" copy

Current copy treats the incomplete/skip state as a warning. Reframe as a normal, expected path — because it is.

**Current treatment → new treatment:**

Amber banner on skipped vehicle: "Don't have all the details? Skip and we'll confirm on the call →"
→ Keep the banner, but soften copy:
"No worries if you're not sure — we'll sort it out on the call."

"VEHICLE UNCONFIRMED" warning in admin detail:
→ Change to a small amber pill that just says "Call to confirm" — no uppercase shouting, no "WARNING" language

"VEHICLE UNCONFIRMED" in admin email/SMS notifications:
→ Change to: "Heads up: some details to confirm on the call" — at the bottom, not the top; smaller font, not alarming

---

### Step 5: Admin badge polish (minor)

In `ScheduleDetailPanel.tsx` or wherever the unconfirmed badge lives:

- Change the amber badge label from "UNCONFIRMED" or similar to "Call to confirm"
- Keep it amber (visual signal for staff to notice) but not alarming
- Keep its presence on the booking list so staff knows which ones need a confirmation call first

Do NOT remove the badge — it's useful info for Jason. Just tone it down.

---

### Step 6: Next button label tweaks (optional, small UX win)

On Step 1, if the user is proceeding with incomplete vehicle info (e.g. just Year, or just VIN), change the Next button label to "Continue — we'll confirm details on the call" for that state. Otherwise keep "Next".

This sets expectation without alarming. Skip if it adds more than 5 minutes of work.

---

### Step 7: Build, commit, push, deploy

1. `npm run build` — confirm zero errors.
2. `git add src/`
3. `git commit -m "WO-22f: permissive booking flow — fewer required fields, softer warnings"`
4. `git push`
5. `npx netlify-cli deploy --prod`

---

## ACCEPTANCE CRITERIA

### Step 1 (Vehicle)
- [ ] Next button enables with just Year selected (no Make/Model/Fuel needed)
- [ ] Next button enables with just VIN entered (even before decode)
- [ ] Next button enables after "Skip and we'll confirm on the call"
- [ ] Fuel Type dropdown is always enabled (not gated by Model)
- [ ] Skip banner copy is softened, no "warning" language

### Step 3 (Details)
- [ ] Only First name, Phone, Service address, Best way to reach are required
- [ ] Last name, Email, Preferred date, Preferred time are optional (no asterisks, no errors if blank)
- [ ] Phone field doesn't reject inputs for formatting — any non-empty string passes
- [ ] Next button enables as soon as the 4 required fields have any value

### Admin
- [ ] "UNCONFIRMED" / "VEHICLE UNCONFIRMED" language is gone
- [ ] Replaced with "Call to confirm" amber pill (smaller, less alarming)
- [ ] Staff can still see which bookings need a confirmation call at a glance

### Email/SMS
- [ ] No alarming warning copy at the top of admin notifications
- [ ] Instead, a small footer-style note: "Heads up: some details to confirm on the call"

---

## DO NOT

- Do NOT remove the `needsConfirmation` flag from the data model — it's useful for admin filtering
- Do NOT remove phone number as a required field (it's the ONE thing Jason genuinely needs to make the confirmation call)
- Do NOT change the booking success flow or the customer confirmation email/SMS that the BOOKER receives (that's a separate copy review)
- Do NOT touch any other form, page, or component
- Do NOT rewrite entire files — surgical validation changes only
- Do NOT add any new dependencies

---

## ROLLBACK

```bash
git revert HEAD
git push
npx netlify-cli deploy --prod
```
