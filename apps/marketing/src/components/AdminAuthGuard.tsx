'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const ALLOWED_ADMIN_EMAILS = [
  'jon@jgoldco.com',
  'coastalmobilelube@gmail.com',
  'jonrgold@gmail.com',
  'info@coastalmobilelube.com',
];

/**
 * Allowlist email → admin auto-provisioning.
 * If the user has no users doc but their email is in ALLOWED_ADMIN_EMAILS,
 * create one with role='admin'. Prevents lockout when adding new admins.
 */
async function resolveAdminAccess(
  user: User
): Promise<'admin' | 'tech' | 'denied'> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    if ((data.role === 'admin' || data.role === 'owner') && data.isActive === true) return 'admin';
    if (data.role === 'tech') return 'tech';
    return 'denied';
  }

  if (user.email && ALLOWED_ADMIN_EMAILS.includes(user.email)) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      role: 'admin',
      isActive: true,
      createdAt: serverTimestamp(),
      createdBy: 'allowlist-auto',
      lastLoginAt: serverTimestamp(),
    });
    return 'admin';
  }

  return 'denied';
}

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        setLoading(false);
        return;
      }

      try {
        const access = await resolveAdminAccess(user);
        if (access === 'admin') {
          setAuthenticated(true);
        } else if (access === 'tech') {
          router.push('/tech');
        } else {
          await signOut(auth);
          router.push('/admin/login?error=unauthorized');
        }
      } catch (err) {
        console.error('Failed to resolve admin access:', err);
        await signOut(auth);
        router.push('/admin/login?error=unauthorized');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0B2040',
        color: 'white',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  if (!authenticated) return null;
  return <>{children}</>;
}
