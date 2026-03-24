# WORK ORDER: About Page — Full Build

## CONTEXT
The /about page is currently a placeholder. It needs Jason's 30-year story, credibility signals, and a strong CTA. This is the page that answers "why should I trust you?" for the client presentation.

**Design system:** Navy #0B2040, Orange #E07B2D, Blue #1A5FAC, Surface #FAFBFC, Plus Jakarta Sans
**Match design patterns from:** Services and Fleet pages (white hero, left-aligned, eyebrow labels, alternating sections)

## REPLACE the entire content of `src/app/about/page.tsx`

### Page Metadata
- Title: "About Us | Coastal Mobile Lube & Tire | Tampa"
- Description: "Three decades of franchise dealership fixed operations experience, now mobile. Learn how Coastal Mobile Lube and Tire brings dealership-quality service to your driveway, parking lot, or marina."

### Page Structure

**Section 1 — Hero (white background, left-aligned)**
- Eyebrow: "OUR STORY" (blue, 13px uppercase)
- H1: "30 years of dealership expertise, on wheels" (navy, 42px desktop / 30px mobile, 800)
- Subtitle: "Coastal Mobile Lube and Tire was built on a simple idea: dealership-quality maintenance should not require a dealership visit. Our team brings three decades of franchise fixed operations leadership to your driveway, parking lot, or marina." (#444, 16px, max-width 600px)

Right side (desktop 2-col, mobile stacked): Use Cloudinary image `heroVanDrivewayAlt` with width 800. If a van mockup image would work better, use `vanMockup`.

**Section 2 — The Story (surface #FAFBFC background)**
- Eyebrow: "THE DIFFERENCE"
- Title: "Built by someone who ran the shop"

Two-column layout (text left, image right on desktop):

Left column text (write this as real paragraphs, NOT bullet points):

"Most mobile mechanics are solo operators learning as they go. Coastal Mobile is different. Our founder spent 30 years inside franchise dealership service departments, managing teams of 20 or more technicians, overseeing thousands of vehicles a month, and building the kind of quality control systems that manufacturers require.

That experience does not disappear when you leave the building. It goes with you. Every oil change, every tire installation, every marine service call follows the same standards, the same checklists, and the same accountability that a factory-certified service department demands.

The only thing that changed is the location. Instead of you driving to us, we drive to you."

Right side: Cloudinary image `vanInteriorEquipment` with width 800.

**Section 3 — Value Props (white background)**
- Eyebrow: "WHY COASTAL"
- Title: "What sets us apart"

Four value prop cards in a 2x2 grid (desktop) or single column (mobile):

Card 1: "Dealership Standards, Mobile Convenience"
"Every service follows factory maintenance protocols. Same parts, same procedures, same quality. Just performed at your location instead of ours."

Card 2: "Certified Technicians Only"
"Our team holds ASE certifications and factory training credentials. No apprentices, no shortcuts."

Card 3: "Transparent, Flat-Rate Pricing"
"You see the price before we start. No diagnostic fees, no surprise charges, no upselling."

Card 4: "12-Month Service Warranty"
"Every job is backed by a full 12-month warranty on parts and labor. If something is not right, we make it right."

Card styling: white bg, border 1px solid #e8e8e8, rounded-[12px], padding 28px. Title in navy 18px 700, description in #444 15px. Maybe a small icon or navy number above each title.

**Section 4 — Three Verticals (navy #0B2040 background)**
- Title: "Three verticals, one team" (white, 28px, 800)
- Subtitle: "Automotive, fleet, and marine. One provider for everything that rolls or floats." (white/70%)

Three cards on navy:
- "Automotive" — "Cars, trucks, and SUVs serviced at your home or office" → links to /services
- "Fleet" — "5 vehicles or 500. Scheduled programs built for your operation." → links to /fleet
- "Marine" — "Dockside and boat ramp service for outboard and inboard engines" → links to /marine

Cards: semi-transparent white border (rgba(255,255,255,0.15)), padding 24px, rounded 12px. Titles white 18px 700, descriptions white/70%. Each card has an orange "Learn more →" link.

**Section 5 — CTA (surface #FAFBFC background)**
- Title: "Ready to skip the shop?"
- Subtitle: "Book your first service online or call us. Most appointments available within the week."
- Two CTAs: "Book Online" (orange, /book) + "Call 813-722-LUBE" (outlined, tel:8137225823)

### Copy Rules
- No em dashes (use commas or periods instead)
- No emojis
- Conversational but authoritative tone
- Do not use the word "just" more than once
- No AI tells ("leverage," "utilize," "harness," "unlock")

## DO NOT
- Do not change any other pages or components
- Do not add npm packages

## WHEN DONE
```bash
npm run build && npx netlify deploy --prod --dir=.next && git add -A && git commit -m "feat: about page — full build with story, value props, verticals" && git push origin main
```
