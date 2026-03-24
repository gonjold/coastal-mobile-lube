import Link from "next/link";
import { Phone } from "lucide-react";
import HullStripe from "./HullStripe";
import { cloudinaryUrl, images } from "@/lib/cloudinary";

const quickLinks = [
  { label: "Services", href: "/services" },
  { label: "Fleet & Commercial", href: "/fleet" },
  { label: "Marine", href: "/marine" },
  { label: "About", href: "/about" },
  { label: "Service Areas", href: "/service-areas" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const serviceAreas = [
  "Tampa",
  "Brandon",
  "Riverview",
  "Wesley Chapel",
  "Plant City",
  "Temple Terrace",
  "Lutz",
  "Land O' Lakes",
];

export default function Footer() {
  return (
    <footer>
      <HullStripe />
      <div className="bg-navy text-white">
        <div className="section-inner px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
            {/* Column 1 - Brand */}
            <div className="flex flex-col gap-4">
              <img
                src={cloudinaryUrl(images.logo, { width: 180, quality: "auto", format: "auto" })}
                alt="Coastal Mobile Lube & Tire"
                className="h-10 w-auto"
              />
              <p className="font-semibold text-white text-base">
                Coastal Mobile Lube &amp; Tire
              </p>
              <p className="text-[#9CA3AF] text-sm">
                Automotive. Fleet. Marine.
              </p>
              <a
                href="tel:8137225823"
                className="inline-flex items-center gap-2 text-white text-lg font-semibold hover:text-teal-soft transition-colors"
              >
                <Phone size={18} />
                813-722-LUBE
              </a>
              {/* Social media placeholder */}
              <div className="flex gap-3 mt-2" aria-label="Social media links coming soon" />
            </div>

            {/* Column 2 - Quick Links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
                Quick Links
              </h3>
              <ul className="flex flex-col gap-2.5">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[#D1D5DB] text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 - Service Areas */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
                Service Areas
              </h3>
              <ul className="flex flex-col gap-2.5">
                {serviceAreas.map((area) => (
                  <li key={area}>
                    <Link
                      href="/service-areas"
                      className="text-[#D1D5DB] text-sm hover:text-white transition-colors"
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
        <div className="border-t border-white/10">
          <div className="section-inner px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-[#9CA3AF]">
            <p className="text-center md:text-left">
              &copy; 2026 Coastal Mobile Lube &amp; Tire. All rights reserved.
            </p>
            <p className="text-center md:text-right">
              Website by JG Systems
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
