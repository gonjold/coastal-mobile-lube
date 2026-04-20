"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import { BrandLogo } from "./brand/BrandLogo";

const serviceLinks = [
  { label: "All Services", href: "/services-overview" },
  { label: "Automotive", href: "/services" },
  { label: "Fleet & Commercial", href: "/fleet" },
  { label: "Marine", href: "/marine" },
  { label: "RV", href: "/rv" },
  { label: "Book Service", href: "/book" },
];

const companyLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Service Areas", href: "/service-areas" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Book Service", href: "/book" },
];

export default function Footer() {
  const { openBooking } = useBooking();

  return (
    <footer className="bg-[#0B2040]">
      <div className="section-inner px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-10 lg:gap-8">
          {/* Column 1 - Brand */}
          <div className="flex flex-col gap-3">
            <BrandLogo
              variant="primary"
              width={180}
              height={50}
              className="max-w-[180px] h-auto object-contain mb-1"
            />
            <p className="text-sm text-white/40">
              Cars. Boats. RVs. Fleets. One call.
            </p>
            <a
              href="tel:8137225823"
              className="inline-flex items-center gap-2 font-bold text-lg text-[#E07B2D]"
            >
              <Phone size={18} />
              813-722-LUBE
            </a>
          </div>

          {/* Column 2 - Services */}
          <div>
            <h3 className="text-[11px] uppercase text-white/35 tracking-[1.5px] mb-4">
              Services
            </h3>
            <ul className="flex flex-col gap-2.5">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  {link.href === "/book" ? (
                    <button
                      onClick={openBooking}
                      className="text-sm text-[#aaa] hover:text-white transition-colors"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[#aaa] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Company */}
          <div>
            <h3 className="text-[11px] uppercase text-white/35 tracking-[1.5px] mb-4">
              Company
            </h3>
            <ul className="flex flex-col gap-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  {link.href === "/book" ? (
                    <button
                      onClick={openBooking}
                      className="text-sm text-[#aaa] hover:text-white transition-colors"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[#aaa] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.1]">
        <div className="section-inner px-6 py-5 pb-24 lg:pb-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <img src="/images/ase-badge.png" alt="ASE Certified" className="w-[35px] h-auto object-contain" style={{ filter: "brightness(0) invert(1)", opacity: 0.6 }} />
            <p className="text-[12px] text-white/40">
              2026 Coastal Mobile Lube & Tire. All rights reserved.
            </p>
            <span className="text-[12px] text-white/25">·</span>
            <Link href="/privacy" className="text-[12px] text-white/40 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[12px] text-white/25">·</span>
            <Link href="/terms" className="text-[12px] text-white/40 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-[12px] text-white/40">
            Website by Gold Co LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
