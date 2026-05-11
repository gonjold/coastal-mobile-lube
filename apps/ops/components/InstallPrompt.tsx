'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'coastal.install.dismissed';
const ANDROID_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const IOS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const isIOS =
      typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
      // Future: detect iPad in desktop-UA mode via
      // (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const ttl = isIOS ? IOS_TTL_MS : ANDROID_TTL_MS;
    const dismissedRecently = dismissedAt > 0 && Date.now() - dismissedAt < ttl;
    if (dismissedRecently) return;

    if (isIOS) {
      setShowIOS(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setShowIOS(false);
    setShowAndroid(false);
    setDeferred(null);
  };

  const installAndroid = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShowAndroid(false);
    setDeferred(null);
  };

  if (!showIOS && !showAndroid) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div
        className="mx-auto max-w-md rounded-2xl shadow-2xl px-4 py-4"
        style={{ background: '#0B2040', color: '#FBF9F5' }}
      >
        {showAndroid && (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="text-base font-semibold">Install Coastal Ops</div>
              <div className="mt-1 text-sm" style={{ color: '#C5CDDB' }}>
                Add to your home screen for faster access and offline support.
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={installAndroid}
                className="text-sm font-semibold px-4 py-2 rounded-md"
                style={{ background: '#E07B2D', color: '#FBF9F5' }}
              >
                Install
              </button>
              <button
                onClick={dismiss}
                className="text-xs px-3 py-1 rounded-md"
                style={{ color: '#C5CDDB' }}
              >
                Not now
              </button>
            </div>
          </div>
        )}
        {showIOS && (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="text-base font-semibold">Install Coastal Ops</div>
              <div className="mt-1 text-sm" style={{ color: '#C5CDDB' }}>
                Tap the Share icon{' '}
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center w-5 h-5 rounded align-middle"
                  style={{ background: '#E07B2D' }}
                >
                  ↑
                </span>{' '}
                then choose <span className="font-semibold">Add to Home Screen</span>.
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-sm font-semibold px-3 py-2 rounded-md shrink-0"
              style={{ background: '#E07B2D', color: '#FBF9F5' }}
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
