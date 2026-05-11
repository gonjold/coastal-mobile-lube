'use client';

import { useOnline } from '@/lib/online';

export function OfflineBanner() {
  const { online, queued, flush } = useOnline();

  if (online && queued === 0) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center justify-between px-3 py-2 text-sm font-medium"
      style={{
        background: online ? '#FEF3C7' : '#0B2040',
        color: online ? '#1F1B16' : '#FBF9F5',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div>
        {!online && <span>Offline — changes will sync when you reconnect.</span>}
        {online && queued > 0 && <span>{queued} update{queued === 1 ? '' : 's'} queued</span>}
      </div>
      {online && queued > 0 && (
        <button
          onClick={() => { void flush(); }}
          className="text-xs font-semibold underline"
        >
          Flush now
        </button>
      )}
    </div>
  );
}
