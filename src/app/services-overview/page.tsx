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

const NAVY = '#0B2040';
const ORANGE = '#E07B2D';

const ArrowIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform group-hover/link:translate-x-1"
  >
    <path d="M3 9 H15" />
    <path d="M10 4 L15 9 L10 14" />
  </svg>
);

const CheckBullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-3 text-slate-700 text-sm">
    <div
      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
      style={{ backgroundColor: '#FEF3E8' }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke={ORANGE}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 6 L5 9 L10 3" />
      </svg>
    </div>
    <span>{children}</span>
  </li>
);

const DotPattern: React.FC = () => (
  <div
    className="absolute inset-0"
    style={{
      opacity: 0.08,
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
      backgroundSize: '16px 16px',
    }}
  />
);

export default function ServicesOverviewPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section
        className="relative text-white pt-32 pb-24 px-6 overflow-hidden"
        style={{
          backgroundColor: NAVY,
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(224, 123, 45, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(224, 123, 45, 0.05) 0%, transparent 50%),
            radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, auto, 24px 24px',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 49.5%, rgba(224, 123, 45, 0.06) 49.5%, rgba(224, 123, 45, 0.06) 50.5%, transparent 50.5%)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute top-20 right-[10%] w-32 h-32 rounded-full blur-3xl"
          style={{ backgroundColor: ORANGE, opacity: 0.08 }}
        />
        <div
          className="absolute bottom-10 left-[15%] w-40 h-40 rounded-full blur-3xl"
          style={{ backgroundColor: ORANGE, opacity: 0.06 }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="h-px w-8" style={{ backgroundColor: ORANGE }} />
            <span
              className="text-xs font-bold uppercase"
              style={{ color: ORANGE, letterSpacing: '0.2em' }}
            >
              Services
            </span>
            <span className="h-px w-8" style={{ backgroundColor: ORANGE }} />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.05] text-white">
            Everything we handle<br />
            <span style={{ color: ORANGE }}>on-site.</span>
          </h1>
          <p className="text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Four divisions, one team. Factory-trained technicians bring the shop to your driveway, marina, campground, or yard.
          </p>
        </div>
      </section>

      {/* CARDS */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">

          {/* AUTOMOTIVE CARD */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div
              className="relative h-48 flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(135deg, ${NAVY} 0%, #1a3a6e 100%)`,
              }}
            >
              <DotPattern />
              <svg viewBox="0 0 300 140" className="relative w-3/4 drop-shadow-xl">
                <g opacity="0.2">
                  <path
                    d="M230 20 L260 50 L265 45 L270 50 L265 55 L235 85 L210 110"
                    stroke="#E07B2D"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
                <g transform="translate(40, 30)">
                  <path
                    d="M20 60 L50 25 L170 25 L200 60 L210 85 L10 85 Z"
                    fill="#E07B2D"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M55 32 L80 10 L140 10 L170 32 Z"
                    fill="#0B2040"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <path d="M60 30 L82 14 L108 14 L108 30 Z" fill="#A7C5EB" opacity="0.8" />
                  <path d="M112 30 L112 14 L138 14 L162 30 Z" fill="#A7C5EB" opacity="0.8" />
                  <circle cx="55" cy="85" r="16" fill="#0B2040" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="55" cy="85" r="8" fill="#64748B" />
                  <circle cx="165" cy="85" r="16" fill="#0B2040" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="165" cy="85" r="8" fill="#64748B" />
                  <circle cx="190" cy="65" r="5" fill="#FEF3E8" />
                </g>
              </svg>
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div
                className="text-xs uppercase font-bold mb-2"
                style={{ color: ORANGE, letterSpacing: '0.1em' }}
              >
                Cars, Trucks, SUVs
              </div>
              <h3 className="text-3xl font-extrabold mb-3" style={{ color: NAVY }}>
                Automotive
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Full-service mobile maintenance for passenger vehicles. Factory-trained techs. OEM-grade parts. At your home or office.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                <CheckBullet>Oil changes (conventional, synthetic, diesel)</CheckBullet>
                <CheckBullet>Brakes, tires, batteries, belts, filters</CheckBullet>
                <CheckBullet>A/C, heating, and diagnostic scans</CheckBullet>
              </ul>
              <Link
                href="/services"
                className="inline-flex items-center justify-between gap-2 font-bold group/link py-3 border-t border-slate-100"
                style={{ color: ORANGE }}
              >
                <span>View automotive services</span>
                <ArrowIcon />
              </Link>
            </div>
          </div>

          {/* MARINE CARD */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div
              className="relative h-48 flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(135deg, ${NAVY} 0%, #1e4d7a 100%)`,
              }}
            >
              <svg
                className="absolute bottom-0 left-0 w-full h-16"
                viewBox="0 0 400 60"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 30 Q50 10 100 30 T200 30 T300 30 T400 30 L400 60 L0 60 Z"
                  fill="#1e4d7a"
                  opacity="0.6"
                />
                <path
                  d="M0 40 Q50 20 100 40 T200 40 T300 40 T400 40 L400 60 L0 60 Z"
                  fill="#2a5f8f"
                  opacity="0.5"
                />
              </svg>
              <DotPattern />
              <svg viewBox="0 0 300 140" className="relative w-3/4 drop-shadow-xl">
                <g transform="translate(60, 30)">
                  <path
                    d="M0 60 L20 85 L160 85 L180 60 L170 55 L10 55 Z"
                    fill="#E07B2D"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M40 55 L55 25 L125 25 L140 55 Z"
                    fill="#0B2040"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <path d="M55 50 L65 30 L115 30 L125 50 Z" fill="#A7C5EB" opacity="0.8" />
                  <line x1="90" y1="10" x2="90" y2="25" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M90 10 L105 13 L90 17 Z" fill="#E07B2D" />
                </g>
              </svg>
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div
                className="text-xs uppercase font-bold mb-2"
                style={{ color: ORANGE, letterSpacing: '0.1em' }}
              >
                Boats, Outboards, Inboards
              </div>
              <h3 className="text-3xl font-extrabold mb-3" style={{ color: NAVY }}>
                Marine
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                On-site marine service at marinas, boat lifts, and slips across Tampa Bay. Winterization, oil changes, impellers, and tune-ups.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                <CheckBullet>Engine oil and lower-unit service</CheckBullet>
                <CheckBullet>Impeller and fuel system service</CheckBullet>
                <CheckBullet>Winterization and de-winterization</CheckBullet>
              </ul>
              <Link
                href="/marine"
                className="inline-flex items-center justify-between gap-2 font-bold group/link py-3 border-t border-slate-100"
                style={{ color: ORANGE }}
              >
                <span>View marine services</span>
                <ArrowIcon />
              </Link>
            </div>
          </div>

          {/* RV CARD */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div
              className="relative h-48 flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(135deg, ${NAVY} 0%, #2a5942 100%)`,
              }}
            >
              <svg
                className="absolute bottom-0 left-0 w-full h-16"
                viewBox="0 0 400 60"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 60 L20 30 L40 60 Z M60 60 L85 20 L110 60 Z M130 60 L145 35 L160 60 Z M340 60 L360 25 L380 60 Z"
                  fill="#1a3d1a"
                  opacity="0.6"
                />
              </svg>
              <DotPattern />
              <svg viewBox="0 0 300 140" className="relative w-3/4 drop-shadow-xl">
                <g transform="translate(30, 25)">
                  <rect
                    x="10"
                    y="30"
                    width="180"
                    height="55"
                    rx="4"
                    fill="#FFFFFF"
                    stroke="#0B2040"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M190 40 L230 40 L230 85 L190 85 Z"
                    fill="#E07B2D"
                    stroke="#0B2040"
                    strokeWidth="2.5"
                  />
                  <path d="M195 45 L225 45 L225 60 L195 60 Z" fill="#A7C5EB" />
                  <rect x="20" y="38" width="30" height="18" rx="2" fill="#A7C5EB" />
                  <rect x="60" y="38" width="30" height="18" rx="2" fill="#A7C5EB" />
                  <rect x="100" y="38" width="30" height="18" rx="2" fill="#A7C5EB" />
                  <rect x="140" y="38" width="30" height="18" rx="2" fill="#A7C5EB" />
                  <rect x="10" y="65" width="180" height="4" fill="#E07B2D" />
                  <rect x="155" y="70" width="18" height="15" fill="#0B2040" />
                  <circle cx="50" cy="90" r="12" fill="#0B2040" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="50" cy="90" r="6" fill="#64748B" />
                  <circle cx="150" cy="90" r="12" fill="#0B2040" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="150" cy="90" r="6" fill="#64748B" />
                  <circle cx="215" cy="90" r="12" fill="#0B2040" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="215" cy="90" r="6" fill="#64748B" />
                </g>
              </svg>
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div
                className="text-xs uppercase font-bold mb-2"
                style={{ color: ORANGE, letterSpacing: '0.1em' }}
              >
                Class A, Class C, Travel Trailers
              </div>
              <h3 className="text-3xl font-extrabold mb-3" style={{ color: NAVY }}>
                RV
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                RV maintenance at your home, storage lot, or campground. Chassis service, generator service, and pre-trip inspections.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                <CheckBullet>Chassis and generator oil service</CheckBullet>
                <CheckBullet>Brake inspection and replacement</CheckBullet>
                <CheckBullet>Pre-trip multi-point inspection</CheckBullet>
              </ul>
              <Link
                href="/rv"
                className="inline-flex items-center justify-between gap-2 font-bold group/link py-3 border-t border-slate-100"
                style={{ color: ORANGE }}
              >
                <span>View RV services</span>
                <ArrowIcon />
              </Link>
            </div>
          </div>

          {/* FLEET CARD */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div
              className="relative h-48 flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(135deg, ${NAVY} 0%, #3d2d52 100%)`,
              }}
            >
              <DotPattern />
              <svg viewBox="0 0 300 140" className="relative w-3/4 drop-shadow-xl">
                {/* Back van */}
                <g transform="translate(20, 25)" opacity="0.6">
                  <rect
                    x="10"
                    y="30"
                    width="90"
                    height="40"
                    rx="3"
                    fill="#FFFFFF"
                    stroke="#0B2040"
                    strokeWidth="2"
                  />
                  <path
                    d="M100 35 L130 35 L130 70 L100 70 Z"
                    fill="#E07B2D"
                    stroke="#0B2040"
                    strokeWidth="2"
                  />
                  <circle cx="35" cy="75" r="8" fill="#0B2040" />
                  <circle cx="115" cy="75" r="8" fill="#0B2040" />
                </g>
                {/* Middle van */}
                <g transform="translate(80, 35)" opacity="0.85">
                  <rect
                    x="10"
                    y="30"
                    width="90"
                    height="40"
                    rx="3"
                    fill="#FFFFFF"
                    stroke="#0B2040"
                    strokeWidth="2"
                  />
                  <path
                    d="M100 35 L130 35 L130 70 L100 70 Z"
                    fill="#E07B2D"
                    stroke="#0B2040"
                    strokeWidth="2"
                  />
                  <circle cx="35" cy="75" r="8" fill="#0B2040" />
                  <circle cx="115" cy="75" r="8" fill="#0B2040" />
                </g>
                {/* Front van */}
                <g transform="translate(140, 45)">
                  <rect
                    x="10"
                    y="30"
                    width="90"
                    height="40"
                    rx="3"
                    fill="#FFFFFF"
                    stroke="#0B2040"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M100 35 L130 35 L130 70 L100 70 Z"
                    fill="#E07B2D"
                    stroke="#0B2040"
                    strokeWidth="2.5"
                  />
                  <path d="M105 40 L125 40 L125 52 L105 52 Z" fill="#A7C5EB" />
                  <text
                    x="55"
                    y="55"
                    fill="#0B2040"
                    fontSize="9"
                    fontWeight="800"
                    textAnchor="middle"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    COASTAL
                  </text>
                  <circle cx="35" cy="75" r="10" fill="#0B2040" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="35" cy="75" r="5" fill="#64748B" />
                  <circle cx="115" cy="75" r="10" fill="#0B2040" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="115" cy="75" r="5" fill="#64748B" />
                </g>
              </svg>
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div
                className="text-xs uppercase font-bold mb-2"
                style={{ color: ORANGE, letterSpacing: '0.1em' }}
              >
                Company Vehicles, Work Vans, Trucks
              </div>
              <h3 className="text-3xl font-extrabold mb-3" style={{ color: NAVY }}>
                Fleet & Commercial
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Scheduled recurring service for fleets of any size. Keep your vehicles on the road. We come to your yard on your schedule.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                <CheckBullet>Recurring monthly or quarterly service</CheckBullet>
                <CheckBullet>Consolidated monthly billing</CheckBullet>
                <CheckBullet>Dedicated fleet account manager</CheckBullet>
              </ul>
              <Link
                href="/fleet"
                className="inline-flex items-center justify-between gap-2 font-bold group/link py-3 border-t border-slate-100"
                style={{ color: ORANGE }}
              >
                <span>Request a fleet quote</span>
                <ArrowIcon />
              </Link>
            </div>
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
            { value: '30+', label: 'Years in fixed ops', border: true },
            { value: '<1hr', label: 'Most services', border: true },
            { value: '100%', label: 'Mobile, always', border: true },
            { value: '$0', label: 'Surprise fees', border: false },
          ].map((stat, i) => (
            <div
              key={i}
              className={`flex flex-col items-center text-center ${
                stat.border ? 'md:border-r md:border-white/10 md:pr-4' : ''
              }`}
            >
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

      {/* CTA */}
      <section
        className="text-white py-24 px-6 relative overflow-hidden"
        style={{ backgroundColor: '#081832' }}
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
            Not sure which fits?
          </h2>
          <p className="text-xl text-white/75 mb-10 max-w-xl mx-auto leading-relaxed">
            Tell us what you need. We will point you to the right division and schedule the service.
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
