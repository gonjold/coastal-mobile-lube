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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { openBooking } = useBooking();

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
    <header
      className="sticky top-0 z-50"
      style={{ background: "linear-gradient(135deg, #0F2847 0%, #0B2040 100%)" }}
    >
      <div className="section-inner flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/dgcdcqjrz/image/upload/w_200,q_auto:good,f_png/v1774315498/Coastal_Lube_logo_v1_zbx9qs.png"
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

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute top-0 right-0 w-72 h-full bg-[#0F2847] shadow-xl flex flex-col">
            <div className="flex items-center justify-end p-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="inline-flex items-center justify-center w-10 h-10 text-white"
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
                  className={`py-3 font-medium text-base border-b border-white/10 transition-colors ${
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
              <a
                href="tel:8137225823"
                className="inline-flex items-center justify-center gap-2 font-medium text-sm text-white/90 border-2 border-white/20 rounded-[10px] py-2.5 px-4"
              >
                <Phone size={16} />
                813-722-LUBE
              </a>
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={() => { openBooking(); setDrawerOpen(false); }}
              >
                Book Service
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
