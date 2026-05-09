"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssetType } from "@/types";

export type AssetFormValues = {
  type: AssetType;
  year: string;
  make: string;
  model: string;
  nickname: string;
};

export const EMPTY_ASSET: AssetFormValues = {
  type: "vehicle",
  year: "",
  make: "",
  model: "",
  nickname: "",
};

const TYPE_LABELS: Record<AssetType, string> = {
  vehicle: "Vehicle",
  boat: "Boat",
  trailer: "Trailer",
  fleet_vehicle: "Fleet vehicle",
};

export function AssetForm({
  values,
  onChange,
  disabled,
}: {
  values: AssetFormValues;
  onChange: (v: AssetFormValues) => void;
  disabled?: boolean;
}) {
  function set<K extends keyof AssetFormValues>(
    key: K,
    v: AssetFormValues[K],
  ) {
    onChange({ ...values, [key]: v });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="asset-type">Type</Label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TYPE_LABELS) as AssetType[]).map((t) => (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() => set("type", t)}
              className={`h-9 rounded-md border px-3 text-sm transition-colors duration-150 ease-out ${
                values.type === t
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="asset-year">Year</Label>
          <Input
            id="asset-year"
            inputMode="numeric"
            placeholder="2020"
            disabled={disabled}
            value={values.year}
            onChange={(e) =>
              set("year", e.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="asset-make">Make</Label>
          <Input
            id="asset-make"
            placeholder="Honda"
            disabled={disabled}
            value={values.make}
            onChange={(e) => set("make", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="asset-model">Model</Label>
        <Input
          id="asset-model"
          placeholder="Civic"
          disabled={disabled}
          value={values.model}
          onChange={(e) => set("model", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="asset-nickname">Nickname (optional)</Label>
        <Input
          id="asset-nickname"
          placeholder="Mom's car"
          disabled={disabled}
          value={values.nickname}
          onChange={(e) => set("nickname", e.target.value)}
        />
      </div>
    </div>
  );
}

export function validateAsset(v: AssetFormValues): string | null {
  if (!v.make.trim() && !v.nickname.trim()) {
    return "Make or nickname is required";
  }
  if (v.year && !/^\d{4}$/.test(v.year)) return "Year should be 4 digits";
  return null;
}
