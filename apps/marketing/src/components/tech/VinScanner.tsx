'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

interface VinScannerProps {
  onScan: (vin: string) => void;
  onCancel: () => void;
  onManualEntry: () => void;
}

// Full-screen modal for VIN barcode scanning. Falls back to manual entry if camera
// unavailable or denied. Cleans up camera stream on unmount.
export default function VinScanner({ onScan, onCancel, onManualEntry }: VinScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const reader = new BrowserMultiFormatReader();

        if (!videoRef.current) return;

        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (cancelled) return;
            if (result) {
              const candidate = result.getText().trim().toUpperCase();
              // Tolerant 11-18 char range — strict 17-char check happens at form save
              if (candidate.length >= 11 && candidate.length <= 18) {
                cancelled = true;
                controls.stop();
                onScan(candidate);
              }
            }
          }
        );
        controlsRef.current = controls;
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setError('Camera access denied. Use manual entry instead, or enable camera in browser settings.');
        } else if (msg.includes('NotFoundError') || msg.includes('no camera')) {
          setError('No camera found on this device. Use manual entry.');
        } else {
          setError('Camera unavailable: ' + msg);
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between bg-[#0B2040] p-3 text-white">
        <button onClick={onCancel} className="rounded border border-white/30 px-3 py-2 text-sm">
          Cancel
        </button>
        <div className="text-sm font-semibold">Scan VIN</div>
        <button onClick={onManualEntry} className="rounded bg-[#E07B2D] px-3 py-2 text-sm font-semibold">
          Type instead
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {!error && (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-4/5 max-w-md rounded-lg border-4 border-[#E07B2D] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-white">
              Point camera at the VIN barcode (door jamb sticker or windshield)
            </div>
          </>
        )}

        {error && (
          <div className="p-6 text-center text-white">
            <div className="mb-3 text-base font-semibold">Camera unavailable</div>
            <div className="mb-6 text-sm text-white/80">{error}</div>
            <button onClick={onManualEntry} className="rounded-lg bg-[#E07B2D] px-6 py-3 text-base font-semibold">
              Type VIN manually
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
