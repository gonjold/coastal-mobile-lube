"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  Anchor,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileCheck,
  FileText,
  ImageIcon,
  LayoutGrid,
  LogOut,
  Menu,
  Percent,
  Plug,
  Plus,
  QrCode,
  Receipt,
  Settings,
  Sparkles,
  Type,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useAdminModal } from "@/contexts/AdminModalContext";
import { useCommandPalette } from "@/components/admin/CommandPalette";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavSection = { label: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    label: "CRM",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutGrid },
      { label: "Schedule", href: "/admin/schedule", icon: CalendarDays },
      { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
      { label: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "ACCOUNTING",
    items: [
      { label: "Invoices", href: "/admin/invoices", icon: Receipt },
      { label: "Invoicing (legacy)", href: "/admin/invoicing", icon: FileText },
      { label: "Fees", href: "/admin/fees", icon: Percent },
      { label: "Integrations", href: "/admin/integrations", icon: Plug },
    ],
  },
  {
    label: "WEBSITE",
    items: [
      { label: "Services CMS", href: "/admin/services", icon: Settings },
      { label: "Photos", href: "/admin/photos", icon: ImageIcon },
      { label: "Copy editor", href: "/admin/copy", icon: Type },
      { label: "Hero editor", href: "/admin/hero-editor", icon: Sparkles },
      { label: "QR codes", href: "/admin/qr", icon: QrCode },
    ],
  },
  {
    label: "FIELD",
    items: [
      { label: "Team", href: "/admin/team", icon: UserCog },
      { label: "Jobs", href: "/tech/jobs", icon: Wrench },
      { label: "FDACS settings", href: "/admin/fdacs", icon: FileCheck },
    ],
  },
];

const SIDEBAR_OPEN_SECTIONS_KEY = "admin-sidebar-open-sections";

function findContainingSection(pathname: string): string {
  for (const section of SECTIONS) {
    if (
      section.items.some((item) =>
        item.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(item.href),
      )
    ) {
      return section.label;
    }
  }
  return SECTIONS[0].label;
}

export default function AdminSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-primary text-primary-foreground border-r border-white/10"
        style={{
          width: collapsed ? 56 : 240,
          transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <SidebarBody collapsed={collapsed} onToggle={onToggle} />
      </aside>

      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-md transition hover:opacity-90"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[260px] bg-primary text-primary-foreground border-r-0 p-0"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SidebarBody
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            mobile
          />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}

function SidebarBody({
  collapsed,
  onToggle,
  mobile = false,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { openModal } = useAdminModal();
  const palette = useCommandPalette();

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(SIDEBAR_OPEN_SECTIONS_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {}
    return new Set([findContainingSection(pathname)]);
  });

  useEffect(() => {
    setOpenSections((prev) => {
      const containing = findContainingSection(pathname);
      if (prev.has(containing)) return prev;
      const next = new Set(prev);
      next.add(containing);
      return next;
    });
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_OPEN_SECTIONS_KEY,
        JSON.stringify(Array.from(openSections)),
      );
    } catch {}
  }, [openSections]);

  function toggleSection(label: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  async function handleSignOut() {
    await signOut(auth);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/admin/login");
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center border-b border-white/10",
          collapsed ? "justify-center py-3" : "px-4 py-4 justify-between",
        )}
      >
        {!collapsed && (
          <div>
            <div className="text-[14px] font-semibold tracking-tight leading-tight">
              Coastal Mobile
            </div>
            <div className="text-[11px] text-white/55 mt-0.5">
              Lube &amp; Tire Admin
            </div>
          </div>
        )}
        {!mobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white transition-colors duration-150"
              >
                {collapsed ? (
                  <ChevronsRight className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <ChevronsLeft className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div
        className={cn(
          "border-b border-white/10",
          collapsed ? "px-2 py-2.5 flex justify-center" : "px-3 py-3 space-y-2",
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => palette.open()}
                aria-label="Open command palette"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity duration-150"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Search &amp; create (⌘K)</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <button
              type="button"
              onClick={() => palette.open()}
              className="w-full inline-flex items-center justify-between gap-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors duration-150 text-[13px] text-white/75 px-3 py-2"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4 text-accent" strokeWidth={2} />
                Search &amp; create
              </span>
              <kbd className="text-[10px] font-mono text-white/45 border border-white/15 rounded px-1.5 py-0.5">
                ⌘K
              </kbd>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
                  Create new
                  <ChevronDown
                    className="h-3.5 w-3.5 ml-auto opacity-70"
                    strokeWidth={1.75}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem onClick={() => openModal("booking")}>
                  <CalendarCheck className="h-4 w-4 mr-2" strokeWidth={1.75} />
                  New booking
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModal("customer")}>
                  <Users className="h-4 w-4 mr-2" strokeWidth={1.75} />
                  New customer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModal("invoice")}>
                  <Receipt className="h-4 w-4 mr-2" strokeWidth={1.75} />
                  New invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {SECTIONS.map((section) => {
          const open = openSections.has(section.label);
          return (
            <div key={section.label} className="mb-0.5">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-semibold tracking-[0.08em] text-white/45 hover:text-white/75 transition-colors duration-150"
                >
                  <span>{section.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      open ? "rotate-0" : "-rotate-90",
                    )}
                    strokeWidth={2}
                  />
                </button>
              )}
              {(collapsed || open) && (
                <div className={cn("space-y-px", collapsed ? "" : "px-2")}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    if (collapsed) {
                      return (
                        <div key={item.href} className="flex justify-center py-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={item.href}
                                aria-label={item.label}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150",
                                  active
                                    ? "bg-white/15 text-white"
                                    : "text-white/55 hover:bg-white/10 hover:text-white",
                                )}
                              >
                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150",
                          active
                            ? "bg-white/10 text-white font-semibold ring-1 ring-inset ring-accent/40"
                            : "text-white/70 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={cn("border-t border-white/10", collapsed ? "py-2" : "p-3")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View site"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/55 hover:bg-white/10 hover:text-white transition-colors duration-150"
                >
                  <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">View site</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/55 hover:bg-white/10 hover:text-white transition-colors duration-150"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] text-white/65 hover:text-white transition-colors duration-150"
            >
              <Anchor className="h-3.5 w-3.5" strokeWidth={1.75} />
              View site
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-[12px] text-white/65 hover:text-white transition-colors duration-150"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
