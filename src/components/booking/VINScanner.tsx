'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface VINScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (vin: string) => void;
}

export default function VINScanner({ isOpen, onClose, onScanSuccess }: VINScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setScanning(true);
    setError(null);

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
        if (result) {
          const text = result.getText().trim().toUpperCase();
          if (/^[A-HJ-NPR-Z0-9]{17}$/.test(text)) {
            onScanSuccess(text);
            stopScanner();
          }
        }
      })
      .catch((e) => {
        if (e.name === 'NotAllowedError') {
          setError('Camera permission denied. Enable camera access in your browser settings.');
        } else if (e.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Could not start camera. Please try again or enter the VIN manually.');
        }
        setScanning(false);
      });

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function stopScanner() {
    if (readerRef.current) {
      // @ts-expect-error ZXing reset API
      readerRef.current.reset?.();
      readerRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }

  function handleClose() {
    stopScanner();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black text-white">
        <h2 className="text-base font-semibold">Scan VIN Barcode</h2>
        <button
          onClick={handleClose}
          className="p-2 -m-2"
          aria-label="Close scanner"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[85%] max-w-md aspect-[3/1] border-2 border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-0.5 bg-[#E07B2D] animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-black">
            <div className="max-w-sm text-center">
              <p className="text-white text-base mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-[#E07B2D] text-white rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {scanning && !error && (
        <div className="bg-black text-white text-center px-4 py-4 text-sm">
          Point camera at the VIN barcode. Found on the driver&apos;s side door jamb or dashboard through the windshield.
        </div>
      )}
    </div>
  );
}
