# WO-COASTAL-NAME-SPLIT.md

Read the following files in full before making any changes:
- src/components/BookingWizardModal.tsx
- src/components/FloatingQuoteBar.tsx (if it still exists and is not hidden)
- src/app/fleet/FleetContent.tsx
- src/app/marine/MarineContent.tsx
- src/app/rv/RVContent.tsx
- src/app/contact/page.tsx (or ContactContent.tsx, whatever holds the contact form)

TASK: Every form on the site that currently has a single "Name", "Full Name", or "Your Name" field must be split into two side-by-side fields: "First name" and "Last name". Both required.

For each form found:
1. Replace the single name input with two inputs in a flex row with gap-2 or gap-3
2. Update form state to track firstName and lastName as separate values
3. Update the Firestore write to save firstName and lastName as separate fields instead of name/fullName
4. If the form currently saves "name" or "fullName", change the field names to "firstName" and "lastName"

Do not change any other form fields, styling, layout, or behavior. Only the name field split.

The BookingWizardModal is ~2400 lines. Find the exact Step 3 section where the name input lives, make the change there, and leave everything else untouched. Do not rewrite the entire file.

Note: The new QuoteModal and hero quote form from WO-COASTAL-HERO-REBUILD already use first/last name fields. This WO covers all the OTHER forms that still have a single name field.

Do not rewrite entire files. Surgical edits only.

After changes:

```bash
npm run build && git add -A && git commit -m "feat: split name fields to first/last across all forms" && git push origin main && npx netlify-cli deploy --prod
```
