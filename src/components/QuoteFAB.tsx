"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useBooking } from "@/contexts/BookingContext";

export default function QuoteFAB() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const { bookingOpen, quoteOpen, openQuote } = useBooking();
  const [pastHero, setPastHero] = useState(false);
  const [hasHero, setHasHero] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-section");
    if (!hero) {
      setHasHero(false);
      setPastHero(true);
      return;
    }
    setHasHero(true);

    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (isAdmin || bookingOpen || quoteOpen) return null;

  // Desktop: only show after scrolling past hero (or if no hero exists)
  // Mobile: always show
  const desktopVisible = !hasHero || pastHero;

  return (
    <>
      {/* Mobile FAB — always visible */}
      <button
        onClick={openQuote}
        className="lg:hidden fixed z-40 h-[54px] rounded-[27px] flex items-center gap-2 px-[20px] pl-[16px] text-white text-[15px] font-semibold whitespace-nowrap"
        style={{
          bottom: 72,
          right: 16,
          background: "linear-gradient(135deg, #0D8A8F, #10B4B9)",
          boxShadow: "0 4px 16px rgba(13,138,143,0.5), 0 0 0 3px rgba(16,180,185,0.2)",
          animation: "fabPulse 3s infinite",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Get a Quote
      </button>

      {/* Desktop FAB — visible after scrolling past hero */}
      <button
        onClick={openQuote}
        className="hidden lg:flex fixed z-40 h-[54px] rounded-[27px] items-center gap-2 px-[20px] pl-[16px] text-white text-[15px] font-semibold whitespace-nowrap transition-all duration-300"
        style={{
          bottom: 24,
          right: 24,
          background: "linear-gradient(135deg, #0D8A8F, #10B4B9)",
          boxShadow: "0 4px 16px rgba(13,138,143,0.5), 0 0 0 3px rgba(16,180,185,0.2)",
          animation: "fabPulse 3s infinite",
          opacity: desktopVisible ? 1 : 0,
          transform: desktopVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(1)",
          pointerEvents: desktopVisible ? "auto" : "none",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Get a Quote
      </button>
    </>
  );
}
