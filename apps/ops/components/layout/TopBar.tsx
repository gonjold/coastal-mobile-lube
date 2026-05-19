'use client';

/* A3f Phase 4.2: TopBar trimmed for the three-mode responsive layout.
 *
 * Removed:
 * - md:hidden hamburger button (replaced by MobileTabBar at <md and the
 *   icon Sidebar's overlay trigger at md..lg).
 * - Sheet-based mobile-sidebar drawer (replaced by MobileTabBar +
 *   MoreDrawer at <md and SidebarOverlay at md..lg).
 *
 * Kept:
 * - Search button -> CommandPalette (visible all breakpoints).
 * - New dropdown (booking / customer / invoice modal triggers).
 * - Notifications bell (placeholder; not wired this sprint).
 *
 * `mobileSidebarOpen` state in ClientLayoutProvider still has one writer
 * (SidebarRow.onNavigate calls setMobileSidebarOpen(false) on click) but
 * no reader after this commit. Leaving the state in place for now to
 * avoid touching ClientLayoutProvider + Sidebar in this commit; a
 * follow-up cleanup sweep can retire it once Phase 5/6 are settled.
 */

import { Search, Bell, Plus } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Kbd,
} from '@coastal/shared-ui';
import { useLayout } from './ClientLayoutProvider';
import { useAdminModal } from '@/lib/AdminModalContext';

export function TopBar() {
  const { setPaletteOpen } = useLayout();
  const { openModal } = useAdminModal();

  return (
    <div className="h-14 border-b border-border bg-card flex items-center px-4 md:px-6 gap-2 md:gap-4">
      <div className="flex-1 max-w-md">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="w-full h-10 pl-9 pr-16 text-sm bg-muted/60 border border-border rounded-md text-left text-muted-foreground hover:bg-muted relative focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <span className="truncate block">Search customers, jobs, invoices...</span>
          <Kbd className="absolute right-2 top-1/2 -translate-y-1/2 bg-card border-border text-muted-foreground">
            ⌘K
          </Kbd>
        </button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => openModal('booking')}>New booking</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openModal('customer')}>New customer</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openModal('invoice')}>New invoice</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        aria-label="Notifications"
        className="h-10 w-10 rounded-md hover:bg-muted flex items-center justify-center"
      >
        <Bell className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
      </button>
    </div>
  );
}
