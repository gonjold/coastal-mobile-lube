"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@coastal/shared-ui";
import { toast } from "sonner";
import { CustomerCombobox } from "@/components/field/forms/CustomerCombobox";
import {
  CustomerForm,
  validateCustomer,
  digitsOnly,
  type CustomerFormValues,
} from "@/components/field/forms/CustomerForm";
import { AssetPicker } from "@/components/field/forms/AssetPicker";
import {
  AssetForm,
  EMPTY_ASSET,
  validateAsset,
  type AssetFormValues,
} from "@/components/field/forms/AssetForm";
import {
  ScheduleForm,
  EMPTY_SCHEDULE,
  validateSchedule,
  type ScheduleFormValues,
} from "@/components/field/forms/ScheduleForm";
import type { CustomerSummary } from "@/components/field/forms/types";

const EMPTY_CUST: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type CustomerMode = "search" | "new";
type AssetMode = "pick" | "new";

export function CreateBookingClient({
  initialCustomerId,
}: {
  initialCustomerId?: string;
}) {
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [customerMode, setCustomerMode] = useState<CustomerMode>("search");
  const [newCustomer, setNewCustomer] =
    useState<CustomerFormValues>(EMPTY_CUST);
  const [newCustErrors, setNewCustErrors] = useState<
    ReturnType<typeof validateCustomer>
  >(null);

  const [assetMode, setAssetMode] = useState<AssetMode>("pick");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [draftAsset, setDraftAsset] = useState<AssetFormValues>(EMPTY_ASSET);
  const [assetError, setAssetError] = useState<string | null>(null);

  const [schedule, setSchedule] =
    useState<ScheduleFormValues>(EMPTY_SCHEDULE);
  const [scheduleErrors, setScheduleErrors] = useState<
    ReturnType<typeof validateSchedule>
  >(null);

  const [submitting, setSubmitting] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(
    Boolean(initialCustomerId),
  );

  // Pre-fill customer from query string (from /field/customers/new "Save & continue")
  useEffect(() => {
    if (!initialCustomerId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/field/customers?q=${encodeURIComponent(initialCustomerId)}&limit=25`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { results?: CustomerSummary[] };
        const match = json.results?.find((c) => c.id === initialCustomerId);
        if (!cancelled && match) {
          setCustomer(match);
        }
      } catch {
        // non-fatal — user can still search
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCustomerId]);

  async function submit() {
    if (submitting) return;
    setNewCustErrors(null);
    setAssetError(null);
    setScheduleErrors(null);

    // 1. Resolve customer
    let resolvedCustomerId: string | null = customer?.id ?? null;
    if (customerMode === "new" && !customer) {
      const v = validateCustomer(newCustomer);
      if (v) {
        setNewCustErrors(v);
        return;
      }
    }
    if (!resolvedCustomerId && customerMode === "search") {
      toast.error("Pick or create a customer");
      return;
    }

    // 2. Validate asset draft if creating new
    if (assetMode === "new") {
      const e = validateAsset(draftAsset);
      if (e) {
        setAssetError(e);
        return;
      }
    } else if (!selectedAssetId) {
      setAssetError("Pick or add an asset");
      return;
    }

    // 3. Validate schedule
    const sErr = validateSchedule(schedule);
    if (sErr) {
      setScheduleErrors(sErr);
      return;
    }

    setSubmitting(true);
    try {
      // Create customer if needed
      if (!resolvedCustomerId && customerMode === "new") {
        const r = await fetch("/api/field/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCustomer.name.trim(),
            phone: digitsOnly(newCustomer.phone),
            email: newCustomer.email.trim(),
            address: newCustomer.address.trim(),
          }),
        });
        const j = (await r.json().catch(() => ({}))) as {
          id?: string;
          error?: string;
        };
        if (!r.ok || !j.id) throw new Error(j.error || `HTTP ${r.status}`);
        resolvedCustomerId = j.id;
      }
      if (!resolvedCustomerId) throw new Error("No customer id");

      // Create asset if needed
      let resolvedAssetId = selectedAssetId;
      if (assetMode === "new") {
        const r = await fetch(
          `/api/field/customers/${resolvedCustomerId}/assets`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: draftAsset.type,
              year: draftAsset.year || undefined,
              make: draftAsset.make.trim(),
              model: draftAsset.model.trim(),
              nickname: draftAsset.nickname.trim(),
            }),
          },
        );
        const j = (await r.json().catch(() => ({}))) as {
          id?: string;
          error?: string;
        };
        if (!r.ok || !j.id) throw new Error(j.error || `HTTP ${r.status}`);
        resolvedAssetId = j.id;
      }
      if (!resolvedAssetId) throw new Error("No asset id");

      // Create booking
      const r = await fetch("/api/field/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: resolvedCustomerId,
          assetId: resolvedAssetId,
          scheduledDate: schedule.date,
          timeWindow: schedule.window,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };
      if (!r.ok || !j.id) throw new Error(j.error || `HTTP ${r.status}`);

      toast.success("Booking created");
      router.push(`/field/jobs/${j.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
      setSubmitting(false);
    }
  }

  const customerReady = Boolean(
    customer ||
      (customerMode === "new" &&
        newCustomer.name.trim() &&
        digitsOnly(newCustomer.phone).length === 10),
  );

  return (
    <>
      <header
        data-new-booking-bar
        className="fixed inset-x-0 top-0 z-40 flex h-20 items-center gap-3 border-b border-border bg-background px-4"
      >
        <Link
          href="/field/today"
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out active:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate font-display text-base font-semibold leading-tight text-foreground">
            New booking
          </h1>
          <p className="truncate text-sm leading-tight text-muted-foreground">
            Customer · Asset · Schedule
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-4 pb-24 pt-2">
        {bootstrapping && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading customer…
          </div>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Customer
          </h2>
          {customerMode === "search" && (
            <CustomerCombobox
              selected={customer}
              onSelect={(c) => {
                setCustomer(c);
                setSelectedAssetId(null);
                setAssetMode("pick");
              }}
              onClear={() => {
                setCustomer(null);
                setSelectedAssetId(null);
                setAssetMode("pick");
              }}
              onCreateNew={() => {
                setCustomer(null);
                setSelectedAssetId(null);
                setCustomerMode("new");
                setAssetMode("new");
              }}
            />
          )}
          {customerMode === "new" && !customer && (
            <>
              <CustomerForm
                values={newCustomer}
                onChange={setNewCustomer}
                errors={newCustErrors ?? {}}
                disabled={submitting}
              />
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setCustomerMode("search");
                  setNewCustomer(EMPTY_CUST);
                  setNewCustErrors(null);
                }}
              >
                Cancel new customer
              </Button>
            </>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Asset
          </h2>
          {!customerReady && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Pick or create a customer first.
            </p>
          )}
          {customerReady && customer && (
            <AssetPicker
              customerId={customer.id}
              selectedId={selectedAssetId}
              onSelect={setSelectedAssetId}
              draftAsset={draftAsset}
              onDraftChange={setDraftAsset}
              mode={assetMode}
              onModeChange={(m) => {
                setAssetMode(m);
                setAssetError(null);
              }}
              errorBanner={assetError}
            />
          )}
          {customerReady && !customer && customerMode === "new" && (
            <>
              <p className="text-xs text-muted-foreground">
                Asset is created together with the customer when you save.
              </p>
              {assetError && (
                <p className="text-xs text-destructive">{assetError}</p>
              )}
              <AssetForm
                values={draftAsset}
                onChange={setDraftAsset}
                disabled={submitting}
              />
            </>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Schedule
          </h2>
          <ScheduleForm
            values={schedule}
            onChange={setSchedule}
            errors={scheduleErrors ?? {}}
            disabled={submitting}
            minDate={todayISO()}
          />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[64px] z-30 border-t border-border bg-background px-4 py-3">
        <Button
          size="lg"
          className="w-full"
          disabled={submitting || !customerReady}
          onClick={submit}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create booking
        </Button>
      </div>
    </>
  );
}
