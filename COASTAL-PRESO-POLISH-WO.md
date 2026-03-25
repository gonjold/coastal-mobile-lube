# WO: Polish Pitch Presentation
## Coastal Mobile Lube & Tire — 2026-03-24

Read pitch-presentation.html IN FULL before making changes. This is a single-file edit.

---

## CHANGE 1 — Remove all em dashes

Find every instance of "—" (em dash) in the document and replace with " - " (space hyphen space) or rewrite the sentence to not need it.

---

## CHANGE 2 — Trim the 30-60-90 section

The 30-60-90 section has too many bullet points and reads like a wall of text. Cut each column to the 5-6 most important items MAX. Remove the rest. Use short punchy phrases, not full sentences. For example:

Days 1-30: Foundation
- Website live on custom domain
- Google Business Profile optimized
- Professional email setup
- First 5 blog posts + 10 service area pages
- Google Local Service Ads submitted
- Social accounts created

Days 31-60: Lead Generation  
- Google Ads + LSA campaigns live
- Facebook/Instagram video ads running
- Fleet outreach: 20 businesses contacted
- Marina partnerships started
- Target: 15+ Google reviews

Days 61-90: Scale
- Organic traffic building (200+ sessions/mo target)
- 30+ Google reviews
- First recurring fleet contracts
- Ad campaigns optimized with real data
- Evaluate: second van timing

---

## CHANGE 3 — Remove specific lead count promises

Do NOT promise specific lead counts like "25-50 leads/month" or "50-120 leads/month." We cannot guarantee those numbers. Instead say things like:
- "Consistent lead flow within the first month"
- "Scaling volume as campaigns optimize"
- "ROI tracked monthly with full transparency"

Remove any specific lead projections throughout the document.

---

## CHANGE 4 — Bigger, bolder typography

Update the CSS:
- Section headers (h2): bump to 36px, weight 800, add 48px top margin
- Subheaders/card titles (h3): bump to 22px, weight 700
- Body text in cards: 16px, line-height 1.7
- The cover section title: bump to 48px
- Table text: 15px minimum
- 30-60-90 column headers: 24px, weight 800, orange color
- Flow diagram boxes: 16px, weight 600
- Add more whitespace between sections (padding 60px top/bottom instead of 40px)

---

## CHANGE 5 — Better CSS and visual polish

Add these design improvements:

### 5a — Subtle section transitions
- Alternate section backgrounds between white and #FAFBFC (every other section)
- Add a thin 1px border-bottom #eee between sections

### 5b — Card hover effects
- Cards should have a subtle transform: translateY(-2px) and box-shadow increase on hover
- Transition: 0.2s ease

### 5c — "View Live Page" buttons
- Make them full-width within their card
- Add a subtle arrow icon (→) after the text using CSS ::after
- Hover: background darkens slightly

### 5d — Competitive comparison table
- Coastal Mobile column should have a light orange background (#FFF8F0)
- Header row should be navy with white text
- Checkmarks in green, X marks in red/gray
- Use ✓ and ✗ symbols instead of "Yes"/"No" text

### 5e — Flow diagram
- Make the boxes slightly larger with more padding
- Use navy background with white text for each step
- Orange arrows between steps
- On mobile, stack vertically instead of horizontal

### 5f — Cover section
- Add a subtle gradient or the logo larger and more prominent
- More vertical spacing, feels premium

---

## CHANGE 6 — Editable pricing: save to localStorage + cleaner UI

Replace the current dashed-underline editable approach:

### 6a — Remove the permanent dashed underline
Editable spans should look like normal text by default. On hover only, show a very subtle background highlight (#FFF8F0) and a small pencil icon (✏️) that appears to the right using CSS ::after on hover.

### 6b — Save edits to localStorage
Add JavaScript that:
1. Assigns a unique `data-price-id` to each editable span (e.g., "build-total", "monthly-retainer", "workspace-cost", "ad-low", "ad-high")
2. On page load, checks localStorage for saved values and restores them
3. On blur (when user clicks away after editing), saves the current value to localStorage
4. Add a small floating "Reset Prices" button in the bottom-left corner that clears localStorage and reloads the page

### 6c — Add a subtle "click to edit" tooltip
On first visit (check localStorage for a flag), show a small tooltip/banner at the top: "Tip: Click any highlighted price to edit it before your meeting." with a dismiss X. Set a flag in localStorage so it only shows once.

---

## CHANGE 7 — General copy cleanup

Go through ALL text and:
- Remove any language that sounds AI-generated or overly formal
- Make it conversational and direct (like Jon is talking to Jason)
- Remove filler words ("In order to", "It is important to note", "Additionally")
- Use "you" and "your" frequently (talking TO Jason)
- Remove any remaining em dashes (double check)
- Keep sentences short. Max 20 words per sentence where possible.
- The tone should be confident but not salesy. Factual. Straightforward.

---

## BUILD AND DEPLOY

```
cp pitch-presentation.html public/pitch-presentation.html
npm run build && netlify deploy --prod && git add -A && git commit -m "polish: pitch presentation QA pass - typography, trim, copy, editable pricing" && git push origin main
```
