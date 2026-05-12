"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@coastal/shared-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@coastal/shared-ui";
import { Loader2, Eraser } from "lucide-react";
import { toast } from "sonner";

export function SignatureCapture({
  jobId,
  kind,
  open,
  onOpenChange,
  onCaptured,
}: {
  jobId: string;
  kind: "estimate" | "completion";
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCaptured: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize signature_pad when dialog mounts the canvas; tear down on close.
  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;

    // Set canvas backing-store size to match its rendered size for sharp ink.
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      penColor: "#0B2040",
      backgroundColor: "rgba(0,0,0,0)",
      minWidth: 1,
      maxWidth: 2.5,
    });
    padRef.current = pad;

    return () => {
      pad.off();
      padRef.current = null;
    };
  }, [open]);

  function clear() {
    padRef.current?.clear();
  }

  async function save() {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      toast.error("Please sign first");
      return;
    }
    setSaving(true);
    try {
      const dataUrl = pad.toDataURL("image/png");
      const res = await fetch(`/api/field/jobs/${jobId}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, dataUrl }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || `HTTP ${res.status}`);
      }
      toast.success("Signature saved");
      onCaptured();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {kind === "estimate"
              ? "Estimate signature"
              : "Completion signature"}
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-md border border-border bg-card">
          <canvas
            ref={canvasRef}
            className="block h-48 w-full touch-none"
            aria-label="Signature pad"
          />
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={clear} disabled={saving}>
            <Eraser className="mr-2 h-4 w-4" /> Clear
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
