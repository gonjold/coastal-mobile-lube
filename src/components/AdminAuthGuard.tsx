'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const ALLOWED_ADMIN_EMAILS = [
  'jon@jgoldco.com',
  'coastalmobilelube@gmail.com',
  'jonrgold@gmail.com',
];

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (ALLOWED_ADMIN_EMAILS.includes(user.email || '')) {
          setAuthenticated(true);
        } else {
          await signOut(auth);
          router.push('/admin/login?error=unauthorized');
        }
      } else {
        router.push('/admin/login');
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
