# WO-COASTAL-17: Booking Page Rebuild -- Card-Based Service Picker

## Goal
Completely rebuild the /book page with a new card-based service selection flow, VIN/Hull scanner with YMM fallback fields, sticky service sidebar, and redesigned form layout. Reference the approved mockup at coastal-booking-v3.jsx in the project root for exact design.

## Rules
- Interactive CC only. This is a BIG change -- take it slow and methodical.
- Do NOT touch globals.css or tailwind.config.
- Build + deploy after completion.
- This replaces the existing /book page content entirely. The old booking flow is being replaced.

## Important Context
- The homepage quick quote form is a SEPARATE component and should NOT be touched.
- The /book page currently has a simple dropdown + form. We are replacing it with a card-based category picker with optional drill-down to specific Firestore services.
- Services and prices should be pulled from Firestore (serviceCategories collection) where possible. The broad category cards can be hardcoded per division since they map to Firestore categories.
- Division tabs already exist on /book -- keep that wiring.

## Design Spec (match the mockup exactly)

### Layout
- Navy hero banner at top with division tabs, heading "Book your service", subtext with phone CTA
- Below hero: two-column layout (left = main form, right = sticky sidebar)
- Left column: service cards section, then "Your details" form card
- Right column: "Your services" sticky summary (NO submit button in sidebar)

### Service Selection Flow
1. **Division tabs** (Automotive / Fleet / Marine / RV & Trailer) -- already exist, keep them
2. **Category cards** in a 4-column grid. Each card shows:
   - Category name (bold, white)
   - "Starting at $XX.XX" price (lowest price from that category's services) -- Automotive only. Fleet shows no prices (all null). Marine and RV show prices.
   - "Other" card shows "Describe what you need" subtext
   - When selected: orange border, light orange background tint
   - When selected: "See specific services" link text appears. Tapping again toggles the drill-down panel.
3. **Drill-down panel** (optional, expandable below cards):
   - Shows specific services from that category with checkboxes and prices
   - User can select one or more specific services
   - "Not sure? Just leave the broad category and describe it below." helper text
   - If user selects specifics, the broad category is replaced in the sidebar with the specific services
   - If user deselects all specifics, the broad category comes back
4. **"Other" card**: shows a text input "What do you need?" with placeholder "Briefly describe the service you need"

### Category Cards per Division

**Automotive:** Oil Change, Tires, Brakes, Battery, Maintenance, HVAC, Wipers, Other
**Fleet:** Oil Change, Tire Service, Battery, Brakes, Preventive Maintenance, Other
**Marine:** Oil Change, Engine Service, Winterization, Other
**RV & Trailer:** Oil Change, Tire Service, Generator, Roof / Exterior, Other

The specific services under each category should be pulled from Firestore serviceCategories collection, filtered by division and matched to the broad category name. If Firestore data isn't available or loading, show the category cards without drill-down.

### Vehicle Information Section (inside "Your details" card)
- Section header: "Vehicle Information"
- **VIN or Hull # field** with Scan button:
  - Label changes by division: "VIN" for Automotive/Fleet/RV, "Hull #" for Marine
  - Text input + camera scan button (just the button for now, OCR wiring is a future WO)
  - Helper text: "Found on driver's door jamb sticker" for VIN, "Stamped on boat transom" for Hull #
- **"or enter vehicle details" divider** (only for Automotive/Fleet/RV, hidden for Marine)
- **Year / Make / Model** three-column row (only for Automotive/Fleet/RV, hidden for Marine):
  - Year: `<select>` dropdown, options from 2027 down to 1988
  - Make: text input, placeholder "e.g. Toyota"
  - Model: text input, placeholder "e.g. Camry"

### Contact Form Fields (inside "Your details" card, below vehicle info)
- Your Name (text input)
- Zip Code + Phone (two-column row)
- Email
- Best Way to Reach You (Call / Text / Email toggle buttons, orange highlight on selected)
- Preferred Date (date input)
- "Anything else we should know?" (textarea, placeholder "Tire size, special requests, access instructions, etc.")
- Get My Quote (full-width orange button)
- "or call 813-722-LUBE for immediate help" below button

### Sticky Sidebar ("Your services")
- Position: sticky, top offset so it scrolls with the page
- Header: "Your services" in orange
- Empty state: "No services selected yet"
- Selected services list:
  - Each item shows service name, price (if available), and X remove button
  - Broad category selections show "Price confirmed at booking" instead of a price
  - Specific service selections show the price in orange
  - Format: "Oil Change" for broad, "Oil Change: Full Synthetic" for specific
- Estimated total section (only shows when services are selected):
  - If any services have prices: show "Estimated total" with dollar amount in orange + "Starting at pricing. Final quote confirmed by our team."
  - If no services have prices (Fleet): show "We will confirm pricing when we reach out"
- NO submit button in sidebar. The submit button lives at the bottom of the form.

### Styling Notes
- Match existing site theme: navy background (#0B1929 or similar), white text, orange accents (#E8913A)
- Cards: rounded-xl, subtle border, hover/selected states
- Inputs: semi-transparent background (rgba white), rounded-lg, white text
- Year dropdown: appearance-none with custom SVG chevron
- All font: Plus Jakarta Sans (already loaded)
- No emojis anywhere
- Responsive: on mobile, sidebar moves below the form or becomes a fixed bottom bar (handle gracefully)

## Steps

1. **Read the current /book page component in full.** Find it:
   ```
   find src -path "*book*" -o -path "*Book*" | head -20
   ```
   Also check the routing to understand how /book is rendered.

2. **Read the Firestore hooks** to understand how services are fetched:
   ```
   grep -r "useServices\|serviceCategories\|useFirestore" src/ --include="*.ts" --include="*.tsx" -l
   ```

3. **Rebuild the /book page component.** This is a full replacement of the page content. Keep the same file, but replace the JSX and state logic entirely. Do NOT modify any shared components (Navbar, Footer, etc.).

4. **Wire Firestore service data** to the drill-down panels. When a user expands a category card, the specific services shown should come from the Firestore serviceCategories data for that division + category.

5. **Form submission** should work the same as the current form -- send the data to whatever endpoint/function it currently uses. Add the new fields (vinOrHull, vehicleYear, vehicleMake, vehicleModel, selectedServices array) to the submission payload.

6. **Build and deploy:**
   ```bash
   cd ~/coastal-mobile-lube && npm run build && npx netlify-cli deploy --prod --message="WO-17: booking page rebuild with card picker"
   ```

7. **Verify on live site:**
   - All 4 division tabs work, cards update per division
   - Selecting a card adds it to sidebar
   - Tapping again shows drill-down, selecting specifics updates sidebar
   - "Other" shows text input
   - VIN label changes for Marine (Hull #)
   - YMM fields hidden for Marine
   - Year dropdown works
   - Form submits successfully
   - Sidebar is sticky on desktop
   - Mobile layout is usable
