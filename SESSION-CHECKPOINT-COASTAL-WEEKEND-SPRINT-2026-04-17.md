# SESSION CHECKPOINT: Coastal Weekend Sprint
# April 17, 2026 — Mid-afternoon, post WO-18 deploy, WO-19 in flight

## START HERE (next Claude reads this first)

This is a checkpoint mid-sprint. Jon is shipping a major Coastal Mobile Lube & Tire revision this weekend. WO-18 (vehicle selector) is deployed and verified. WO-19 (copy overhaul + new sections) is RUNNING in a tmux session on the Mac Mini. Three more WOs queued behind it (22, 20, 23, 21). All Work Orders, the locked copy doc, and the design reference live in `~/coastal-mobile-lube/` on the Mac Mini AND in the chat as downloadable files in `/mnt/user-data/outputs/coastal-weekend-sprint/`.

**Live site:** https://coastal-mobile-lube.netlify.app
**Admin:** https://coastal-mobile-lube.netlify.app/admin
**Repo:** github.com/gonjold/coastal-mobile-lube
**Mac Mini:** `ssh jgsystems@100.66.96.13` (Tailscale), tmux session `coastal`
**Firebase:** coastal-mobile-lube
**Deploy:** `npx netlify-cli deploy --prod` (no `--dir` flag) + `firebase deploy --only functions --project coastal-mobile-lube`

---

## CURRENT EXECUTION STATE

### WO-18 — VEHICLE SELECTOR ✅ DEPLOYED + VERIFIED

Replaced the WO-17 NHTSA typeahead with a Menards-style 4-dropdown pattern. Live at /book.

**What shipped:**
- YMM / VIN pill toggle at top of Step 1
- 4 searchable dropdowns: Year, Make, Model, **Fuel Type** (NOT trim — NHTSA trim data unreliable, fuel type covers oil selection)
- Dependency chain: Year clears Make/Model/Fuel; Make clears Model/Fuel; Model clears Fuel
- Skip option ("Don't have all the details? Skip and we'll confirm on the call →") with amber banner + Undo
- VIN mode: monospace 17-char input, Decode button, green confirmation card with Edit link
- "Been here before? Look up by phone number →" inline below form
- `vehicle.needsConfirmation = true` flag for skipped bookings
- Admin: amber badge on unconfirmed bookings, email/SMS includes "VEHICLE UNCONFIRMED" warning

**Files touched:**
- Created: `src/components/booking/VehicleSelector.tsx`
- Edited: `src/components/BookingWizardModal.tsx`, `src/app/admin/shared.ts`, `src/components/admin/ScheduleDetailPanel.tsx`, `functions/index.js`
- Deleted: `src/components/VehicleTypeahead.tsx` (old NHTSA typeahead)

**Verification done:** Jon tested booking flow, vehicle dropdowns work, admin email arrived at info@coastalmobilelube.com.

### WO-19 — COPY OVERHAUL + NEW SECTIONS 🔄 RUNNING IN TMUX

**Started:** ~3:00 PM ET April 17. Estimated 60-90 min execution.

**What it does (v2 scope, much bigger than original v1):**
- Surgical copy edits across homepage, /how-it-works, /services-overview, /services, /fleet, /marine, /rv, /about, /contact, /book
- Hero rewritten: `We bring the shop. You keep your day.` (option C from review)
- Step 3 title: `You never left your day.`
- NEW homepage section: **The Coastal Difference** (3 cards: vacuum extraction / tire delivery coming soon / multi-vertical)
- NEW /how-it-works sections: **Where we set up** (6 locations), **What's in the van** (6 equipment items), **What you don't have to do** (6 strikethrough items), **FAQ strip** (4 Q&As)
- NEW /services callout: **Coastal Tire Store coming soon** with "have tires today? we install" fallback
- About story rewritten to acknowledge the team (Jason has multiple vans, hires/trains team — NOT a solo guy mythology)
- Footer tagline: `Cars. Boats. RVs. Fleets. One call.`
- Mobile sticky bar: 3 buttons (Call / Quote / Book)
- "Driveway" no longer the default location — vary across home, office, marina, slip, RV park, storage lot, fleet yard, job site
- Vacuum extraction promoted from buried-in-About to homepage feature
- SEO meta titles + descriptions on every page
- JSON-LD schema: AutoRepair on root layout, FAQPage on /how-it-works
- Global removal of "Learn More", em dashes, &nbsp; in copy

**Reference doc on Mac Mini:** `~/coastal-mobile-lube/COASTAL-MASTER-COPY-V2-2026-04-17.md`
**WO file on Mac Mini:** `~/coastal-mobile-lube/WO-19-COPY-OVERHAUL.md`

### NEXT WOs QUEUED (all written, all on Mac Mini, ready to execute)

| # | WO | File on Mac Mini | Time | Prerequisites |
|---|---|---|---|---|
| 1 | WO-22: Booking Layout Polish | `~/coastal-mobile-lube/WO-22-BOOKING-LAYOUT-POLISH.md` | 10-15 min | WO-19 finishes. Hides "YOUR SELECTION" sidebar on Step 1 only, tightens spacing |
| 2 | WO-20: Illustrations + Sticky CTA | `~/coastal-mobile-lube/WO-20-ILLUSTRATIONS-AND-STICKY-CTA.md` | 30-45 min | WO-22 finishes. Removes cartoon vehicles, adds photo placeholder boxes, makes Quote CTA always visible on homepage |
| 3 | WO-23: Twilio SMS | `~/coastal-mobile-lube/WO-23-TWILIO-SMS.md` | 20-30 min | Twilio account + new 813 area code phone number. Jon doing this "in a little bit." See "PENDING JON" below. |
| 4 | WO-21: AI Environmental Images | `~/coastal-mobile-lube/WO-21-AI-IMAGES.md` | 15-25 min | WO-20 finishes. Auto-discovers OpenAI/OpenRouter/Flux key, generates 5 images, fills WO-20 placeholder divs |

### Files in chat that may not be on Mac Mini

These exist in `/mnt/user-data/outputs/coastal-weekend-sprint/`:
- `vehicle-selector-mockup.jsx` (design reference for WO-18, already executed — keep as reference)
- `COASTAL-MASTER-COPY-2026-04-17.md` (V1 — superseded by V2, do not use)
- `README-EXECUTE-THIS.md` (original execution guide, partially stale due to V2 changes)

---

## DECISIONS LOCKED THIS SESSION

| Decision | Lock |
|---|---|
| Hero headline | `We bring the shop. You keep your day.` |
| Brand line (marketing only) | `Your vehicle stays put. Your day stays yours.` |
| Step 3 title | `You never left your day.` |
| Trim dropdown | Dropped. Fuel Type dropdown instead. NHTSA doesn't return reliable trim data. |
| License plate lookup | Deferred to v2. Costs ~$0.01/lookup via CarsXE, not weekend priority. |
| Tire delivery service | Framed as "Coastal Tire Store coming soon — launching this summer." NOT promising it's live. |
| Tire fitment lookup tool (Menards-style) | Future feature. Mentioned as "lookup launching soon" in copy but not built this sprint. |
| About page framing | Jason as founder + standards-keeper of a growing team. NOT solo "one tech, one van" mythology. |
| Footer tagline | `Cars. Boats. RVs. Fleets. One call.` |
| Vacuum extraction | Promoted from FAQ to homepage feature card. The Coastal moat. |
| Multi-vertical (cars/boats/RVs/fleets one provider) | The third pillar of "The Coastal Difference" homepage section. Underused before, now front and center. |

---

## DEAD/BROKEN THINGS DISCOVERED

### AT&T email-to-SMS gateway (`txt.att.net`) is shut down

Confirmed via Gmail bounce: `DNS type 'mx' lookup of txt.att.net responded with code NOERROR had no relevant answers`. AT&T killed this gateway in 2023. Cannot be retried, cannot be fixed at the email layer. Twilio is the only path.

The admin email to info@coastalmobilelube.com works fine — that's regular SMTP. Only the carrier SMS gateway is broken.

### Step 1 of booking wizard scrolls on desktop

The "YOUR SELECTION" sidebar on the right ("Pick services to get started") wastes space on Step 1 (nothing to select yet). WO-22 fixes by hiding the sidebar on Step 1 only — Steps 2/3/4 keep the sidebar.

---

## PENDING JON

1. **Buy a Twilio number** with 813 area code preferably. Get Account SID, Auth Token, and Twilio phone number into Bitwarden. Then WO-23 can run. He's doing this "in a little bit."
2. **Test text alert** — once WO-23 deploys, submit a test booking and confirm SMS arrives at (949) 292-6686 within 60 seconds.
3. **Hosted SMS port for 813-722-LUBE** is a future task (4-6 weeks out, post-launch). Not part of this weekend.

---

## RESUME PROMPT FOR NEXT CHAT SESSION

Paste this into a fresh chat with project knowledge enabled:

```
Continuing Coastal Mobile Lube weekend sprint. Read SESSION-CHECKPOINT-COASTAL-WEEKEND-SPRINT-2026-04-17.md in project knowledge for full state.

Current status: WO-18 (vehicle selector) deployed clean. WO-19 (copy overhaul + new sections) was running in tmux when last session ended. Need to verify WO-19 completed successfully and continue with WO-22 (layout polish), WO-20 (illustrations), WO-23 (Twilio SMS), WO-21 (AI images) in that order.

First action: SSH into Mac Mini (jgsystems@100.66.96.13), tmux attach -t coastal, scroll up to see if WO-19 finished and the new sections deployed. Check live site at coastal-mobile-lube.netlify.app — homepage should have new Coastal Difference section (vacuum extraction / tire delivery coming soon / multi-vertical), how-it-works should have Where we set up + What's in the van + What you don't have to do sections.

Then:
- If WO-19 succeeded: queue WO-22 (booking layout polish) next.
- If WO-19 failed mid-execution: read tmux scrollback for the error, fix surgically, redeploy. Then continue.
- If something looks visually wrong on the new sections: that's a copy + design issue, may need a quick polish WO before moving on.
```

---

## VERIFICATION CHECKLIST (do this BEFORE writing new WOs in next session)

When the next session resumes, verify these on https://coastal-mobile-lube.netlify.app:

**Homepage**
- [ ] Hero says `We bring the shop. You keep your day.`
- [ ] How It Works Step 3 title is `You never left your day.`
- [ ] NEW section "The Coastal Difference" present between How It Works and Services, 3 cards
- [ ] Card 2 has visible "COMING SOON" badge for tire delivery
- [ ] Stats bar reads `30+ years dealership service / <1hr most jobs / 100% mobile, always / $0 surprise fees`
- [ ] Floating quote pill says "Need a price? Ask us." (still scroll-triggered, WO-20 makes always-visible)
- [ ] Footer tagline: `Cars. Boats. RVs. Fleets. One call.`

**/how-it-works**
- [ ] Hero: `No shop. No waiting. Your vehicle never moves.`
- [ ] Step 3 title: `You never left your day.`
- [ ] NEW: "Where we set up" section (6 location items)
- [ ] NEW: "What's in the van" section (6 equipment callouts including vacuum extraction)
- [ ] NEW: "What you don't have to do" section (6 strikethrough items)
- [ ] NEW: 4-Q&A FAQ strip at bottom

**/services-overview**
- [ ] 4 cards with new bodies (no driveway-default; varied locations)
- [ ] Eyebrows use middle dots (CARS · TRUCKS · SUVS)

**/services (Automotive)**
- [ ] Hero headline: `Oil, tires, brakes, and the rest of the list.`
- [ ] NEW: "Coastal Tire Store coming soon" callout section before bottom CTA

**/marine**
- [ ] Hero: `Your boat stays in the water.`

**/rv**
- [ ] Hero: `RV service wherever you're parked.`

**/about**
- [ ] Hero: `30 years of dealership service. Now coming to you.`
- [ ] Story is 4 paragraphs, third paragraph mentions "growing local team", "Jason hires and trains every technician personally"
- [ ] Value prop 1 is "A real local team" (NOT "One tech, every time")
- [ ] Value prop 4 is "Vacuum extraction. Clean every time."

**SEO**
- [ ] View page source on homepage, find `<meta name="description"` matching V2 doc
- [ ] View page source, find `<script type="application/ld+json">` block with AutoRepair schema
- [ ] /how-it-works has FAQPage schema

---

## INFRASTRUCTURE REFERENCE

| System | URL / Access |
|--------|-------------|
| Mac Mini | `ssh jgsystems@100.66.96.13` (Tailscale) |
| Coastal production | coastal-mobile-lube.netlify.app |
| Coastal admin | coastal-mobile-lube.netlify.app/admin |
| Coastal repo | github.com/gonjold/coastal-mobile-lube |
| Firebase Console | console.firebase.google.com (coastal-mobile-lube) |
| Netlify dashboard | app.netlify.com/projects/coastal-mobile-lube |
| Cloudinary | cloud `dgcdcqjrz` |
| QB Sandbox | sandbox.qbo.intuit.com (connected, Company ID 9341456879533680) |
| tmux session | `coastal` |

## KEY PHONE NUMBERS

- Jon: (949) 292-6686 — AT&T — gateway DEAD, Twilio target
- Jason: (443) 675-8401 — AT&T — gateway DEAD, Twilio target
- Coastal business voice: 813-722-LUBE (current carrier, future Twilio Hosted SMS port)

## TWILIO STATUS

- Account: NOT created yet (Jon doing it next)
- Phone number: NOT purchased yet (target 813 area code)
- WO-23 cannot run until those exist + creds are in Bitwarden as `Coastal Twilio` item

---

## OPEN ISSUES NOT BLOCKING THIS SPRINT

(From earlier sessions, parked for after the launch sprint:)
1. DNC toggles may not persist (admin)
2. Global search only works on Dashboard (admin)
3. Sparklines static placeholders (admin)
4. Invoice three-dot menu possibly broken (admin)
5. Subtotals slightly off in budget exports (SS, not Coastal)

---

## SESSION STATS

- **Duration:** ~3 hours
- **WOs shipped:** 1 (WO-18)
- **WOs queued:** 4 (WO-19 running, WO-20, WO-21, WO-22, WO-23)
- **Major copy revisions:** 2 rounds (V1 → V2 after Jon flagged driveway default, drive-away-happy framing, missing vacuum extraction, missing team acknowledgment, missing tire delivery)
- **Discoveries:** AT&T txt.att.net gateway dead, Step 1 modal layout needs sidebar hidden

---

*Generated: April 17, 2026, ~3:30 PM ET*
*Mid-sprint checkpoint, WO-19 in flight*
*Next session: verify WO-19, then WO-22 → WO-20 → WO-23 → WO-21*
