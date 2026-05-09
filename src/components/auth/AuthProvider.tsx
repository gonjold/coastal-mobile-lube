'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useFirebaseAuthState } from '@/lib/auth/client';
import type { Team, UserRole } from '@/types';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  team: Team | null;
  loading: boolean;
  isMultiTech: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  team: null,
  loading: true,
  isMultiTech: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, role, loading } = useFirebaseAuthState();
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!user || !role || !['owner', 'admin_only'].includes(role)) {
      setTeam(null);
      return;
    }
    fetch('/api/admin/team')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setTeam(data?.team || null))
      .catch(() => setTeam(null));
  }, [user, role]);

  const isMultiTech =
    !!team &&
    team.members.filter((m) => m.active && m.role === 'tech').length >= 1;

  return (
    <AuthContext.Provider
      value={{ user, role, team, loading, isMultiTech }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
