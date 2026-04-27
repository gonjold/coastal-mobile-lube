import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { cld, images } from '@/lib/cloudinary';

export const metadata: Metadata = {
  title: 'How Mobile Service Works | Coastal Mobile Lube',
  description:
    'Book in 60 seconds. We come to your location. Your vehicle never moves. Three steps, one hour, zero trips to a garage.',
  openGraph: {
    title: 'How Mobile Service Works | Coastal Mobile Lube',
    description:
      'Book in 60 seconds. We come to your location. Your vehicle never moves. Three steps, one hour, zero trips to a garage.',
    url: 'https://coastalmobilelube.com/how-it-works',
    type: 'website',
  },
};

const NAVY = '#0B2040';
const NAVY_DEEP = '#081832';
const ORANGE = '#E07B2D';

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
    a: 'Yes. Fully licensed, bonded, and insured. Our techs are ASE-certified with 30 plus years of combined experience.',
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Do you bring everything you need?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Our van carries OEM-grade oil, factory-spec filters, tires in stock, brake parts, diagnostic tools, and everything for a full service bay. We don't make trips to the parts store."
              }
            },
            {
              "@type": "Question",
              "name": "What about jobs you can't do on-site?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "On-site we handle 95% of service and maintenance. For transmission rebuilds or internal engine work, we refer you to a trusted partner shop and coordinate drop-off for you."
              }
            },
            {
              "@type": "Question",
              "name": "How early do I need to book?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Most weeks we have same-day or next-day availability. Fleet and marine customers on a schedule book their slots weeks in advance."
              }
            },
            {
              "@type": "Question",
              "name": "Do you offer a warranty?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Coastal stands behind every job done by our factory-trained, ASE-certified team. Warranty terms specific to your service are provided at the time of your appointment. For details on a particular service, ask when you book or call 813-722-LUBE."
              }
            }
          ]
        }) }}
      />
      {/* HERO */}
      <section
        className="relative text-white px-6 overflow-hidden"
        style={{ backgroundColor: NAVY }}
      >
        {/* Hero photo */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url('${cld(images.heroHowItWorks, 'hero')}')` }}
        />
        {/* Navy gradient overlay (55%) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,32,64,0.7) 0%, rgba(11,32,64,0.55) 60%, rgba(11,32,64,0.7) 100%)',
          }}
        />
        {/* Diagonal accent lines overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 49.5%, rgba(224, 123, 45, 0.06) 49.5%, rgba(224, 123, 45, 0.06) 50.5%, transparent 50.5%)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Ambient orange glows */}
        <div
          className="absolute top-20 right-[10%] w-32 h-32 rounded-full blur-3xl"
          style={{ backgroundColor: ORANGE, opacity: 0.08 }}
        />
        <div
          className="absolute bottom-10 left-[15%] w-40 h-40 rounded-full blur-3xl"
          style={{ backgroundColor: ORANGE, opacity: 0.06 }}
        />

        <div className="relative max-w-5xl mx-auto text-center pt-10 pb-6 md:pt-14 md:pb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="h-px w-8" style={{ backgroundColor: ORANGE }} />
            <span
              className="text-xs font-bold uppercase"
              style={{ color: ORANGE, letterSpacing: '0.2em' }}
            >
              How It Works
            </span>
            <span className="h-px w-8" style={{ backgroundColor: ORANGE }} />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.05] text-white">
            No shop. No waiting.<br />
            <span style={{ color: ORANGE }}>Your vehicle never moves.</span>
          </h1>
          <p className="text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Here&apos;s exactly what happens from the moment you book to the moment we leave. Three steps, one hour, zero trips to a garage.
          </p>
        </div>
      </section>

      {/* STEP 1 */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-extrabold text-xl"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${ORANGE} 0%, #F5A461 100%)`,
                  boxShadow: '0 8px 20px -6px rgba(224, 123, 45, 0.5)',
                }}
              >
                1
              </div>
              <div
                className="text-xs uppercase font-bold"
                style={{ color: ORANGE, letterSpacing: '0.15em' }}
              >
                Step One
              </div>
            </div>
            <h2
              className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight"
              style={{ color: NAVY }}
            >
              Book in 60 seconds
            </h2>
            <p className="text-lg text-slate-600 mb-4 leading-relaxed">
              Pick your service, enter your vehicle, choose a time. The whole thing takes under a minute.
            </p>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Have a VIN? Paste it in, we auto-fill the rest. Returning customer? Enter your phone and your vehicle history loads in a second.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3.5 rounded-lg transition-all hover:opacity-90"
              style={{
                backgroundColor: ORANGE,
                boxShadow: '0 10px 25px -8px rgba(224, 123, 45, 0.4)',
              }}
            >
              Book Service
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8 H13" />
                <path d="M9 4 L13 8 L9 12" />
              </svg>
            </Link>
          </div>

          {/* Illustration: Phone with booking form + floating badges */}
          <div
            className="relative rounded-3xl p-12 flex items-center justify-center min-h-[440px]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, #FEF3E8 0%, #FFFFFF 70%)',
            }}
          >
            <div className="relative" style={{ width: '220px' }}>
              <svg
                viewBox="0 0 220 420"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-2xl"
              >
                <rect x="10" y="10" width="200" height="400" rx="28" fill="#0B2040" />
                <rect x="18" y="18" width="184" height="384" rx="20" fill="#FFFFFF" />
                <rect x="85" y="22" width="50" height="6" rx="3" fill="#0B2040" />
                <rect x="28" y="44" width="164" height="30" rx="6" fill="#0B2040" />
                <text
                  x="110"
                  y="64"
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  Book Service
                </text>
                <circle cx="70" cy="92" r="6" fill="#E07B2D" />
                <circle cx="100" cy="92" r="6" fill="#E2E8F0" />
                <circle cx="130" cy="92" r="6" fill="#E2E8F0" />
                <circle cx="160" cy="92" r="6" fill="#E2E8F0" />
                <text
                  x="32"
                  y="122"
                  fill="#0B2040"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  YOUR VEHICLE
                </text>
                <rect x="28" y="132" width="164" height="32" rx="6" fill="#F8FAFC" stroke="#E2E8F0" />
                <text
                  x="38"
                  y="152"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  Enter VIN...
                </text>
                <line x1="32" y1="180" x2="90" y2="180" stroke="#E2E8F0" />
                <text
                  x="110"
                  y="184"
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="8"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  or search
                </text>
                <line x1="130" y1="180" x2="188" y2="180" stroke="#E2E8F0" />
                <rect x="28" y="196" width="164" height="32" rx="6" fill="white" stroke="#E07B2D" strokeWidth="2" />
                <circle cx="40" cy="212" r="4" fill="none" stroke="#64748B" strokeWidth="1.5" />
                <line x1="43" y1="215" x2="47" y2="219" stroke="#64748B" strokeWidth="1.5" />
                <text
                  x="55"
                  y="216"
                  fill="#0B2040"
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  2024 Toyota Tacoma
                </text>
                <text
                  x="32"
                  y="250"
                  fill="#64748B"
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  FUEL TYPE
                </text>
                <rect x="28" y="258" width="164" height="28" rx="6" fill="#F8FAFC" stroke="#E2E8F0" />
                <text
                  x="38"
                  y="276"
                  fill="#0B2040"
                  fontSize="9"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  Gas
                </text>
                <rect x="28" y="352" width="164" height="36" rx="8" fill="#E07B2D" />
                <text
                  x="110"
                  y="374"
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  Next
                </text>
              </svg>

              {/* Floating calendar badge */}
              <div
                className="absolute -top-4 -left-12 bg-white rounded-2xl p-3 shadow-xl border border-slate-100"
                style={{ transform: 'rotate(-8deg)' }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="#E07B2D"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="7" width="22" height="20" rx="2" />
                  <path d="M5 12 H27" />
                  <path d="M10 4 V10" />
                  <path d="M22 4 V10" />
                  <path d="M11 19 L14 22 L21 15" />
                </svg>
              </div>

              {/* Floating checkmark badge */}
              <div
                className="absolute top-40 -right-14 rounded-2xl p-3 shadow-xl"
                style={{ backgroundColor: NAVY, transform: 'rotate(6deg)' }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="#E07B2D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 16 L13 22 L25 10" />
                </svg>
              </div>

              {/* Floating "60 SEC" pill */}
              <div
                className="absolute -bottom-4 -left-8 text-white rounded-full px-4 py-2 shadow-xl font-bold text-sm"
                style={{ backgroundColor: ORANGE, transform: 'rotate(-4deg)' }}
              >
                60 SEC
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 2 */}
      <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* Illustration: Van arriving at house */}
          <div
            className="relative rounded-3xl p-8 flex items-center justify-center min-h-[440px] md:order-2"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #E8F0FF 0%, #FFFFFF 100%)',
            }}
          >
            <svg
              viewBox="0 0 400 320"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-sm drop-shadow-xl"
            >
              <defs>
                <linearGradient id="vanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#F1F5F9" />
                </linearGradient>
                <linearGradient id="roofGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0B2040" />
                  <stop offset="100%" stopColor="#1a3a6e" />
                </linearGradient>
              </defs>

              {/* Clouds */}
              <circle cx="60" cy="40" r="12" fill="#FFFFFF" opacity="0.8" />
              <circle cx="80" cy="38" r="16" fill="#FFFFFF" opacity="0.8" />
              <circle cx="100" cy="42" r="12" fill="#FFFFFF" opacity="0.8" />
              <circle cx="320" cy="50" r="10" fill="#FFFFFF" opacity="0.7" />
              <circle cx="340" cy="48" r="14" fill="#FFFFFF" opacity="0.7" />

              {/* House */}
              <path d="M30 200 L30 260 L110 260 L110 200 Z" fill="#FDE8D0" />
              <path d="M20 205 L70 160 L120 205 Z" fill="url(#roofGradient)" />
              <rect x="55" y="220" width="30" height="40" fill="#0B2040" />
              <rect x="42" y="215" width="12" height="12" fill="#FDE8D0" stroke="#0B2040" strokeWidth="1.5" />
              <rect x="88" y="215" width="12" height="12" fill="#FDE8D0" stroke="#0B2040" strokeWidth="1.5" />

              {/* Tree */}
              <rect x="8" y="235" width="6" height="25" fill="#78350F" />
              <circle cx="11" cy="225" r="14" fill="#16A34A" />

              {/* Road */}
              <rect x="0" y="260" width="400" height="60" fill="#E2E8F0" />
              <line x1="130" y1="280" x2="160" y2="280" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="8 6" />
              <line x1="200" y1="280" x2="230" y2="280" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="8 6" />
              <line x1="270" y1="280" x2="300" y2="280" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="8 6" />

              {/* Motion lines */}
              <line x1="140" y1="225" x2="155" y2="225" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="135" y1="235" x2="155" y2="235" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <line x1="140" y1="245" x2="155" y2="245" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

              {/* Van */}
              <rect x="180" y="200" width="140" height="65" rx="6" fill="url(#vanGradient)" stroke="#0B2040" strokeWidth="2.5" />
              <path d="M320 210 L360 210 L360 265 L320 265 Z" fill="#E07B2D" stroke="#0B2040" strokeWidth="2.5" />
              <path d="M325 215 L355 215 L355 235 L325 235 Z" fill="#A7C5EB" stroke="#0B2040" strokeWidth="2" />
              <line x1="250" y1="205" x2="250" y2="260" stroke="#0B2040" strokeWidth="1.5" />
              <text
                x="215"
                y="235"
                fill="#0B2040"
                fontSize="11"
                fontWeight="800"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                COASTAL
              </text>
              <text
                x="215"
                y="248"
                fill="#E07B2D"
                fontSize="8"
                fontWeight="700"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                MOBILE LUBE
              </text>
              <circle cx="210" cy="268" r="14" fill="#0B2040" />
              <circle cx="210" cy="268" r="7" fill="#64748B" />
              <circle cx="210" cy="268" r="3" fill="#0B2040" />
              <circle cx="330" cy="268" r="14" fill="#0B2040" />
              <circle cx="330" cy="268" r="7" fill="#64748B" />
              <circle cx="330" cy="268" r="3" fill="#0B2040" />

              {/* Location pin */}
              <g transform="translate(230, 100)">
                <path
                  d="M20 0 C9 0 0 9 0 20 C0 35 20 60 20 60 C20 60 40 35 40 20 C40 9 31 0 20 0 Z"
                  fill="#E07B2D"
                  stroke="#0B2040"
                  strokeWidth="2"
                />
                <circle cx="20" cy="20" r="7" fill="#FFFFFF" />
                <circle cx="20" cy="20" r="3" fill="#0B2040" />
              </g>

              <ellipse cx="250" cy="290" rx="20" ry="4" fill="#0B2040" opacity="0.15" />
            </svg>
          </div>

          <div className="md:order-1">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-extrabold text-xl"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${ORANGE} 0%, #F5A461 100%)`,
                  boxShadow: '0 8px 20px -6px rgba(224, 123, 45, 0.5)',
                }}
              >
                2
              </div>
              <div
                className="text-xs uppercase font-bold"
                style={{ color: ORANGE, letterSpacing: '0.15em' }}
              >
                Step Two
              </div>
            </div>
            <h2
              className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight"
              style={{ color: NAVY }}
            >
              We come to you
            </h2>
            <p className="text-lg text-slate-600 mb-4 leading-relaxed">
              Our fully equipped service van rolls up at your driveway, office parking lot, marina slip, or job site.{' '}
              <span className="font-semibold" style={{ color: NAVY }}>
                On time. Every time.
              </span>
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              The van carries what a shop bay carries. Pneumatic tools, OEM-grade fluids, full tire machine, vacuum oil extraction, diagnostic scanners, certified equipment. And a factory-trained tech, not a gig-app contractor.
            </p>
          </div>
        </div>
      </section>

      {/* STEP 3 */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-extrabold text-xl"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${ORANGE} 0%, #F5A461 100%)`,
                  boxShadow: '0 8px 20px -6px rgba(224, 123, 45, 0.5)',
                }}
              >
                3
              </div>
              <div
                className="text-xs uppercase font-bold"
                style={{ color: ORANGE, letterSpacing: '0.15em' }}
              >
                Step Three
              </div>
            </div>
            <h2
              className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight"
              style={{ color: NAVY }}
            >
              You never left your day
            </h2>
            <p className="text-lg text-slate-600 mb-4 leading-relaxed">
              Most services complete in under an hour. You get an itemized digital invoice and pay securely online. No cash, no paperwork, no shop visit.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Every service is performed by a factory-trained, ASE-certified team. If anything is not right, we come back and make it right. Your vehicle never moved an inch. Neither did your schedule.
            </p>
          </div>

          {/* Illustration: Car with receipt + stars + credentials badge */}
          <div
            className="relative rounded-3xl p-8 flex items-center justify-center min-h-[440px]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, #E8F5E8 0%, #FFFFFF 70%)',
            }}
          >
            <svg
              viewBox="0 0 400 320"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-md drop-shadow-xl"
            >
              <defs>
                <linearGradient id="carGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E07B2D" />
                  <stop offset="100%" stopColor="#C96A1F" />
                </linearGradient>
              </defs>

              <ellipse cx="200" cy="275" rx="170" ry="20" fill="#E2E8F0" opacity="0.5" />

              {/* Car */}
              <g transform="translate(60, 150)">
                <path
                  d="M10 65 L40 30 L180 30 L220 45 L260 55 L270 75 L270 100 L10 100 L10 75 Z"
                  fill="url(#carGradient)"
                  stroke="#0B2040"
                  strokeWidth="2.5"
                />
                <path d="M50 30 L80 10 L160 10 L180 30 Z" fill="#0B2040" />
                <path d="M55 28 L82 14 L108 14 L108 28 Z" fill="#A7C5EB" opacity="0.7" />
                <path d="M112 28 L112 14 L156 14 L172 28 Z" fill="#A7C5EB" opacity="0.7" />
                <line x1="130" y1="30" x2="130" y2="100" stroke="#0B2040" strokeWidth="1.5" />
                <circle cx="250" cy="70" r="6" fill="#FEF3E8" stroke="#0B2040" strokeWidth="1.5" />
                <rect x="18" y="65" width="10" height="6" rx="1" fill="#DC2626" stroke="#0B2040" strokeWidth="1" />
                <circle cx="60" cy="100" r="22" fill="#0B2040" />
                <circle cx="60" cy="100" r="12" fill="#64748B" />
                <circle cx="60" cy="100" r="4" fill="#0B2040" />
                <circle cx="210" cy="100" r="22" fill="#0B2040" />
                <circle cx="210" cy="100" r="12" fill="#64748B" />
                <circle cx="210" cy="100" r="4" fill="#0B2040" />
                <line x1="-10" y1="60" x2="10" y2="60" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                <line x1="-15" y1="75" x2="5" y2="75" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                <line x1="-10" y1="90" x2="10" y2="90" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              </g>

              {/* Receipt */}
              <g transform="translate(30, 40) rotate(-6 70 70)">
                <rect x="10" y="10" width="130" height="110" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
                <rect x="10" y="10" width="130" height="22" fill="#0B2040" />
                <text
                  x="75"
                  y="25"
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  INVOICE
                </text>
                <text x="20" y="50" fill="#0B2040" fontSize="8" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
                  Oil Change
                </text>
                <text x="130" y="50" textAnchor="end" fill="#0B2040" fontSize="8" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
                  $89
                </text>
                <line x1="20" y1="58" x2="130" y2="58" stroke="#E2E8F0" />
                <text x="20" y="72" fill="#64748B" fontSize="7" fontFamily="Plus Jakarta Sans, sans-serif">
                  Synthetic blend
                </text>
                <text x="20" y="85" fill="#64748B" fontSize="7" fontFamily="Plus Jakarta Sans, sans-serif">
                  Filter replacement
                </text>
                <text x="20" y="98" fill="#64748B" fontSize="7" fontFamily="Plus Jakarta Sans, sans-serif">
                  Fluid top-off
                </text>
                <rect x="20" y="104" width="110" height="14" rx="3" fill="#16A34A" />
                <text
                  x="75"
                  y="114"
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  PAID
                </text>
              </g>

              {/* Credentials badge */}
              <g transform="translate(280, 30) rotate(8 50 50)">
                <circle cx="50" cy="50" r="40" fill="#0B2040" />
                <circle cx="50" cy="50" r="34" fill="none" stroke="#E07B2D" strokeWidth="2" strokeDasharray="3 3" />
                <text
                  x="50"
                  y="42"
                  textAnchor="middle"
                  fill="#E07B2D"
                  fontSize="14"
                  fontWeight="800"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  30 YR
                </text>
                <text
                  x="50"
                  y="56"
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  DEALERSHIP
                </text>
                <text
                  x="50"
                  y="68"
                  textAnchor="middle"
                  fill="white"
                  fontSize="6"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  EXPERIENCE
                </text>
              </g>

              {/* Stars */}
              <g transform="translate(130, 265)" fill="#E07B2D">
                <polygon points="15,0 19,10 30,10 21,17 25,28 15,22 5,28 9,17 0,10 11,10" />
                <polygon points="45,0 49,10 60,10 51,17 55,28 45,22 35,28 39,17 30,10 41,10" />
                <polygon points="75,0 79,10 90,10 81,17 85,28 75,22 65,28 69,17 60,10 71,10" />
                <polygon points="105,0 109,10 120,10 111,17 115,28 105,22 95,28 99,17 90,10 101,10" />
                <polygon points="135,0 139,10 150,10 141,17 145,28 135,22 125,28 129,17 120,10 131,10" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* WHERE WE SET UP */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-[#E07B2D] uppercase mb-3">Locations</p>
            <h2 className="text-3xl font-bold text-[#0B2040] tracking-tight mb-3">Wherever your vehicle lives</h2>
            <p className="text-[#555] max-w-xl mx-auto">Half the work of mobile service is showing up where you actually are. Here&apos;s where we set up.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              "Your home driveway or garage",
              "Your office parking lot",
              "Marinas, slips, ramps, dry storage",
              "RV parks, campgrounds, storage lots",
              "Fleet yards and depots",
              "Job sites and construction lots",
            ].map((loc) => (
              <div key={loc} className="bg-[#FAFBFC] border border-[#E8E8E8] rounded-[10px] px-4 py-3 text-[14px] font-medium text-[#0B2040]">{loc}</div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S IN THE VAN */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-[#E07B2D] uppercase mb-3">The Van</p>
            <h2 className="text-3xl font-bold text-[#0B2040] tracking-tight mb-3">A real shop on wheels</h2>
            <p className="text-[#555] max-w-xl mx-auto">Our service van isn&apos;t a pickup truck with a toolbox. It&apos;s a fully equipped mobile bay carrying everything a dealership service department uses.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Vacuum oil extraction system. The same kind dealerships use.",
              "Full tire mount and balance machine",
              "OEM-grade fluids and filters in stock",
              "OBD2, marine, and RV diagnostic scanners",
              "Pneumatic tools and calibrated torque wrenches",
              "Spare parts on board: filters, brakes, batteries, belts, wipers",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white border border-[#E8E8E8] rounded-[10px] px-4 py-3">
                <span className="inline-block w-2 h-2 rounded-full bg-[#E07B2D] mt-[7px] shrink-0" />
                <span className="text-[14px] text-[#333] leading-[1.5]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU DON'T HAVE TO DO */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-[#E07B2D] uppercase mb-3">What You Skip</p>
            <h2 className="text-3xl font-bold text-[#0B2040] tracking-tight mb-3">A short list of things you don&apos;t have to do.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {[
              "Drive anywhere",
              "Sit in a waiting room",
              "Arrange a ride home",
              "Reschedule your day",
              "Deal with shop drop-off and pickup",
              "Visit a tire shop, oil shop, or service center",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 px-4 py-3">
                <span className="text-[#E07B2D] text-[16px] font-bold shrink-0">&times;</span>
                <span className="text-[15px] text-[#888] line-through">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section
        className="py-16 px-6 text-white relative overflow-hidden"
        style={{ backgroundColor: NAVY }}
      >
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.04,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            {
              icon: (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7 V12 L15 15" />
                </>
              ),
              value: '30+',
              label: 'Years in fixed ops',
              border: true,
            },
            {
              icon: <path d="M6 13 L10 17 L18 9" />,
              value: '<1hr',
              label: 'Most services',
              border: true,
            },
            {
              icon: (
                <>
                  <path d="M20 10 C20 16 12 22 12 22 C12 22 4 16 4 10 C4 6 7 3 12 3 C17 3 20 6 20 10 Z" />
                  <circle cx="12" cy="10" r="3" />
                </>
              ),
              value: '100%',
              label: 'Mobile, always',
              border: true,
            },
            {
              icon: (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 8 L16 16" />
                  <path d="M16 8 L8 16" />
                </>
              ),
              value: '$0',
              label: 'Surprise fees',
              border: false,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`flex flex-col items-center text-center ${
                stat.border ? 'md:border-r md:border-white/10 md:pr-4' : ''
              }`}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #FEF3E8 0%, #FDE8D0 100%)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E07B2D"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {stat.icon}
                </svg>
              </div>
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs uppercase tracking-wider text-white/60 font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8" style={{ backgroundColor: ORANGE }} />
              <span
                className="text-xs font-bold uppercase"
                style={{ color: ORANGE, letterSpacing: '0.2em' }}
              >
                Frequently Asked
              </span>
              <span className="h-px w-8" style={{ backgroundColor: ORANGE }} />
            </div>
            <h2
              className="text-4xl md:text-5xl font-extrabold"
              style={{ color: NAVY }}
            >
              Common questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden transition-all open:shadow-lg"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-slate-50 transition-colors border-l-[3px] border-transparent group-open:border-[#E07B2D]">
                  <span className="font-bold text-base" style={{ color: NAVY }}>
                    {faq.q}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 text-[#E07B2D]/60 transition-transform duration-200 group-open:rotate-180 group-open:text-[#E07B2D]"
                  >
                    <path d="M6 9 L12 15 L18 9" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="text-white py-24 px-6 relative overflow-hidden"
        style={{ backgroundColor: NAVY_DEEP }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-3xl rounded-full"
          style={{ backgroundColor: ORANGE, opacity: 0.1 }}
        />
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.03,
            backgroundImage: 'linear-gradient(135deg, white 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
            Ready to skip the shop?
          </h2>
          <p className="text-xl text-white/75 mb-10 max-w-xl mx-auto leading-relaxed">
            Pick a time that works for you. We handle the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="inline-flex items-center justify-center text-white font-bold px-10 py-4 rounded-lg transition-all hover:opacity-90"
              style={{
                backgroundColor: ORANGE,
                boxShadow: '0 20px 40px -10px rgba(224, 123, 45, 0.5)',
              }}
            >
              Book Service
            </Link>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center border-2 border-white/20 hover:bg-white/10 text-white font-bold px-10 py-4 rounded-lg transition-all"
            >
              Call 813-722-LUBE
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
