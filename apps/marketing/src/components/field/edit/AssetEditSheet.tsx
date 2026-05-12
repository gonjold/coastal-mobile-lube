"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Loader2, Car, Anchor, Container, Truck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@coastal/shared-ui";
import { Button } from "@coastal/shared-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AssetForm,
  EMPTY_ASSET,
  validateAsset,
  type AssetFormErrors,
  type AssetFormValues,
  type AssetType,
} from "./AssetForm";

type ServerAsset = {
  id: string;
  type?: AssetType;
  year?: number | string;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  nickname?: string;
  customerId?: string;
};

type AssetGetResponse = {
  ok: true;
  finalized: boolean;
  customerId: string | null;
  currentAssetId: string | null;
  currentAsset: ServerAsset | null;
  otherAssets: ServerAsset[];
};

const ICONS: Record<string, typeof Car> = {
  vehicle: Car,
  boat: Anchor,
  trailer: Container,
  fleet_vehicle: Truck,
};

function toFormValues(a: ServerAsset | null): AssetFormValues {
  if (!a) return EMPTY_ASSET;
  return {
    year: a.year ? String(a.year) : "",
    make: a.make ?? "",
    model: a.model ?? "",
    vin: a.vin ?? "",
    licensePlate: a.licensePlate ?? "",
    nickname: a.nickname ?? "",
  };
}

function assetLabel(a: ServerAsset): string {
  if (a.nickname) return a.nickname;
  const parts = [a.year, a.make, a.model].filter(Boolean);
  return parts.length ? parts.join(" ") : a.id;
}

export function AssetEditSheet({
  jobId,
  locked,
}: {
  jobId: string;
  locked: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AssetGetResponse | null>(null);
  const [tab, setTab] = useState<"edit" | "swap">("edit");

  const [editValues, setEditValues] = useState<AssetFormValues>(EMPTY_ASSET);
  const [editErrors, setEditErrors] = useState<AssetFormErrors | undefined>();

  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<AssetFormValues>(EMPTY_ASSET);
  const [createType, setCreateType] = useState<AssetType>("vehicle");
  const [createErrors, setCreateErrors] = useState<AssetFormErrors | undefined>();

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/field/jobs/${jobId}/asset`, {
        cache: "no-store",
      });
      const json = (await res.json()) as AssetGetResponse | { error: string };
      if (!res.ok || !("ok" in json)) {
        toast.error("Couldn't load asset", {
          description: "error" in json ? json.error : `HTTP ${res.status}`,
        });
        return;
      }
      setData(json);
      setEditValues(toFormValues(json.currentAsset));
      setTab(json.currentAssetId ? "edit" : "swap");
    } catch (err) {
      toast.error("Couldn't load asset", {
        description: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setLoading(false);
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      void load();
    } else {
      setEditErrors(undefined);
      setCreateErrors(undefined);
      setCreateOpen(false);
      setCreateValues(EMPTY_ASSET);
      setCreateType("vehicle");
    }
  }

  async function saveEdit() {
    const v = validateAsset(editValues);
    if (v) {
      setEditErrors(v);
      return;
    }
    setEditErrors(undefined);
    setSaving(true);
    try {
      const res = await fetch(`/api/field/jobs/${jobId}/asset`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "edit",
          patch: {
            year: editValues.year || null,
            make: editValues.make,
            model: editValues.model,
            vin: editValues.vin || null,
            licensePlate: editValues.licensePlate || null,
            nickname: editValues.nickname || null,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Couldn't save asset", {
          description: json?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success("Asset updated");
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function swapTo(assetId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/field/jobs/${jobId}/asset`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "swap", assetId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Couldn't swap asset", {
          description: json?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success("Asset swapped");
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveCreate() {
    const v = validateAsset(createValues);
    if (v) {
      setCreateErrors(v);
      return;
    }
    setCreateErrors(undefined);
    setSaving(true);
    try {
      const res = await fetch(`/api/field/jobs/${jobId}/asset`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "create",
          asset: {
            type: createType,
            year: createValues.year || undefined,
            make: createValues.make,
            model: createValues.model,
            nickname: createValues.nickname || undefined,
            vin: createValues.vin || undefined,
            licensePlate: createValues.licensePlate || undefined,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Couldn't create asset", {
          description: json?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success("Asset created and linked");
      setOpen(false);
      router.refresh();
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
        aria-label="Edit asset"
      >
        <Pencil className="mr-1 h-3 w-3" strokeWidth={2} /> Edit
      </Button>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display text-lg">Asset</SheetTitle>
            <SheetDescription>
              {locked
                ? "Asset on the finalized invoice cannot change."
                : "Edit the linked asset, swap to a different one, or add a new asset."}
            </SheetDescription>
          </SheetHeader>

          {locked && (
            <div className="px-4">
              <p
                role="note"
                className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-foreground"
              >
                <span className="font-semibold">Invoice finalized.</span>{" "}
                Customer info on the finalized invoice cannot change. Asset
                details below are read-only.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "edit" | "swap")}
              className="px-4 pb-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" disabled={!data.currentAssetId}>
                  Edit current
                </TabsTrigger>
                <TabsTrigger value="swap">Swap / Add</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="pt-4">
                {data.currentAssetId ? (
                  <AssetForm
                    idPrefix="edit-asset"
                    values={editValues}
                    onChange={setEditValues}
                    errors={editErrors}
                    disabled={saving || locked}
                  />
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No asset linked yet — use the Swap / Add tab.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="swap" className="pt-4">
                <div className="flex flex-col gap-3">
                  {data.otherAssets.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Other assets on this customer
                      </p>
                      {data.otherAssets.map((a) => {
                        const Icon =
                          ICONS[a.type ?? "vehicle"] ?? Car;
                        return (
                          <button
                            type="button"
                            key={a.id}
                            disabled={saving || locked}
                            onClick={() => void swapTo(a.id)}
                            className="flex items-center gap-3 rounded-md border border-border bg-card p-3 text-left transition-colors duration-150 ease-out hover:bg-muted/50 disabled:opacity-50"
                          >
                            <Icon
                              className="h-5 w-5 text-muted-foreground"
                              strokeWidth={1.5}
                            />
                            <div className="flex flex-1 flex-col">
                              <span className="text-sm font-semibold">
                                {assetLabel(a)}
                              </span>
                              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                {a.type ?? "asset"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      No other assets on this customer.
                    </p>
                  )}

                  {!createOpen ? (
                    <Button
                      variant="outline"
                      onClick={() => setCreateOpen(true)}
                      disabled={saving || locked || !data.customerId}
                    >
                      Add new asset
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                          Type
                        </span>
                        <select
                          value={createType}
                          onChange={(e) =>
                            setCreateType(e.target.value as AssetType)
                          }
                          disabled={saving}
                          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                          <option value="vehicle">Vehicle</option>
                          <option value="boat">Boat</option>
                          <option value="trailer">Trailer</option>
                          <option value="fleet_vehicle">Fleet vehicle</option>
                        </select>
                      </div>
                      <AssetForm
                        idPrefix="create-asset"
                        values={createValues}
                        onChange={setCreateValues}
                        errors={createErrors}
                        disabled={saving || locked}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCreateOpen(false)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button onClick={saveCreate} disabled={saving || locked}>
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Create & link"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  {!data.customerId && (
                    <p className="text-xs text-muted-foreground">
                      No customer record matched this booking yet — create the
                      customer record first to add a new asset.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : null}

          {tab === "edit" && data?.currentAssetId && !loading && (
            <div className="mt-auto flex flex-row justify-end gap-2 p-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={saving || locked}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
