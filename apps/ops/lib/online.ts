'use client';

import { useEffect, useState } from 'react';
import { flushQueue, pendingCount } from './outbox';

export function useOnline(): { online: boolean; queued: number; flush: () => Promise<void> } {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [queued, setQueued] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    const refreshCount = async () => {
      try {
        const n = await pendingCount();
        if (mounted) setQueued(n);
      } catch {/* ignore */}
    };

    const handleOnline = () => {
      setOnline(true);
      flushQueue().then(refreshCount).catch(() => {});
    };
    const handleOffline = () => setOnline(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        flushQueue().then(refreshCount).catch(() => {});
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    refreshCount();

    const interval = window.setInterval(refreshCount, 5000);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, []);

  const flush = async () => {
    await flushQueue();
    const n = await pendingCount();
    setQueued(n);
  };

  return { online, queued, flush };
}
