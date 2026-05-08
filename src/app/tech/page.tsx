'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/app/admin/shared';
import FieldManagerDashboard from './FieldManagerDashboard';

export default function TechRoot() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }
      if (!fbUser) {
        setUser(null);
        setResolved(true);
        return;
      }
      unsubUser = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => {
          setUser(snap.exists() ? (snap.data() as AppUser) : null);
          setResolved(true);
        },
        () => setResolved(true),
      );
    });
    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  useEffect(() => {
    if (!resolved) return;
    if (user && user.isActive && user.role !== 'admin') {
      router.replace('/tech/jobs');
    }
  }, [resolved, user, router]);

  // TechAuthShell handles unauthenticated + loading. Render nothing while
  // we're still resolving or while a non-admin redirect is pending.
  if (!resolved || !user) return null;
  if (user.role !== 'admin') return null;

  return (
    <FieldManagerDashboard userId={user.uid} userName={user.displayName || ''} />
  );
}
