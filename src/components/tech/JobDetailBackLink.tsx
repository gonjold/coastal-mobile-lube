'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/app/admin/shared';
import { useFmReturnPath } from '@/hooks/useFmReturnPath';

export default function JobDetailBackLink({ className }: { className?: string }) {
  const [role, setRole] = useState<string | null>(null);
  const { href, label } = useFmReturnPath(role);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }
      if (!fbUser) {
        setRole(null);
        return;
      }
      unsubUser = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => {
          const data = snap.exists() ? (snap.data() as AppUser) : null;
          setRole(data?.role ?? null);
        },
        () => setRole(null),
      );
    });
    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  return (
    <Link
      href={href}
      className={className ?? 'inline-flex items-center px-3 py-3 text-sm text-slate-600 hover:underline'}
    >
      {label}
    </Link>
  );
}
