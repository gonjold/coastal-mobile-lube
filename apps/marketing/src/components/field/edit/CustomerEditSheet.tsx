"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@coastal/shared-ui";
import { Button } from "@coastal/shared-ui";
import {
  CustomerForm,
  validateCustomer,
  type CustomerFormErrors,
  type CustomerFormValues,
} from "./CustomerForm";

export function CustomerEditSheet({
  jobId,
  initial,
  locked,
}: {
  jobId: string;
  initial: CustomerFormValues;
  locked: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CustomerFormValues>(initial);
  const [errors, setErrors] = useState<CustomerFormErrors | undefined>();
  const [saving, setSaving] = useState(false);

  function onOpenChange(next: boolean) {
    if (!next) {
      setValues(initial);
      setErrors(undefined);
    }
    setOpen(next);
  }

  async function onSave() {
    const v = validateCustomer(values);
    if (v) {
      setErrors(v);
      return;
    }
    setErrors(undefined);
    setSaving(true);
    try {
      const res = await fetch(`/api/field/jobs/${jobId}/customer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Couldn't save customer", {
          description: data?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success("Customer updated");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Couldn't save customer", {
        description: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label="Edit customer"
      >
        <Pencil className="mr-1 h-3 w-3" strokeWidth={2} /> Edit
      </Button>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display text-lg">Edit customer</SheetTitle>
            <SheetDescription>
              {locked
                ? "Customer info on the finalized invoice cannot change."
                : "Update the customer record for this job."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            {locked && (
              <p
                role="note"
                className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-foreground"
              >
                <span className="font-semibold">Invoice finalized.</span>{" "}
                Customer info on the finalized invoice cannot change. The
                customer record below is still editable for future jobs.
              </p>
            )}
            <CustomerForm
              values={values}
              onChange={setValues}
              errors={errors}
              disabled={saving}
            />
          </div>
          <div className="mt-auto flex flex-row justify-end gap-2 p-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
