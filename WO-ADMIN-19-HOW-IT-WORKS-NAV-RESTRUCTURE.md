# WO-ADMIN-19: How It Works Page + Services Overview + Nav Restructure

## Context

Three deliverables that ship together:

1. **New page:** `/how-it-works` — expanded 3-step explainer + FAQ
2. **New page:** `/services-overview` — landing hub for the 4 service divisions
3. **Nav restructure:** replace 4 division links with `How It Works | Services ▼ | About | Contact`, with Services dropdown containing Automotive → Marine → RV → Fleet

**Design system reminders:**
- Navy: `#0B2040`
- Orange: `#E07B2D`
- Font: Plus Jakarta Sans
- No em dashes anywhere in copy
- No emojis in final UI
- No "family-owned" language
- Active voice

**Execution rules:**
- Do NOT rewrite any existing file wholesale. Surgical edits only.
- Do NOT touch `globals.css` or `tailwind.config.js` unless this WO explicitly says to.
- Read every file mentioned IN FULL before editing it.
- Build, commit, push, deploy at the end.

---

## PART 1: Create SVG Icon Components for How It Works Steps

**File to create:** `src/components/icons/HowItWorksIcons.tsx`

Create three custom SVG icon components. Each is 64x64, uses `currentColor` for strokes, 2px stroke width, rounded linecaps and linejoins. Design language: clean line icons, not filled shapes. Think "Stripe docs" visual style.

```tsx
import React from 'react';

type IconProps = {
  className?: string;
};

// Icon 1: Book Online — calendar with a checkmark
export const BookOnlineIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="10" y="14" width="44" height="40" rx="4" />
    <path d="M10 24 H54" />
    <path d="M20 10 V18" />
    <path d="M44 10 V18" />
    <path d="M22 38 L28 44 L42 30" />
  </svg>
);

// Icon 2: We Come to You — service van with location pin above
export const VanArrivalIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Location pin above van */}
    <path d="M32 6 C28 6 25 9 25 13 C25 18 32 24 32 24 C32 24 39 18 39 13 C39 9 36 6 32 6 Z" />
    <circle cx="32" cy="13" r="2" />
    {/* Van body */}
    <path d="M6 44 V34 C6 32 7 31 9 31 H38 L46 37 H55 C56 37 57 38 57 39 V44" />
    {/* Van wheels */}
    <circle cx="18" cy="46" r="4" />
    <circle cx="48" cy="46" r="4" />
    {/* Connect van wheels with ground line */}
    <path d="M6 46 H14" />
    <path d="M22 46 H44" />
    <path d="M52 46 H57" />
    {/* Van window */}
    <path d="M38 31 V37 H46" />
  </svg>
);

// Icon 3: Drive Away Happy — steering wheel with checkmark
export const DriveAwayIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Outer circle (steering wheel) */}
    <circle cx="32" cy="32" r="22" />
    {/* Inner hub */}
    <circle cx="32" cy="32" r="6" />
    {/* Spokes */}
    <path d="M32 10 V26" />
    <path d="M13 44 L27 35" />
    <path d="M51 44 L37 35" />
    {/* Checkmark on hub */}
    <path d="M29 32 L31 34 L35 30" />
  </svg>
);
```

---

## PART 2: Create the Nav Dropdown Component

**File to create:** `src/components/NavServicesDropdown.tsx`

Desktop dropdown that opens on hover, closes on mouse-leave. 200ms close delay so users can move diagonally to menu items without accidentally closing. Keyboard accessible.

```tsx
'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Service = {
  label: string;
  href: string;
};

const SERVICES: Service[] = [
  { label: 'Automotive', href: '/services' },
  { label: 'Marine', href: '/marine' },
  { label: 'RV', href: '/rv' },
  { label: 'Fleet', href: '/fleet' },
];

export const NavServicesDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const isActive =
    pathname === '/services-overview' ||
    SERVICES.some((s) => pathname === s.href);

  const handleOpen = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      <Link
        href="/services-overview"
        className={`flex items-center gap-1 text-white hover:text-orange-400 transition-colors ${
          isActive ? 'text-orange-400' : ''
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Services
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M3 5 L6 8 L9 5" />
        </svg>
      </Link>

      {isOpen && (
        <div
          className="absolute top-full left-0 pt-3 z-50"
          role="menu"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 py-2 min-w-[180px]">
            {SERVICES.map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                  pathname === service.href
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                {service.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## PART 3: Update the Public Nav Component

**File to edit:** Find the public nav component. Likely at `src/components/Nav.tsx`, `src/components/PublicNav.tsx`, `src/components/Header.tsx`, or `src/components/layout/Navbar.tsx`. Read it fully before editing.

### Desktop nav changes

Locate the horizontal nav link list. It currently contains links to Automotive, RV, Marine, Fleet, About, Contact. Replace that entire `<nav>` / `<ul>` / link container's contents with this exact structure:

```tsx
<Link
  href="/how-it-works"
  className={`text-white hover:text-orange-400 transition-colors ${
    pathname === '/how-it-works' ? 'text-orange-400' : ''
  }`}
>
  How It Works
</Link>

<NavServicesDropdown />

<Link
  href="/about"
  className={`text-white hover:text-orange-400 transition-colors ${
    pathname === '/about' ? 'text-orange-400' : ''
  }`}
>
  About
</Link>

<Link
  href="/contact"
  className={`text-white hover:text-orange-400 transition-colors ${
    pathname === '/contact' ? 'text-orange-400' : ''
  }`}
>
  Contact
</Link>
```

Import at the top of the file:

```tsx
import { NavServicesDropdown } from './NavServicesDropdown';
import { usePathname } from 'next/navigation';
```

If `usePathname` is already imported, skip the duplicate.

Keep the phone number link and "Book Service" CTA button on the right side UNCHANGED.

### Mobile nav changes (hamburger menu)

Find the mobile menu overlay/drawer logic. It lists the same nav items vertically. Replace the mobile nav item list with:

```tsx
<Link
  href="/how-it-works"
  className="block py-3 text-white text-lg font-medium"
  onClick={() => setMobileOpen(false)}
>
  How It Works
</Link>

<button
  type="button"
  className="w-full flex items-center justify-between py-3 text-white text-lg font-medium"
  onClick={() => setMobileServicesOpen((v) => !v)}
  aria-expanded={mobileServicesOpen}
>
  Services
  <svg
    width="14"
    height="14"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform ${mobileServicesOpen ? 'rotate-180' : ''}`}
  >
    <path d="M3 5 L6 8 L9 5" />
  </svg>
</button>

{mobileServicesOpen && (
  <div className="pl-4 pb-2 space-y-1 border-l-2 border-orange-400">
    <Link
      href="/services-overview"
      className="block py-2 text-white/80 text-base"
      onClick={() => setMobileOpen(false)}
    >
      All Services
    </Link>
    <Link
      href="/services"
      className="block py-2 text-white/80 text-base"
      onClick={() => setMobileOpen(false)}
    >
      Automotive
    </Link>
    <Link
      href="/marine"
      className="block py-2 text-white/80 text-base"
      onClick={() => setMobileOpen(false)}
    >
      Marine
    </Link>
    <Link
      href="/rv"
      className="block py-2 text-white/80 text-base"
      onClick={() => setMobileOpen(false)}
    >
      RV
    </Link>
    <Link
      href="/fleet"
      className="block py-2 text-white/80 text-base"
      onClick={() => setMobileOpen(false)}
    >
      Fleet
    </Link>
  </div>
)}

<Link
  href="/about"
  className="block py-3 text-white text-lg font-medium"
  onClick={() => setMobileOpen(false)}
>
  About
</Link>

<Link
  href="/contact"
  className="block py-3 text-white text-lg font-medium"
  onClick={() => setMobileOpen(false)}
>
  Contact
</Link>
```

At the top of the mobile nav component, add state for the services accordion:

```tsx
const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
```

Do NOT touch the hamburger trigger button, the mobile menu open/close state, the logo, phone link, or "Book Service" CTA button. Those stay as-is.

---

## PART 4: Create `/how-it-works` Page

**File to create:** `src/app/how-it-works/page.tsx`

Match the visual pattern of existing pages (navy hero, white content sections, orange CTAs).

```tsx
import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  BookOnlineIcon,
  VanArrivalIcon,
  DriveAwayIcon,
} from '@/components/icons/HowItWorksIcons';

export const metadata: Metadata = {
  title: 'How It Works | Coastal Mobile Lube & Tire',
  description:
    'Book in 60 seconds. We show up at your location. You never leave your day. See how Coastal Mobile delivers shop-quality service right to your driveway, office, or marina.',
  openGraph: {
    title: 'How It Works | Coastal Mobile Lube & Tire',
    description:
      'Book in 60 seconds. We come to you. Skip the shop, keep your day.',
    url: 'https://coastalmobilelube.com/how-it-works',
    type: 'website',
  },
};

const FAQS = [
  {
    q: 'Do I need to be home when you service the vehicle?',
    a: 'Not required. As long as we can access the vehicle and it is safe to work on, we can perform most services without you being present. We recommend being available by phone in case we have questions. For services that require vehicle startup, test drive, or a signature on parts recommendations, we will ask you to be nearby.',
  },
  {
    q: 'What is your service area?',
    a: 'Apollo Beach, Ruskin, Sun City Center, Riverview, Gibsonton, and surrounding South Shore and Tampa Bay communities. If you are outside our standard area, call us. We can often accommodate on a case-by-case basis or for fleet accounts.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Credit card, debit card, digital wallets, and ACH. You receive an invoice with a secure payment link. Fleet accounts can set up monthly billing.',
  },
  {
    q: 'What if my vehicle needs a part you do not have on the van?',
    a: 'Our vans are stocked for the vast majority of common services. If a specific part is needed, we will source it and schedule a return visit, usually within 24 to 48 hours. You only pay for the service once it is completed.',
  },
  {
    q: 'Is mobile service more expensive than a shop?',
    a: 'Our pricing is competitive with traditional shops for comparable services. When you factor in the time you save not sitting in a waiting room, driving to and from the shop, or arranging a ride, mobile service is typically the better value.',
  },
  {
    q: 'Are you licensed and insured?',
    a: 'Yes. Fully licensed, bonded, and insured. Our techs are ASE-certified with 30+ years of combined experience. All work is backed by a 12-month service warranty.',
  },
  {
    q: 'How far in advance should I book?',
    a: 'Same-day service is often available. For preferred time slots or larger services like full brake jobs, booking 1 to 3 days ahead is recommended. Fleet accounts can set up recurring scheduled service.',
  },
  {
    q: 'What happens if it rains?',
    a: 'Most services continue in light rain. For safety reasons we may reschedule in heavy weather or lightning. We will contact you directly if we need to move your appointment.',
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="bg-[#0B2040] text-white pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block text-orange-400 text-sm font-semibold tracking-wider uppercase mb-4">
            How It Works
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Three steps. That is it.
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Book online in under a minute. We arrive at your location on time and fully equipped. You get shop-quality service without the shop visit.
          </p>
        </div>
      </section>

      {/* STEP 1 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-bold text-lg mb-4">
              1
            </div>
            <h2 className="text-4xl font-bold text-[#0B2040] mb-6">
              Book in 60 seconds
            </h2>
            <p className="text-lg text-slate-600 mb-4">
              Pick your service, tell us about your vehicle, and choose a time that works for your day. The whole booking takes less than a minute.
            </p>
            <p className="text-lg text-slate-600 mb-6">
              Have a VIN? Paste it in and we auto-fill year, make, and model. Returning customer? Enter your phone and we pull up your vehicle history instantly.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Book Service
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8 H13" />
                <path d="M9 4 L13 8 L9 12" />
              </svg>
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-2xl bg-orange-50 flex items-center justify-center text-[#0B2040]">
              <BookOnlineIcon className="w-24 h-24" />
            </div>
          </div>
        </div>
      </section>

      {/* STEP 2 */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center md:order-2">
            <div className="w-48 h-48 rounded-2xl bg-orange-50 flex items-center justify-center text-[#0B2040]">
              <VanArrivalIcon className="w-24 h-24" />
            </div>
          </div>
          <div className="md:order-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-bold text-lg mb-4">
              2
            </div>
            <h2 className="text-4xl font-bold text-[#0B2040] mb-6">
              We come to you
            </h2>
            <p className="text-lg text-slate-600 mb-4">
              Our fully equipped service van rolls up at your driveway, office parking lot, marina slip, or job site. On time. Every time.
            </p>
            <p className="text-lg text-slate-600">
              The van carries everything a shop bay carries: certified lifts, pneumatic tools, OEM-grade fluids, tire machine, diagnostic scanners, and factory-trained technicians. You do not lose your day sitting in a waiting room.
            </p>
          </div>
        </div>
      </section>

      {/* STEP 3 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-bold text-lg mb-4">
              3
            </div>
            <h2 className="text-4xl font-bold text-[#0B2040] mb-6">
              Drive away happy
            </h2>
            <p className="text-lg text-slate-600 mb-4">
              Most services complete in under an hour. You get a clear, itemized digital invoice and pay securely online. No cash, no paperwork, no shop visit.
            </p>
            <p className="text-lg text-slate-600">
              Every service is backed by a 12-month warranty. If anything is not right, we come back and make it right.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-2xl bg-orange-50 flex items-center justify-center text-[#0B2040]">
              <DriveAwayIcon className="w-24 h-24" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block text-orange-600 text-sm font-semibold tracking-wider uppercase mb-3">
              Frequently Asked
            </div>
            <h2 className="text-4xl font-bold text-[#0B2040]">
              Common questions
            </h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
                  <span className="font-semibold text-[#0B2040] text-lg">
                    {faq.q}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 text-orange-500 transition-transform group-open:rotate-45"
                  >
                    <path d="M10 4 V16" />
                    <path d="M4 10 H16" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-[#0B2040] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to skip the shop?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Book your mobile service today. Most appointments available same week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              Book Service
            </Link>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center border-2 border-white/30 hover:border-white text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              Call 813-722-LUBE
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
```

---

## PART 5: Create `/services-overview` Page

**File to create:** `src/app/services-overview/page.tsx`

Landing page that distributes traffic to the four division pages.

```tsx
import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Services | Coastal Mobile Lube & Tire',
  description:
    'Mobile automotive, marine, RV, and fleet service across Apollo Beach and Tampa Bay. Oil changes, brakes, tires, and more. We come to you.',
  openGraph: {
    title: 'Our Services | Coastal Mobile Lube & Tire',
    description:
      'Mobile automotive, marine, RV, and fleet service across Tampa Bay.',
    url: 'https://coastalmobilelube.com/services-overview',
    type: 'website',
  },
};

type Division = {
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  href: string;
  cta: string;
};

const DIVISIONS: Division[] = [
  {
    title: 'Automotive',
    tagline: 'Cars, trucks, SUVs',
    description:
      'Full-service mobile maintenance for passenger vehicles. Factory-trained techs. OEM-grade parts. At your home or office.',
    highlights: [
      'Oil changes (conventional, synthetic blend, full synthetic, diesel)',
      'Brakes, tires, batteries, belts, filters',
      'A/C and heating service',
      'Diagnostic scans and check-engine lights',
    ],
    href: '/services',
    cta: 'View automotive services',
  },
  {
    title: 'Marine',
    tagline: 'Boats, outboards, inboards',
    description:
      'On-site marine service at marinas, boat lifts, and slips across Tampa Bay. Winterization, oil changes, impellers, and tune-ups.',
    highlights: [
      'Engine oil and lower-unit service',
      'Impeller and fuel system service',
      'Winterization and de-winterization',
      'Battery and electrical diagnosis',
    ],
    href: '/marine',
    cta: 'View marine services',
  },
  {
    title: 'RV',
    tagline: 'Class A, Class C, travel trailers',
    description:
      'RV maintenance at your home, storage lot, or campground. Chassis service, generator service, and pre-trip inspections.',
    highlights: [
      'Chassis and generator oil service',
      'Brake inspection and replacement',
      'Tire inspection, rotation, and replacement',
      'Pre-trip multi-point inspection',
    ],
    href: '/rv',
    cta: 'View RV services',
  },
  {
    title: 'Fleet & Commercial',
    tagline: 'Company vehicles, work vans, trucks',
    description:
      'Scheduled recurring service for fleets of any size. Keep your vehicles on the road. We come to your yard on your schedule.',
    highlights: [
      'Recurring monthly or quarterly service',
      'On-site PM programs and DOT inspections',
      'Consolidated monthly billing',
      'Dedicated fleet account manager',
    ],
    href: '/fleet',
    cta: 'Request a fleet quote',
  },
];

export default function ServicesOverviewPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="bg-[#0B2040] text-white pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block text-orange-400 text-sm font-semibold tracking-wider uppercase mb-4">
            Services
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Everything we handle on-site.
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Four divisions, one team. Factory-trained technicians bring the shop to your driveway, marina, campground, or yard.
          </p>
        </div>
      </section>

      {/* DIVISIONS GRID */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {DIVISIONS.map((division) => (
            <div
              key={division.title}
              className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:border-orange-200 transition-all"
            >
              <div className="text-sm font-semibold tracking-wider uppercase text-orange-600 mb-2">
                {division.tagline}
              </div>
              <h3 className="text-3xl font-bold text-[#0B2040] mb-4">
                {division.title}
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {division.description}
              </p>
              <ul className="space-y-2 mb-8">
                {division.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 mt-0.5 text-orange-500"
                    >
                      <path d="M3 9 L7 13 L15 5" />
                    </svg>
                    <span className="text-sm">{h}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={division.href}
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                {division.cta}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8 H13" />
                  <path d="M9 4 L13 8 L9 12" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-[#0B2040] mb-2">30+</div>
            <div className="text-sm text-slate-600 uppercase tracking-wider">Years in fixed ops</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#0B2040] mb-2">&lt;1hr</div>
            <div className="text-sm text-slate-600 uppercase tracking-wider">Most services</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#0B2040] mb-2">100%</div>
            <div className="text-sm text-slate-600 uppercase tracking-wider">Mobile, always</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#0B2040] mb-2">$0</div>
            <div className="text-sm text-slate-600 uppercase tracking-wider">Surprise fees</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0B2040] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Not sure which fits?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Tell us what you need. We will point you to the right division and schedule the service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              Book Service
            </Link>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center border-2 border-white/30 hover:border-white text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              Call 813-722-LUBE
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
```

---

## PART 6: Footer Update (if footer has duplicate nav links)

If the site footer has its own nav column listing Automotive/RV/Marine/Fleet, add a "How It Works" link and an "All Services" link that points to `/services-overview`. Do NOT restructure the footer. Just add those two links to the existing "Company" or "Services" column — whichever makes more sense contextually.

If the footer does not have duplicated nav links, skip this part.

---

## BUILD, COMMIT, DEPLOY

```bash
cd ~/coastal-mobile-lube
npm run build
# If build fails, read the error, fix it, retry. Do not deploy a failing build.
npx netlify-cli deploy --prod
git add src/
git commit -m "Add How It Works and Services Overview pages, restructure public nav"
git push origin main
```

**No `--dir` flag on netlify-cli deploy.**
**No `git add -A`.**

---

## SUCCESS CRITERIA

1. `/how-it-works` loads with navy hero, 3 alternating sections with custom SVG icons, 8 FAQ accordions, and navy CTA band
2. `/services-overview` loads with navy hero, 4 division cards in correct order (Automotive, Marine, RV, Fleet), trust band, and CTA
3. Desktop nav shows exactly: `How It Works | Services ▼ | About | Contact` with phone and "Book Service" on right
4. Hovering "Services" opens white dropdown with Automotive, Marine, RV, Fleet in that order
5. Clicking "Services" (not the dropdown items) navigates to `/services-overview`
6. Dropdown closes on mouse-leave with 200ms delay (does not snap shut)
7. Mobile hamburger shows: How It Works, Services (accordion), About, Contact
8. Mobile Services accordion expands to show: All Services, Automotive, Marine, RV, Fleet
9. Active page is highlighted in orange in both desktop and mobile nav
10. FAQ accordions expand and collapse with smooth animation and rotating plus-icon
11. All four old division links (Automotive, RV, Marine, Fleet) removed from top-level desktop nav
12. Live at https://coastal-mobile-lube.netlify.app/how-it-works and `/services-overview`
