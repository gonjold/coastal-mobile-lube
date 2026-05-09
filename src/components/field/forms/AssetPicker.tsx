"use client";

import { useEffect, useState } from "react";
import { Loader2, Car, Anchor, Container as TrailerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetForm, EMPTY_ASSET, type AssetFormValues } from "./AssetForm";
import type { AssetSummary } from "./types";
import type { AssetType } from "@/types";

function iconFor(t: AssetType) {
  switch (t) {
    case "boat":
      return Anchor;
    case "trailer":
      return TrailerIcon;
    case "vehicle":
    case "fleet_vehicle":
    default:
      return Car;
  }
}

export function AssetPicker({
  customerId,
  selectedId,
  onSelect,
  draftAsset,
  onDraftChange,
  mode,
  onModeChange,
  errorBanner,
}: {
  customerId: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  draftAsset: AssetFormValues;
  onDraftChange: (v: AssetFormValues) => void;
  mode: "pick" | "new";
  onModeChange: (m: "pick" | "new") => void;
  errorBanner?: string | null;
}) {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/field/customers/${customerId}/assets`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as { results: AssetSummary[] };
      })
      .then((json) => {
        if (cancelled) return;
        setAssets(json.results ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load assets");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading assets…
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {errorBanner && (
        <p className="text-xs text-destructive">{errorBanner}</p>
      )}

      {mode === "pick" && (
        <>
          {assets.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              No assets yet for this customer.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {assets.map((a) => {
                const Icon = iconFor(a.type);
                const active = selectedId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onSelect(a.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors duration-150 ease-out ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon
                        className="h-5 w-5 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {a.displayName}
                      </p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {a.type.replace("_", " ")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              onSelect(null);
              onDraftChange(EMPTY_ASSET);
              onModeChange("new");
            }}
          >
            Add new asset
          </Button>
        </>
      )}

      {mode === "new" && (
        <>
          <AssetForm values={draftAsset} onChange={onDraftChange} />
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              onModeChange("pick");
              onDraftChange(EMPTY_ASSET);
            }}
          >
            Cancel new asset
          </Button>
        </>
      )}
    </div>
  );
}
