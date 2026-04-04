"use client";

import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#888] mb-6">
        <Link href="/admin" className="hover:text-[#1A5FAC] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[#0B2040] font-semibold">Pricing & Services</span>
      </div>

      <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#EBF4FF] flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A5FAC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-[#0B2040] mb-2">Pricing & Services</h2>
        <p className="text-[14px] text-[#888] mb-1">Manage service pricing, packages, and availability.</p>
        <p className="text-[13px] text-[#E07B2D] font-semibold">Coming Soon</p>
      </div>
    </div>
  );
}
