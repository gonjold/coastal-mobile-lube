# WO-ADMIN-12: Booking Wizard Fixes + Fee CMS

## Context
WO-09 deployed the booking wizard redesign. Several issues found during testing need fixing. This WO also adds a Convenience Fee settings panel in the admin so Jason can manage fee rules without touching Firestore directly.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read EVERY file mentioned in full BEFORE making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css, tailwind.config, or AdminSidebar.tsx
- Build, commit, push, deploy at the end
- Do NOT skip any fixes

---

## STEP 0: Read all target files first

Read these files IN FULL before touching anything:

```
src/components/BookingWizardModal.tsx
src/app/admin/services/page.tsx (or wherever the admin services/settings page is)
src/components/admin/AdminSidebar.tsx (read only -- check current nav items)
```

Note:
1. How packages/categories are rendered and which starts expanded
2. How customer lookup works (what fields it sets, where vehicle data lives in state)
3. How the convenience fee "free first service" check runs and when it triggers
4. What settings UI exists in admin (if any)

---

## FIX 1: Packages Collapsed by Default

**File:** `src/components/BookingWizardModal.tsx`

Find the state or logic that controls which accordion category starts expanded. There will be something like:

```typescript
const [expandedCategory, setExpandedCategory] = useState('coastal-packages')
```
or
```typescript
const [expandedCategories, setExpandedCategories] = useState(['coastal-packages'])
```
or a condition in the render that checks if a category is "Coastal Packages" and defaults it to open.

**Change it so nothing starts expanded:**

```typescript
const [expandedCategory, setExpandedCategory] = useState('')
// or
const [expandedCategories, setExpandedCategories] = useState<string[]>([])
```

If the logic is in the render (like `defaultOpen={cat.name === 'Coastal Packages'}`), change it to `defaultOpen={false}` or remove the prop.

---

## FIX 2: Customer Lookup Must NOT Override Vehicle from Step 1

**File:** `src/components/BookingWizardModal.tsx`

Find the customer lookup/search function. When a returning customer is found (by phone or email), the code currently populates form fields from the customer's Firestore record. This likely includes the customer's saved vehicle, which overwrites whatever the user entered in Step 1.

**Find where customer data is applied to form state.** It will look something like:

```typescript
// When customer is found from lookup
setFirstName(customer.firstName);
setLastName(customer.lastName);
setEmail(customer.email);
setPhone(customer.phone);
setAddress(customer.address);
// THIS IS THE PROBLEM:
setVehicleYear(customer.vehicles?.[0]?.year);
setVehicleMake(customer.vehicles?.[0]?.make);
setVehicleModel(customer.vehicles?.[0]?.model);
```

**Fix:** Remove the vehicle field population from the customer lookup. The lookup should ONLY set:
- firstName
- lastName  
- email (if not already filled)
- address (if not already filled)
- customerId (to link the booking to the existing customer)

It should NOT set or touch:
- vehicleYear
- vehicleMake
- vehicleModel
- vehicleTrim
- fuelType
- vin

The vehicle entered in Step 1 is the vehicle being serviced THIS visit. The customer's saved vehicles are historical data and should not override the current booking's vehicle.

Also check: if the lookup happens by searching the customer's saved vehicles (e.g., matching by VIN or Y/M/M), and THAT is what triggers the customer match, make sure the match is used for customer identity only. The vehicle fields in the form should remain untouched.

---

## FIX 3: Free First Service Detection Should Trigger on Input, Not Submit

**File:** `src/components/BookingWizardModal.tsx`

Find where the "is this a first-time customer" check runs. Currently it likely runs on form submit or when clicking "Book". It should run as soon as the user enters their phone number or email in Step 3.

**Find the first-time customer check.** It will query Firestore customers or bookings to see if this phone/email has been seen before. It might look like:

```typescript
const checkFirstTimeCustomer = async (phone, email) => {
  // query customers collection
  // if no match found, set isFirstTime = true
  // if match found, set isFirstTime = false
}
```

**Wire it to run on Step 3 input changes:**

1. Add a useEffect that triggers the check when phone or email changes AND the user is on Step 3:

```typescript
useEffect(() => {
  if (currentStep !== 3) return; // Step 3 = Details (0-indexed: step 2)
  
  const phone = phoneValue?.replace(/\D/g, '');
  const email = emailValue?.trim();
  
  if (!phone && !email) return;
  
  const timer = setTimeout(async () => {
    await checkFirstTimeCustomer(phone, email);
  }, 500); // debounce 500ms
  
  return () => clearTimeout(timer);
}, [currentStep, phoneValue, emailValue]);
```

Adjust `currentStep` check to match whatever step index "Details" is (likely index 2 if 0-indexed, or 3 if 1-indexed). Check what variable name and numbering the file uses.

2. Make sure `isFirstTime` state updates the convenience fee display in the sidebar immediately (not just on submit). The sidebar should show "FREE - first service" in green as soon as the check resolves, while the user is still on Step 3.

3. If the existing customer lookup already runs on phone/email input (from Fix 2), combine the first-time check into that same lookup. When a customer is found: `setIsFirstTime(false)`. When no customer is found: `setIsFirstTime(true)`.

---

## FIX 4: Vehicle Text Search Input (Public Wizard)

**File:** `src/components/BookingWizardModal.tsx`

The admin NewBookingModal got a "Quick Vehicle Search" text field in the earlier bug fix WO. The public wizard should have the same pattern but styled for customers.

**Add a text search input between the VIN section and the Year/Make/Model dropdowns.**

1. Find the "or enter manually" divider between VIN and the Y/M/M dropdowns.

2. Replace the divider and dropdowns section with this layout:

```
[VIN input] [Decode] [Scan]

--- or describe your vehicle ---

[Text search input: "e.g. 2024 Toyota Camry"]

[Show Year/Make/Model dropdowns]   <-- clickable text link, toggles dropdown visibility
```

3. The text search input:
   - Full width, same styling as other form inputs in the wizard
   - Placeholder: "e.g. 2024 Toyota Camry LE"
   - On change, parse the text to extract year/make/model/trim

4. Parsing logic (run on blur or on a 500ms debounce after typing stops):

```typescript
const parseVehicleText = (text: string) => {
  const words = text.trim().split(/\s+/);
  let year = '';
  let make = '';
  let model = '';
  let trim = '';
  
  // Extract 4-digit year (1990-2030)
  const yearIdx = words.findIndex(w => /^(19|20)\d{2}$/.test(w));
  if (yearIdx !== -1) {
    year = words[yearIdx];
    words.splice(yearIdx, 1);
  }
  
  // Common makes (case-insensitive match)
  const makes = [
    'Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chevy',
    'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda',
    'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover',
    'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'McLaren', 'Mercedes', 'Mercedes-Benz',
    'Mini', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Rivian', 'Rolls-Royce',
    'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'VW', 'Volvo',
  ];
  
  const makeIdx = words.findIndex(w => 
    makes.some(m => m.toLowerCase() === w.toLowerCase())
  );
  
  if (makeIdx !== -1) {
    // Normalize common abbreviations
    const matched = words[makeIdx];
    if (matched.toLowerCase() === 'chevy') make = 'Chevrolet';
    else if (matched.toLowerCase() === 'vw') make = 'Volkswagen';
    else if (matched.toLowerCase() === 'mercedes') make = 'Mercedes-Benz';
    else make = makes.find(m => m.toLowerCase() === matched.toLowerCase()) || matched;
    words.splice(makeIdx, 1);
  }
  
  // Remaining words: first is model, rest is trim
  if (words.length > 0) {
    model = words[0];
    if (words.length > 1) {
      trim = words.slice(1).join(' ');
    }
  }
  
  return { year, make, model, trim };
};
```

5. When parsed values are found, set the form state:

```typescript
const handleVehicleTextBlur = () => {
  if (!vehicleSearchText.trim()) return;
  const parsed = parseVehicleText(vehicleSearchText);
  if (parsed.year) setVehicleYear(parsed.year);
  if (parsed.make) setVehicleMake(parsed.make);
  if (parsed.model) setVehicleModel(parsed.model);
  if (parsed.trim) setVehicleTrim(parsed.trim);
};
```

6. The Y/M/M dropdowns should still exist but be toggleable. Add state:

```typescript
const [showManualDropdowns, setShowManualDropdowns] = useState(false);
```

Show them automatically when the text search populates values OR when the user clicks the toggle:

```tsx
{(showManualDropdowns || vehicleYear || vehicleMake) && (
  <div className="grid grid-cols-3 gap-3 mt-3">
    {/* existing Year, Make, Model dropdowns */}
  </div>
)}

{!showManualDropdowns && !vehicleYear && !vehicleMake && (
  <button
    type="button"
    onClick={() => setShowManualDropdowns(true)}
    className="text-sm text-[#1A5FAC] mt-2 hover:underline"
  >
    Or select year, make, and model
  </button>
)}
```

7. The fuel type dropdown should ALWAYS be visible (not hidden behind the toggle) since it affects service filtering in Step 2.

---

## FIX 5: Convenience Fee Admin Settings Panel

This adds a "Fees" section to the admin Settings/Services page so Jason can manage convenience fee rules.

**File:** `src/app/admin/services/page.tsx` (or wherever the admin services/settings page is)

1. Add a "Service Fees" section below or alongside the existing service management content. It should read from and write to the `settings/fees` Firestore document.

2. Add state for fee settings:

```typescript
const [feeSettings, setFeeSettings] = useState({
  enabled: true,
  amount: 39.95,
  label: 'Mobile Service Fee',
  taxable: false,
  waiveFirstService: true,
  promoOverride: false,
});
const [feeLoading, setFeeLoading] = useState(true);
const [feeSaving, setFeeSaving] = useState(false);
```

3. Load on mount:

```typescript
useEffect(() => {
  const loadFees = async () => {
    try {
      const feeDoc = await getDoc(doc(db, 'settings', 'fees'));
      if (feeDoc.exists()) {
        const data = feeDoc.data();
        setFeeSettings({
          enabled: data.convenienceFee?.enabled ?? true,
          amount: data.convenienceFee?.amount ?? 39.95,
          label: data.convenienceFee?.label ?? 'Mobile Service Fee',
          taxable: data.convenienceFee?.taxable ?? false,
          waiveFirstService: data.convenienceFee?.waiveFirstService ?? true,
          promoOverride: data.convenienceFee?.promoOverride ?? false,
        });
      }
    } catch (err) {
      console.error('Failed to load fee settings:', err);
    }
    setFeeLoading(false);
  };
  loadFees();
}, []);
```

4. Save handler:

```typescript
const handleSaveFees = async () => {
  setFeeSaving(true);
  try {
    await setDoc(doc(db, 'settings', 'fees'), {
      convenienceFee: feeSettings,
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save fee settings:', err);
  }
  setFeeSaving(false);
};
```

5. Render the settings panel. Place it in a visible section of the services page (either as a tab, or as a bordered card below the service list). Do NOT create a new route -- keep it on the existing services page.

```tsx
{/* Service Fees Section */}
<div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
  <h2 className="text-lg font-bold text-[#0B2040] mb-4">Service Fees</h2>

  {feeLoading ? (
    <p className="text-sm text-gray-500">Loading...</p>
  ) : (
    <div className="space-y-4">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0B2040]">Mobile Service Fee</p>
          <p className="text-xs text-gray-500">Charge a fee for mobile service visits</p>
        </div>
        <button
          onClick={() => setFeeSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            feeSettings.enabled ? 'bg-[#1A5FAC]' : 'bg-gray-200'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            feeSettings.enabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {feeSettings.enabled && (
        <>
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fee Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={feeSettings.amount}
              onChange={(e) => setFeeSettings(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              className="w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Label</label>
            <input
              type="text"
              value={feeSettings.label}
              onChange={(e) => setFeeSettings(prev => ({ ...prev, label: e.target.value }))}
              className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Mobile Service Fee, Convenience Fee"
            />
          </div>

          {/* Waive First Service */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0B2040]">Waive for first-time customers</p>
              <p className="text-xs text-gray-500">New customers get the fee waived on their first booking</p>
            </div>
            <button
              onClick={() => setFeeSettings(prev => ({ ...prev, waiveFirstService: !prev.waiveFirstService }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                feeSettings.waiveFirstService ? 'bg-[#1A5FAC]' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                feeSettings.waiveFirstService ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Taxable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0B2040]">Include in tax calculation</p>
              <p className="text-xs text-gray-500">Whether the fee is subject to sales tax</p>
            </div>
            <button
              onClick={() => setFeeSettings(prev => ({ ...prev, taxable: !prev.taxable }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                feeSettings.taxable ? 'bg-[#1A5FAC]' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                feeSettings.taxable ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </>
      )}

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={handleSaveFees}
          disabled={feeSaving}
          className="px-6 py-2.5 bg-[#E07B2D] text-white rounded-lg text-sm font-semibold hover:bg-[#CC6A1F] disabled:opacity-50"
        >
          {feeSaving ? 'Saving...' : 'Save Fee Settings'}
        </button>
      </div>
    </div>
  )}
</div>
```

6. Make sure `getDoc`, `setDoc`, `doc` are imported from firebase/firestore and `db` is imported from the firebase config. Check what other functions on this page use for imports and match them.

---

## FINAL STEP: Build, Commit, Push, Deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix ALL TypeScript or build errors.

```bash
git add src/
git commit -m "WO-12: Wizard fixes - vehicle search, packages collapsed, customer lookup, free detection, fee CMS"
git push origin main
npx netlify-cli deploy --prod --message="WO-12: Booking wizard fixes + fee settings CMS"
```

Verify:
1. Open booking wizard -- packages section should be collapsed
2. Enter vehicle in Step 1, go to Step 3, enter a returning customer's phone -- vehicle should NOT change
3. Enter a NEW phone/email in Step 3 -- sidebar should show "FREE - first service" within a second
4. Type "2024 Toyota Camry" in the vehicle search field -- Y/M/M dropdowns should auto-populate
5. Go to /admin/services -- scroll down to see "Service Fees" card with toggles and amount input
6. Toggle "Waive for first-time customers" off, save, open wizard with new customer -- fee should NOT show as free

---

*End of WO-ADMIN-12*
