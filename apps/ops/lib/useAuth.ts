'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { isUserRole, type UserRole } from '@coastal/shared-types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const tok = await u.getIdTokenResult();
        const claimed = tok.claims.role;
        setRole(isUserRole(claimed) ? claimed : null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  return { user, role, loading };
}
