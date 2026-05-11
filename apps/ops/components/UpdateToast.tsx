'use client';

import { useEffect, useState } from 'react';

export function UpdateToast() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      if (reg.waiting) setWaitingWorker(reg.waiting);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
          }
        });
      });
    });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  }, []);

  if (!waitingWorker) return null;

  const onRefresh = () => {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"
      style={{ background: '#0B2040', color: '#FBF9F5', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <span className="text-sm">Update available</span>
      <button
        onClick={onRefresh}
        className="text-xs font-semibold px-3 py-1.5 rounded-md"
        style={{ background: '#E07B2D', color: '#FBF9F5' }}
      >
        Refresh
      </button>
    </div>
  );
}
