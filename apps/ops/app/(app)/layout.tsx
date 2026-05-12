export const dynamic = 'force-dynamic';

import { Toaster } from 'sonner';
import { RoleGate } from '@/components/RoleGate';
import { OfflineBanner } from '@/components/OfflineBanner';
import { InstallPrompt } from '@/components/InstallPrompt';
import { UpdateToast } from '@/components/UpdateToast';
import { ClientLayoutProvider } from '@/components/layout/ClientLayoutProvider';
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
            <Sidebar />
            <div className="flex-1 min-h-screen flex flex-col">
              <TopBar />
              <main className="flex-1">{children}</main>
            </div>
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
