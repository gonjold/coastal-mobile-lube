# WO-22e: Restore VIN Camera Scanner

**Project:** Coastal Mobile Lube & Tire
**Scope:** Vehicle selector VIN mode.
**Estimated time:** 30-45 min
**Prerequisite:** WO-20 deployed.

---

## CONTEXT

Before WO-18 replaced `VehicleTypeahead.tsx` with `VehicleSelector.tsx`, the VIN mode had a camera-based barcode scanner for mobile users — they could tap "Scan VIN", point the camera at the barcode on their door jamb or dashboard, and the VIN would auto-populate. This got lost in the refactor.

Users cannot reliably type 17-character alphanumeric VINs on a phone keyboard without errors. Camera scanning is the correct UX for this field.

Two-path approach: check git history for the prior implementation first and restore if it exists. If not, build fresh with `@zxing/browser`.

---

## SCOPE

### IN
- `src/components/booking/VehicleSelector.tsx` (VIN mode section only)
- Possibly a new `src/components/booking/VINScanner.tsx` component
- `package.json` if a library needs to be added
- Browser permissions handling (camera access)

### OUT
- YMM mode (untouched)
- Any other booking wizard step
- Any other page or component
- Admin portal

---

## STEPS

### Step 0: Check git history for prior implementation

Before adding a new library or writing new code:

1. Run `git log --all --oneline --follow -- src/components/VehicleTypeahead.tsx` to find commits that touched the old component.
2. Search the repo history for VIN scanner keywords:
   ```bash
   git log --all --source -S 'VIN' --oneline | head -30
   git log --all --source -S 'barcode' --oneline | head -30
   git log --all --source -S 'getUserMedia' --oneline | head -30
   git log --all --source -S 'zxing' --oneline | head -30
   git log --all --source -S 'quagga' --oneline | head -30
   ```
3. If a prior VIN scanner implementation is found, read the relevant commit's version of the file: `git show <sha>:path/to/file`
4. Print what you found. If the prior implementation used a library that's still in `package.json`, we'll restore from history. If not, we'll install a new one.

If NO prior implementation is found in git history: proceed to Step 2 (install `@zxing/browser`).

If a prior implementation IS found: adapt it into the current `VehicleSelector.tsx` structure — DO NOT resurrect the deleted `VehicleTypeahead.tsx` component. Just port the scanner logic into a new `VINScanner.tsx` sub-component that works inside the current architecture.

---

### Step 1: (Conditional) Restore from history

If you found a prior implementation:

1. Create `src/components/booking/VINScanner.tsx` with the scanner logic ported over.
2. Make sure it exports a clean React component that accepts:
   - `onScanSuccess: (vin: string) => void`
   - `onClose: () => void`
   - `isOpen: boolean`
3. Skip to Step 4 (UI integration).

---

### Step 2: (Conditional) Install `@zxing/browser`

If no prior implementation exists:

```bash
npm install @zxing/browser @zxing/library
```

`@zxing/browser` is the actively-maintained browser build of the ZXing barcode library. Handles Code 39, Code 128, QR, and other VIN-relevant formats. ~100KB gzipped. TypeScript definitions included.

---

### Step 3: (Conditional) Build new `VINScanner.tsx`

Create `src/components/booking/VINScanner.tsx`:

```tsx
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
          // VINs are exactly 17 chars, alphanumeric, no I/O/Q
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
      {/* Header */}
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

      {/* Camera view */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Scanning frame overlay */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[85%] max-w-md aspect-[3/1] border-2 border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-0.5 bg-[#E07B2D] animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
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

      {/* Instructions */}
      {scanning && !error && (
        <div className="bg-black text-white text-center px-4 py-4 text-sm">
          Point camera at the VIN barcode. Found on the driver's side door jamb or dashboard through the windshield.
        </div>
      )}
    </div>
  );
}
```

---

### Step 4: Integrate into VehicleSelector.tsx

In the VIN mode section of `VehicleSelector.tsx`:

1. Import the new `VINScanner` component.
2. Add state: `const [scannerOpen, setScannerOpen] = useState(false);`
3. Add a "Scan VIN" button next to (or above) the VIN text input, visible on mobile only by default — or on all devices if webcam is available. Style it with the brand orange:

```tsx
<button
  type="button"
  onClick={() => setScannerOpen(true)}
  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 h-12 bg-[#0B2040] text-white rounded-lg font-semibold hover:bg-[#0B2040]/90 transition-colors"
>
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23l-.38.054a2.25 2.25 0 00-1.94 2.2v10.58A2.25 2.25 0 005.116 22.3h13.768a2.25 2.25 0 002.25-2.236V9.484a2.25 2.25 0 00-1.94-2.2l-.38-.054a2.31 2.31 0 01-1.64-1.055l-.822-1.316A2.192 2.192 0 0014.155 4h-4.31a2.192 2.192 0 00-1.857 1.03l-.822 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
  Scan VIN with camera
</button>
```

4. Render the scanner modal:

```tsx
<VINScanner
  isOpen={scannerOpen}
  onClose={() => setScannerOpen(false)}
  onScanSuccess={(vin) => {
    setVinInput(vin);
    setScannerOpen(false);
    // Trigger decode automatically if that's the existing pattern
    handleVinDecode(vin);
  }}
/>
```

Replace `setVinInput` and `handleVinDecode` with whatever the existing VIN state and decode handler are named.

---

### Step 5: HTTPS requirement

`getUserMedia` (camera API) requires HTTPS. Netlify production is already HTTPS so that's fine. But note for Jon: the scanner won't work on localhost unless tested with `https://` or on the deployed Netlify URL.

If testing locally, use the deployed URL on your phone instead of localhost.

---

### Step 6: Build, commit, push, deploy

1. `npm run build` — confirm zero errors.
2. `git add src/ package.json package-lock.json` (if @zxing was installed)
3. `git commit -m "WO-22e: restore VIN camera scanner"`
4. `git push`
5. `npx netlify-cli deploy --prod`

---

## ACCEPTANCE CRITERIA

### Mobile (iPhone — the primary use case)
- [ ] "Scan VIN with camera" button visible in VIN mode of Step 1
- [ ] Tapping button prompts for camera permission
- [ ] On grant, full-screen camera view opens with scanning frame overlay
- [ ] Pointing camera at a VIN barcode auto-detects and populates the VIN input
- [ ] Modal closes automatically on successful scan
- [ ] VIN then decodes normally (existing NHTSA decode path works)
- [ ] Close button (X) closes the modal cleanly, stops the camera
- [ ] Camera stream stops when modal is closed (check phone doesn't keep camera light on)

### Desktop (Mac with webcam)
- [ ] Scanner works if user has a webcam (bonus, not required)

### Error handling
- [ ] Camera permission denied shows a clear error message
- [ ] No camera on device shows a clear error message
- [ ] Scanning for 30+ seconds without finding a barcode doesn't crash

---

## DO NOT

- Do NOT resurrect the deleted `VehicleTypeahead.tsx` file
- Do NOT touch YMM mode
- Do NOT change the VIN decode API call or response handling
- Do NOT rewrite `VehicleSelector.tsx` — surgical additions only (import, state, button, modal render)
- Do NOT add any other libraries beyond `@zxing/browser` + `@zxing/library`

---

## ROLLBACK

```bash
git revert HEAD
git push
npx netlify-cli deploy --prod
```
