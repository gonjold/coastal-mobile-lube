"use client";

import { type ReactNode, useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { formatCurrency } from "@/lib/formatCurrency";
import { type Booking, buildCustomerList, formatPhone, getServiceLabel } from "@/app/admin/shared";

/* ── Types for global search ── */
interface SearchInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: string;
}

export default function AdminTopBar({
  title,
  subtitle,
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  const isGlobalSearch = !onSearchChange;

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex justify-between items-center px-8 py-3.5">
        {/* Left side */}
        <div>
          <h1 className="text-xl font-bold text-[#0B2040]">{title}</h1>
          {subtitle && (
            <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isGlobalSearch ? (
            <GlobalSearchBar />
          ) : (
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 gap-2 min-w-[220px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || "Search customers, bookings..."}
                className="border-none outline-none bg-transparent text-[13px] w-full"
              />
            </div>
          )}

          {/* User avatar */}
          <div className="w-[34px] h-[34px] rounded-full bg-[#0B2040] text-white flex items-center justify-center text-[13px] font-bold">
            JB
          </div>

          {/* Page-specific action buttons */}
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Global Search Component ── */

function GlobalSearchBar() {
  const router = useRouter();
  const [query_, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<SearchInvoice[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  /* Fetch data on mount */
  useEffect(() => {
    const qBookings = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(qBookings, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
    });
    const qInvoices = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(qInvoices, (snap) => {
      setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SearchInvoice));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  /* Click outside to close */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* Escape to close */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const customers = useMemo(() => buildCustomerList(bookings), [bookings]);

  const q = query_.toLowerCase().trim();
  const showDropdown = open && q.length >= 2;

  const customerResults = useMemo(() => {
    if (q.length < 2) return [];
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)),
      )
      .slice(0, 3);
  }, [q, customers]);

  const bookingResults = useMemo(() => {
    if (q.length < 2) return [];
    return bookings
      .filter(
        (b) =>
          (b.name || b.customerName || "").toLowerCase().includes(q) ||
          (getServiceLabel(b) || "").toLowerCase().includes(q),
      )
      .slice(0, 3);
  }, [q, bookings]);

  const invoiceResults = useMemo(() => {
    if (q.length < 2) return [];
    return invoices
      .filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q),
      )
      .slice(0, 3);
  }, [q, invoices]);

  const hasResults = customerResults.length > 0 || bookingResults.length > 0 || invoiceResults.length > 0;

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 gap-2 min-w-[220px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query_}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query_.length >= 2) setOpen(true); }}
          placeholder="Search customers, bookings..."
          className="border-none outline-none bg-transparent text-[13px] w-full"
        />
      </div>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 w-[400px] max-h-[400px] overflow-y-auto z-[60]">
          {!hasResults && (
            <p className="px-4 py-6 text-center text-[13px] text-gray-500">No results found</p>
          )}

          {customerResults.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase">Customers</div>
              {customerResults.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(`/admin/customers?search=${encodeURIComponent(c.name)}`);
                  }}
                  className="block w-full text-left px-4 py-2.5 cursor-pointer hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-[#0B2040]">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.phone ? formatPhone(c.phone) : ""}{c.email ? ` · ${c.email}` : ""}</div>
                </button>
              ))}
            </>
          )}

          {bookingResults.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase">Bookings</div>
              {bookingResults.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(`/admin/schedule?select=${b.id}`);
                  }}
                  className="block w-full text-left px-4 py-2.5 cursor-pointer hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-[#0B2040]">{b.name || b.customerName || "—"}</div>
                  <div className="text-xs text-gray-500">
                    {getServiceLabel(b)} · {b.confirmedDate || b.preferredDate || "No date"}
                  </div>
                </button>
              ))}
            </>
          )}

          {invoiceResults.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase">Invoices</div>
              {invoiceResults.map((i) => (
                <button
                  key={i.id}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(`/admin/invoicing?select=${i.id}`);
                  }}
                  className="block w-full text-left px-4 py-2.5 cursor-pointer hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-[#0B2040]">{i.invoiceNumber}</div>
                  <div className="text-xs text-gray-500">
                    {i.customerName} · {formatCurrency(i.total)} · {i.status}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
