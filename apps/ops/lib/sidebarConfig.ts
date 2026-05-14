// A3a: route-to-availability mapping. Items marked `available: false` render
// as disabled in the sidebar with a tooltip indicating which sprint they
// land in. A3b/A3c flip these to true as features migrate.

import {
  Home as HomeIcon,
  Calendar,
  Wrench,
  Users,
  FileText,
  Receipt,
  Clock,
  BarChart3,
  Settings,
  Package,
  DollarSign,
  Plug,
  type LucideIcon,
} from 'lucide-react';

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  available: boolean;
  availableIn?: string;
  badge?: string;
};

export type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: 'Operations',
    items: [
      { href: '/home', label: 'Home', icon: HomeIcon, available: true },
      { href: '/schedule', label: 'Schedule', icon: Calendar, available: true },
      { href: '/jobs', label: 'Jobs', icon: Wrench, available: true },
      { href: '/customers', label: 'Customers', icon: Users, available: true },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/estimates', label: 'Estimates', icon: FileText, available: false, availableIn: 'A5' },
      { href: '/invoices', label: 'Invoices', icon: Receipt, available: true },
      { href: '/quotes', label: 'Quick Quotes', icon: Clock, available: false, availableIn: 'A5' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3, available: false, availableIn: 'A7' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/team', label: 'Team', icon: Users, available: true },
      { href: '/services', label: 'Services', icon: Package, available: true },
      { href: '/fees', label: 'Fees', icon: DollarSign, available: true },
      { href: '/integrations', label: 'Integrations', icon: Plug, available: true },
      { href: '/settings', label: 'Settings', icon: Settings, available: false, availableIn: 'A4' },
    ],
  },
];
