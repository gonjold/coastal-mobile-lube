# COASTAL-ABOUT-PAGE-UPDATE-WO.md
# Work Order: About Page Update with Real "Our Story" Content
# Priority: Phase 2 / Content
# Date: 2026-04-03

---

## OBJECTIVE

Replace the placeholder "About" page copy with Jason's real "Our Story" content. Update location references to Apollo Beach and South Shore area. Add RV and trailer to the services mentioned.

---

## INSTRUCTIONS

### BEFORE YOU START

Read this file IN FULL before making any changes:
- `src/app/about/page.tsx`

Do NOT rewrite the entire file. Make surgical edits only.
Do NOT touch globals.css or tailwind.config.ts.

---

## PART A: Replace the Story Section Copy

Find the main story/narrative section on the about page. Replace the existing placeholder copy with Jason's real content. Adapt it slightly for web formatting (break into shorter paragraphs, add section emphasis) but keep Jason's voice and words intact. Do NOT add em dashes. Do NOT add emojis.

### New copy for the main story section:

**Section heading:** "Our Story"

**Paragraph 1:**
At Coastal Mobile Lube and Tire, we built this business to serve our local community with honesty, convenience, and dependable service.

**Paragraph 2:**
Living in Apollo Beach and working in Tampa, we recognized the need for a better way to help customers maintain their vehicles and equipment without the hassle of sitting in traffic or waiting at a repair shop. Life is busy, and people deserve service that is professional, reliable, and built around their schedule. That is why Coastal Mobile Lube and Tire was created.

**Paragraph 3:**
With a background in automotive dealerships and fixed operations, our company is built on 30 years of experience in luxury customer service, operational excellence, and exceptional white-glove care. That experience shaped our commitment to doing things the right way, communicating clearly, and delivering service our customers can trust.

**Paragraph 4:**
Coastal Mobile Lube and Tire is built on faith-based values that matter: integrity, honesty, hard work, kindness, and service to others. These principles are at the heart of how we operate, how we treat our customers, and how we serve our community.

**Paragraph 5:**
We are proud to serve the people who live, work, and enjoy life throughout the Apollo Beach and South Shore area. Whether it is your personal vehicle, boat, work truck, RV, trailer, fleet vehicle, or recreational equipment, our goal is to bring high-quality mobile lube, tire, and maintenance services directly to you with professionalism and a personal touch.

**Paragraph 6:**
We are more than a mobile service company. We are a local business built on experience, strong values, and a commitment to serving our community the right way.

---

## PART B: Update Value Props / Highlights

If the about page has value proposition cards or highlights, update them to reflect the real content:

1. **30 Years of Experience** — "Built on three decades in automotive dealerships and fixed operations, with a focus on luxury customer service and operational excellence."

2. **Apollo Beach Based** — "Locally owned and operated, proudly serving Apollo Beach, Sun City Center, Riverview, and the greater South Shore area."

3. **Full-Service Mobile** — "Personal vehicles, boats, work trucks, RVs, trailers, fleet vehicles, and recreational equipment. We bring the shop to you."

4. **Built on Values** — "Integrity, honesty, hard work, kindness, and service to others. These principles guide every interaction."

---

## PART C: Update Location References

Search the entire about page for any references to "Tampa" as a base location. Jason is based in Apollo Beach, serves the South Shore area and greater Tampa region. Update:

- "Based in Tampa" → "Based in Apollo Beach"
- "Tampa area" → "Apollo Beach and the South Shore area" (or "greater Tampa area" when referring to the full service radius)
- Keep "Tampa" in the context of the broader market, just not as the home base

---

## DO NOT CHANGE

- Page layout and structure
- Van wrap image (if already updated by WO 2)
- Oval badge logo placement (if already added by WO 2)
- Footer
- Navigation
- Any other pages

---

## VALIDATION

- [ ] "Our Story" section has Jason's real content (not placeholder)
- [ ] Apollo Beach is mentioned as the home base
- [ ] RV and trailer are listed among services
- [ ] No em dashes anywhere on the page
- [ ] No emojis anywhere on the page
- [ ] Value prop cards updated with real content
- [ ] Page reads naturally and professionally
- [ ] No build errors

---

## FINISH

```bash
npm run build && git add -A && git commit -m "WO: About page updated with real Our Story content from Jason" && git push origin main
```

---

*WO written by Jon Gold / Gold Co LLC — 2026-04-03*
