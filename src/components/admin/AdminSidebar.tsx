"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAdminModal } from "@/contexts/AdminModalContext";

/* ── Navigation structure ── */
const SECTIONS = [
  {
    label: "OPERATIONS",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Schedule", href: "/admin/schedule" },
      { label: "Customers", href: "/admin/customers" },
    ],
  },
  {
    label: "FINANCIAL",
    items: [
      { label: "Invoicing", href: "/admin/invoicing" },
      { label: "Integrations", href: "/admin/integrations" },
    ],
  },
  {
    label: "WEBSITE",
    items: [
      { label: "Content Editor", href: "/admin/hero-editor" },
      { label: "Services & Pricing", href: "/admin/services" },
      { label: "Service Fees", href: "/admin/services#fees" },
    ],
  },
];

const CREATE_ITEMS = ["New Booking", "New Customer", "New Invoice"];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openModal } = useAdminModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  function isActive(href: string) {
    return href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(href);
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/admin/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-[230px] bg-[#0B2040] text-white flex flex-col z-50">
      {/* ── Logo area ── */}
      <div
        className="px-5 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="text-[15px] font-bold text-white">Coastal Mobile</div>
        <div className="text-[11px] text-white/45 font-medium mt-0.5">
          Lube &amp; Tire Admin
        </div>
      </div>

      {/* ── Create New button ── */}
      <div className="px-4 pt-4 pb-2 relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="w-full bg-[#E07B2D] hover:bg-[#CC6A1F] transition rounded-[10px] text-[13px] font-semibold text-white py-2.5 cursor-pointer"
        >
          + Create New
        </button>

        {dropdownOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-[10px] shadow-lg z-50 overflow-hidden">
            {CREATE_ITEMS.map((item, i) => (
              <button
                key={item}
                onClick={() => {
                  setDropdownOpen(false);
                  if (item === "New Booking") openModal("booking");
                  else if (item === "New Customer") openModal("customer");
                  else if (item === "New Invoice") openModal("invoice");
                }}
                className={`block w-full text-left px-4 py-2.5 text-[13px] font-medium text-gray-900 hover:bg-gray-50 cursor-pointer ${
                  i < CREATE_ITEMS.length - 1
                    ? "border-b border-gray-200"
                    : ""
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Navigation sections ── */}
      <nav className="flex-1 overflow-y-auto pt-2">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-5 py-3 pb-1.5 text-[10px] font-bold text-white/35 uppercase tracking-[0.08em]">
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-5 py-2.5 text-sm cursor-pointer transition-all ${
                    active
                      ? "text-white font-semibold bg-white/[0.08] border-l-[3px] border-[#E07B2D]"
                      : "text-white/60 font-normal border-l-[3px] border-transparent hover:bg-white/[0.04] hover:text-white/85"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom actions ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="block px-5 py-2.5 text-[13px] text-white/55 hover:text-white/85 cursor-pointer transition"
        >
          View Site
        </a>
        <button
          onClick={handleSignOut}
          className="block w-full text-left px-5 py-2.5 text-[13px] text-white/40 hover:text-white/85 cursor-pointer transition"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
