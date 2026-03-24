"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Phone, Menu, X } from "lucide-react";
import HullStripe from "./HullStripe";
import Button from "./Button";
import { cloudinaryUrl, images } from "@/lib/cloudinary";

const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Fleet & Commercial", href: "/fleet" },
  { label: "Marine", href: "/marine" },
  { label: "About", href: "/about" },
  { label: "Service Areas", href: "/service-areas" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="sticky top-0 z-50">
      <header
        className={`bg-white transition-shadow ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="section-inner flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img
              src={cloudinaryUrl(images.logo, { width: 200, quality: "auto", format: "auto" })}
              alt="Coastal Mobile Lube & Tire"
              className="h-10 w-auto md:h-12"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium text-sm transition-colors ${pathname === link.href ? "text-teal" : "text-text-body hover:text-blue"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="tel:8137225823"
              className="inline-flex items-center gap-2 bg-teal text-white rounded-[var(--radius-pill)] px-4 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Phone size={14} />
              813-722-LUBE
            </a>
            <Button href="/book" variant="primary" size="sm">
              Book Now
            </Button>
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-3">
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center w-10 h-10 bg-teal text-white rounded-full"
              aria-label="Call 813-722-LUBE"
            >
              <Phone size={18} />
            </a>
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center justify-center w-10 h-10 text-text-body"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <HullStripe />

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute top-0 right-0 w-72 h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-end p-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="inline-flex items-center justify-center w-10 h-10 text-text-body"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex flex-col px-6 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`py-3 font-medium text-base border-b border-border-light transition-colors ${pathname === link.href ? "text-teal" : "text-text-body hover:text-blue"}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 px-6 flex flex-col gap-3">
              <a
                href="tel:8137225823"
                className="inline-flex items-center justify-center gap-2 bg-teal text-white rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-semibold"
              >
                <Phone size={16} />
                813-722-LUBE
              </a>
              <Button
                href="/book"
                variant="primary"
                size="md"
                className="w-full justify-center"
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
