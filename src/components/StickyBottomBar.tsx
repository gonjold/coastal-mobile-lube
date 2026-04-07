"use client";

import { useBooking } from "@/contexts/BookingContext";

export default function StickyBottomBar() {
  const { openBooking } = useBooking();

  return (
    <div id="site-sticky-bar" className="fixed bottom-0 left-0 right-0 flex lg:hidden items-center gap-3 px-4 py-3 bg-white border-t border-[#eee] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-[100]">
      <a
        href="tel:8137225823"
        className="inline-flex items-center justify-center w-12 h-12 shrink-0 text-[#0B2040] border-2 border-[#e8e8e8] rounded-[10px]"
        aria-label="Call 813-722-LUBE"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </a>
      <button
        onClick={openBooking}
        className="flex-1 inline-flex items-center justify-center font-semibold text-white rounded-[var(--radius-button)] py-3.5 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
      >
        Book Service
      </button>
    </div>
  );
}
