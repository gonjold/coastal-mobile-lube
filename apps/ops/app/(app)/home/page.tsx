'use client';

import { RoleGate } from '@/components/RoleGate';
import { useAuth } from '@/lib/useAuth';

export default function HomePage() {
  const { user, role } = useAuth();
  return (
    <RoleGate roles={['owner', 'admin_only', 'tech']}>
      <main className="min-h-screen px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-2">
          <h1 className="text-2xl font-semibold">Auth wired</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <code>{user?.email ?? '...'}</code> with role <code>{role ?? '...'}</code>.
          </p>
          <p className="text-sm text-muted-foreground">
            This is the A1 placeholder. Real ops UI lands in A3.
          </p>
        </div>
      </main>
    </RoleGate>
  );
}
