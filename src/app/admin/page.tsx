"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  type Booking,
  formatPhone,
  formatTimestamp,
  getStatusStyle,
  getSourceLabel,
  buildCustomerList,
  toISODate,
} from "./shared";

export default function AdminHome() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  /* ── Computed stats ── */
  const totalBookings = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const customers = buildCustomerList(bookings);
  const totalCustomers = customers.length;

  // This week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const weeklyBookings = bookings.filter((b) => {
    if (!b.createdAt?.toDate) return false;
    return b.createdAt.toDate() >= startOfWeek;
  }).length;

  // Recent 5 bookings
  const recent = bookings.slice(0, 5);

  // Activity detail expansion
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-[800] text-[#0B2040] mb-1">Dashboard</h1>
        <p className="text-[14px] text-[#888]">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* ═══ TOP ROW - Quick Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Bookings */}
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#EBF4FF] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5FAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <p className="text-[32px] font-[800] text-[#0B2040] leading-none mb-1">{totalBookings}</p>
          <p className="text-[13px] text-[#888] font-medium">Total Bookings</p>
        </div>

        {/* This Week */}
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#F0FAF0] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
          <p className="text-[32px] font-[800] text-[#16a34a] leading-none mb-1">{weeklyBookings}</p>
          <p className="text-[13px] text-[#888] font-medium">This Week</p>
        </div>

        {/* Pending */}
        <div className="bg-white border-2 border-[#E07B2D]/30 rounded-[12px] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#FFF8F0] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <p className="text-[32px] font-[800] text-[#E07B2D] leading-none mb-1">{pendingCount}</p>
          <p className="text-[13px] text-[#E07B2D] font-semibold">Pending</p>
        </div>

        {/* Total Customers */}
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#F5F0FF] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <p className="text-[32px] font-[800] text-[#7c3aed] leading-none mb-1">{totalCustomers}</p>
          <p className="text-[13px] text-[#888] font-medium">Total Customers</p>
        </div>
      </div>

      {/* ═══ NAVIGATION CARDS ═══ */}
      <h2 className="text-[16px] font-bold text-[#0B2040] mb-4">Manage</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {/* Schedule */}
        <Link
          href="/admin/schedule"
          className="group bg-white border border-[#e8e8e8] rounded-[12px] p-5 hover:border-[#1A5FAC] hover:shadow-md transition-all"
        >
          <div className="w-11 h-11 rounded-[10px] bg-[#EBF4FF] flex items-center justify-center mb-4 group-hover:bg-[#1A5FAC] transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A5FAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-colors">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 className="text-[15px] font-bold text-[#0B2040] mb-1">Schedule</h3>
          <p className="text-[13px] text-[#888] leading-snug">View calendar, incoming bookings, and appointments</p>
        </Link>

        {/* Customers */}
        <Link
          href="/admin/customers"
          className="group bg-white border border-[#e8e8e8] rounded-[12px] p-5 hover:border-[#7c3aed] hover:shadow-md transition-all"
        >
          <div className="w-11 h-11 rounded-[10px] bg-[#F5F0FF] flex items-center justify-center mb-4 group-hover:bg-[#7c3aed] transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-colors">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="text-[15px] font-bold text-[#0B2040] mb-1">Customers</h3>
          <p className="text-[13px] text-[#888] leading-snug">Customer database, history, and notes</p>
        </Link>

        {/* Invoicing */}
        <Link
          href="/admin/invoicing"
          className="group bg-white border border-[#e8e8e8] rounded-[12px] p-5 hover:border-[#E07B2D] hover:shadow-md transition-all"
        >
          <div className="w-11 h-11 rounded-[10px] bg-[#FFF8F0] flex items-center justify-center mb-4 group-hover:bg-[#E07B2D] transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-colors">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h3 className="text-[15px] font-bold text-[#0B2040] mb-1">Invoicing</h3>
          <p className="text-[13px] text-[#888] leading-snug">Create and send invoices</p>
        </Link>

        {/* Pricing & Services */}
        <Link
          href="/admin/pricing"
          className="group bg-white border border-[#e8e8e8] rounded-[12px] p-5 hover:border-[#0D8A8F] hover:shadow-md transition-all"
        >
          <div className="w-11 h-11 rounded-[10px] bg-[#ECFBFB] flex items-center justify-center mb-4 group-hover:bg-[#0D8A8F] transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D8A8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-colors">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h3 className="text-[15px] font-bold text-[#0B2040] mb-1">Pricing & Services</h3>
          <p className="text-[13px] text-[#888] leading-snug">Manage service pricing and availability</p>
        </Link>
      </div>

      {/* ═══ RECENT ACTIVITY ═══ */}
      <h2 className="text-[16px] font-bold text-[#0B2040] mb-4">Recent Activity</h2>
      {recent.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-12 text-center">
          <p className="text-[14px] text-[#888]">No bookings yet. They&apos;ll appear here when customers book.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] overflow-hidden">
          {recent.map((b, i) => {
            const status = getStatusStyle(b.status);
            const source = getSourceLabel(b.source);
            const isExpanded = expandedActivity === b.id;
            return (
              <div key={b.id}>
                <div
                  onClick={() => setExpandedActivity(isExpanded ? null : b.id)}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[#FAFBFC] ${
                    i < recent.length - 1 && !isExpanded ? "border-b border-[#f0f0f0]" : ""
                  }`}
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    b.status === "pending" ? "bg-[#E07B2D]"
                    : b.status === "confirmed" ? "bg-[#1A5FAC]"
                    : b.status === "completed" ? "bg-[#16a34a]"
                    : "bg-[#999]"
                  }`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#0B2040] truncate">
                      {b.name || "—"}
                      <span className="ml-2 text-[13px] font-normal text-[#888]">{b.service || ""}</span>
                    </p>
                    <p className="text-[12px] text-[#888]">{formatTimestamp(b.createdAt)}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold text-white ${source.color}`}>
                      {source.label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Chevron */}
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-b border-[#f0f0f0]">
                    <div className="bg-[#FAFBFC] rounded-[10px] p-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                      <Detail label="Phone" value={formatPhone(b.phone)} href={b.phone ? `tel:${b.phone}` : undefined} />
                      <Detail label="Email" value={b.email || "—"} href={b.email ? `mailto:${b.email}` : undefined} />
                      <Detail label="Address" value={b.address || "—"} />
                      <Detail label="Preferred Date" value={b.preferredDate || "—"} />
                      <Detail label="Time Window" value={b.timeWindow || "—"} />
                      <Detail label="Contact Pref" value={b.contactPreference || "—"} />
                      {b.confirmedDate && <Detail label="Confirmed Date" value={b.confirmedDate} />}
                      {b.confirmedArrivalWindow && <Detail label="Arrival Window" value={b.confirmedArrivalWindow} />}
                      {b.notes && <div className="col-span-2 md:col-span-3"><Detail label="Notes" value={b.notes} /></div>}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Link
                        href="/admin/schedule"
                        className="text-[13px] font-semibold text-[#1A5FAC] hover:underline"
                      >
                        View in Schedule &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick link to see all */}
      {bookings.length > 5 && (
        <div className="mt-4 text-center">
          <Link
            href="/admin/schedule"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-[#E07B2D] rounded-lg hover:bg-[#CC6A1F] transition-colors"
          >
            View All Bookings
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-0.5">{label}</p>
      {href ? (
        <a href={href} className="text-[13px] text-[#1A5FAC] font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{value}</a>
      ) : (
        <p className="text-[13px] text-[#0B2040] font-medium">{value}</p>
      )}
    </div>
  );
}
