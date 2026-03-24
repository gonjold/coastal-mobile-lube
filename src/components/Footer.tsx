import Link from "next/link";
import { Phone } from "lucide-react";

const serviceLinks = [
  { label: "Automotive", href: "/services" },
  { label: "Fleet & Commercial", href: "/fleet" },
  { label: "Marine", href: "/marine" },
  { label: "Book Online", href: "/book" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Service Areas", href: "/service-areas" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const areaLinks = ["Tampa", "Brandon", "Riverview", "Wesley Chapel", "Plant City", "Lutz"];

export default function Footer() {
  return (
    <footer className="bg-[#0B2040]">
      <div className="section-inner px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-8">
          {/* Column 1 - Brand */}
          <div className="flex flex-col gap-3">
            <p className="font-bold text-white text-lg">
              Coastal Mobile Lube & Tire
            </p>
            <p className="text-sm text-white/40">
              Automotive. Fleet. Marine.
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
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
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
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Service Areas */}
          <div>
            <h3 className="text-[11px] uppercase text-white/35 tracking-[1.5px] mb-4">
              Service Areas
            </h3>
            <ul className="flex flex-col gap-2.5">
              {areaLinks.map((area) => (
                <li key={area}>
                  <Link
                    href="/service-areas"
                    className="text-sm text-white/65 hover:text-white transition-colors"
                  >
                    {area}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.08]">
        <div className="section-inner px-6 py-5 pb-24 lg:pb-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/25">
            2026 Coastal Mobile Lube & Tire. All rights reserved.
          </p>
          <p className="text-[11px] text-white/25">
            Website by JG Systems
          </p>
        </div>
      </div>
    </footer>
  );
}
