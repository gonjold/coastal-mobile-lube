# WO-COASTAL-HERO-REBUILD.md

Read the following files in full before making any changes:
- src/app/page.tsx
- src/app/globals.css
- src/components/FloatingQuoteBar.tsx
- src/components/MobileQuickQuote.tsx (if exists)
- src/components/BookingWizardModal.tsx (just to understand how the modal open/close state works)
- src/app/layout.tsx

This is a large WO with 6 tasks. Do them in order. Do not rewrite entire files. Surgical edits only. Read every target file in full before touching it.

## TASK 1: HOMEPAGE HERO REBUILD

Replace ONLY the hero section in src/app/page.tsx. Do not touch anything below the hero.

BACKGROUND: linear-gradient(135deg, #0F2847 0%, #0B2040 100%). Add the oval logo from Cloudinary as a centered watermark at ~6% opacity behind everything:
  background-image: url('https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774315498/Coastal_Lube_logo_v1_zbx9qs.png');
  background-repeat: no-repeat; background-position: center center; background-size: 280px (mobile), 400px (desktop);
  Mix with the gradient using a wrapper div with the gradient, and an inner div with the logo bg at opacity 0.06.

### DESKTOP LAYOUT (>= 1024px):

Two columns: left = copy (flex-1, text-center), right = frosted glass quote form (w-[370px]).

The hero section should use a parallax/sticky scroll effect where the navy hero background stays fixed and content below scrolls over it. Use `bg-fixed` or `min-h-[calc(100vh-56px)]` with the How It Works section overlapping on scroll. The goal: the form and hero text stay pinned while the user scrolls, and the How It Works section slides up over the hero.

LEFT COLUMN (centered text):
- Eyebrow line 1: "MOBILE SERVICE" in white, text-[13px], font-extrabold, uppercase, tracking-[4px]
- Eyebrow line 2: "Oil, Brakes, Tires & More" in #D9A441, text-[12px], font-semibold, uppercase, tracking-[2.5px], opacity-90
- Headline: text from Firestore (default "We bring the shop.") in white, text-[52px], font-extrabold, leading-[1.04], tracking-[-1px]
- Subheadline: text from Firestore (default "Oil changes, tires, and brakes wherever you are. A master tech with 30 years of experience. Apollo Beach and the South Shore.") in white/68, text-[18px], leading-[1.55], max-w-[460px] mx-auto
- CTA row (centered, flex, gap-3):
  - "Book Service" button: bg-[#E07B2D] text-white px-7 py-3.5 rounded-[8px] font-semibold shadow-[0_2px_12px_rgba(224,123,45,0.35)]. Opens BookingWizardModal.
  - "Call 813-722-LUBE" button: FROSTED GLASS style: bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.18] text-white px-7 py-3.5 rounded-[8px] font-semibold. Phone icon left of text. Links to tel:8137225823.
- Trust capsule (centered, mt-7): A single rounded-full pill with bg-white/[0.05] border border-white/[0.08] py-2 px-1.5. Three items separated by 1px white/10 vertical dividers:
  - "30+" in #10B4B9 font-extrabold text-[13px] + "yrs exp" in white/55 text-[12.5px] font-semibold
  - Shield-check SVG icon 14px in #10B4B9 + "Licensed" in white/55
  - Clock SVG icon 14px in #D9A441 + "Same-day" in white/55
  - Each item: flex items-center gap-[5px] px-[14px] py-1

RIGHT COLUMN (frosted glass form):
- Container: w-[370px], bg-white/[0.06], backdrop-blur-[24px] saturate-[1.6], rounded-[16px], border border-white/[0.1], p-[26px_22px], shadow-[0_8px_40px_rgba(0,0,0,0.3)], inset shadow top 1px white/6
- Header (centered): "Connect with us" h3 white text-[18px] font-bold, then "Tell us what you need. We get back to you fast." in white/45 text-[13px]
- Fields (flex-col gap-[10px]): First name + Last name (side by side in flex row gap-2), Phone, Email, City, Service dropdown (Oil change, Tires, Brakes, Marine service, RV service, Fleet service, Other)
- All inputs: bg-white/[0.08] border border-white/[0.15] rounded-[8px] text-white text-[14px] p-[10px_12px] placeholder-white/40
- Submit: "Send Quote Request" bg-[#E07B2D] text-white rounded-[8px] py-[13px] font-semibold full-width mt-1
- On submit: write to Firestore collection "quickQuotes" with all fields + timestamp + source: "hero-quote-form"

### MOBILE LAYOUT (< 1024px):

Single column, centered text, px-4 pt-6 pb-7. No sticky scroll effect on mobile.

- Same eyebrow as desktop but: line 1 text-[11px] tracking-[4px], line 2 text-[11px] tracking-[2px]
- Headline from Firestore: text-[34px], leading-[1.06], tracking-[-0.8px]
- Subheadline from Firestore: text-[15px], leading-[1.55], max-w-[320px] mx-auto
- CTAs stacked vertically, max-w-[300px] mx-auto, gap-[10px]:
  - "Book Service": same orange button, full-width, min-h-[48px]
  - "Call 813-722-LUBE": same frosted glass style, full-width, min-h-[48px], phone icon left
- Trust pills: Three equal-width cards in flex row gap-2, mt-5. Each: flex-col items-center justify-center gap-[5px] p-[12px_6px_10px] rounded-[12px] bg-white/[0.04] border border-white/[0.1].
  - Card 1: "30+" in #10B4B9 text-[16px] font-extrabold + "Years Experience" in white/60 text-[10.5px]
  - Card 2: Shield-check SVG 18px #10B4B9 + "Licensed & Insured"
  - Card 3: Clock SVG 18px #D9A441 + "Same-Day Available"
- NO quote form on mobile hero.

## TASK 2: HOW IT WORKS SECTION

Update the How It Works section on the homepage. Same file (src/app/page.tsx).

Section: bg-[#F7F8FA] py-8 md:py-14, text-center. If using the sticky hero on desktop, this section needs position: relative and z-10 so it scrolls over the hero.

- Eyebrow: "HOW IT WORKS" in #1A5FAC text-[11px] md:text-[12px] font-bold uppercase tracking-[2.5px] centered
- Headline: "Three steps. Done." in #0B2040 text-[22px] md:text-[30px] font-extrabold centered

### DESKTOP CARDS (3-col flex gap-5):

Each card: bg-white rounded-[16px] border border-[#E8E8E8] p-[32px_22px_28px] text-center.
- Step number: "1" / "2" / "3" in #10B4B9 text-[20px] font-extrabold, display block, mb-3
- Icon: 52x52px rounded-[14px] bg-gradient-to-br from-[#0F2847] to-[#0B2040], centered (mx-auto), mb-4. Contains a teal SVG icon (calendar-check, van, check-square) at 22px stroke width 1.8.
- Title: #0B2040 text-[17px] font-bold mb-2
- Description: #555555 text-[14px] leading-[1.55]

### MOBILE CARDS (stacked, gap-[10px]):

Each card: bg-white rounded-[14px] border border-[#E8E8E8] p-[16px]. Layout: flex items-start gap-[14px], text-align LEFT.
- Left column: flex-col items-center gap-[4px], flex-shrink-0, w-[48px].
  - Step number: "1" / "2" / "3" in #10B4B9 text-[15px] font-extrabold
  - Icon below number: 44x44px rounded-[12px] navy gradient, teal SVG icon inside at 22px
- Right column: flex-1
  - Title: #0B2040 text-[15px] font-bold mb-[3px]
  - Description: #555555 text-[13.5px] leading-[1.5]

Steps content:
1. Icon: calendar-check. "You book a time" / "Pick your service and a time that works. Takes about a minute."
2. Icon: van/truck. "We roll up ready" / "A fully equipped van arrives at your location. Your driveway, your office, the marina, the RV park."
3. Icon: check-square. "You never left your day" / "We handle everything on-site. No waiting rooms, no second trips, no disruptions."

## TASK 3: TEAL QUOTE FAB

Create src/components/QuoteFAB.tsx.

A floating action button that appears on ALL pages (rendered in layout.tsx).

Visibility rules:
- MOBILE (< 1024px): Always visible. No scroll detection needed. Position: fixed, bottom: 72px (above sticky bar), right: 16px, z-40.
- DESKTOP (>= 1024px): Only visible after scrolling past the hero. Use an IntersectionObserver watching an element with id="hero-section" (add this id to the hero wrapper in Task 1). When the hero is NOT intersecting (scrolled past), show the FAB. When hero IS intersecting (visible), hide it. Position: fixed, bottom: 24px, right: 24px, z-40. On non-homepage pages that have no #hero-section element, always show the FAB.

Style: h-[48px] rounded-full. Background: linear-gradient(135deg, #0D8A8F, #10B4B9). Box-shadow: 0 4px 16px rgba(13,138,143,0.5), 0 0 0 3px rgba(16,180,185,0.15). Flex row, items-center, gap-2, px-[18px] pl-[14px].
- Chat-bubble SVG icon 18px white stroke
- "Get a Quote" text white text-[14px] font-semibold whitespace-nowrap

Pulse animation (CSS keyframes, 3s infinite): box-shadow glow expands and contracts slightly. No scale change.

Fade in/out: opacity 0 to 1, translateY(20px to 0), transition 0.3s.

On click: opens QuoteModal (from Task 4). Pass modal open state via context or props.

Hide the FAB when QuoteModal OR BookingWizardModal is open.

Render this component in src/app/layout.tsx inside the body, alongside the existing sticky bar.

## TASK 4: QUOTE MODAL

Create src/components/QuoteModal.tsx.

A centered modal triggered by the FAB. Not a bottom sheet.

- Backdrop: fixed inset-0 z-50 bg-[#0B2040]/65 backdrop-blur-[4px]. Click backdrop to close.
- Modal: fixed z-[51] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2. Width: calc(100% - 32px) on mobile, 440px on desktop. Max-height: calc(100vh - 80px) on mobile with overflow-y-auto. bg-white rounded-[20px] shadow-[0_24px_80px_rgba(0,0,0,0.3)]. Padding: 28px 20px 32px (mobile), 36px 32px (desktop).
- Entrance animation: fade in 0.2s + modal slides from translate(-50%, -48%) to translate(-50%, -50%) over 0.25s.
- Close button: absolute top-4 right-4, bg-[#F7F8FA] rounded-full w-8 h-8 flex center, X icon 16px #7A7A7A.
- Header (centered, no icon): "Connect with us" in #0B2040 text-[22px] font-extrabold. Then "Tell us what you need. We get back to you fast." in #7A7A7A text-[14px] leading-[1.4] mb-[22px].
- Form fields (flex-col gap-3, text-align left for inputs):
  - First name + Last name (flex row gap-[10px])
  - Phone
  - Email
  - City
  - Service dropdown (same options as hero form)
  - "Reach me by:" label + radio buttons Call/Text/Email (default Call), centered row, orange accent
- All inputs: bg-[#F7F8FA] border border-[#E8E8E8] rounded-[10px] text-[15px] p-[12px_14px]
- Submit: "Send Quote Request" bg-[#E07B2D] text-white rounded-[10px] py-[14px] font-semibold full-width mt-1 shadow-[0_2px_12px_rgba(224,123,45,0.3)]
- On submit: write to Firestore "quickQuotes" with all fields + timestamp + source: "quote-modal"

## TASK 5: KILL OLD QUICK QUOTE

Remove the MobileQuickQuote component (the sideways "Quick Quote" tab on the right edge of the screen). Remove its import and render from layout.tsx or wherever it lives.

If FloatingQuoteBar exists as a separate desktop widget, add className="hidden" to its outermost wrapper. We will remove it fully in a later WO. The FAB replaces its function.

## TASK 6: HERO COPY EDITOR (Admin Page)

Create src/app/admin/hero-editor/page.tsx.

A simple admin page at /admin/hero-editor where the site owner can edit hero text live without redeploying.

Firestore document: collection "siteConfig", document "heroCopy".

On page load:
1. Read the Firestore doc siteConfig/heroCopy
2. If it doesn't exist, seed it with these defaults and then show them in the form:
   - eyebrowLine1: "Mobile Service"
   - eyebrowLine2: "Oil, Brakes, Tires & More"
   - headline: "We bring the shop."
   - subheadline: "Oil changes, tires, and brakes wherever you are. A master tech with 30 years of experience. Apollo Beach and the South Shore."

Page layout:
- Page title: "Hero Copy Editor" in the admin panel style
- 4 form fields:
  - Eyebrow Line 1 (text input)
  - Eyebrow Line 2 (text input)
  - Headline (text input)
  - Subheadline (textarea, 3 rows)
- Below ALL the fields: a live preview panel showing the text rendered on a navy (#0B2040) background with the actual hero font sizes and colors so the user can see exactly how it will look
- "Save Changes" button that writes to Firestore
- Show a success message after save (green text or a toast)

The homepage hero (Task 1) must read from this Firestore doc. Use useEffect + getDoc from firebase/firestore to fetch siteConfig/heroCopy on mount. Use the fetched values for eyebrow, headline, subheadline. If the doc doesn't exist or fetch fails, fall back to the hardcoded defaults above.

Add "Hero Editor" as a nav link in the admin sidebar (find the existing sidebar component and add it).

Do not add authentication. The admin is already access-controlled.

## BUILD AND DEPLOY

After all 6 tasks:

```bash
npm run build && git add -A && git commit -m "feat: hero rebuild with split layout, frosted form, FAB, quote modal, copy editor" && git push origin main && npx netlify-cli deploy --prod
```
