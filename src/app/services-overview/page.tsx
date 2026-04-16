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
