export const dynamic = 'force-dynamic';

import { RoleGate } from '@/components/RoleGate';
import { OfflineBanner } from '@/components/OfflineBanner';
import { InstallPrompt } from '@/components/InstallPrompt';
import { UpdateToast } from '@/components/UpdateToast';
import { ClientLayoutProvider } from '@/components/layout/ClientLayoutProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { CommandPalette } from '@/components/layout/CommandPalette';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={['owner', 'admin_only', 'tech']}>
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
      </ClientLayoutProvider>
    </RoleGate>
  );
}
