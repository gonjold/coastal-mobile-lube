export const dynamic = 'force-dynamic';

import { Toaster } from 'sonner';
import { RoleGate } from '@/components/RoleGate';
import { OfflineBanner } from '@/components/OfflineBanner';
import { InstallPrompt } from '@/components/InstallPrompt';
import { UpdateToast } from '@/components/UpdateToast';
import { ClientLayoutProvider } from '@/components/layout/ClientLayoutProvider';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { NewActionFAB } from '@/components/layout/NewActionFAB';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { AdminModalProvider } from '@/lib/AdminModalContext';
import { NewBookingModal } from '@/components/modals/NewBookingModal';
import { NewCustomerModal } from '@/components/modals/NewCustomerModal';
import { NewInvoiceModal } from '@/components/modals/NewInvoiceModal';
import { CustomerMergeModal } from '@/components/modals/CustomerMergeModal';
import { FixInvoiceDialog } from '@/components/modals/FixInvoiceDialog';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={['owner', 'admin_only', 'tech']}>
      <AdminModalProvider>
        <ClientLayoutProvider>
          <OfflineBanner />
          <div className="min-h-screen bg-background text-foreground flex">
            {/* A3f Phase 4: three-mode responsive nav.
                - <md (mobile): MobileTabBar fixed bottom; both sidebars hidden.
                - md..lg (tablet 768-1023px): icon-only sidebar 72px on left.
                - lg+ (1024px+): full sidebar 240px on left.
                The two Sidebar instances render at mutually-exclusive
                breakpoints via className overrides; both stay hidden <md. */}
            <Sidebar variant="icon" className="hidden md:flex lg:hidden" />
            <Sidebar variant="full" className="hidden lg:flex" />
            {/* A3f Phase 6A polish round 2: min-w-0 on the flex-1 main
                column lets it shrink below its content's intrinsic
                min-width (default min-width: auto on flex items prevents
                this). Without it, any wide child (sub-page, TopBar item,
                etc.) forces the column past viewport on mobile, dragging
                the page into horizontal scroll and clipping the bell. */}
            <div className="flex-1 min-w-0 min-h-screen flex flex-col">
              <TopBar />
              {/* pb-20 on mobile gives the fixed bottom tab bar (h-16 + safe
                  area) clearance so page content doesn't slide under it.
                  md:pb-0 because tab bar is hidden md+. min-w-0 here too so
                  the inner page wrapper can shrink. */}
              <main className="flex-1 min-w-0 pb-20 md:pb-0">
                <RouteGuard>{children}</RouteGuard>
              </main>
            </div>
            <MobileTabBar />
            <NewActionFAB />
            <CommandPalette />
          </div>
          <InstallPrompt />
          <UpdateToast />
          <NewBookingModal />
          <NewCustomerModal />
          <NewInvoiceModal />
          <CustomerMergeModal />
          <FixInvoiceDialog />
          <Toaster position="bottom-right" />
        </ClientLayoutProvider>
      </AdminModalProvider>
    </RoleGate>
  );
}
