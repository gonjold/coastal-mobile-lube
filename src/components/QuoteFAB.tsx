"use client";

import { useState, useEffect } from "react";
import { useBooking } from "@/contexts/BookingContext";
import QuoteModal from "./QuoteModal";

export default function QuoteFAB() {
  const { bookingOpen } = useBooking();
  const [quoteOpen, setQuoteOpen] = useState(false);
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
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (bookingOpen || quoteOpen) return <QuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} />;

  // Desktop: only show after scrolling past hero (or if no hero exists)
  // Mobile: always show
  const desktopVisible = !hasHero || pastHero;

  return (
    <>
      {/* Mobile FAB — always visible */}
      <button
        onClick={() => setQuoteOpen(true)}
        className="lg:hidden fixed z-40 h-[48px] rounded-full flex items-center gap-2 px-[18px] pl-[14px] text-white text-[14px] font-semibold whitespace-nowrap"
        style={{
          bottom: 72,
          right: 16,
          background: "linear-gradient(135deg, #0D8A8F, #10B4B9)",
          boxShadow: "0 4px 16px rgba(13,138,143,0.5), 0 0 0 3px rgba(16,180,185,0.15)",
          animation: "fabPulse 3s infinite",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Get a Quote
      </button>

      {/* Desktop FAB — visible after scrolling past hero */}
      <button
        onClick={() => setQuoteOpen(true)}
        className="hidden lg:flex fixed z-40 h-[48px] rounded-full items-center gap-2 px-[18px] pl-[14px] text-white text-[14px] font-semibold whitespace-nowrap transition-all duration-300"
        style={{
          bottom: 24,
          right: 24,
          background: "linear-gradient(135deg, #0D8A8F, #10B4B9)",
          boxShadow: "0 4px 16px rgba(13,138,143,0.5), 0 0 0 3px rgba(16,180,185,0.15)",
          animation: "fabPulse 3s infinite",
          opacity: desktopVisible ? 1 : 0,
          transform: desktopVisible ? "translateY(0)" : "translateY(20px)",
          pointerEvents: desktopVisible ? "auto" : "none",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Get a Quote
      </button>

      <QuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
