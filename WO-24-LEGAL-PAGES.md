# WO-24: Privacy Policy + Terms of Service Pages

**Goal:** Ship `/privacy` and `/terms` public pages on the Coastal site, link them from the footer, and deploy. Needed to complete App Details checklists on Intuit (QuickBooks) and Clover developer portals to unlock production API access.

**Expected execution time:** 10-15 minutes.

**Coverage:** Content covers all current + near-future data flows: booking form, customer records, Firestore, Netlify, QuickBooks, Clover, Twilio, GA4, Cloudinary, NHTSA VIN lookup, QR code tracking, and FDACS recordkeeping requirements.

**Reminder:** Not a lawyer, not legal advice. Content is drafted in good faith for a Florida mobile motor vehicle repair business but Jason (owner) should have an attorney review when reasonable.

---

## Step 1: Read existing patterns

Before writing anything, read these in full so new pages match the site's visual style:

1. `src/app/how-it-works/page.tsx` (or whichever public page has the cleanest text-heavy layout)
2. `src/app/about/page.tsx` (if it exists)
3. `src/components/Footer.tsx` or wherever the site footer lives
4. `src/app/layout.tsx` (root layout, for metadata pattern)

Match the existing public page pattern for:
- Container widths and padding
- Heading typography (h1/h2/h3 classes)
- Body text color and size
- Any hero/intro treatment at top of page

Do NOT invent a new styling system for these pages. Reuse existing classes.

---

## Step 2: Create `/privacy`

Create new file `src/app/privacy/page.tsx`.

Page metadata:
- Title: `Privacy Policy | Coastal Mobile Lube & Tire`
- Description: `How Coastal Mobile Lube & Tire collects, uses, and protects your information.`

Page content (render as prose, use h1 for page title, h2 for numbered sections, h3 if needed for subsections):

```
# Privacy Policy

Effective: April 20, 2026

Coastal Mobile Lube & Tire LLC ("Coastal," "we," "us") operates coastalmobilelube.com and the booking, scheduling, and invoicing services offered through it. This policy explains what we collect, why, who we share it with, and your rights.

## 1. Who we are and how to reach us

Coastal Mobile Lube & Tire LLC
Apollo Beach, FL
Phone: 813-722-5823
Email: info@coastalmobilelube.com

## 2. Information we collect

**You give us:**
- Contact info: name, phone number, email, and service address
- Vehicle info: year, make, model, trim, VIN, fuel type, and odometer reading
- Service details: services requested, preferred date and time, and any special instructions
- Payment info: processed by our payment partners (Intuit QuickBooks, Clover). Full card numbers never touch Coastal servers.

**We collect automatically when you use the site:**
- Device and browser info (type, operating system, screen size)
- IP address and approximate location
- Pages visited, referral source, and time on site
- Anonymous scan data from Coastal QR codes (count, timestamp, approximate location)

**From our partners:**
- Vehicle specifications from NHTSA's public VIN database
- Existing customer records that Jason (owner) may import manually

## 3. How we use it

- Schedule and deliver the service you booked
- Contact you about your appointment (confirmation, reminders, arrival notifications, and status updates)
- Process payment and send receipts
- Track your service history for warranty and follow-up
- Improve the site and our operations
- Meet legal and regulatory requirements, including Florida Department of Agriculture and Consumer Services (FDACS) recordkeeping for motor vehicle repair

## 4. Who we share it with

We share data only with service providers that help us run Coastal. We do not sell your data.

- Google Firebase: site database, authentication, and hosting
- Netlify: web hosting
- Intuit QuickBooks: customer records, invoices, and payment processing
- Clover: customer records, orders, and card-present payment processing
- Twilio: name, phone number, and message content for appointment texts
- Google Analytics (GA4): anonymous usage statistics
- Cloudinary: image hosting
- NHTSA: VIN-only lookup for vehicle decoding

We may also share data when required by law, including subpoena, court order, or regulatory request.

## 5. Cookies and tracking

We use cookies to keep you signed in to admin tools, remember your preferences, and measure site performance. You can disable cookies in your browser, but some features (booking, account management) will not work without them.

## 6. Your rights

You can:
- Ask what data we have about you
- Ask us to correct inaccurate data
- Ask us to delete your account and associated data, subject to legal retention requirements (for example, FDACS requires 2-year invoice retention)
- Opt out of marketing messages at any time by texting STOP to any SMS or clicking unsubscribe in email

Email info@coastalmobilelube.com for any of these requests. We respond within 30 days.

California residents have additional rights under CCPA and CPRA, including the right to know categories of data collected, the right to delete, and the right to opt out of sale. Coastal does not sell personal data.

## 7. Data retention

- Appointment and service records: 2 years minimum (FDACS requirement)
- Invoice and payment records: 7 years (tax recordkeeping)
- QR code scan logs: 90 days
- Deleted customer accounts: purged within 30 days unless retention is legally required

## 8. Security

We use industry-standard encryption for data in transit (TLS/HTTPS) and at rest. Access to your data is limited to Coastal staff and the service providers listed above. No system is 100 percent secure. If a breach affects your data, we will notify you as required by Florida law.

## 9. Children

This site is not intended for anyone under 18. We do not knowingly collect data from minors. If you believe we have, contact us and we will delete it.

## 10. Changes

We may update this policy. The effective date at the top shows the latest version. Material changes will be posted on the site and, where we have your contact info, sent by email.

## 11. Questions

Email info@coastalmobilelube.com or call 813-722-5823.
```

---

## Step 3: Create `/terms`

Create new file `src/app/terms/page.tsx`.

Page metadata:
- Title: `Terms of Service | Coastal Mobile Lube & Tire`
- Description: `Terms governing use of coastalmobilelube.com and services provided by Coastal Mobile Lube & Tire.`

Page content:

```
# Terms of Service

Effective: April 20, 2026

These Terms govern your use of coastalmobilelube.com and any service booked through it. By using the site or booking a service, you agree to these Terms. If you do not agree, do not use the site.

## 1. About us

Coastal Mobile Lube & Tire LLC is a licensed Florida motor vehicle repair business operating in the Tampa Bay area. We provide mobile automotive, fleet, marine, and RV services at customer-specified locations. FDACS registration information available on request.

## 2. Booking a service

When you book through the site you confirm:
- You own the vehicle, or you have the owner's permission to authorize service
- The information you provide is accurate
- You will be available or have an authorized adult present at the appointment address

Bookings are not confirmed until Coastal sends you a confirmation email or text. We may decline or reschedule bookings based on scheduling, location, or vehicle condition.

## 3. Pricing and fees

Prices shown on the site are estimates for the service selected, based on the vehicle you entered. A mobile convenience fee applies to each visit. The current fee is shown in the booking summary before you submit.

Final pricing may change if additional work is needed once we inspect the vehicle. We will contact you for approval before performing any work beyond the original scope. Parts, tire, and specialty service pricing is quoted at time of service.

## 4. Cancellation and rescheduling

You can cancel or reschedule up to 24 hours before your appointment at no charge. Text or call 813-722-5823 or reply to your confirmation.

Cancellations inside 24 hours or no-shows may be subject to the convenience fee. We reserve the right to cancel or reschedule if weather, vehicle access, or other circumstances make the service unsafe.

## 5. Payment

Payment is due at time of service unless otherwise agreed in writing. We accept credit cards, debit cards, and ACH through our payment partners (Clover and Intuit QuickBooks Payments). Unpaid invoices may be subject to a late fee after 30 days and may be submitted to collections after 60 days.

## 6. Warranty

Coastal warranties its labor for 30 days or 1,000 miles, whichever comes first. Parts are covered by the manufacturer's warranty. This warranty does not cover:
- Damage or wear caused by normal use after service
- Damage from accidents, misuse, or modifications
- Pre-existing conditions noted on the service invoice
- Fleet accounts, which are governed by the fleet service agreement

To make a warranty claim, contact us within the warranty period at info@coastalmobilelube.com with your invoice number.

## 7. Your responsibilities

- Provide safe, legal access to the vehicle at the service address (driveway, street parking where permitted, or private lot with permission)
- Disclose known mechanical issues, prior repairs, or modifications
- Remove personal items of value from the service area
- Keep pets and children clear of the work area

We may decline to perform service if the site is unsafe or inaccessible.

## 8. Limitation of liability

To the maximum extent permitted by Florida law, Coastal's total liability for any claim related to a service is limited to the amount you paid for that service. Coastal is not liable for indirect, incidental, or consequential damages, including lost time, rental costs, towing beyond the standard trip, or missed work. Coastal is not responsible for pre-existing mechanical issues or wear items that fail outside the scope of work performed.

Nothing in this section limits liability for gross negligence, willful misconduct, or anything that cannot be limited under Florida law.

## 9. Governing law and disputes

These Terms are governed by the laws of the State of Florida. Any dispute will be resolved in the state or federal courts located in Hillsborough County, Florida. You and Coastal each waive any right to a jury trial for disputes arising from these Terms or from a service.

## 10. End user license agreement

To the extent the site provides software (including the booking wizard, customer portal, and admin tools), Coastal grants you a limited, non-exclusive, non-transferable, revocable license to use those tools for the purpose of booking or managing services. You may not reverse engineer, resell, or sublicense access to these tools.

## 11. Changes to terms

We may update these Terms. Material changes will be posted on the site with a new effective date and, where we have your contact info, sent by email. Continued use of the site after changes means you accept them.

## 12. Contact

Coastal Mobile Lube & Tire LLC
Apollo Beach, FL
813-722-5823
info@coastalmobilelube.com
```

---

## Step 4: Footer links

Locate the site footer component. Add two new links in whichever footer section currently holds utility or company links (likely "Company" or an unnamed meta row above the copyright line):

- "Privacy Policy" linking to `/privacy`
- "Terms of Service" linking to `/terms`

If the footer has a legal row with just a copyright, add the two links next to it, separated by a middle dot or pipe, matching the existing dividers used on the site.

Make this a surgical edit. Do not rewrite the footer component.

---

## Step 5: Build, commit, deploy

```
cd ~/coastal-mobile-lube
npm run build
```

If build passes:

```
git add -A
git commit -m "Add privacy policy and terms of service pages, link from footer"
git push
npx netlify-cli deploy --prod
```

Verify after deploy:
- `https://coastal-mobile-lube.netlify.app/privacy` loads and matches site style
- `https://coastal-mobile-lube.netlify.app/terms` loads and matches site style
- Footer links to both work from homepage
- No console errors on either page
- `git log --oneline -3` shows the new commit

---

## Style rules reminder

- No em dashes anywhere in content (use commas, parens, or periods)
- No emojis
- No "we are committed to..." AI-sounding corpo speak
- Human written tone, direct, mobile-first sentence length
- Do NOT touch globals.css or tailwind config
- Do NOT rewrite the footer component, surgical edit only
