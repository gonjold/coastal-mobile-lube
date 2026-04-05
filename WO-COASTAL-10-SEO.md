# WO-COASTAL-10: SEO Pass

## Summary
Add per-page SEO metadata: OG tags, canonical URLs, and JSON-LD structured data on service pages.

## Pre-read
- src/app/layout.tsx (check existing global meta)
- src/app/page.tsx (homepage -- check existing metadata export)
- src/app/services/page.tsx
- src/app/marine/page.tsx
- src/app/rv/page.tsx
- src/app/fleet/page.tsx
- src/app/about/page.tsx
- src/app/contact/page.tsx
- src/app/book/page.tsx
- src/app/faq/page.tsx (check existing JSON-LD as reference)
- Run: grep -r "metadata" src/app/*/page.tsx | head -20

## Changes

### 1. Per-Page Metadata Exports
Add or update the Next.js metadata export on every page. Each page needs:

**Homepage (/):**
- title: "Coastal Mobile Lube & Tire | Mobile Auto, Marine & RV Service | Tampa Bay"
- description: "Factory-trained mobile mechanics serving Tampa Bay. Oil changes, brakes, tires, marine engine service, and RV maintenance at your location. Call 813-722-LUBE."
- openGraph: title, description, url: "https://coastalmobilelube.com", type: "website"

**Services (/services):**
- title: "Automotive Services | Coastal Mobile Lube & Tire"
- description: "Mobile oil changes, brake service, tire mounting, HVAC, and full automotive maintenance. We come to your home or office in Tampa Bay."

**Marine (/marine):**
- title: "Marine Services | Coastal Mobile Lube & Tire"
- description: "Dockside boat engine service, marine brakes, diesel maintenance, and trailer tire service. We come to your marina or boat ramp."

**RV & Trailer (/rv):**
- title: "RV & Trailer Services | Coastal Mobile Lube & Tire"
- description: "Mobile RV oil changes, generator service, roof inspection, brake and tire service for all RV classes. We come to your RV park or storage facility."

**Fleet (/fleet):**
- title: "Fleet Services | Coastal Mobile Lube & Tire"
- description: "Scheduled fleet maintenance for businesses in Tampa Bay. Custom plans, on-site service, detailed reporting. Keep your fleet running."

**About (/about):**
- title: "About Us | Coastal Mobile Lube & Tire"
- description: "30 years of dealership experience, now mobile. Licensed, insured, ASE-certified technicians serving Tampa Bay."

**Contact (/contact):**
- title: "Contact Us | Coastal Mobile Lube & Tire"
- description: "Get in touch with Coastal Mobile Lube & Tire. Call 813-722-LUBE or request a quote online."

**Book (/book):**
- title: "Book Service | Coastal Mobile Lube & Tire"
- description: "Book mobile auto, marine, or RV service online. Choose your service, pick a date, and we come to you."

All pages should include:
- openGraph: { title, description, url: "https://coastalmobilelube.com/[path]", type: "website" }

### 2. Canonical URLs
Add canonical URL to each page's metadata:
```
alternates: { canonical: "https://coastalmobilelube.com/[path]" }
```

### 3. JSON-LD on Service Pages
Add LocalBusiness JSON-LD schema to the homepage (if not already present):
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Coastal Mobile Lube & Tire",
  "telephone": "+1-813-722-5823",
  "url": "https://coastalmobilelube.com",
  "areaServed": "Tampa Bay, FL",
  "serviceType": ["Oil Change", "Brake Service", "Tire Service", "Marine Engine Service", "RV Maintenance", "Fleet Maintenance"],
  "priceRange": "$$"
}
```

Add Service JSON-LD to /services, /marine, and /rv pages:
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "provider": { "@type": "LocalBusiness", "name": "Coastal Mobile Lube & Tire" },
  "serviceType": "[Automotive/Marine/RV] Maintenance",
  "areaServed": "Tampa Bay, FL"
}
```

### 4. Fix Dead Google Review Link
- Search for any href="#" that is supposed to be a Google review link
- Replace with a placeholder comment: {/* TODO: Replace with real Google Business Profile review URL from Jason */}
- Do NOT remove the link element -- just make it non-clickable or link to /contact temporarily

## Rules
- Do NOT rewrite entire files. Add metadata exports surgically.
- Do NOT touch globals.css or tailwind config.
- Use Next.js Metadata API (export const metadata = {...}) not manual <head> tags.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-10: SEO pass - OG tags, canonical URLs, JSON-LD"
```

Then run: git add -A && git commit -m "WO-10: SEO pass" && git push origin main
