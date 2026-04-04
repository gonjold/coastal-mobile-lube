"use client";

import Link from "next/link";

export default function InvoicingPage() {
  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#888] mb-6">
        <Link href="/admin" className="hover:text-[#1A5FAC] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[#0B2040] font-semibold">Invoicing</span>
      </div>

      <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FFF8F0] flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E07B2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-[#0B2040] mb-2">Invoicing</h2>
        <p className="text-[14px] text-[#888] mb-1">Create and send professional invoices to customers.</p>
        <p className="text-[13px] text-[#E07B2D] font-semibold">Coming Soon</p>
      </div>
    </div>
  );
}
