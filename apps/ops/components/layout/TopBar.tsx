'use client';

import { Menu, Search, Bell, Plus } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Kbd,
  Sheet,
  SheetContent,
} from '@coastal/shared-ui';
import { useLayout } from './ClientLayoutProvider';
import { SidebarContent } from './Sidebar';
import { useAdminModal } from '@/lib/AdminModalContext';

export function TopBar() {
  const { setPaletteOpen, mobileSidebarOpen, setMobileSidebarOpen } = useLayout();
  const { openModal } = useAdminModal();

  return (
    <div className="h-14 border-b border-border bg-card flex items-center px-4 md:px-6 gap-2 md:gap-4">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileSidebarOpen(true)}
        className="md:hidden h-10 w-10 rounded-md hover:bg-muted flex items-center justify-center"
      >
        <Menu className="w-5 h-5 text-foreground" strokeWidth={1.75} />
      </button>

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

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0 sm:max-w-none">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </div>
  );
}
