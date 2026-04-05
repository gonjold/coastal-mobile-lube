"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminAuthGuard from "@/components/AdminAuthGuard";

/* ── Nav items ── */
const NAV = [
  { label: "Dashboard", href: "/admin", icon: IconHome },
  { label: "Services", href: "/admin/services", icon: IconWrench },
  { label: "Schedule", href: "/admin/schedule", icon: IconCalendar },
  { label: "Customers", href: "/admin/customers", icon: IconPeople },
  { label: "Invoicing", href: "/admin/invoicing", icon: IconReceipt },
  { label: "Pricing", href: "/admin/pricing", icon: IconTag },
];

function getPageTitle(path: string) {
  const match = NAV.find((n) =>
    n.href === "/admin" ? path === "/admin" : path.startsWith(n.href)
  );
  return match?.label ?? "Admin";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? "");
    });
    return () => unsub();
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* ── Login page — no admin chrome ── */
  if (pathname === "/admin/login") {
    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html:
              "header, footer, #site-sticky-bar { display: none !important; } main { padding-bottom: 0 !important; }",
          }}
        />
        {children}
      </>
    );
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/admin/login");
  }

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  /* ── Sidebar content (shared between desktop & mobile drawer) ── */
  function SidebarInner({ iconsOnly }: { iconsOnly?: boolean }) {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <Link
          href="/admin"
          className={`flex items-center gap-2.5 px-4 py-5 border-b border-white/10 ${
            iconsOnly ? "justify-center" : ""
          }`}
        >
          {/* Wave / anchor icon */}
          <div className="w-8 h-8 rounded-lg bg-[#E07B2D] flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12c2-3 4-4 6-4s4 1 6 4 4 4 6 4" />
              <path d="M2 18c2-3 4-4 6-4s4 1 6 4 4 4 6 4" />
            </svg>
          </div>
          {!iconsOnly && (
            <span className="text-[15px] font-[800] text-white leading-tight whitespace-nowrap">
              Coastal Mobile
            </span>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={iconsOnly ? item.label : undefined}
                className={`group flex items-center gap-3 rounded-lg transition-colors relative ${
                  iconsOnly ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                } ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {/* Orange left accent */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#E07B2D]" />
                )}
                <item.icon className="w-[20px] h-[20px] shrink-0" />
                {!iconsOnly && (
                  <span className="text-[14px] font-semibold">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleSignOut}
            title={iconsOnly ? "Sign Out" : undefined}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/50 hover:text-white hover:bg-white/5 transition-colors ${
              iconsOnly ? "justify-center" : ""
            }`}
          >
            <IconLogout className="w-[20px] h-[20px] shrink-0" />
            {!iconsOnly && (
              <span className="text-[13px] font-semibold">Sign Out</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hide public site chrome */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "header, footer, #site-sticky-bar { display: none !important; } main { padding-bottom: 0 !important; }",
        }}
      />

      <div className="flex h-screen bg-[#F5F6F8]">
        {/* ═══ SIDEBAR — desktop full ═══ */}
        <aside className="hidden lg:flex flex-col w-[220px] bg-[#0B2040] shrink-0">
          <SidebarInner />
        </aside>

        {/* ═══ SIDEBAR — tablet icons-only ═══ */}
        <aside className="hidden md:flex lg:hidden flex-col w-[64px] bg-[#0B2040] shrink-0">
          <SidebarInner iconsOnly />
        </aside>

        {/* ═══ SIDEBAR — mobile drawer ═══ */}
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <aside className="fixed inset-y-0 left-0 w-[240px] bg-[#0B2040] z-50 md:hidden shadow-2xl animate-slide-in">
              <SidebarInner />
            </aside>
          </>
        )}

        {/* ═══ MAIN AREA ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── Top bar ── */}
          <header className="flex items-center gap-4 px-4 lg:px-6 py-3 bg-white border-b border-[#e8e8e8] shrink-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-[#f0f0f0] transition-colors"
              aria-label="Open menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B2040"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Page title */}
            <h1 className="text-[18px] font-[800] text-[#0B2040] flex-1">
              {getPageTitle(pathname)}
            </h1>

            {/* Right side */}
            <div className="flex items-center gap-3 shrink-0">
              {email && (
                <span className="hidden sm:block text-[13px] text-[#888] font-medium truncate max-w-[200px]">
                  {email}
                </span>
              )}
              <Link
                href="/"
                className="text-[13px] font-semibold text-[#1A5FAC] hover:underline whitespace-nowrap"
              >
                Back to site &rarr;
              </Link>
            </div>
          </header>

          {/* ── Content ── */}
          <main className="flex-1 overflow-auto">
            <AdminAuthGuard>{children}</AdminAuthGuard>
          </main>
        </div>
      </div>

      {/* Slide-in animation for mobile drawer */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
            .animate-slide-in { animation: slideIn 0.2s ease-out; }
          `,
        }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════
   SVG Icon components
   ═══════════════════════════════════════════════ */

function IconHome({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconPeople({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function IconWrench({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
