# WO-07: Customer Deduplication and Merge

## Context
WO-06 (functional wiring) must be completed first. This WO adds duplicate customer detection and a merge flow so Jason can consolidate records when the same person enters the system multiple times with different info (e.g., "Mike Hernandez" from the website and "Michael Hernandez" from a phone call).

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css or tailwind.config
- Build, commit, push, deploy at the end
- Never apply fuzzy/automatic merging logic to financial data. Strict matching only. Silently wrong records are unacceptable.

---

## Step 1: Read all relevant files

Read these files in full:
- src/app/admin/customers/page.tsx
- src/components/admin/CustomerProfilePanel.tsx
- Firestore customers collection structure
- Firestore bookings collection (how bookings reference customers)
- Firestore invoices collection (how invoices reference customers)
- src/contexts/AdminModalContext.tsx (from WO-06)

---

## Step 2: Build duplicate detection utility

Create src/lib/customerDedup.ts

This utility scans the customer list and finds potential duplicates using strict matching rules.

**Matching rules (in priority order):**

1. **Phone match** -- Two customers with the same phone number (after stripping formatting: spaces, dashes, parens, +1 prefix). This is the strongest signal. Phone numbers are nearly unique per person.

2. **Email match** -- Two customers with the same email address (case-insensitive). Also very strong.

3. **Name similarity** -- Two customers whose names are very close. Use these strict rules only (no fuzzy NLP):
   - Exact match after lowercasing and trimming
   - One name is a substring of the other (e.g., "Mike Hernandez" matches "Michael Hernandez" because "Mike" is NOT a substring, but "Hernandez" is shared -- so check if last names match AND first names share the first 3+ characters)
   - Common nickname mappings: Mike/Michael, Bill/William, Bob/Robert, Jim/James, Joe/Joseph, Tom/Thomas, Dan/Daniel, Dave/David, Chris/Christopher, Matt/Matthew, Jon/Jonathan, Tony/Anthony, Sam/Samuel, Ben/Benjamin, Alex/Alexander, Nick/Nicholas, Ed/Edward, Pat/Patrick, Rick/Richard, Steve/Steven

**Function signature:**
```typescript
interface DuplicateGroup {
  matchType: 'phone' | 'email' | 'name';
  customers: Customer[];  // 2 or more customers in the group
  matchValue: string;      // the matching phone/email/name
}

function findDuplicates(customers: Customer[]): DuplicateGroup[]
```

**Rules:**
- A customer can appear in multiple duplicate groups (phone match AND name match with different people)
- Sort groups by match strength: phone first, then email, then name
- Do NOT include groups where both customers have zero bookings and zero invoices (they're empty test records, not worth flagging)
- Normalize phone numbers before comparing: strip everything except digits, remove leading 1 if 11 digits

---

## Step 3: Add Possible Duplicates banner to Customers page

Modify src/app/admin/customers/page.tsx

Add a banner above the customer table (below the filter bar) that shows when duplicates are detected.

**Banner design:**
Similar to NeedsInvoiceBanner but with a blue/purple accent instead of amber.

Collapsed state:
- bg-white rounded-xl border border-gray-200 overflow-hidden, mb-4
- Header bar: bg-blue-50, px-5 py-3.5, flex justify-between items-center, cursor-pointer
  - Left: flex items-center gap-2.5
    - Blue dot: w-2 h-2 rounded-full bg-blue-500
    - Text: "X possible duplicate customers found" text-sm font-semibold text-blue-800
  - Right: chevron (rotates when expanded)

Expanded state shows each duplicate group:
- Group header: px-5 py-2 bg-gray-50 border-b
  - "Matched by [phone/email/name]: [value]" text-xs font-bold text-gray-500 uppercase
- Under each group, show the matching customer rows side by side (or stacked):
  - Each customer card: flex items-center gap-3, px-5 py-3, border-b
    - Avatar + name + phone + email + total spent + job count
    - "Select as Primary" radio button or clickable highlight
  - "Merge" button at bottom of each group: px-4 py-2, bg-blue-600, text-white, text-xs font-semibold, rounded-lg

If there are no duplicates, do not render the banner at all.

---

## Step 4: Build the Merge flow

Create src/components/admin/CustomerMergeModal.tsx

This modal opens when "Merge" is clicked on a duplicate group.

**Modal structure:**
- Overlay: fixed inset-0 bg-black/30 z-[70]
- Modal: bg-white rounded-2xl shadow-xl w-[600px] max-h-[90vh] overflow-y-auto, centered

**Header:**
- "Merge Customers" text-lg font-bold
- Subtitle: "Choose the primary record. All bookings, invoices, and history from the other record will be moved to the primary."
- text-sm text-gray-500

**Side-by-side comparison:**
Show the two (or more) customers in columns. For each field, let Jason pick which value to keep:

| Field | Customer A | Customer B |
|-------|-----------|-----------|
| Name | [radio] Mike Hernandez | [radio] Michael Hernandez |
| Phone | [radio] (813) 555-0142 | [radio] (813) 555-0142 |
| Email | [radio] mike.h@email.com | [radio] m.hernandez@gmail.com |
| Address | [radio] 4821 Bayshore Blvd | [radio] 4821 Bayshore Blvd, Apollo Beach, FL |
| Type | [radio] Residential | [radio] Residential |
| Vehicles | [checkbox] 2022 Toyota Camry | [checkbox] 2019 Toyota Tacoma |

Each row has radio buttons (pick one value) except Vehicles which has checkboxes (keep all selected). Pre-select the value from whichever customer has more bookings (the more active record is likely more accurate).

**Linked records summary:**
Below the field comparison, show what will be merged:
- "Customer A has X bookings and Y invoices"
- "Customer B has Z bookings and W invoices"
- "After merge: X+Z bookings and Y+W invoices linked to the primary record"

**Footer buttons:**
- "Cancel" (border border-gray-200, text-gray-500)
- "Merge Customers" (bg-blue-600, text-white, font-semibold)

**On "Merge Customers":**

This is a multi-step Firestore operation. Execute in this order:

1. **Create the merged customer document:**
   - Use the primary customer's document ID
   - Update it with all the selected field values from the comparison
   - Combine vehicles arrays (all checked vehicles)
   - Set totalSpent = sum of both customers' totals
   - Set jobCount = sum of both customers' job counts
   - Keep the earlier createdAt date

2. **Transfer bookings:**
   - Query all bookings where customerId matches the secondary customer's ID
   - Also query bookings where the customer name field matches the secondary customer's name (for bookings that reference by name string instead of ID)
   - Update each booking: set customerId to primary customer's ID, update customer name/phone/email fields to primary's values

3. **Transfer invoices:**
   - Same approach: query by customerId and by customer name
   - Update each invoice to reference the primary customer

4. **Delete the secondary customer document**

5. **Close the modal and refresh the customer list**

**CRITICAL:** Do NOT run this as a batch write that could partially fail. Use a Firestore batch (writeBatch) to make it atomic. If the batch fails, nothing changes. Show an error message if the batch fails.

---

## Step 5: Add merge button to customer profile panel

Modify src/components/admin/CustomerProfilePanel.tsx

If the currently viewed customer is part of a duplicate group, show a subtle indicator in the profile header:

- Below the status badges, add: "Possible duplicate of [Other Customer Name]" in text-xs text-blue-600 cursor-pointer
- Clicking it opens the CustomerMergeModal with these two customers pre-loaded

This gives Jason a way to merge from the profile panel, not just from the banner.

---

## Step 6: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "WO-07: Customer deduplication - detection, comparison, and atomic merge"
git push origin main
npx netlify-cli deploy --prod --message="WO-07: Customer dedup and merge"
```

Verify:
- Duplicate banner appears on Customers page when duplicates exist
- Merge modal shows side-by-side comparison with field selection
- Merging transfers all bookings and invoices to the primary customer
- Secondary customer is deleted after merge
- Profile panel shows duplicate indicator when applicable
- Create two test customers with the same phone number to verify detection works
