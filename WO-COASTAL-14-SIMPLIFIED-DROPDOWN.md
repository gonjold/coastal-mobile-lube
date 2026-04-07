# WO-COASTAL-14: Simplify Quote Form Service Dropdown

## Goal
Replace the 60+ individual service dropdown with broad category options that change based on the selected division tab. Add "Other" option that highlights the notes field.

## Rules
- Interactive CC only. One change at a time.
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind.config.
- Read target files in full before editing.
- Build + deploy after completion.

## Steps

1. **Find the quote form component:**
   ```
   grep -r "serviceType\|service.*select\|service.*dropdown\|quote.*form" src/ --include="*.tsx" -l
   ```
   Read the file in full.

2. **Replace the dynamic Firestore service list** in the dropdown with hardcoded category arrays per division. The dropdown should be a simple `<select>` with these options:

   **Automotive** (default):
   - Oil Change
   - Tire Replacement
   - Tire Service
   - Battery
   - Brakes
   - Wipers
   - Other (describe below)

   **Fleet:**
   - Oil Change
   - Tire Service
   - Battery
   - Brakes
   - Preventive Maintenance
   - Other (describe below)

   **Marine:**
   - Oil Change Service
   - Engine Service
   - Winterization / De-Winterization
   - Other (describe below)

   **RV & Trailer:**
   - Oil Change
   - Tire Service
   - Generator Service
   - Roof / Exterior Maintenance
   - Other (describe below)

3. **Wire the dropdown to the division tabs.** When the user switches division tabs (Automotive/Fleet/Marine/RV), the service dropdown options should update to match. Find the existing division state variable and use it to select the right options array.

4. **"Other" behavior.** When "Other (describe below)" is selected:
   - Add a visual highlight to the notes/message textarea (e.g., `ring-2 ring-sky-400` or a brief pulse animation)
   - Optionally change the textarea placeholder to "Please describe the service you need..."
   - When a non-Other option is re-selected, remove the highlight

5. **Build and deploy:**
   ```bash
   cd ~/coastal-mobile-lube && npm run build && npx netlify-cli deploy --prod --message="WO-14: simplified service dropdown"
   ```

6. **Verify:** Switch between all 4 division tabs, confirm dropdown updates. Select "Other", confirm notes field highlights. Submit a test (or confirm form still submits properly).
