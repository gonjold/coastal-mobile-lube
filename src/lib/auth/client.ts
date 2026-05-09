'use client';

import { onIdTokenChanged, getAuth, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/types';

export interface ClientAuthState {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
}

export function useFirebaseAuthState(): ClientAuthState {
  const [state, setState] = useState<ClientAuthState>({
    user: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const auth = getAuth();
    return onIdTokenChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, loading: false });
        return;
      }
      const tokenResult = await user.getIdTokenResult();
      const role = (tokenResult.claims.role as UserRole) || null;
      setState({ user, role, loading: false });
    });
  }, []);

  return state;
}
