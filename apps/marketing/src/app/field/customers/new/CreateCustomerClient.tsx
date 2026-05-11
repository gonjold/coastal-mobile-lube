"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@coastal/shared-ui";
import { toast } from "sonner";
import {
  CustomerForm,
  validateCustomer,
  digitsOnly,
  type CustomerFormValues,
  type CustomerFormErrors,
} from "@/components/field/forms/CustomerForm";

const EMPTY: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

export function CreateCustomerClient() {
  const router = useRouter();
  const [values, setValues] = useState<CustomerFormValues>(EMPTY);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [pendingMode, setPendingMode] =
    useState<null | "save" | "save-and-job">(null);

  async function submit(mode: "save" | "save-and-job") {
    if (pendingMode) return;
    const validation = validateCustomer(values);
    if (validation) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setPendingMode(mode);

    try {
      const res = await fetch("/api/field/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          phone: digitsOnly(values.phone),
          email: values.email.trim(),
          address: values.address.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        id?: string;
        deduped?: boolean;
        error?: string;
      };
      if (!res.ok || !json.id) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      if (json.deduped) {
        toast.success("Matched existing customer");
      } else {
        toast.success("Customer saved");
      }

      if (mode === "save-and-job") {
        router.push(`/field/jobs/new?customerId=${json.id}`);
      } else {
        router.push("/field/customers");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      setPendingMode(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <Link
          href="/field/customers"
          aria-label="Back to customers"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out active:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl font-semibold text-foreground">
          New customer
        </h1>
      </div>

      <CustomerForm
        values={values}
        onChange={setValues}
        errors={errors}
        disabled={pendingMode !== null}
      />

      <div className="mt-2 flex flex-col gap-2">
        <Button
          size="lg"
          className="w-full"
          disabled={pendingMode !== null}
          onClick={() => submit("save-and-job")}
        >
          {pendingMode === "save-and-job" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Save & continue to new job
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          disabled={pendingMode !== null}
          onClick={() => submit("save")}
        >
          {pendingMode === "save" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Save customer
        </Button>
      </div>
    </div>
  );
}
