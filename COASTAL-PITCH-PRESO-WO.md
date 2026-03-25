# WO: Build Pitch Presentation for Jason Meeting
## Coastal Mobile Lube & Tire — 2026-03-24

Create a single HTML file at `/home/jgsystems/coastal-mobile-lube/pitch-presentation.html` that Jon can open in Chrome to walk Jason through the full pitch. This is NOT a slideshow with animations — it's a scrollable branded document with sections, live site links, and editable pricing. Think "one-pager on steroids."

DO NOT read other project files. All content is provided below. Just build the HTML file.

---

## DESIGN SPECS

- Single HTML file, all CSS inline/embedded (no external deps except Google Fonts)
- Font: Plus Jakarta Sans from Google Fonts (weights 400, 600, 700, 800)
- Colors: Navy #0B2040, Orange #E07B2D, Blue #1A5FAC, White #FFFFFF, Surface #FAFBFC, Light gray #F5F5F5
- Max width: 900px centered, generous padding
- Print-friendly (no fixed elements, clean page breaks)
- All pricing numbers should be wrapped in `<span class="editable" contenteditable="true">` so Jon can click and change them before the meeting
- Editable spans get a subtle dashed underline (#E07B2D) so Jon knows they're clickable
- Navigation: fixed top bar with section links (semi-transparent navy bg)
- Each section has an `id` for anchor links
- Responsive — looks good on laptop screen (primary) and tablet

---

## SECTIONS (build in this exact order)

### SECTION 1: Cover
- "Coastal Mobile Lube & Tire" in large navy text
- "Digital Launch Strategy & Partnership Proposal" subtitle
- "Prepared for Jason | March 2026" in gray
- "Presented by Jon Gold — JG Systems" small at bottom
- Coastal logo from Cloudinary: `https://res.cloudinary.com/dgcdcqjrz/image/upload/w_200,q_auto:good,f_auto/v1774315498/Coastal_Lube_logo_v1_zbx9qs.png`

### SECTION 2: The Opportunity (why this works)
Header: "The Market Gap Is Real"

Three cards in a row:
1. **"Mobile Lube" is Wide Open** — "Google 'mobile lube Tampa.' You get brick-and-mortar Mobil 1 locations, not actual mobile services. Your business name IS the keyword. That is an SEO gift."
2. **No One Combines All Three** — "No competitor in Tampa bundles mobile oil changes + tire service + marine engine maintenance. You are the only one offering automotive, fleet, AND marine under one brand."
3. **Competitors Are Stuck in 2015** — "Solo operators with basic websites, no online booking, hidden pricing. A professional system with real-time booking and transparent pricing immediately outclasses every local competitor."

Below the cards, a quote-style callout:
"95,000+ registered boats in Tampa Bay. A booming small-business fleet segment underserved by heavy-diesel providers. And a consumer market that is rapidly adopting mobile services. The transition window is right now."

### SECTION 3: What We Built (live site walkthrough)
Header: "Your Website Is Live"
Subheader: "Every link below opens the real site. This is not a mockup."

A grid of 6 cards, each with:
- Page name
- 1-2 sentence description  
- Orange "View Live Page" button linking to the actual URL

Cards:
1. **Homepage** — "The shop that comes to you. Hero with instant quote widget, tabbed service overview, trust signals, mobile-first." → https://coastal-mobile-lube.netlify.app
2. **Services** — "7 automotive services with transparent pricing, detailed descriptions, FAQ section." → https://coastal-mobile-lube.netlify.app/services  
3. **Fleet** — "Dedicated landing page for commercial clients. Inline quote form, fleet process, volume pricing." → https://coastal-mobile-lube.netlify.app/fleet
4. **Marine** — "Three marine packages (Dock Ready, Captain's Choice, Season Opener). Inline quote form." → https://coastal-mobile-lube.netlify.app/marine
5. **Booking** — "Full service booking with date preference, time window, contact preference, email capture." → https://coastal-mobile-lube.netlify.app/book
6. **Admin Dashboard** — "Real-time booking management, calendar view, status workflow, communication log." → https://coastal-mobile-lube.netlify.app/admin

Below the grid, a feature list:
- All forms write to a real database (Firebase/Firestore)
- Every new booking triggers an instant email alert to you
- Admin dashboard with one-click confirm, Google Calendar sync, and communication logging
- Mobile-optimized with sticky call/book bar on every page
- Customers choose their preferred contact method (call, text, or email)
- Preferred dates feed directly into the admin calendar view

### SECTION 4: How Bookings Work (system walkthrough)
Header: "From Website to Wrench"

A horizontal flow diagram (use simple HTML/CSS boxes with arrows):

`Customer books online` → `Instant email alert to you` → `Review in admin dashboard` → `Confirm & add to Google Calendar` → `Customer gets confirmation email` → `Show up and do the work` → `Mark complete`

Below: "Every step is tracked. Every interaction is logged. Full audit trail from first click to completed service."

### SECTION 5: Growth Roadmap (30-60-90 day plan)
Header: "30-60-90 Day Launch Plan"

Three columns:

**Days 1-30: Foundation**
- Website live on coastalmobilelube.com (custom domain)
- Google Business Profile optimized (you already have a listing)
- Google Workspace email setup (jason@coastalmobilelube.com)
- Admin dashboard training
- Service area pages for 10+ Tampa neighborhoods  
- First 5 blog posts published for SEO
- Citation building: 15+ business directories
- Social media accounts created (Instagram, Facebook, TikTok)
- Review generation system set up (automated post-service requests)
- Google Local Service Ads application submitted

**Days 31-60: Lead Generation**
- Google Ads campaign launched ($500-1,000/mo starting budget)
- Google Local Service Ads live (Google Guaranteed badge)
- Facebook/Instagram ads with service videos
- 10 more service area pages published
- 5 more blog posts
- First customer reviews flowing in (target: 15+ by day 60)
- Fleet outreach: 20 local businesses contacted
- Marina partnerships: 3-5 marina introductions
- Nextdoor business presence established
- First monthly performance report

**Days 61-90: Scale**
- SEO generating organic traffic (target: 200+ sessions/month)
- 30+ Google reviews (target: 4.7+ stars)
- Ad campaigns optimized based on 60 days of data
- Customer database growing, repeat bookings increasing
- Fleet contracts: first 2-3 recurring clients
- Marine seasonal push (spring/summer prep)
- Evaluate: second van timing, hiring, territory expansion
- Full analytics dashboard with ROI tracking

### SECTION 6: Google Business Profile
Header: "Your Google Listing Is a Lead Machine"

Text: "You already have a Google Business Profile for Coastal Mobile Lube & Tire. This is one of the most valuable free tools available. Here is what we need to do with it:"

Checklist-style list:
- Set up as Service Area Business (hide street address since you go to them)
- Primary category: Mobile Mechanic
- Secondary categories: Oil Change Service, Tire Shop, Brake Shop
- Add all service areas (20+ Tampa neighborhoods)
- Upload 10+ real photos (van, equipment, work in progress)
- Write keyword-rich business description
- Post updates weekly (offers, tips, completed jobs)
- Enable messaging and booking links
- Goal: 50+ reviews in 6 months, 100+ by year end

"Google Business Profile is free and generates more leads than any paid channel for local service businesses. This is priority one."

### SECTION 7: Google Workspace Email
Header: "Professional Email"

"We recommend setting up Google Workspace for your business email. This gives you:"
- jason@coastalmobilelube.com (and any other addresses you need)
- Full Gmail interface you already know
- Google Calendar for scheduling (syncs with the admin dashboard)
- Google Drive for documents, invoices, contracts
- Professional appearance on every customer email

Cost: `<span class="editable" contenteditable="true">$7.20</span>`/month per user (Business Starter plan)

"We can set this up in the first week."

### SECTION 8: Advertising Strategy
Header: "Getting Customers from Day One"

**Google Local Service Ads (Highest Priority)**
- Pay per lead, not per click ($20-50 per lead)
- "Google Guaranteed" badge builds instant trust
- Appears at the very top of Google search results
- Estimated setup time: 3-5 business days after verification

**Google Search Ads**
- "Mobile oil change Tampa" — estimated $2.50-5.50 per click
- "Mobile marine mechanic Tampa" — estimated $2.50-5.50 per click  
- Auto repair has the lowest cost per lead of any Google Ads category ($27.94 average)
- Conversion rate: 12.96% (highest of all industries)

**Social Media Ads**
- Facebook/Instagram: $1-3 per click (much cheaper than Google)
- Video ads of service calls get the highest engagement
- Retargeting website visitors is the cheapest and most effective ad type

**Recommended Starting Budget:**
Low tier: `<span class="editable" contenteditable="true">$1,500</span>`/month → ~25-50 leads/month
Medium tier: `<span class="editable" contenteditable="true">$3,000</span>`/month → ~50-120 leads/month

"At your average ticket of $100-300, even the low budget generates strong ROI. We track every dollar and optimize monthly."

### SECTION 9: Competitive Advantage
Header: "Why You Win"

A comparison table:

| Feature | Solo Mobile Mechanics | National Platforms | Coastal Mobile |
|---|---|---|---|
| Online booking | Rarely | Yes | Yes |
| Transparent pricing | Rarely | Sometimes | Yes |
| Automotive + Tire | Sometimes | Limited | Yes |
| Marine service | No | No | Yes |
| Fleet programs | Rarely | No | Yes |
| Customer portal | No | Basic | Yes |
| Communication logging | No | No | Yes |
| Booking calendar | No | Yes | Yes |
| Local SEO | Weak | Strong | Building |
| Personal touch | High | Low | High |

### SECTION 10: The Franchise Vision (future)
Header: "Thinking Bigger"

"This does not have to stay local. The systems we are building are designed to scale."

**The Owner-Operator Model:**
"Target audience: master techs who are tired of being stuck in a shop. Skilled, experienced, entrepreneurial-minded people who want more freedom and control."

"They invest to become an owner-operator under the Coastal brand. In return they get:"
- Structured van buildout package
- Technology and infrastructure (booking, routing, customer management)  
- Customer service handled centrally
- Established brand and proven systems

"They run their own operation but are not starting from scratch alone. This scales the number of vans in the field without you funding every single one."

"This is a Phase 2 conversation. But the systems, the brand, and the technology we build now are designed with this in mind from day one."

### SECTION 11: Investment & Pricing
Header: "Partnership Investment"

**Website & System Build:**

| Item | Investment |
|---|---|
| Custom website (7 pages, mobile-first) | Included |
| Online booking system with Firestore database | Included |
| Admin dashboard with calendar & status workflow | Included |
| Email notification system (new booking alerts + customer confirmations) | Included |
| Communication logging & Google Calendar sync | Included |
| Custom domain setup (coastalmobilelube.com) | Included |
| **Total Build** | **`<span class="editable" contenteditable="true">$2,000</span>`** |

**Monthly Retainer:**

| Service | Monthly |
|---|---|
| Website hosting & maintenance | Included |
| SEO (service area pages, blog posts, optimization) | Included |
| Google Business Profile management | Included |
| Monthly analytics reporting | Included |
| Ad campaign management (budget separate) | Included |
| Social media strategy & content calendar | Included |
| System updates & new feature development | Included |
| Priority support | Included |
| **Monthly Retainer** | **`<span class="editable" contenteditable="true">$750</span>`/month** |

**Additional Costs (paid directly, not to JG Systems):**

| Item | Cost |
|---|---|
| Google Workspace email | ~$7/mo per user |
| Advertising budget (Google/Facebook/LSA) | $1,500-3,000/mo recommended |
| Custom domain renewal | ~$12/year |
| Twilio SMS (when activated) | ~$1.50/mo + $0.01/text |

**What is NOT included (and why):**
- Advertising spend (you pay Google/Facebook directly, we manage the campaigns)
- Housecall Pro or other third-party SaaS tools (evaluate at 60-day mark)
- Professional photography/videography (recommended at 30-day mark)
- Logo redesign (optional, ~$30-50 on Fiverr for vector version)

### SECTION 12: Next Steps
Header: "Ready to Launch"

"Here is what happens next:"

Numbered list:
1. You review this proposal and the live site
2. We finalize pricing for your service menu (we are using placeholder prices)
3. Custom domain pointed to the live site (coastalmobilelube.com)
4. Google Workspace email set up (jason@coastalmobilelube.com)
5. Google Business Profile optimized  
6. First batch of service area pages and blog posts published
7. Google Local Service Ads application submitted
8. You start taking real bookings

"The website is already built and working. Everything you saw today is live. We can have you taking real customers within a week."

Contact info at bottom:
- Jon Gold
- JG Systems
- jonrgold@gmail.com
- (949) 292-6686

---

## SAVE AND CONFIRM

Save the file to: `/home/jgsystems/coastal-mobile-lube/pitch-presentation.html`

Also copy it to the Netlify output so it deploys with the site:
```bash
cp pitch-presentation.html public/pitch-presentation.html
npm run build && netlify deploy --prod && git add -A && git commit -m "feat: pitch presentation for Jason meeting" && git push origin main
```

This way Jon can also access it at https://coastal-mobile-lube.netlify.app/pitch-presentation.html
