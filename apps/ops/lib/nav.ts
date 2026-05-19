/* A3f Phase 1.1: role-based nav helper - single source of truth for sidebar,
 * mobile tab bar, More drawer, command palette. Replaces the role-blind
 * SIDEBAR_SECTIONS export in sidebarConfig.ts as the data layer; Phase 3
 * rewires consumers to read from here.
 *
 * Two role-shaped item lists:
 * - OWNER_NAV: 10 active routes (Home/Today/Schedule/Jobs/Customers/Invoices/
 *   Team/Services/Fees/Integrations) + 4 future-locked stubs (Estimates,
 *   Quick Quotes, Reports, Settings).
 * - TECH_NAV: 4 routes only (Today/Jobs/Schedule/Customers). Direct URL
 *   access to other routes is silently redirected by Phase 3's middleware
 *   guard; no "no permission" surface.
 *
 * admin_only role gets the OWNER_NAV today. Future divergence (if needed)
 * can branch off in getNavItemsForRole.
 *
 * tabBarOrder convention:
 * - 1-4: primary tabs in MobileTabBar (renders in this exact order)
 * - 5+:  overflow items in More drawer
 * - undefined: sidebar-only (no mobile representation)
 *
 * The four OWNER tabBar items (Today/Jobs/Customers/Invoices) and the four
 * TECH tabBar items (Today/Jobs/Schedule/Customers) match the WO-A3F locked
 * decision.
 */
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Clock,
  Calendar,
  Wrench,
  Users,
  FileText,
  Receipt,
  Quote,
  BarChart3,
  Package,
  DollarSign,
  Plug,
  Settings,
} from "lucide-react";
import type { UserRole } from "@coastal/shared-types";

export type NavGroup = "Operations" | "Sales" | "Insights" | "Admin";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  available: boolean;
  availableIn?: string;
  group: NavGroup;
  /** Tab bar slot. 1-4 = primary tabs. 5+ = More drawer. Undefined = sidebar only. */
  tabBarOrder?: number;
}

const OWNER_NAV: NavItem[] = [
  // Operations
  { href: "/today", label: "Today", icon: Clock, available: true, group: "Operations", tabBarOrder: 1 },
  { href: "/jobs", label: "Jobs", icon: Wrench, available: true, group: "Operations", tabBarOrder: 2 },
  { href: "/customers", label: "Customers", icon: Users, available: true, group: "Operations", tabBarOrder: 3 },
  { href: "/home", label: "Home", icon: Home, available: true, group: "Operations", tabBarOrder: 5 },
  { href: "/schedule", label: "Schedule", icon: Calendar, available: true, group: "Operations", tabBarOrder: 6 },

  // Sales
  { href: "/invoices", label: "Invoices", icon: Receipt, available: true, group: "Sales", tabBarOrder: 4 },
  { href: "/estimates", label: "Estimates", icon: FileText, available: false, availableIn: "A5", group: "Sales" },
  { href: "/quotes", label: "Quick Quotes", icon: Quote, available: false, availableIn: "A5", group: "Sales" },

  // Insights
  { href: "/reports", label: "Reports", icon: BarChart3, available: false, availableIn: "A7", group: "Insights" },

  // Admin
  { href: "/team", label: "Team", icon: Users, available: true, group: "Admin", tabBarOrder: 7 },
  { href: "/services", label: "Services", icon: Package, available: true, group: "Admin", tabBarOrder: 8 },
  { href: "/fees", label: "Fees", icon: DollarSign, available: true, group: "Admin", tabBarOrder: 9 },
  { href: "/integrations", label: "Integrations", icon: Plug, available: true, group: "Admin", tabBarOrder: 10 },
  { href: "/settings", label: "Settings", icon: Settings, available: false, availableIn: "A4", group: "Admin" },
];

const TECH_NAV: NavItem[] = [
  { href: "/today", label: "Today", icon: Clock, available: true, group: "Operations", tabBarOrder: 1 },
  { href: "/jobs", label: "Jobs", icon: Wrench, available: true, group: "Operations", tabBarOrder: 2 },
  { href: "/schedule", label: "Schedule", icon: Calendar, available: true, group: "Operations", tabBarOrder: 3 },
  { href: "/customers", label: "Customers", icon: Users, available: true, group: "Operations", tabBarOrder: 4 },
];

/** Full nav list for a role, including future-locked items. Sidebar consumers
 * may render `available: false` items as disabled rows; mobile tab bar and
 * drawer filter them out via getTabBarItems / getDrawerItems. */
export function getNavItemsForRole(role: UserRole | null): NavItem[] {
  if (!role) return [];
  if (role === "tech") return TECH_NAV;
  return OWNER_NAV;
}

/** Primary tabs for the mobile bottom tab bar (tabBarOrder 1-4, available
 * only). Order is preserved from the role nav list. */
export function getTabBarItems(role: UserRole | null): NavItem[] {
  return getNavItemsForRole(role)
    .filter((item) => item.available && item.tabBarOrder !== undefined && item.tabBarOrder >= 1 && item.tabBarOrder <= 4)
    .sort((a, b) => (a.tabBarOrder ?? 0) - (b.tabBarOrder ?? 0));
}

/** Overflow items for the More drawer (tabBarOrder 5+, available only).
 * Returns [] for tech (no More needed since tech has exactly 4 tabs). */
export function getDrawerItems(role: UserRole | null): NavItem[] {
  return getNavItemsForRole(role)
    .filter((item) => item.available && item.tabBarOrder !== undefined && item.tabBarOrder >= 5)
    .sort((a, b) => (a.tabBarOrder ?? 0) - (b.tabBarOrder ?? 0));
}

/** All nav items for the sidebar (includes future-locked items so the sidebar
 * can render them as disabled rows with the existing pattern). Sidebar
 * groups items by NavGroup at render time. */
export function getSidebarItems(role: UserRole | null): NavItem[] {
  return getNavItemsForRole(role);
}

/** Sidebar items grouped by NavGroup, preserving array order within each
 * group. Empty groups are omitted. */
export function getSidebarGroups(role: UserRole | null): Array<{ label: NavGroup; items: NavItem[] }> {
  const items = getSidebarItems(role);
  const order: NavGroup[] = ["Operations", "Sales", "Insights", "Admin"];
  return order
    .map((label) => ({ label, items: items.filter((i) => i.group === label) }))
    .filter((g) => g.items.length > 0);
}

/** True if the given pathname is allowed for the role. Used by Phase 3's
 * silent-redirect guard. List routes match their item.href; detail routes
 * (/jobs/123, /invoices/abc) are allowed if the parent list is allowed. */
export function isPathAllowedForRole(pathname: string, role: UserRole | null): boolean {
  if (!role) return false;
  const items = getNavItemsForRole(role).filter((i) => i.available);
  return items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
