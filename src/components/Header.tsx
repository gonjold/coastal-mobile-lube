"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Phone, Menu, X } from "lucide-react";
import Button from "./Button";
import { useBooking } from "@/contexts/BookingContext";

const navLinks = [
  { label: "Automotive", href: "/services" },
  { label: "RV", href: "/rv" },
  { label: "Marine", href: "/marine" },
  { label: "Fleet", href: "/fleet" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(true);
  const pathname = usePathname();
  const { openBooking, openQuote } = useBooking();

  useEffect(() => {
    const hero = document.getElementById("hero-section");
    if (!hero) {
      setScrolledPastHero(true);
      return;
    }
    setScrolledPastHero(false);
    const observer = new IntersectionObserver(
      ([entry]) => setScrolledPastHero(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

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
    <>
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ease-in-out ${
        scrolledPastHero
          ? "bg-[#0B2040]/[0.88] border-white/[0.06]"
          : "bg-white/[0.12] border-white/[0.08]"
      }`}
      style={{
        backdropFilter: "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
      }}
    >
      <div className="section-inner flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/dgcdcqjrz/image/upload/v1775916096/Coastal_logo_bh3biu.svg"
            alt="Coastal Mobile Lube & Tire"
            className="h-8 lg:h-10 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="text-white font-[800] text-[18px] leading-tight">Coastal Mobile</span>
            <span className="text-white/45 font-semibold text-[12px] uppercase tracking-[2px]">Lube &amp; Tire</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-white"
                  : "text-white/85 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="tel:8137225823"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.18] rounded-[8px] px-5 py-2.5"
          >
            <Phone size={14} />
            813-722-LUBE
          </a>
          <Button variant="primary" size="sm" onClick={openBooking}>
            Book Service
          </Button>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-3">
          <a
            href="tel:8137225823"
            className="inline-flex items-center justify-center w-10 h-10 text-white/90 border-2 border-white/20 rounded-full"
            aria-label="Call 813-722-LUBE"
          >
            <Phone size={18} />
          </a>
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center justify-center w-10 h-10 text-white"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

    </header>

    {/* Mobile Drawer — rendered outside <header> to escape backdrop-filter containing block */}
    {drawerOpen && (
      <div
        className="fixed inset-0 z-[100] lg:hidden transition-all duration-300"
        style={{ animation: "drawerFadeIn 250ms ease-out" }}
      >
        <div
          className="absolute inset-0 bg-black/80"
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className="absolute top-0 right-0 w-80 max-w-[85vw] h-full bg-[#0A1628]/95 backdrop-blur-md shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-end p-4">
            <button
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center justify-center w-12 h-12 text-white"
              aria-label="Close menu"
            >
              <X size={26} />
            </button>
          </div>
          <nav className="flex flex-col px-6 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className={`min-h-[48px] py-4 font-semibold text-[17px] border-b border-white/10 transition-colors ${
                  pathname === link.href
                    ? "text-white"
                    : "text-white/85 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 px-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => { setDrawerOpen(false); openQuote(); }}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] font-semibold text-[15px] text-[#10B4B9] border-2 border-[#10B4B9]/60 rounded-[10px] py-3 px-4"
            >
              Get a Quote
            </button>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] font-semibold text-[15px] text-white border-2 border-white/25 rounded-[10px] py-3 px-4"
            >
              <Phone size={18} />
              813-722-LUBE
            </a>
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center min-h-[48px]"
              onClick={() => { openBooking(); setDrawerOpen(false); }}
            >
              Book Service
            </Button>
          </div>
        </div>
        <style>{`
          @keyframes drawerFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    )}
    </>
  );
}
