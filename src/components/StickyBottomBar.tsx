"use client";

import { Phone } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

export default function StickyBottomBar() {
  const { openBooking } = useBooking();

  return (
    <div
      id="site-sticky-bar"
      className="fixed bottom-0 left-0 right-0 flex lg:hidden items-center gap-3 z-40 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ padding: "10px 16px" }}
    >
      <a
        href="tel:8137225823"
        className="inline-flex items-center justify-center gap-2 font-semibold text-[#0B2040] border-2 border-[#0B2040] rounded-[var(--radius-button)] bg-white transition-colors hover:bg-[#f0f4f8]"
        style={{ width: "40%", height: "44px", fontSize: "14px" }}
      >
        <Phone size={16} />
        Call
      </a>
      <button
        onClick={openBooking}
        className="inline-flex items-center justify-center font-bold text-white rounded-[var(--radius-button)] bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
        style={{ width: "60%", height: "44px", fontSize: "15px" }}
      >
        Book Service
      </button>
    </div>
  );
}
