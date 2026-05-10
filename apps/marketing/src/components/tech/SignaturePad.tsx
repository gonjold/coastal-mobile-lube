"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import SignaturePadLib from "signature_pad";

export interface SignaturePadHandle {
  isEmpty: () => boolean;
  clear: () => void;
  toDataURL: () => string;
}

interface Props {
  onChange?: (isEmpty: boolean) => void;
}

const SignaturePad = forwardRef<SignaturePadHandle, Props>(({ onChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const onChangeRef = useRef(onChange);
  const lastWidthRef = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const performResize = () => {
      const newWidth = canvas.offsetWidth;
      // Width-change guard kills iOS Safari URL-bar oscillation noise.
      if (newWidth === lastWidthRef.current) return;
      lastWidthRef.current = newWidth;

      const data = padRef.current?.toData() ?? [];

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);

      padRef.current?.fromData(data);
    };

    const debouncedResize = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(performResize, 200);
    };

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(0, 0, 0)",
      minWidth: 1,
      maxWidth: 2.5,
    });
    padRef.current = pad;

    pad.addEventListener("endStroke", () => {
      onChangeRef.current?.(pad.isEmpty());
    });

    performResize();

    const observer = new ResizeObserver(debouncedResize);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      pad.off();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    clear: () => {
      padRef.current?.clear();
      onChangeRef.current?.(true);
    },
    toDataURL: () => padRef.current?.toDataURL("image/png") ?? "",
  }));

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        className="w-full block touch-none"
        style={{ height: 150 }}
      />
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;
