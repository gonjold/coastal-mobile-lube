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
