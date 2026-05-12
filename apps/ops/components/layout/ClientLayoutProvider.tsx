'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type LayoutCtx = {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
};

const LayoutContext = createContext<LayoutCtx | null>(null);

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used inside ClientLayoutProvider');
  return ctx;
}

export function ClientLayoutProvider({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    <LayoutContext.Provider value={{ paletteOpen, setPaletteOpen, mobileSidebarOpen, setMobileSidebarOpen }}>
      {children}
    </LayoutContext.Provider>
  );
}
