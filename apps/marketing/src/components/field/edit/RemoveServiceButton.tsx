"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@coastal/shared-ui";
import { Button } from "@coastal/shared-ui";

export function RemoveServiceButton({
  jobId,
  itemId,
  description,
}: {
  jobId: string;
  itemId: string;
  description: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function confirmDelete() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/field/jobs/${jobId}/services/${encodeURIComponent(itemId)}`,
        { method: "DELETE" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Couldn't remove line item", {
          description: json?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success(`Removed: ${description}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Couldn't remove line item", {
        description: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Remove ${description}`}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent role="alertdialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <AlertTriangle
                className="h-5 w-5 text-destructive"
                strokeWidth={2}
              />
              Remove line item?
            </DialogTitle>
            <DialogDescription>
              This will remove <span className="font-semibold">{description}</span>{" "}
              from the estimate and recalculate totals. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
