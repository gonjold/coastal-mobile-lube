'use client';

/* A3f Phase 5.6: mobileSidebarOpen state removed (dead-write since Phase 4
 * dropped the TopBar hamburger + Sheet drawer; Sidebar's last writer was
 * cleaned up alongside this commit). LayoutCtx is now palette-only;
 * future cross-component layout state lands here. */

import React, { createContext, useContext, useEffect, useState } from 'react';

type LayoutCtx = {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
};

const LayoutContext = createContext<LayoutCtx | null>(null);

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used inside ClientLayoutProvider');
  return ctx;
}

export function ClientLayoutProvider({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <LayoutContext.Provider value={{ paletteOpen, setPaletteOpen }}>
      {children}
    </LayoutContext.Provider>
  );
}
