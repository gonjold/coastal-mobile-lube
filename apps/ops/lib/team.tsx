'use client';

import * as React from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

type TeamSizeContextValue = { size: number; multiTechActive: boolean; loading: boolean };

const TeamSizeContext = React.createContext<TeamSizeContextValue>({
  size: 1,
  multiTechActive: false,
  loading: true,
});

export function TeamSizeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<TeamSizeContextValue>({
    size: 1,
    multiTechActive: false,
    loading: true,
  });

  React.useEffect(() => {
    const ref = doc(db, 'team', 'coastal');
    return onSnapshot(
      ref,
      (snap) => {
        const members = (snap.data()?.members ?? []) as Array<{ active?: boolean; role?: string }>;
        const techCount = members.filter((m) => m.active !== false && m.role === 'tech').length;
        setState({
          size: techCount,
          multiTechActive: techCount > 1,
          loading: false,
        });
      },
      () => setState((s) => ({ ...s, loading: false }))
    );
  }, []);

  return <TeamSizeContext.Provider value={state}>{children}</TeamSizeContext.Provider>;
}

export function useTeamSize() {
  return React.useContext(TeamSizeContext);
}
