# WO-COASTAL-15: Service Page Category Tab Order

## Goal
Reorder the category tabs on /services and /marine to match customer demand priority.

## Rules
- Interactive CC only. One change at a time.
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind.config.
- Read target files in full before editing.
- Build + deploy after completion.

## Steps

1. **Find how tabs are ordered.** The tabs come from Firestore `serviceCategories` collection or are sorted client-side. Check:
   ```
   grep -r "sortOrder\|sort\|category.*order\|tabs" src/ --include="*.tsx" -l
   ```
   Read `ServicesContent.tsx` and `MarineContent.tsx` in full.

2. **Determine sort approach.** Two options:
   - **Option A (preferred if quick):** Add/update `sortOrder` field in Firestore documents for each category, then sort by that field client-side in the hook.
   - **Option B:** Hardcode a priority array client-side and sort categories against it.
   
   Use Option B if Firestore writes would be complex. The priority arrays are:

   **Automotive (/services) tab order:**
   1. Oil Changes
   2. Tires / Wheel Services
   3. Brakes
   4. Basic Maintenance
   5. HVAC
   6. (everything else in existing order)

   **Marine (/marine) tab order:**
   1. Oil Change / Oil Service
   2. (everything else in existing order)

3. **Implement the sort.** Add a priority map at the top of each content component (or in a shared util), then sort the categories array before rendering tabs. Match by category name (case-insensitive partial match is fine since category names may vary slightly from Firestore).

4. **Build and deploy:**
   ```bash
   cd ~/coastal-mobile-lube && npm run build && npx netlify-cli deploy --prod --message="WO-15: tab reorder by demand"
   ```

5. **Verify:** Check /services -- Oil Changes tab should be first. Check /marine -- Oil Change tab should be first.
